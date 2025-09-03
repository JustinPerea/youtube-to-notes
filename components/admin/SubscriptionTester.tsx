/**
 * Admin Subscription Tester Component
 * Provides a UI for testing different subscription tiers without payment
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Zap, Shield, Users } from 'lucide-react';
import { type SubscriptionTier } from '@/lib/subscription/config';

interface SubscriptionInfo {
  subscription: {
    id: string;
    tier: SubscriptionTier;
    status: string;
    adminOverride?: {
      tier: SubscriptionTier;
      expires?: string;
    };
  };
  limits: {
    videosPerMonth: number | 'unlimited';
    aiQuestionsPerMonth: number | 'unlimited';
    storageGB: number;
    availableFormats: string[];
    exportFormats: string[];
    processingSpeed: string;
    watermarkOnExports: boolean;
  };
  isTestAccount: boolean;
}

export function SubscriptionTester() {
  const { data: session } = useSession();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testTier, setTestTier] = useState<SubscriptionTier>('free');
  const [expiresInHours, setExpiresInHours] = useState<number>(24);

  // Only show for admins in development or with admin email
  const isAdmin = process.env.NODE_ENV === 'development' || 
    session?.user?.email === 'justinmperea@gmail.com';

  useEffect(() => {
    if (isAdmin) {
      loadSubscriptionInfo();
    }
  }, [isAdmin]);

  const loadSubscriptionInfo = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch('/api/admin/subscription-override');
      const data = await response.json();

      if (response.ok) {
        setSubscriptionInfo(data);
      } else {
        setError(data.error || 'Failed to load subscription info');
      }
    } catch (err) {
      setError('Failed to load subscription info');
    } finally {
      setLoading(false);
    }
  };

  const setSubscriptionOverride = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/subscription-override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          tier: testTier,
          expiresInHours,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        await loadSubscriptionInfo();
      } else {
        setError(data.error || 'Failed to set subscription override');
      }
    } catch (err) {
      setError('Failed to set subscription override');
    } finally {
      setLoading(false);
    }
  };

  const clearSubscriptionOverride = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/admin/subscription-override?userId=${session.user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Subscription override cleared');
        await loadSubscriptionInfo();
      } else {
        setError(data.error || 'Failed to clear subscription override');
      }
    } catch (err) {
      setError('Failed to clear subscription override');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8 border-2 border-dashed border-orange-300 bg-orange-50/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-orange-700">Admin Subscription Tester</CardTitle>
        </div>
        <CardDescription>
          Test different subscription tiers without payment. Only visible to admins in development.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        {subscriptionInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-gray-700">Current Status</h3>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={subscriptionInfo.isTestAccount ? "destructive" : "default"}
                  className="capitalize"
                >
                  {subscriptionInfo.subscription.tier}
                </Badge>
                {subscriptionInfo.isTestAccount && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    Test Account
                  </Badge>
                )}
              </div>
              {subscriptionInfo.subscription.adminOverride?.expires && (
                <p className="text-xs text-gray-500">
                  Override expires: {new Date(subscriptionInfo.subscription.adminOverride.expires).toLocaleString()}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-gray-700">Current Limits</h3>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Videos:</span>
                  <span className="font-mono">{subscriptionInfo.limits.videosPerMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Chat:</span>
                  <span className="font-mono">{subscriptionInfo.limits.aiQuestionsPerMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span className="font-mono">{subscriptionInfo.limits.storageGB}GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing:</span>
                  <span className="font-mono capitalize">{subscriptionInfo.limits.processingSpeed}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Testing Controls */}
        <div className="border rounded-lg p-4 bg-white">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Test Subscription Tier
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Test Tier
              </label>
              <Select value={testTier} onValueChange={(value) => setTestTier(value as SubscriptionTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">
                    <div className="flex items-center gap-2">
                      <span>Free</span>
                      <Badge variant="secondary" className="text-xs">5 videos</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="student">
                    <div className="flex items-center gap-2">
                      <span>Student ($9.99)</span>
                      <Badge variant="secondary" className="text-xs">Unlimited</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="pro">
                    <div className="flex items-center gap-2">
                      <span>Pro ($19.99)</span>
                      <Badge variant="secondary" className="text-xs">Unlimited + AI</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Expires In (Hours)
              </label>
              <Input
                type="number"
                min="1"
                max="168"
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(parseInt(e.target.value) || 24)}
                placeholder="24"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={setSubscriptionOverride}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Clock className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Users className="h-4 w-4 mr-2" />
                )}
                Set Test Tier
              </Button>
              
              {subscriptionInfo?.isTestAccount && (
                <Button
                  onClick={clearSubscriptionOverride}
                  disabled={loading}
                  variant="outline"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { tier: 'free', name: 'Free', price: '$0', highlight: false },
            { tier: 'student', name: 'Student', price: '$9.99', highlight: testTier === 'student' },
            { tier: 'pro', name: 'Pro', price: '$19.99', highlight: testTier === 'pro' }
          ].map((plan) => (
            <div 
              key={plan.tier}
              className={`border rounded-lg p-3 ${
                plan.highlight ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="font-medium text-sm mb-2">
                {plan.name} <span className="text-gray-500">({plan.price})</span>
              </div>
              <div className="text-xs space-y-1 text-gray-600">
                <div>Videos: {plan.tier === 'free' ? '5/month' : 'Unlimited'}</div>
                <div>AI Chat: {
                  plan.tier === 'free' ? 'None' : 
                  plan.tier === 'student' ? '10/month' : 'Unlimited'
                }</div>
                <div>Storage: {
                  plan.tier === 'free' ? '100MB' : 
                  plan.tier === 'student' ? '5GB' : '50GB'
                }</div>
                <div>Speed: {plan.tier === 'pro' ? 'Priority' : 'Standard'}</div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 italic">
          💡 This testing system lets you experience all subscription features without payment. 
          Overrides expire automatically and won't affect real billing.
        </p>
      </CardContent>
    </Card>
  );
}