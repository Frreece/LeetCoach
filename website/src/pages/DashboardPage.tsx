// src/pages/DashboardPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, CheckCircle, BookOpen, TrendingUp, ExternalLink, ArrowRight, XCircle } from "lucide-react";
import { api, type SubmissionsResponse } from "../lib/api";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { format } from "date-fns";

export default function DashboardPage() {
  const [data, setData] = useState<SubmissionsResponse | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getSubmissions(), api.getReviewQueue()])
      .then(([subs, queue]) => {
        setData(subs);
        setReviewCount(queue.count);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;
  if (error) return <div className="text-red-400 p-4">{error}</div>;
  if (!data) return null;

  const topicData = Object.entries(data.topicBreakdown || {})
    .map(([topic, { total, accepted }]) => ({
      topic,
      rate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {reviewCount > 0 && (
  <Link
    to="/review"
    className="flex items-center gap-2 bg-slate-600/20 border border-slate-600/40 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-600/30 transition-colors"
  >
    <BookOpen size={15} />
    {reviewCount} due for review
    <ArrowRight size={14} />
  </Link>
)}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<CheckCircle size={18} className="text-emerald-400" />} label="Problems Solved" value={data.total} color = "text-emerald-400" />
        <StatCard icon={<BookOpen size={18} />} label="Due for Review" value={reviewCount} />
        <StatCard icon={<TrendingUp size={18} />} label="Topics Covered" value={Object.keys(data.topicBreakdown || {}).length} />
        <StatCard icon={<Flame size={18} className="text-orange-400" />} label="Day Streak" value={data.currentStreak} color="text-orange-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Topic radar */}
        {topicData.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-slate-400">Topic Mastery</h2>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={topicData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11, fill: "#64748b" }} />
                <Radar name="Acceptance Rate" dataKey="rate" stroke="#ffffffff" fill="#ffffffff" fillOpacity={0.25} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, "Acceptance"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent submissions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-slate-400">Recent Submissions</h2>
            <Link to="/history" className="text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {data.recentSubmissions.length === 0 && (
              <p className="text-slate-500 text-sm py-4 text-center">No submissions yet. Solve a problem on LeetCode!</p>
            )}
            {data.recentSubmissions.slice(0, 7).map((sub, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-slate-800 last:border-0">
  <div className="flex items-center gap-2.5 min-w-0">
    {sub.accepted ? (
      <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
    ) : (
      <XCircle size={14} className="text-red-400 flex-shrink-0" />
    )}
    <a
      href={`https://leetcode.com/problems/${sub.problemSlug}/`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-slate-200 hover:text-brand-300 truncate flex items-center gap-1"
    >
      {formatSlug(sub.problemSlug)}
      <ExternalLink size={11} className="flex-shrink-0 opacity-40" />
    </a>
  </div>
</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color = "text-slate-200",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function DiffBadge({ diff }: { diff: string }) {
  const cls =
    diff === "Easy" ? "badge-easy" :
    diff === "Medium" ? "badge-medium" :
    diff === "Hard" ? "badge-hard" :
    "inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400";
  return <span className={cls}>{diff || "?"}</span>;
}

function formatSlug(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-800 rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-800 rounded-xl" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-72 bg-slate-800 rounded-xl" />
        <div className="h-72 bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
}
