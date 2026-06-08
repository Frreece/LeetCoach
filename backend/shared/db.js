// backend/shared/db.js
// DynamoDB single-table helpers + SM-2 SRS implementation

import { DynamoDBClient, Select } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
export const ddb = DynamoDBDocumentClient.from(client);
export const TABLE = process.env.DYNAMODB_TABLE;

// ─── Key patterns ──────────────────────────────────────────────────────────
// User profile:       PK=USER#<userId>  SK=PROFILE
// Submission:         PK=USER#<userId>  SK=SUB#<timestamp>#<slug>
// SRS record:         PK=USER#<userId>  SK=SRS#<slug>
// GSI:                GSI1PK=SRS#<userId>  GSI1SK=<nextReview ISO>

export function userPK(userId) { return `USER#${userId}`; }
export function subSK(slug, ts) { return `SUB#${ts}#${slug}`; }
export function srsSK(slug) { return `SRS#${slug}`; }

// ─── SM-2 Algorithm ────────────────────────────────────────────────────────
// quality: 0-5 (0=blackout, 3=correct with difficulty, 5=perfect)
export function sm2Update(record, quality) {
  let { easeFactor = 2.5, interval = 0, repetitions = 0 } = record;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  const nextReview = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();

  return { easeFactor, interval, repetitions, nextReview };
}

// Map AI optimality score (0–1) to SM-2 quality (0–5)
export function optimalityToQuality(optimality, accepted) {
  if (!accepted) return 1;
  if (optimality >= 0.9) return 5;
  if (optimality >= 0.75) return 4;
  if (optimality >= 0.5) return 3;
  if (optimality >= 0.25) return 2;
  return 1;
}

// ─── User profile helpers ──────────────────────────────────────────────────
export async function getProfile(userId) {
  const res = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: userPK(userId), SK: "PROFILE" },
  }));
  return res.Item;
}

export async function upsertProfile(userId, updates) {
  const now = new Date().toISOString();
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: {
      PK: userPK(userId),
      SK: "PROFILE",
      userId,
      ...updates,
      updatedAt: now,
    },
  }));
}

// ─── Analysis helpers ──────────────────────────────────────────────────────

export async function saveAnalysis(userId) {
  const now = new Date();
  const tmr = new Date(now);
  tmr.setDate(now.getDate() + 1);
  tmr.setHours(0,0,0,0);
  const ttl = Math.floor(tmr.getTime() / 1000);
  await ddb.send(new PutCommand( {
    TableName: TABLE,
    Item: {
      PK: userPK(userId),
      SK: `ANALYZE#${now.toISOString()}`,
      ttl,
      userId
    },
  }))
}

export async function getAnalysisCount(userId) {
  const res = await ddb.send(new QueryCommand( {
    TableName: TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
    ExpressionAttributeValues: {
      ":pk": userPK(userId),
      ":prefix": "ANALYZE#"
    },
    ScanIndexForward: false,
    Limit: 3,
    Select: "COUNT",
  }))
  return res.Count;
}

// ─── Submission helpers ────────────────────────────────────────────────────
export async function saveSubmission(userId, submission) {
  const ts = submission.timestamp || new Date().toISOString();
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: {
      PK: userPK(userId),
      SK: subSK(submission.problemSlug, ts),
      ...submission,
      userId,
      timestamp: ts,
    },
  }));
}

export async function getSubmissions(userId, limit = 50) {
  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
    ExpressionAttributeValues: {
      ":pk": userPK(userId),
      ":prefix": "SUB#",
    },
    ScanIndexForward: false,
    Limit: limit,
  }));
  return res.Items || [];
}

// ─── SRS record helpers ────────────────────────────────────────────────────
export async function getSrsRecord(userId, slug) {
  const res = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: userPK(userId), SK: srsSK(slug) },
  }));
  return res.Item;
}

export async function saveSrsRecord(userId, slug, srsData) {
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: {
      PK: userPK(userId),
      SK: srsSK(slug),
      GSI1PK: `SRS#${userId}`,
      userId,
      problemSlug: slug,
      ...srsData,
      GSI1SK: srsData.nextReview,  // ← moved after spread so it can't be overwritten
      updatedAt: new Date().toISOString(),
    },
  }));
}

export async function getReviewQueue(userId) {
  const now = new Date().toISOString();
  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :pk AND GSI1SK <= :now",
    ExpressionAttributeValues: {
      ":pk": `SRS#${userId}`,
      ":now": now,
    },
    ScanIndexForward: true,
    Limit: 50,
  }));
  return res.Items || [];
}

// ─── Stats helpers ─────────────────────────────────────────────────────────
export async function computeStats(userId) {
  const subs = await getSubmissions(userId, 500);
  const total = subs.filter(s => s.accepted).length;

  // Streak: consecutive days with at least one accepted submission
  const days = new Set(
    subs
      .filter(s => s.accepted)
      .map(s => s.timestamp?.slice(0, 10))
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (days.has(d.toISOString().slice(0, 10))) streak++;
    else if (i > 0) break;
  }

  // Topic breakdown
  const topicMap = {};
  for (const s of subs) {
    if (!s.topics) continue;
    for (const t of s.topics) {
      if (!topicMap[t]) topicMap[t] = { total: 0, accepted: 0 };
      topicMap[t].total++;
      if (s.accepted) topicMap[t].accepted++;
    }
  }

  return {
    total,
    currentStreak: streak,
    recentSubmissions: subs.slice(0, 10),
    topicBreakdown: topicMap,
  };
}
