/**
 * Admin Testing Page - Redirect to Simple Admin
 * The full admin interface requires shadcn/ui components
 * For now, redirect to our working simple admin page
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the working simple admin page
    router.push('/admin/simple');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to admin panel...</p>
      </div>
    </div>
  );
}