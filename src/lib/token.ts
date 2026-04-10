import jwt from "jsonwebtoken";

export function createAccessToken(
  userId: string,
  role: "TENANT" | "STAFF" | "SAFETY_STAFF" | "SAFETY_ADMIN" | "ADMIN",
  tokenVersion: number
) {
  const payload = { sub: userId, role, tokenVersion };

  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: "12h",
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
    sub: string;
    role: "TENANT" | "STAFF" | "SAFETY_STAFF" | "SAFETY_ADMIN" | "ADMIN";
    tokenVersion: number;
  };
}

export function createRefreshToken(userId: string, tokenVersion: number) {
  const payload = { sub: userId, tokenVersion };

  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: "7d",
  });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
    sub: string;
    tokenVersion: number;
  };
}
