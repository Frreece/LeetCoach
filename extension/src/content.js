// content.js — LeetCoach content script
// Intercepts LeetCode submission results and triggers AI analysis

(function () {
  "use strict";

  // ── State ──────────────────────────────────────────────────────────────────
  let lastSubmissionId = null;
  let panelVisible = false;
  let pollTimer = null;

// Inject page script into real page context
const script = document.createElement("script");
script.src = chrome.runtime.getURL("injected.js");
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

// Listen for messages from injected script
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type === "LEETCOACH_SUBMISSION") {
    handleSubmissionResult(event.data.data);
  }
});

  // ── Poll submission result ─────────────────────────────────────────────────
  function startPolling(submissionId) {
    if (pollTimer) clearInterval(pollTimer);
    let attempts = 0;
    pollTimer = setInterval(async () => {
      attempts++;
      if (attempts > 30) { clearInterval(pollTimer); return; }
      try {
        const slug = getProblemSlug();
        const res = await origFetch(
          `https://leetcode.com/submissions/detail/${submissionId}/check/`,
          { headers: { "X-CSRFToken": getCsrfToken() } }
        );
        const data = await res.json();
        if (data.state === "SUCCESS" || (data.status_msg && data.status_msg !== "Pending")) {
          clearInterval(pollTimer);
          handleSubmissionResult({ ...data, submission_id: submissionId, slug });
        }
      } catch (_) {}
    }, 1500);
  }

  // ── Handle submission result ───────────────────────────────────────────────
  async function handleSubmissionResult(data) {
    const slug = getProblemSlug();
    const accepted = data.status_msg === "Accepted" || data.run_success === true && data.total_correct === data.total_testcases;
    const code = data.code || getEditorCode();
    const language = data.lang || getLanguage();
    const difficulty = getDifficulty();

    const payload = {
      problemSlug: slug,
      code,
      language,
      difficulty,
      accepted,
      statusMsg: data.status_msg || (accepted ? "Accepted" : "Wrong Answer"),
      runtime: data.status_runtime,
      memory: data.status_memory,
      runtimePercentile: data.runtime_percentile,
      memoryPercentile: data.memory_percentile,
      timestamp: new Date().toISOString(),
    };

    // Check auth first
    const authState = await sendMessage({ type: "GET_AUTH_STATE" });
    if (!authState?.isAuthenticated) return; // silently skip if not signed in

    // Show loading panel
    showPanel({ loading: true, accepted, problemSlug: slug });

    try {
      const result = await sendMessage({ type: "SAVE_SUBMISSION", payload });
      showPanel({ ...result, accepted, problemSlug: slug, loading: false, payload });
    } catch (err) {
      showPanel({ error: err.message, accepted, problemSlug: slug, loading: false });
    }
  }

  // ── Panel UI ───────────────────────────────────────────────────────────────
  function showPanel(data) {
    removePanel();
    panelVisible = true;

    const panel = document.createElement("div");
    panel.id = "lc-coach-panel";
    panel.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; width: 360px; z-index: 999999;
      background: #0f172a; border: 1px solid #1e293b; border-radius: 16px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.6); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #e2e8f0; overflow: hidden; animation: lcSlideIn 0.25s ease-out; max-height: 80vh;
    `;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes lcSlideIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      #lc-coach-panel * { box-sizing: border-box; }
      #lc-coach-panel button { cursor: pointer; }
      .lc-close { position:absolute; top:12px; right:12px; background:none; border:none; color:#64748b; font-size:18px; padding:4px 8px; border-radius:6px; }
      .lc-close:hover { color:#e2e8f0; background:#1e293b; }
      .lc-header { padding:16px 48px 12px 16px; border-bottom:1px solid #1e293b; }
      .lc-brand { font-size:13px; font-weight:700; color:#a78bfa; margin-bottom:4px; }
      .lc-problem { font-size:11px; color:#64748b; }
      .lc-body { padding:14px 16px; 
      overflow-y: auto;
      max-height: calc(80vh - 60px);}
      .lc-complexity { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px; }
      .lc-box { background:#1e293b; border-radius:10px; padding:10px; text-align:center; }
      .lc-box-label { font-size:10px; color:#64748b; margin-bottom:3px; }
      .lc-box-val { font-size:14px; font-weight:700; font-family:'Courier New',monospace; }
      .lc-assessment { font-size:12px; color:#94a3b8; line-height:1.5; margin-bottom:12px; }
      .lc-hint { background:#1e1b4b; border-left:3px solid #7c3aed; border-radius:0 8px 8px 0; padding:10px 12px; font-size:12px; color:#c4b5fd; line-height:1.5; margin-bottom:12px; }
      .lc-questions { margin-bottom:12px; }
      .lc-questions-title { font-size:11px; font-weight:600; color:#64748b; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em; }
      .lc-question { font-size:12px; color:#94a3b8; line-height:1.5; padding:6px 0; border-bottom:1px solid #1e293b; }
      .lc-question:last-child { border:none; }
      .lc-srs { font-size:11px; color:#38bdf8; padding-top:8px; border-top:1px solid #1e293b; }
      .lc-tags { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:10px; }
      .lc-tag { font-size:10px; background:#1e293b; color:#64748b; padding:2px 8px; border-radius:99px; }
      .lc-spinner { display:flex; align-items:center; justify-content:center; gap:10px; padding:32px 16px; color:#64748b; font-size:13px; }
      .lc-spin { width:20px; height:20px; border:2px solid #1e293b; border-top-color:#7c3aed; border-radius:50%; animation:lc-rotate 0.8s linear infinite; }
      @keyframes lc-rotate { to { transform:rotate(360deg); } }
      .lc-optimal { background:#0d2d1a; border:1px solid #166534; border-radius:10px; padding:12px; text-align:center; margin-bottom:10px; }
      .lc-optimal-icon { font-size:24px; margin-bottom:4px; }
      .lc-optimal-text { font-size:13px; color:#4ade80; font-weight:600; }
    `;
    document.head.appendChild(style);

    let bodyHTML = "";

    if (data.loading) {
      bodyHTML = `<div class="lc-spinner"><div class="lc-spin"></div>Submitting Your Solution…</div>`;
    } else if (data.saved) {
      bodyHTML = `<div class="lc-body">
        <div class="lc-srs">📅 ${escHtml(data.srsMessage || "")}</div>
        <div style="margin-top:12px;">
          ${data.remaining > 0
            ? `<button id="lc-analyze-btn" style="width:100%;padding:10px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;">
                ⚡ Analyze Solution (${data.remaining} left today)
              </button>`
            : `<div style="text-align:center;font-size:12px;color:#64748b;padding:10px;">
                No analyses remaining today — resets at midnight
              </div>`
          }
        </div>
        </div>`;
    }else if (data.error) {
      bodyHTML = `<div class="lc-body"><div style="color:#f87171;font-size:12px;">Analysis failed: ${escHtml(data.error)}</div></div>`;
    } else {
      const timeColor = complexityColor(data.timeComplexity, data.optimalTimeComplexity);
      const spaceColor = complexityColor(data.spaceComplexity, data.optimalSpaceComplexity);

      bodyHTML = `<div class="lc-body">`;

      // Complexity grid
      if (data.timeComplexity) {
        bodyHTML += `
          <div class="lc-complexity">
            <div class="lc-box">
              <div class="lc-box-label">Your Time</div>
              <div class="lc-box-val" style="color:${timeColor}">${escHtml(data.timeComplexity)}</div>
            </div>
            <div class="lc-box">
              <div class="lc-box-label">Optimal Time</div>
              <div class="lc-box-val" style="color:#4ade80">${escHtml(data.optimalTimeComplexity || "?")}</div>
            </div>
          </div>`;
      }

      // Optimal badge or hint
      if (data.isOptimal) {
        bodyHTML += `
          <div class="lc-optimal">
            <div class="lc-optimal-icon">🎯</div>
            <div class="lc-optimal-text">Optimal solution!</div>
            <div style="font-size:11px;color:#86efac;margin-top:2px;">Great work on the complexity.</div>
          </div>`;
      } else if (data.hint) {
        bodyHTML += `<div class="lc-hint">💭 ${escHtml(data.hint)}</div>`;
      }

      // Assessment
      if (data.assessment) {
        bodyHTML += `<div class="lc-assessment">${escHtml(data.assessment)}</div>`;
      }

      // Follow-up questions
      if (data.followUpQuestions?.length) {
        bodyHTML += `<div class="lc-questions">
          <div class="lc-questions-title">Follow-up questions</div>
          ${data.followUpQuestions.map(q => `<div class="lc-question">• ${escHtml(q)}</div>`).join("")}
        </div>`;
      }

      // Topics
      if (data.topics?.length) {
        bodyHTML += `<div class="lc-tags">${data.topics.slice(0, 5).map(t => `<span class="lc-tag">${escHtml(t)}</span>`).join("")}</div>`;
      }

      // SRS message
      if (data.srsMessage) {
        bodyHTML += `<div class="lc-srs">📅 ${escHtml(data.srsMessage)}</div>`;
      }

      bodyHTML += `</div>`;
    }

    panel.innerHTML = `
      <button class="lc-close" id="lc-close-btn" title="Close">✕</button>
      <div class="lc-header">
        <div class="lc-brand">⚡ LeetCoach</div>
        <div class="lc-problem">${escHtml(data.problemSlug?.replace(/-/g, " ") || "")}</div>
      </div>
      ${bodyHTML}
    `;

    document.body.appendChild(panel);
    panel.querySelector("#lc-close-btn").addEventListener("click", removePanel);
    if (data.saved && data.remaining > 0) {
      panel.querySelector("#lc-analyze-btn").addEventListener("click", async () => {
        showPanel({ loading: true, accepted: data.accepted, problemSlug: data.problemSlug });
        try {
          const result = await sendMessage({ type: "ANALYZE_SUBMISSION", payload: data.payload });
          showPanel({ ...result, accepted: data.accepted, problemSlug: data.problemSlug, loading: false });
        } catch (e) {
          showPanel({ error: e.message, accepted: data.accepted, problemSlug: data.problemSlug, loading: false });
        }
      });
    }

    // Auto-dismiss after 45s if optimal
    if (data.isOptimal) setTimeout(removePanel, 45000);
  }

  function removePanel() {
    document.getElementById("lc-coach-panel")?.remove();
    panelVisible = false;
  }

  // ── DOM helpers ────────────────────────────────────────────────────────────
  function getProblemSlug() {
    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    return match?.[1] || "unknown-problem";
  }

  function getEditorCode() {
    // Monaco editor
    try {
      const model = window.monaco?.editor?.getModels()?.[0];
      if (model) return model.getValue();
    } catch (_) {}
    // CodeMirror fallback
    try {
      const cm = document.querySelector(".CodeMirror");
      if (cm?.CodeMirror) return cm.CodeMirror.getValue();
    } catch (_) {}
    return "";
  }

  function getLanguage() {
    const sel = document.querySelector("[data-cy='lang-select'] .ant-select-selection-item");
    return sel?.textContent?.trim() || "unknown";
  }

  function getDifficulty() {
    const el = document.querySelector("[diff]") ||
               document.querySelector(".text-difficulty-easy, .text-difficulty-medium, .text-difficulty-hard");
    if (!el) return "Unknown";
    const text = el.textContent?.trim();
    if (text?.includes("Easy")) return "Easy";
    if (text?.includes("Medium")) return "Medium";
    if (text?.includes("Hard")) return "Hard";
    return "Unknown";
  }

  function getCsrfToken() {
    return document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "";
  }

  function escHtml(str) {
    return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function complexityColor(actual, optimal) {
    if (!actual || !optimal) return "#e2e8f0";
    if (actual === optimal) return "#4ade80";
    // Rough comparison: if actual is worse than optimal, warn
    const order = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(n³)", "O(2^n)", "O(n!)"];
    const ai = order.findIndex(x => actual.includes(x.replace("O(", "").replace(")", "")));
    const oi = order.findIndex(x => optimal.includes(x.replace("O(", "").replace(")", "")));
    if (ai > oi) return "#fb923c";
    return "#4ade80";
  }

  // ── Message helper ─────────────────────────────────────────────────────────
  function sendMessage(msg) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(msg, (resp) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (resp?.error) return reject(new Error(resp.error));
        resolve(resp);
      });
    });
  }
})();
