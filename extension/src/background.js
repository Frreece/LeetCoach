// background.js — LeetCoach Service Worker
// Handles auth (Cognito SRP via amazon-cognito-identity-js),
// API calls, and message routing from content script + popup

const API_BASE = "YOUR_API_GATEWAY_URL"; // replaced at build time
const USER_POOL_ID = "YOUR_USER_POOL_ID";
const CLIENT_ID = "YOUR_CLIENT_ID";

// ── In-memory auth state ─────────────────────────────────────────────────────
let authState = {
  isAuthenticated: false,
  idToken: null,
  email: null,
  userId: null,
  tokenExpiry: null,
};

// ── Restore from storage on startup ─────────────────────────────────────────
chrome.runtime.onStartup.addListener(restoreSession);
chrome.runtime.onInstalled.addListener(restoreSession);

async function restoreSession() {
  const stored = await chrome.storage.local.get(["lc_id_token", "lc_email", "lc_user_id", "lc_expiry"]);
  if (stored.lc_id_token && stored.lc_expiry && Date.now() < stored.lc_expiry) {
    authState = {
      isAuthenticated: true,
      idToken: stored.lc_id_token,
      email: stored.lc_email,
      userId: stored.lc_user_id,
      tokenExpiry: stored.lc_expiry,
    };
  }
}

// ── Message handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch(err => sendResponse({ error: err.message }));
  return true; // keep channel open for async
});

async function handleMessage(msg) {
  switch (msg.type) {
    case "GET_AUTH_STATE":
      return {
        isAuthenticated: authState.isAuthenticated,
        email: authState.email,
        userId: authState.userId,
      };

    case "SIGN_IN":
      return signIn(msg.email, msg.password);

    case "SIGN_UP":
      return signUp(msg.email, msg.password);

    case "CONFIRM_SIGN_UP":
      return confirmSignUp(msg.email, msg.code);

    case "SIGN_OUT":
      return signOut();

    case "ANALYZE_SUBMISSION":
      return analyzeSubmission(msg.payload);

    case "GET_SUBMISSIONS":
      return apiGet("/submissions");

    case "GET_REVIEW_QUEUE":
      return apiGet("/reviews/queue");

    case "SUBMIT_REVIEW":
      return apiPost("/reviews/submit", { problemSlug: msg.problemSlug, quality: msg.quality });

    default:
      throw new Error(`Unknown message type: ${msg.type}`);
  }
}

// ── Cognito Auth (password flow via fetch — no SDK needed in SW) ─────────────
async function signIn(email, password) {
  // Cognito USER_PASSWORD_AUTH flow
  const res = await fetch(
    `https://cognito-idp.${regionFromPoolId(USER_POOL_ID)}.amazonaws.com/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
      },
      body: JSON.stringify({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: CLIENT_ID,
        AuthParameters: { USERNAME: email, PASSWORD: password },
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.__type || "Sign in failed");

  const { IdToken, ExpiresIn } = data.AuthenticationResult;
  const expiry = Date.now() + (ExpiresIn - 60) * 1000;
  const payload = parseJwt(IdToken);

  authState = {
    isAuthenticated: true,
    idToken: IdToken,
    email: payload.email,
    userId: payload.sub,
    tokenExpiry: expiry,
  };

  await chrome.storage.local.set({
    lc_id_token: IdToken,
    lc_email: payload.email,
    lc_user_id: payload.sub,
    lc_expiry: expiry,
  });

  return { success: true, email: payload.email };
}

async function signUp(email, password) {
  const res = await fetch(
    `https://cognito-idp.${regionFromPoolId(USER_POOL_ID)}.amazonaws.com/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": "AWSCognitoIdentityProviderService.SignUp",
      },
      body: JSON.stringify({
        ClientId: CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [{ Name: "email", Value: email }],
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.__type || "Sign up failed");
  return { success: true, confirmed: data.UserConfirmed };
}

async function confirmSignUp(email, code) {
  const res = await fetch(
    `https://cognito-idp.${regionFromPoolId(USER_POOL_ID)}.amazonaws.com/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": "AWSCognitoIdentityProviderService.ConfirmSignUp",
      },
      body: JSON.stringify({ ClientId: CLIENT_ID, Username: email, ConfirmationCode: code }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.__type || "Confirmation failed");
  return { success: true };
}

async function signOut() {
  authState = { isAuthenticated: false, idToken: null, email: null, userId: null, tokenExpiry: null };
  await chrome.storage.local.remove(["lc_id_token", "lc_email", "lc_user_id", "lc_expiry"]);
  return { success: true };
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function ensureToken() {
  if (!authState.isAuthenticated) throw new Error("Not authenticated");
  if (authState.tokenExpiry && Date.now() > authState.tokenExpiry) {
    throw new Error("Session expired — please sign in again");
  }
  return authState.idToken;
}

async function apiGet(path) {
  const token = await ensureToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

async function apiPost(path, body) {
  const token = await ensureToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

async function analyzeSubmission(payload) {
  return apiPost("/submissions/analyze", payload);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function regionFromPoolId(poolId) {
  return poolId.split("_")[0];
}

function parseJwt(token) {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64).split("").map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
  );
  return JSON.parse(json);
}
