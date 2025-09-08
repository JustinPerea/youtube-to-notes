'use client';

import { useState, useEffect } from 'react';

interface UserState {
  user: {
    id: string;
    email: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    paymentProvider: string;
    polarSubscriptionId: string;
  };
  adminOverride: {
    tier: string | null;
    expires: string | null;
    isActive: boolean;
  };
  canClearOverride: boolean;
}

export default function ClearOverridePage() {
  const [userState, setUserState] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUserState();
  }, []);

  async function fetchUserState() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/clear-override');
      if (!response.ok) {
        throw new Error('Failed to fetch user state');
      }
      const data = await response.json();
      setUserState(data);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function clearOverride() {
    try {
      setClearing(true);
      setMessage('');
      
      const response = await fetch('/api/admin/clear-override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear override');
      }

      setMessage('✅ Admin override cleared successfully!');
      setTimeout(() => {
        window.location.reload(); // Refresh to see changes
      }, 1500);
      
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setClearing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Admin Override Manager</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!userState) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Admin Override Manager</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Failed to load user state.</p>
            {message && <p className="text-red-600 text-sm mt-2">{message}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Admin Override Manager</h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('✅') 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Current User State</h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Email:</strong>
              <div className="text-gray-600">{userState.user.email}</div>
            </div>
            
            <div>
              <strong>Subscription Tier:</strong>
              <div className={`font-mono ${
                userState.user.subscriptionTier === 'pro' ? 'text-purple-600' :
                userState.user.subscriptionTier === 'basic' ? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {userState.user.subscriptionTier}
              </div>
            </div>
            
            <div>
              <strong>Status:</strong>
              <div className={`font-mono ${
                userState.user.subscriptionStatus === 'active' ? 'text-green-600' : 'text-red-600'
              }`}>
                {userState.user.subscriptionStatus}
              </div>
            </div>
            
            <div>
              <strong>Payment Provider:</strong>
              <div className="text-gray-600">{userState.user.paymentProvider}</div>
            </div>
            
            {userState.user.polarSubscriptionId && (
              <div className="col-span-2">
                <strong>Polar Subscription ID:</strong>
                <div className="text-gray-600 font-mono text-xs">
                  {userState.user.polarSubscriptionId}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Admin Override Status</h2>
          
          {userState.adminOverride.isActive ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">
                  🚨 Active Admin Override Detected
                </p>
                <div className="mt-2 text-sm text-yellow-700">
                  <p><strong>Override Tier:</strong> {userState.adminOverride.tier}</p>
                  <p><strong>Expires:</strong> {
                    userState.adminOverride.expires 
                      ? new Date(userState.adminOverride.expires).toLocaleString()
                      : 'Never'
                  }</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm mb-3">
                  The admin override is preventing you from seeing your real subscription tier. 
                  Clear it to see your actual Pro subscription.
                </p>
                
                <button
                  onClick={clearOverride}
                  disabled={clearing}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {clearing ? 'Clearing...' : 'Clear Admin Override'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                ✅ No Active Admin Override
              </p>
              <p className="text-green-700 text-sm mt-1">
                Your subscription tier should reflect your actual Polar purchase.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={fetchUserState}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Refresh State
          </button>
        </div>
      </div>
    </div>
  );
}