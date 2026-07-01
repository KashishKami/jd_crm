import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { hasPermission } from './service/permission.service';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Mapping of paths to their required navigation permission code
    const routePermissionMap: Record<string, string> = {
      '/vendors': 'vendors:view',
      '/agents': 'agents:view',
      '/gateways': 'gateways:view',
      '/orders': 'orders:view',
      '/pending/booking': 'orders:view-pending-booking',
      '/pending/shipment': 'orders:view-pending-shipment',
      '/pending/delivery': 'orders:view-pending-delivery',
      '/pending/feedback': 'orders:view-pending-feedback',
      '/pending/resolutions': 'orders:view-pending-resolutions',
      '/pending/returned': 'orders:view-returned',
    };

    // Check if the current route matches any protected path prefix
    const matchedPath = Object.keys(routePermissionMap).find((path) =>
      pathname.startsWith(path)
    );

    if (matchedPath) {
      const requiredPermission = routePermissionMap[matchedPath];
      const userPermissions = token?.userPermissions as string | undefined;

      // If user lacks permissions, redirect to access-denied
      if (!hasPermission(userPermissions, requiredPermission)) {
        return NextResponse.redirect(new URL('/access-denied', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Access requires a valid token
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (NextAuth API routes)
     * - login (standalone sign-in page)
     * - access-denied (standalone error page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - next.svg, vercel.svg (public images)
     */
    '/((?!api/auth|login|access-denied|_next/static|_next/image|favicon.ico|next.svg|vercel.svg).*)',
  ],
};
