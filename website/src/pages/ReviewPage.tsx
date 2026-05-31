// src/pages/ReviewPage.tsx
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Minus, ExternalLink, Trophy, BookOpen } from "lucide-react";
import { api, type SrsItem } from "../lib/api";

const QUALITY_LABELS = [
  { q: 1, label: "Forgot it",  color: "bg-red-600   hover:bg-red-700",     icon: XCircle },
  { q: 3, label: "With effort", color: "bg-amber-600 hover:bg-amber-700",   icon: Minus },
  { q: 5, label: "Easy recall", color: "bg-emerald-600 hover:bg-emerald-700", icon: CheckCircle },
];

export default function ReviewPage() {
  const [queue, setQueue] = useState<SrsItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");
  const [resultMsg, setResultMsg] = useState("");

  useEffect(() => {
    api.getReviewQueue()
      .then(r => setQueue(r.items))
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
      const result = await api.submitReview(current.problemSlug, quality);
      setResultMsg(result.message);
      setDone(d => [...d, current.problemSlug]);
      // brief pause to show message
      setTimeout(() => {
        setResultMsg("");
        setRevealed(false);
        setIdx(i => i + 1);
        setSubmitting(false);
      }, 900);
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-700 border-t-brand-500 rounded-full animate-spin" /></div>;
  if (error) return <div className="text-red-400 p-4">{error}</div>;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-16 h-16 bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4">
          <Trophy size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">You're all caught up!</h2>
        <p className="text-slate-400 text-sm max-w-sm">No problems due for review right now. Keep solving problems and LeetCoach will schedule your next sessions.</p>
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
        <p className="text-slate-400 text-sm mb-6">You reviewed {done.length} problem{done.length !== 1 ? "s" : ""}. Great work.</p>
        <button onClick={() => { setIdx(0); setDone([]); setRevealed(false); setQueue([]); setLoading(true); api.getReviewQueue().then(r => setQueue(r.items)).finally(() => setLoading(false)); }} className="btn-primary">
          Check for more
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
          Review Queue
        </h1>
        <span className="text-slate-400 text-sm">{idx + 1} / {total}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Card */}
      <div className="card min-h-64">
        {resultMsg ? (
          <div className="flex items-center justify-center h-48 text-emerald-300 font-medium text-lg">
            {resultMsg}
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold">
                  {formatSlug(current.problemSlug)}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <DiffBadge diff={current.difficulty || "?"} />
                  {current.topics?.slice(0, 3).map(t => (
                    <span key={t} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
              <a
                href={`https://leetcode.com/problems/${current.problemSlug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-brand-300 transition-colors flex-shrink-0"
              >
                <ExternalLink size={18} />
              </a>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-sm text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Interval</span>
                <span className="text-slate-200">{current.interval ?? 1} day{(current.interval ?? 1) !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between">
                <span>Times reviewed</span>
                <span className="text-slate-200">{current.repetitions ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Ease factor</span>
                <span className="text-slate-200">{(current.easeFactor ?? 2.5).toFixed(2)}</span>
              </div>
            </div>

            {!revealed ? (
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-4">Can you solve this problem from memory?</p>
                <button
                  onClick={() => setRevealed(true)}
                  className="btn-secondary px-8"
                >
                  I've thought about it — rate my recall
                </button>
              </div>
            ) : (
              <div>
                <p className="text-slate-400 text-sm text-center mb-4">How well did you recall this problem?</p>
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
              </div>
            )}
          </>
        )}
      </div>

      {/* Upcoming */}
      {total - idx - 1 > 0 && (
        <div className="text-center text-sm text-slate-500">
          {total - idx - 1} more problem{total - idx - 1 !== 1 ? "s" : ""} remaining
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

function formatSlug(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
