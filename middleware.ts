import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Add any route protection logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    // Add routes that require authentication here
    // '/dashboard/:path*',
    // '/profile/:path*',
  ],
};
