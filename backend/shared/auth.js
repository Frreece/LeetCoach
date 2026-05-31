// backend/shared/auth.js
import { CognitoJwtVerifier } from "aws-jwt-verify";

let verifier;

function getVerifier() {
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.USER_POOL_ID,
      tokenUse: "id",
      clientId: process.env.USER_POOL_CLIENT_ID,
    });
  }
  return verifier;
}

export async function getUserId(event) {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }
  const token = authHeader.slice(7);
  const payload = await getVerifier().verify(token);
  return payload.sub;
}

export function cors(event) {
  const origin = event?.headers?.origin || event?.headers?.Origin || process.env.WEBSITE_URL || "*";
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}

export function ok(body, event) {
  return { statusCode: 200, headers: cors(event), body: JSON.stringify(body) };
}

export function err(status, message, event) {
  return { statusCode: status, headers: cors(event), body: JSON.stringify({ error: message }) };
}