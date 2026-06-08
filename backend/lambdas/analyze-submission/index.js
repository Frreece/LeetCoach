// backend/lambdas/analyze-submission/index.js
// POST /submissions/analyze
// Calls Claude to analyze code complexity, generates follow-up questions,
// saves submission + updates SRS record.

import Anthropic from "@anthropic-ai/sdk";
import { getUserId, ok, err, cors } from "../../shared/auth.js";
import {
  saveSubmission,
  getSrsRecord,
  saveSrsRecord,
  sm2Update,
  optimalityToQuality,
  getAnalysisCount,
  saveAnalysis,
} from "../../shared/db.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Handle OPTIONS preflight
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

  // ── Check Rate Limiter ──────────────────────────────────────────────────────────
  const analysisCount = await getAnalysisCount(userId).catch(() => 0);
  if (analysisCount >= 3) {
    return err(429, "You have already used your analyses for today", event);
  }

  // ── AI Analysis ──────────────────────────────────────────────────────────
  let analysis;
  try {
    analysis = await analyzeWithClaude({
      problemSlug, code, language, difficulty,
      accepted, statusMsg, runtime, runtimePercentile,
    });
  } catch (e) {
    console.error("Claude analysis failed:", e);
    return err(502, "AI analysis failed: " + e.message, event);
  }

  // ── SRS Update ───────────────────────────────────────────────────────────
  const existing = await getSrsRecord(userId, problemSlug).catch(() => null);
  const quality = optimalityToQuality(analysis.optimalityScore ?? 0.5, accepted);
  const newSrs = sm2Update(existing || {}, quality);
  await saveSrsRecord(userId, problemSlug, {
    ...newSrs,
    problemSlug,
    difficulty: difficulty || "Unknown",
    topics: analysis.topics || [],
    lastQuality: quality,
  }).catch(console.error);

  // ── Save Submission ───────────────────────────────────────────────────────
  await saveSubmission(userId, {
    problemSlug, code, language, difficulty,
    accepted, statusMsg, runtime, memory,
    runtimePercentile, memoryPercentile,
    timestamp: timestamp || new Date().toISOString(),
    timeComplexity: analysis.timeComplexity,
    spaceComplexity: analysis.spaceComplexity,
    optimalityScore: analysis.optimalityScore,
    topics: analysis.topics,
  }).catch(console.error);
  
    // ── Save Analysis ───────────────────────────────────────────────────────
    await saveAnalysis(userId).catch(console.error);

  return ok({
    ...analysis,
    nextReviewDate: newSrs.nextReview,
    srsMessage: srsMessage(newSrs),
  }, event);
}

// ── Claude prompt ─────────────────────────────────────────────────────────
async function analyzeWithClaude({ problemSlug, code, language, difficulty, accepted, statusMsg, runtime, runtimePercentile }) {
  const prompt = `You are an expert algorithms tutor reviewing a LeetCode submission.

Problem: ${problemSlug} (${difficulty || "Unknown difficulty"})
Language: ${language || "Unknown"}
Status: ${statusMsg || (accepted ? "Accepted" : "Not accepted")}
${runtime ? `Runtime: ${runtime} (${runtimePercentile ? Math.round(runtimePercentile) + "th percentile" : ""})` : ""}

Code:
\`\`\`${language?.toLowerCase() || ""}
${code}
\`\`\`

Analyze this submission and respond with ONLY a JSON object (no markdown fences) with these fields:
{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "optimalTimeComplexity": "O(...)",
  "optimalSpaceComplexity": "O(...)",
  "optimalityScore": 0.0-1.0,
  "isOptimal": true/false,
  "assessment": "2-3 sentence assessment of the approach",
  "followUpQuestions": ["question1", "question2"] (empty array if optimal),
  "hint": "one actionable hint toward optimal solution (null if already optimal)",
  "topics": ["array", "of", "relevant", "algorithm", "topics"],
  "patternName": "name of the algorithm pattern used (e.g. 'Sliding Window', 'Two Pointers')"
}

Rules:
- optimalityScore is 1.0 if the solution matches optimal complexity, lower otherwise
- followUpQuestions should be Socratic — guide thinking without giving away the answer
- topics should be from: ["Array", "String", "Hash Table", "Dynamic Programming", "Two Pointers", "Sliding Window", "Binary Search", "Tree", "Graph", "BFS", "DFS", "Stack", "Queue", "Heap", "Sorting", "Greedy", "Backtracking", "Linked List", "Math", "Bit Manipulation"]
- Be encouraging but honest`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text.trim();
  const json = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
  try {
    return JSON.parse(json);
  } catch {
    throw new Error("Claude returned malformed JSON: " + text.slice(0, 100));
  }
}

function srsMessage(srs) {
  if (srs.interval === 1) return "Review tomorrow to lock it in.";
  if (srs.interval <= 7) return `Review in ${srs.interval} days.`;
  return `Great retention! Review in ${srs.interval} days.`;
}
