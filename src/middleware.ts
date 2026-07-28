import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';
import { hasPermission } from './service/permission.service';

export function isAuthorized({ token }: { token: any }) {
  return !!(token && token.uid);
}

export async function middlewareHandler(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!isAuthorized({ token })) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  const pathname = req.nextUrl.pathname;

  // Mapping of paths to their required navigation permission code
  const routePermissionMap: Record<string, string> = {
    '/vendors': 'vendors:view',
    '/agents': 'agents:view',
    '/customers': 'customers:view',
    '/gateways': 'gateways:view',
    '/orders': 'orders:view',
    '/follow-ups': 'follow-ups:view',
    '/call-dispositions': 'call-dispositions:view',
    '/pending/booking': 'orders:view-pending-booking',
    '/pending/shipment': 'orders:view-pending-shipment',
    '/pending/delivery': 'orders:view-pending-delivery',
    '/pending/feedback': 'orders:view-pending-feedback',
    '/pending/resolutions': 'orders:view-pending-resolutions',
    '/pending/returned': 'orders:view-returned',
    '/pending/cancelled': 'orders:view-cancelled',
    '/settings/data-management': 'super-admin',
  };

  // Check if the current route matches any protected path prefix
  const matchedPath = Object.keys(routePermissionMap).find((path) =>
    pathname.startsWith(path)
  );

  if (matchedPath) {
    const requiredPermission = routePermissionMap[matchedPath];
    const userPermissions = token?.userPermissions as string | undefined;

    // Special case: /orders path allows orders:view or orders:create
    if (matchedPath === '/orders') {
      const canView = hasPermission(userPermissions, 'orders:view');
      const canCreate = hasPermission(userPermissions, 'orders:create');
      if (!canView && !canCreate) {
        return NextResponse.redirect(new URL('/access-denied', req.url));
      }
    } else if (matchedPath === '/follow-ups') {
      const canView = hasPermission(userPermissions, 'follow-ups:view');
      const canCreate = hasPermission(userPermissions, 'follow-ups:create');
      if (!canView && !canCreate) {
        return NextResponse.redirect(new URL('/access-denied', req.url));
      }
    } else if (matchedPath === '/call-dispositions') {
      const canView = hasPermission(userPermissions, 'call-dispositions:view');
      const canCreate = hasPermission(userPermissions, 'call-dispositions:create');
      if (!canView && !canCreate) {
        return NextResponse.redirect(new URL('/access-denied', req.url));
      }
    } else {
      // If user lacks permissions, redirect to access-denied
      if (!hasPermission(userPermissions, requiredPermission)) {
        return NextResponse.redirect(new URL('/access-denied', req.url));
      }
    }
  }

  return NextResponse.next();
}

export default async function middleware(req: NextRequest) {
  return middlewareHandler(req);
}

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
