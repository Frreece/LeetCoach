// LeetCoach popup script
// Handles sign-in, sign-up, stats display, and review queue

const content = document.getElementById("content");

// ─── State ──────────────────────────────────────────────────────────────────
let view = "loading"; // loading | signin | signup | dashboard
let authState = null;
let statsData = null;
let reviewCount = 0;

// ─── Init ────────────────────────────────────────────────────────────────────
async function init() {
  authState = await sendMessage({ type: "GET_AUTH_STATE" });
  if (authState.isAuthenticated) {
    view = "dashboard";
    await loadDashboardData();
  } else {
    view = "signin";
  }
  render();
}

async function loadDashboardData() {
  try {
    const [subs, queue] = await Promise.all([
      sendMessage({ type: "GET_SUBMISSIONS" }),
      sendMessage({ type: "GET_REVIEW_QUEUE" }),
    ]);
    statsData = subs;
    reviewCount = queue?.items?.length ?? 0;
  } catch (e) {
    statsData = null;
    reviewCount = 0;
  }
}

// ─── Render ──────────────────────────────────────────────────────────────────
function render() {
  if (view === "loading") {
    content.innerHTML = `<div class="loading"><div class="spinner"></div>Loading…</div>`;
    return;
  }
  if (view === "signin") renderSignIn();
  else if (view === "signup") renderSignUp();
  else renderDashboard();
}

function renderSignIn() {
  content.innerHTML = `
    <form class="auth-form" id="signin-form">
      <div id="auth-error" class="error-msg" style="display:none"></div>
      <input type="email" id="email" placeholder="Email" autocomplete="email" required />
      <input type="password" id="password" placeholder="Password" autocomplete="current-password" required />
      <button class="btn-primary" type="submit" id="signin-btn">Sign In</button>
    </form>
    <div class="auth-toggle">
      Don't have an account? <a id="goto-signup">Sign up</a>
    </div>
  `;
  document.getElementById("goto-signup").onclick = () => { view = "signup"; render(); };
  document.getElementById("signin-form").onsubmit = handleSignIn;
}

function renderSignUp() {
  content.innerHTML = `
    <form class="auth-form" id="signup-form">
      <div id="auth-error" class="error-msg" style="display:none"></div>
      <input type="email" id="email" placeholder="Email" autocomplete="email" required />
      <input type="password" id="password" placeholder="Password (8+ chars)" autocomplete="new-password" required />
      <input type="password" id="confirm-password" placeholder="Confirm password" autocomplete="new-password" required />
      <button class="btn-primary" type="submit" id="signup-btn">Create Account</button>
    </form>
    <div class="auth-toggle">
      Already have an account? <a id="goto-signin">Sign in</a>
    </div>
  `;
  document.getElementById("goto-signin").onclick = () => { view = "signin"; render(); };
  document.getElementById("signup-form").onsubmit = handleSignUp;
}

function renderDashboard() {
  const total = statsData?.total ?? 0;
  const streak = statsData?.currentStreak ?? 0;
  const topicsDue = reviewCount;
  const lastProblem = statsData?.recentSubmissions?.[0]?.problemSlug ?? "—";

  content.innerHTML = `
    <div class="user-info">
      <div class="user-email">${authState.email || "Signed in"}</div>
      <button class="btn-signout" id="signout-btn">Sign out</button>
    </div>
    ${topicsDue > 0 ? `
      <div class="review-banner">
        <div>
          <div class="review-count">${topicsDue}</div>
          <div class="review-label">due for review</div>
        </div>
        <div style="font-size:12px;color:#818cf8;line-height:1.4;">
          Your spaced repetition<br>queue has items ready
        </div>
      </div>
    ` : ""}
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${total}</div>
        <div class="stat-label">Solved</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${streak}</div>
        <div class="stat-label">Day Streak</div>
      </div>
      <div class="stat-card" style="grid-column:span 2;">
        <div class="stat-label" style="margin-bottom:4px;">Last Problem</div>
        <div style="font-size:12px;color:#94a3b8;word-break:break-word;">${lastProblem}</div>
      </div>
    </div>
    <a class="btn-dashboard" id="open-dashboard" href="#" target="_blank">
      Open Full Dashboard →
    </a>
  `;

  document.getElementById("signout-btn").onclick = handleSignOut;
  document.getElementById("open-dashboard").onclick = (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "https://leetcoach.app/dashboard" });
  };
}

// ─── Handlers ────────────────────────────────────────────────────────────────
async function handleSignIn(e) {
  e.preventDefault();
  const btn = document.getElementById("signin-btn");
  const errEl = document.getElementById("auth-error");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  btn.disabled = true;
  btn.textContent = "Signing in…";
  errEl.style.display = "none";

  try {
    await sendMessage({ type: "SIGN_IN", email, password });
    authState = await sendMessage({ type: "GET_AUTH_STATE" });
    view = "dashboard";
    await loadDashboardData();
    render();
  } catch (err) {
    errEl.textContent = err.message || "Sign in failed";
    errEl.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
}

async function handleSignUp(e) {
  e.preventDefault();
  const btn = document.getElementById("signup-btn");
  const errEl = document.getElementById("auth-error");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm-password").value;

  if (password !== confirm) {
    errEl.textContent = "Passwords do not match";
    errEl.style.display = "block";
    return;
  }
  if (password.length < 8) {
    errEl.textContent = "Password must be at least 8 characters";
    errEl.style.display = "block";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Creating account…";
  errEl.style.display = "none";

  try {
    await sendMessage({ type: "SIGN_UP", email, password });
    // After sign-up, auto sign-in
    await sendMessage({ type: "SIGN_IN", email, password });
    authState = await sendMessage({ type: "GET_AUTH_STATE" });
    view = "dashboard";
    await loadDashboardData();
    render();
  } catch (err) {
    errEl.textContent = err.message || "Sign up failed";
    errEl.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Create Account";
  }
}

async function handleSignOut() {
  await sendMessage({ type: "SIGN_OUT" });
  authState = { isAuthenticated: false };
  statsData = null;
  reviewCount = 0;
  view = "signin";
  render();
}

// ─── Utils ───────────────────────────────────────────────────────────────────
function sendMessage(msg) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (resp) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (resp?.error) return reject(new Error(resp.error));
      resolve(resp);
    });
  });
}

init();
