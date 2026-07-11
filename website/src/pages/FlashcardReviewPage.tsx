import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Minus, Trophy, BookOpen } from "lucide-react";
import { api, type SrsItemSD } from "../lib/api";
import { allCards, type FlashCard } from "../data/cards";

const QUALITY_LABELS = [
  { q: 1, label: "Forgot it",   color: "bg-red-600 hover:bg-red-700",         icon: XCircle },
  { q: 3, label: "With effort", color: "bg-amber-600 hover:bg-amber-700",     icon: Minus },
  { q: 5, label: "Easy recall", color: "bg-emerald-600 hover:bg-emerald-700", icon: CheckCircle },
];

export default function FlashcardReviewPage() {
  const [queue, setQueue] = useState<FlashCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState("");
  const [resultMsg, setResultMsg] = useState("");

  useEffect(() => {
    api.getFlashcardsReview()
      .then(({ items }) => {
        const cardMap = new Map(allCards.map(c => [c.id, c]));
        const resolved = items
          .map(item => cardMap.get(item.cardId))
          .filter((c): c is FlashCard => !!c);
        setQueue(resolved);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const current = queue[idx];
  const total = queue.length;
  const isFinished = idx >= total;

  async function handleQuality(quality: number) {
    if (!current || submitting) return;
    setSubmitting(true);
    try {
      await api.submitFlashcardReview(current.id, quality);
      setDone(d => d + 1);
      setTimeout(() => {
        setFlipped(false);
        setIdx(i => i + 1);
        setSubmitting(false);
      }, 900);
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="text-red-400 p-4">{error}</div>;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-16 h-16 bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4">
          <Trophy size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">You're all caught up!</h2>
        <p className="text-slate-400 text-sm max-w-sm">No cards due for review right now. Add more cards to your queue from the Flashcards page.</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-16 h-16 bg-brand-900/30 rounded-2xl flex items-center justify-center mb-4">
          <Trophy size={32} className="text-brand-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Session complete!</h2>
        <p className="text-slate-400 text-sm mb-6">You reviewed {done} card{done !== 1 ? "s" : ""}. Great work.</p>
        <button
          onClick={() => { setIdx(0); setDone(0); setFlipped(false); setQueue([]); setLoading(true);
            api.getFlashcardsReview()
              .then(({ items }) => {
                const cardMap = new Map(allCards.map(c => [c.id, c]));
                const resolved = items.map(item => cardMap.get(item.cardId)).filter((c): c is FlashCard => !!c);
                setQueue(resolved);
              })
              .finally(() => setLoading(false));
          }}
          className="btn-primary"
        >
          Would you like to start another session?
        </button>
      </div>
    );
  }

  const progress = ((idx / total) * 100).toFixed(0);
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen size={22} className="text-brand-400" />
          Flashcard Review
        </h1>
        <span className="text-slate-400 text-sm">{idx + 1} / {total}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Card */}
      <div
        onClick={() => !flipped && setFlipped(true)}
        className="card p-0 min-h-[320px] flex flex-col cursor-pointer hover:bg-slate-800/60 transition-colors overflow-hidden"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">{current.category}</span>
            <span className="text-slate-700">•</span>
            <DiffBadge diff={current.difficulty} />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-12 py-8">
          <p className="text-center text-slate-100 text-2xl font-medium leading-relaxed">
            {flipped ? current.back : current.front}
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
          <span className="text-xs text-slate-500 uppercase tracking-widest font-medium">
            {flipped ? "Answer" : "Question"}
          </span>
          {!flipped && <span className="text-xs text-slate-600">click to flip</span>}
        </div>
      </div>

      {/* Rating buttons — only show after flip */}
      {flipped && (
        <div className="grid grid-cols-3 gap-3">
          {QUALITY_LABELS.map(({ q, label, color, icon: Icon }) => (
            <button
              key={q}
              onClick={() => handleQuality(q)}
              disabled={submitting}
              className={`${color} text-white font-medium py-3 rounded-xl transition-colors flex flex-col items-center gap-1.5 disabled:opacity-50`}
            >
              <Icon size={18} />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      )}

      {total - idx - 1 > 0 && (
        <div className="text-center text-sm text-slate-500">
          {total - idx - 1} more card{total - idx - 1 !== 1 ? "s" : ""} remaining
        </div>
      )}
    </div>
  );
}

function DiffBadge({ diff }: { diff: string }) {
  const cls =
    diff === "Easy" ? "badge-easy" :
    diff === "Medium" ? "badge-medium" :
    diff === "Hard" ? "badge-hard" :
    "inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400";
  return <span className={cls}>{diff}</span>;
}