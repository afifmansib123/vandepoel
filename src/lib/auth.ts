// src/lib/auth.ts
import { NextRequest } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface DecodedToken extends JwtPayload {
  sub: string; // Cognito user ID
  email?: string;
  name?: string;
  'custom:role'?: string;
  'cognito:username'?: string;
}

export interface UserFromToken {
  userId: string;
  email: string;
  name?: string;
  username?: string;
  role?: string;
}

/**
 * Extract and decode user information from JWT token in Authorization header
 * @param request - NextRequest object containing Authorization header
 * @returns User information or null if token is invalid/missing
 */
export async function getUserFromToken(request: NextRequest): Promise<UserFromToken | null> {
  try {
    const authorizationHeader = request.headers.get('Authorization');

    if (!authorizationHeader) {
      console.warn('[getUserFromToken] Missing Authorization header');
      return null;
    }

    // Extract Bearer token
    const tokenParts = authorizationHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0].toLowerCase() !== 'bearer' || !tokenParts[1]) {
      console.warn('[getUserFromToken] Invalid Authorization header format');
      return null;
    }

    const token = tokenParts[1];

    // Decode the JWT token (without verification for now)
    // In production, you might want to verify the token signature
    const decoded = jwt.decode(token) as DecodedToken | null;

    if (!decoded || !decoded.sub) {
      console.warn('[getUserFromToken] Invalid or malformed token');
      return null;
    }

    // Extract user information from token
    return {
      userId: decoded.sub,
      email: decoded.email || '',
      name: decoded.name,
      username: decoded['cognito:username'],
      role: decoded['custom:role']?.toLowerCase(),
    };
  } catch (error) {
    console.error('[getUserFromToken] Error decoding token:', error);
    return null;
  }
}

/**
 * Verify user has required role
 * @param user - User object from getUserFromToken
 * @param allowedRoles - Array of allowed roles
 * @returns true if user has required role
 */
export function hasRole(user: UserFromToken | null, allowedRoles: string[]): boolean {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
}
