// backend/lambdas/save-submission/index.js
// POST /submissions/save

import { getUserId, ok, err, cors } from "../../shared/auth.js";
import {
  saveSubmission,
  getSrsRecord,
  saveSrsRecord,
  sm2Update,
  optimalityToQuality,
  getAnalysisCount
} from "../../shared/db.js";

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors(event), body: "" };
  }

  let userId;
  try {
    userId = await getUserId(event);
  } catch (e) {
    return err(401, e.message, event);
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return err(400, "Invalid JSON", event);
  }

  const {
    problemSlug, code, language, difficulty,
    accepted, statusMsg, runtime, memory,
    runtimePercentile, memoryPercentile, timestamp,
  } = body;

  if (!problemSlug || !code) return err(400, "problemSlug and code are required", event);

  // ── SRS Update ───────────────────────────────────────────────────────────
  const existing = await getSrsRecord(userId, problemSlug).catch(() => null);
  const quality = optimalityToQuality(0.5, accepted); // no AI score, use neutral 0.5
  const newSrs = sm2Update(existing || {}, quality);
  await saveSrsRecord(userId, problemSlug, {
    ...newSrs,
    problemSlug,
    difficulty: difficulty || "Unknown",
    lastQuality: quality,
  }).catch(console.error);

  // ── Save Submission ───────────────────────────────────────────────────────
  await saveSubmission(userId, {
    problemSlug, code, language, difficulty,
    accepted, statusMsg, runtime, memory,
    runtimePercentile, memoryPercentile,
    timestamp: timestamp || new Date().toISOString(),
  }).catch(console.error);

  const analysisCount = await getAnalysisCount(userId).catch(() => 0);
  const remaining = 3 - analysisCount;

  return ok({ saved: true, nextReviewDate: newSrs.nextReview, srsMessage: srsMessage(newSrs), remaining }, event);
}

function srsMessage(srs) {
  if (srs.interval === 1) return "Review tomorrow to lock it in.";
  if (srs.interval <= 7) return `Review in ${srs.interval} days.`;
  return `Great retention! Review in ${srs.interval} days.`;
}