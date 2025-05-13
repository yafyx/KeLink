import { verify } from 'jsonwebtoken';
import { headers } from 'next/headers';

// JWT secret key should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'kelink-secure-jwt-secret';

export interface DecodedToken {
    uid: string;
    email: string;
    name?: string;
    vendorType?: string;
    [key: string]: any;
}

/**
 * Gets the authorization token from the headers object
 */
export async function getAuthTokenFromHeaders(): Promise<string | null> {
    try {
        const headersList = await headers();
        const authHeader = headersList.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        return authHeader.split(' ')[1];
    } catch (error) {
        console.error('Error getting auth token from headers:', error);
        return null;
    }
}

/**
 * Gets the authorization token from a Request object
 */
export function getAuthTokenFromRequest(request: Request): string | null {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        return authHeader.split(' ')[1];
    } catch (error) {
        console.error('Error getting auth token from request:', error);
        return null;
    }
}

/**
 * Verifies the JWT token and returns decoded data
 */
export function verifyToken(token: string | null): DecodedToken {
    if (!token) {
        throw new Error('Unauthorized: No token provided');
    }

    try {
        const decoded = verify(token, JWT_SECRET) as DecodedToken;
        return decoded;
    } catch (error) {
        throw new Error('Unauthorized: Invalid token');
    }
}

/**
 * Gets the authenticated user from the current request context
 */
export async function getAuthUser(): Promise<DecodedToken> {
    const token = await getAuthTokenFromHeaders();
    return verifyToken(token);
}

/**
 * Gets the authenticated user from a Request object
 */
export function getAuthUserFromRequest(request: Request): DecodedToken {
    const token = getAuthTokenFromRequest(request);
    return verifyToken(token);
} 