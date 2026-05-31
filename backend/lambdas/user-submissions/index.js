// backend/lambdas/user-submissions/index.js
// GET /submissions — returns paginated submission history + stats

import { getUserId, ok, err, cors } from "../../shared/auth.js";
import { getSubmissions, computeStats } from "../../shared/db.js";

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors(event), body: "", };
  }

  let userId;
  try {
    userId = await getUserId(event);
  } catch (e) {
    return err(401, e.message, event);
  }

  try {
    const stats = await computeStats(userId);
    return ok(stats, event);
  } catch (e) {
    console.error(e);
    return err(500, "Failed to load submissions", event);
  }
}
