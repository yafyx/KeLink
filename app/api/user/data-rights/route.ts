import { getAuthUserFromRequest } from '@/lib/auth-utils';
import { DataProtection } from '@/lib/data-protection';
import { NextResponse } from 'next/server';

/**
 * Handle data access requests
 * GET /api/user/data-rights?action=export
 */
export async function GET(request: Request) {
    try {
        // Get authenticated user
        const user = getAuthUserFromRequest(request);

        // Get URL to determine action
        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        // Handle export action (right to data portability)
        if (action === 'export') {
            const dataProtection = DataProtection.getInstance();
            const userData = await dataProtection.exportUserData(user);

            return NextResponse.json({
                message: 'User data exported successfully',
                data: userData
            });
        }

        return NextResponse.json(
            { error: 'Invalid action specified' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Error handling data rights request:', error);

        if (error.message && error.message.startsWith('Unauthorized')) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to process data rights request' },
            { status: 500 }
        );
    }
}

/**
 * Handle data deletion requests (right to be forgotten)
 * DELETE /api/user/data-rights
 */
export async function DELETE(request: Request) {
    try {
        // Get authenticated user
        const user = getAuthUserFromRequest(request);

        // Process deletion request
        const dataProtection = DataProtection.getInstance();
        await dataProtection.deleteUserData(user);

        return NextResponse.json({
            message: 'User data deleted successfully'
        });
    } catch (error: any) {
        console.error('Error handling data deletion request:', error);

        if (error.message && error.message.startsWith('Unauthorized')) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to delete user data' },
            { status: 500 }
        );
    }
} 