
import crypto from "crypto";

export interface JWTPayload {
  id: string | number;
  rollNumber: string;
  name: string;
}

const SECRET = process.env.JWT_SECRET || "super-secret-key-b-pharmacy-chiniot-2026";


export async function signToken(payload: JWTPayload): Promise<string> {
  const data = JSON.stringify(payload);
  const base64Data = Buffer.from(data).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(base64Data)
    .digest("base64url");

  return `${base64Data}.${signature}`;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const [base64Data, signature] = token.split(".");
    if (!base64Data || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(base64Data)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const jsonStr = Buffer.from(base64Data, "base64url").toString("utf-8");
    return JSON.parse(jsonStr) as JWTPayload;
  } catch (error) {
    return null;
  }
}