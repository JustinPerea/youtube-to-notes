import { isDebugEnabled } from '@/lib/security/debug-gate';
import React from 'react';
import { PolarDowngradeToggle } from './PolarDowngradeToggle';

export const dynamic = 'force-dynamic';

function NotFound() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Not Found</h1>
      <p className="text-sm text-gray-500">Admin flags page is disabled.</p>
    </div>
  );
}

export default async function AdminFlagsPage() {
  if (!isDebugEnabled()) {
    return <NotFound />;
  }
  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Flags</h1>
      <p className="text-sm text-gray-600">These flags affect runtime behavior in this instance only.</p>
      <PolarDowngradeToggle />
    </div>
  );
}

// Client UI moved to a separate client component.
