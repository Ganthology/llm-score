import { NextRequest } from 'next/server';
import { createAuth } from '@/convex/auth';
import { getToken as getTokenNextjs } from '@convex-dev/better-auth/nextjs';

// Token helper for calling Convex functions from server code
export const getToken = () => {
  return getTokenNextjs(createAuth);
};

/**
 * Gets the current user ID from a Next.js API request using the official Convex + Better Auth integration
 * Throws an error if the user is not authenticated
 */
export async function getCurrentUserId(request: NextRequest): Promise<string> {
  try {
    // Use the official Convex + Better Auth token helper
    const token = await getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    // The getToken function returns the actual token string
    // We need to decode it to get the user ID
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid token format');
    }

    try {
      // Decode the payload (second part of JWT)
      let payload;
      try {
        // Try base64url first (standard JWT encoding)
        payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString());
      } catch {
        // Fallback to base64 if base64url fails
        payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      }

      // Validate token has required fields
      if (!payload.sub) {
        throw new Error('No user ID in token');
      }

      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      return payload.sub;
    } catch (decodeError: any) {
      console.error('Token decode error:', decodeError.message);
      throw new Error('Invalid session token');
    }
  } catch (error: any) {
    console.error('Authentication error:', error.message || error);
    throw new Error('Authentication required');
  }
}