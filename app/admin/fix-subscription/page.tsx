'use client';

import { useState } from 'react';

export default function FixSubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function fixSubscription() {
    try {
      setLoading(true);
      setMessage('');
      
      const response = await fetch('/api/admin/fix-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix subscription');
      }

      setMessage('✅ Subscription successfully fixed to Pro!');
      setTimeout(() => {
        window.location.href = '/profile'; // Redirect to profile to see changes
      }, 2000);
      
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Emergency Subscription Fix</h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              🚨 Polar Webhook Issue Detected
            </h2>
            <p className="text-yellow-700 text-sm">
              Your Pro purchase from Polar didn't update your subscription automatically. 
              This is likely due to a webhook configuration issue.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800">Current Status:</h3>
              <p className="text-gray-600">Email: justinmperea@gmail.com</p>
              <p className="text-gray-600">Expected Tier: Pro (paid via Polar)</p>
              <p className="text-gray-600">Current Tier: Free (webhook issue)</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-3">Manual Fix:</h3>
              <p className="text-gray-600 text-sm mb-4">
                Click the button below to manually set your subscription to Pro. 
                This will give you immediate access to all Pro features.
              </p>
              
              <button
                onClick={fixSubscription}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Fixing Subscription...' : '🔧 Fix My Pro Subscription'}
              </button>
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Why did this happen?</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Polar webhooks might be pointing to localhost instead of production</li>
            <li>• The webhook secret might be incorrect</li>
            <li>• Polar might not have sent the webhook after purchase</li>
          </ul>
          <p className="text-blue-700 text-sm mt-2">
            We'll investigate the webhook configuration to prevent this from happening to other customers.
          </p>
        </div>
      </div>
    </div>
  );
}