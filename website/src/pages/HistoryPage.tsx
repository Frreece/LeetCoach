// src/pages/HistoryPage.tsx
import { useEffect, useState } from "react";
import { ExternalLink, Search, Filter } from "lucide-react";
import { api, type Submission } from "../lib/api";
import { format } from "date-fns";

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];
const STATUSES = ["All", "Accepted", "Failed"];

export default function HistoryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    api.getSubmissions()
      .then(data => setSubmissions(data.recentSubmissions))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = submissions.filter(s => {
    const matchSearch = !search || s.problemSlug.toLowerCase().includes(search.toLowerCase());
    const matchDiff = diffFilter === "All" || s.difficulty === diffFilter;
    const matchStatus = statusFilter === "All"
      ? true
      : statusFilter === "Accepted" ? s.accepted : !s.accepted;
    return matchSearch && matchDiff && matchStatus;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Submission History</h1>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search problems…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <div className="flex gap-1">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setDiffFilter(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  diffFilter === d
                    ? "bg-brand-600/30 text-brand-300 border border-brand-600/40"
                    : "text-slate-400 hover:text-slate-200 bg-slate-800/50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex gap-1 ml-2">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-brand-600/30 text-brand-300 border border-brand-600/40"
                    : "text-slate-400 hover:text-slate-200 bg-slate-800/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-2 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-slate-800 rounded-xl" />)}
        </div>
      )}

      {error && <div className="text-red-400">{error}</div>}

      {!loading && !error && (
        <>
          <div className="text-xs text-slate-500 mb-2">{filtered.length} submission{filtered.length !== 1 ? "s" : ""}</div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Problem</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Status</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Complexity</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Language</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-500 py-10">
                      No submissions found.
                    </td>
                  </tr>
                )}
                {filtered.map((sub, i) => (
                  <tr key={i} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sub.accepted ? "bg-emerald-400" : "bg-red-400"}`} />
                        <span className="font-medium text-slate-200">{formatSlug(sub.problemSlug)}</span>
                        <DiffBadge diff={sub.difficulty} />
                      </div>
                      {sub.topics && sub.topics.length > 0 && (
                        <div className="flex gap-1 mt-1 ml-4.5 flex-wrap">
                          {sub.topics.slice(0, 3).map(t => (
                            <span key={t} className="text-xs text-slate-500">{t}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <StatusBadge accepted={sub.accepted} msg={sub.statusMsg} />
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      {sub.timeComplexity ? (
                        <span className="font-mono text-xs text-slate-300">
                          {sub.timeComplexity} / {sub.spaceComplexity || "?"}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-400 text-xs">{sub.language || "—"}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                      {format(new Date(sub.timestamp), "MMM d, yyyy")}
                      <div className="text-slate-600">{format(new Date(sub.timestamp), "h:mm a")}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <a
                        href={`https://leetcode.com/problems/${sub.problemSlug}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-brand-400 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function DiffBadge({ diff }: { diff: string }) {
  const cls =
    diff === "Easy" ? "badge-easy" :
    diff === "Medium" ? "badge-medium" :
    diff === "Hard" ? "badge-hard" :
    "hidden";
  return diff ? <span className={cls}>{diff}</span> : null;
}

function StatusBadge({ accepted, msg }: { accepted: boolean; msg: string }) {
  return accepted
    ? <span className="text-emerald-400 text-xs font-medium">Accepted</span>
    : <span className="text-red-400 text-xs font-medium">{msg || "Failed"}</span>;
}

function formatSlug(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
