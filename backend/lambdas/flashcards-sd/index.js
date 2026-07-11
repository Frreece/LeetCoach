// backend/lambdas/flashcards-sd/index.js
// GET /flashcards/srs calls getAllSrsSDRecords
// POST /flashcards/queue adds new SD card to queue
// GET /flashcards/review calls getDueSDCards, splits into due vs new and returns
// ordered list
// POST /flashcards/review body: {cardId, quality}, calls getSrsSDRecord,
// sm2Update and saveSrsSDRecord

import { getUserId, ok, err, cors } from "../../shared/auth.js";
import { getAllSrsSDRecords, 
    addCardToQueue, 
    getSrsSDRecord, 
    saveSrsSDRecord,  
    sm2Update} from "../../shared/db.js";

const NEW_CARD_COUNT = 10;


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

  // GET /flashcards/srs
  // GET /flashcards/review
  if (event.httpMethod === "GET") {
    if (path.endsWith("srs")) {
        try {
            const items = await getAllSrsSDRecords(userId);
            return ok({items}, event)
        } catch (e) {
            return err(500, "Could not get records", event)
        }
    } else if (path.endsWith("review")) {
        try {
            const allItems = await getAllSrsSDRecords(userId);
            const now = new Date();

            const dueCards = allItems.filter(item => 
                item.repetitions > 0 && new Date(item.nextReview) <= now
            );
            const newCards = allItems.filter(item => 
                item.repetitions === 0
            );
            const earlyCards = allItems.filter(item => 
                item.repetitions > 0 && new Date(item.nextReview) > now
            );

            const shuffledDue = shuffle(dueCards);
            const shuffledNew = shuffle(newCards).slice(0, NEW_CARD_COUNT);
            const shuffledEarly = shuffle(earlyCards);

            const items = [...shuffledDue, ...shuffledNew, ...shuffledEarly];
            return ok({ items }, event);
        } catch(e) {
            return err(500, "Could not get review cards", event);
        }
    }
  }

  // POST /flashcards/queue
    // POST /flashcards/review

    if (event.httpMethod === "POST") {
        if (path.endsWith("queue")) {
            let body;
            try {
                body = JSON.parse(event.body || "{}");
            } catch (e) {
                return(err(400, "Invalid JSON", event));
            }
            const { cardId } = body;
            try {
                await addCardToQueue(userId, cardId)
                return ok({message: "Card added to queue"}, event);
            } catch (e) {
                return(err(500, "Failed to add card to Queue", event))
            }
        } else if (path.endsWith("review")) {
            let body;
            try {
                body = JSON.parse(event.body || "{}");
            } catch (e) {
                return err(400, "Invalid JSON", event);
            }

            const { quality, cardId } = body;
            try {
                const record = await getSrsSDRecord(userId, cardId) || {};
                const srsData = sm2Update(record, quality);
                await saveSrsSDRecord(userId, cardId, {
                    ...record,
                    ...srsData,
                    cardId,
                    lastReviewedAt: new Date().toISOString(),
                    lastQuality: quality
                });
                return ok({srsData, message: reviewMessage(srsData, quality)}, event)
            } catch (e) {
                return err(500, "Failed to submit review", event);
            }
        }
    }
    return err(405, "Method not allowed", event);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function reviewMessage(srs, quality) {
  if (quality <= 1) return `Needs work. We'll revisit this tomorrow.`;
  if (quality <= 3) return `Getting there! Next review in ${srs.interval} day${srs.interval !== 1 ? "s" : ""}.`;
  return `Great job! Ease factor: ${srs.easeFactor.toFixed(2)}. Next review in ${srs.interval} day${srs.interval !== 1 ? "s" : ""}.`;
}