'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  effectiveTier: string;
  hasAdminOverride: boolean;
  adminOverrideTier?: string;
  paymentProvider?: string;
  hasPolarSub: boolean;
  createdAt: string;
}

interface UserData {
  summary: {
    totalUsers: number;
    tierCounts: {
      free: number;
      basic: number;
      pro: number;
      admin_override: number;
    };
    paidUsers: number;
  };
  users: User[];
}

export default function AdminUsersPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }
      
      setUserData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">👥 User Management</h1>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">👥 User Management</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error: {error}</p>
            <button 
              onClick={fetchUsers}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">👥 User Management Dashboard</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-blue-600">{userData.summary.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-green-600">{userData.summary.paidUsers}</div>
            <div className="text-sm text-gray-600">Paid Users</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-purple-600">{userData.summary.tierCounts.pro}</div>
            <div className="text-sm text-gray-600">Pro Users</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-orange-600">{userData.summary.tierCounts.admin_override}</div>
            <div className="text-sm text-gray-600">Admin Overrides</div>
          </div>
        </div>

        {/* Tier Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">📊 Subscription Tier Breakdown</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-600">{userData.summary.tierCounts.free}</div>
              <div className="text-sm">Free</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{userData.summary.tierCounts.basic}</div>
              <div className="text-sm">Basic</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{userData.summary.tierCounts.pro}</div>
              <div className="text-sm">Pro</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">{userData.summary.tierCounts.admin_override}</div>
              <div className="text-sm">Admin Override</div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold">All Users ({userData.users.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userData.users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      <div className="text-xs text-gray-500">{user.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.effectiveTier === 'pro' ? 'bg-purple-100 text-purple-800' :
                        user.effectiveTier === 'basic' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.effectiveTier}
                      </span>
                      {user.hasAdminOverride && (
                        <span className="ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          OVERRIDE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${
                        user.subscriptionStatus === 'active' ? 'text-green-600' : 
                        user.subscriptionStatus === 'canceled' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {user.subscriptionStatus || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.paymentProvider || 'none'}
                      {user.hasPolarSub && (
                        <span className="ml-1 text-xs text-blue-600">✓</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}