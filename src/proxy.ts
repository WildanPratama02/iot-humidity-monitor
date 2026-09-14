import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
    '/login',
];

// Routes that should be completely ignored (static files, API, etc.)
const ignoredPaths = [
    '/_next',
    '/api',
    '/favicon.ico',
    '/manifest.json',
    '/sw.js',
    '/icons',
];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Ignore static files and API routes
    if (ignoredPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Check if route is public
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Check for auth token in cookies or localStorage (via custom header)
    // Note: localStorage is not accessible in middleware, so we rely on cookies
    // For localStorage-based auth, we check on client side
    const token = request.cookies.get('iot_auth_token')?.value;

    // If there's a token in cookie, allow access
    if (token) {
        return NextResponse.next();
    }

    // For localStorage-based tokens, we can't check here
    // The client-side AuthGuard component will handle the redirect
    // So we allow the request to proceed
    return NextResponse.next();
}

export const config = {
    // Matcher configuration - applies middleware only to specific routes
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
    ],
};
