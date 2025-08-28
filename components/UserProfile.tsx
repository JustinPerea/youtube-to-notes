'use client';

import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

export default function UserProfile() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
        <div className="w-20 h-4 bg-gray-600 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {session.user?.image && (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User'}
            width={32}
            height={32}
            className="rounded-full"
          />
        )}
        <span className="text-white text-sm font-medium hidden sm:block">
          {session.user?.name}
        </span>
      </div>
      
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="text-gray-400 hover:text-white transition-colors text-sm"
      >
        Sign Out
      </button>
    </div>
  );
}
