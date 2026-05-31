// backend/lambdas/review-queue/index.js
// GET  /reviews/queue  — returns problems due for SRS review
// POST /reviews/submit — records a manual review result and updates SRS

import { getUserId, ok, err, cors } from "../../shared/auth.js";
import {
  getReviewQueue,
  getSrsRecord,
  saveSrsRecord,
  sm2Update,
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

  const path = event.path || event.rawPath || "";

  // ── GET /reviews/queue ─────────────────────────────────────────────────
  if (event.httpMethod === "GET") {
    try {
      const items = await getReviewQueue(userId);
      return ok({ items, count: items.length }, event);
    } catch (e) {
      console.error(e);
      return err(500, "Failed to fetch review queue", event);
    }
  }

  // ── POST /reviews/submit ───────────────────────────────────────────────
  if (event.httpMethod === "POST") {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return err(400, "Invalid JSON", event);
    }

    const { problemSlug, quality } = body;
    if (!problemSlug || quality === undefined) {
      return err(400, "problemSlug and quality (0-5) are required", event);
    }
    if (quality < 0 || quality > 5) {
      return err(400, "quality must be 0-5", event);
    }

    try {
      const existing = await getSrsRecord(userId, problemSlug) || {};
      const updated = sm2Update(existing, quality);
      await saveSrsRecord(userId, problemSlug, {
        ...existing,
        ...updated,
        problemSlug,
        lastReviewedAt: new Date().toISOString(),
        lastQuality: quality,
      });
      return ok({ ...updated, message: reviewMessage(updated, quality) }, event);
    } catch (e) {
      console.error(e);
      return err(500, "Failed to submit review", event);
    }
  }

  return err(405, "Method not allowed", event);
}

function reviewMessage(srs, quality) {
  if (quality <= 1) return `Needs work. We'll revisit this tomorrow.`;
  if (quality <= 3) return `Getting there! Next review in ${srs.interval} day${srs.interval !== 1 ? "s" : ""}.`;
  return `Great job! Ease factor: ${srs.easeFactor.toFixed(2)}. Next review in ${srs.interval} day${srs.interval !== 1 ? "s" : ""}.`;
}
