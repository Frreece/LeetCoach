// src/lib/api.ts
// Singleton API client — reads token from localStorage set by useAuth

const BASE = (import.meta.env.VITE_API_URL as string) || "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("lc_id_token");
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((errBody as any).error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getSubmissions: () => request<SubmissionsResponse>("/submissions"),
  getReviewQueue: () => request<ReviewQueueResponse>("/reviews/queue"),
  submitReview: (problemSlug: string, quality: number) =>
    request<{ message: string; nextReview: string }>("/reviews/submit", {
      method: "POST",
      body: JSON.stringify({ problemSlug, quality }),
    }),
};

export interface Submission {
  problemSlug: string;
  timestamp: string;
  accepted: boolean;
  statusMsg: string;
  language: string;
  difficulty: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  optimalityScore?: number;
  topics?: string[];
  runtime?: string;
  memory?: string;
  runtimePercentile?: number;
}

export interface SrsItem {
  problemSlug: string;
  nextReview: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  difficulty?: string;
  topics?: string[];
  lastQuality?: number;
}

export interface SubmissionsResponse {
  total: number;
  currentStreak: number;
  recentSubmissions: Submission[];
  topicBreakdown: Record<string, { total: number; accepted: number }>;
}

export interface ReviewQueueResponse {
  items: SrsItem[];
  count: number;
}
