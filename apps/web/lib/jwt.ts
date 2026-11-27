
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function createToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

/**
 * Signs a short-lived token for a specific, authorized workflow.
 * The caller must include a purpose field and validate every
 * relevant claim when verifying the token.
 */
export function createUploadIntentToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "10m",
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
