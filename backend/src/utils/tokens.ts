import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { UserRole } from "../models/User";

export interface JwtPayload {
  sub: string;
  role: UserRole;
  centerId: string;
}

export function signAccessToken(
  payload: JwtPayload,
  secret: string,
  expiresIn: string
): string {
  return jwt.sign(
    payload,
    secret as Secret,
    { expiresIn } as unknown as SignOptions
  );
}

export function verifyAccessToken(token: string, secret: string): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}
