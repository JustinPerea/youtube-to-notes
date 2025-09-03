/**
 * Admin Testing Page
 * Provides access to subscription testing tools
 */

import { Suspense } from 'react';
import { SubscriptionTester } from '@/components/admin/SubscriptionTester';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap, Database, Settings } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Testing Center</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive testing tools for subscription tiers, usage limits, and feature access. 
            Test all subscription features without payment.
          </p>
        </div>

        {/* Development Notice */}
        <div className="bg-orange-100 border border-orange-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Settings className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-orange-800">Development Mode</span>
          </div>
          <p className="text-orange-700 text-sm">
            This admin interface is only visible in development mode or to admin users. 
            All subscription overrides are temporary and won't affect real billing.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Free Tier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Badge variant="secondary">5 videos/month</Badge>
              <div>• No AI chat</div>
              <div>• 100MB storage</div>
              <div>• Basic formats only</div>
              <div>• Watermarked exports</div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                Student
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Badge variant="secondary">Unlimited videos</Badge>
              <div>• 10 AI questions/month</div>
              <div>• 5GB storage</div>
              <div>• Study formats</div>
              <div>• Clean exports</div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                Pro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Badge variant="secondary">Unlimited everything</Badge>
              <div>• Unlimited AI chat</div>
              <div>• 50GB storage</div>
              <div>• All formats</div>
              <div>• Priority processing</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-gray-500" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>• Usage tracking</div>
              <div>• Monthly resets</div>
              <div>• Historical data</div>
              <div>• Postgres functions</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Testing Component */}
        <Suspense fallback={
          <Card>
            <CardHeader>
              <CardTitle>Loading Subscription Tester...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        }>
          <SubscriptionTester />
        </Suspense>

        {/* Testing Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Testing Instructions
            </CardTitle>
            <CardDescription>
              Follow these steps to comprehensively test your subscription system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Database Setup</h3>
                <ol className="text-sm space-y-2 list-decimal list-inside text-gray-600">
                  <li>Run the subscription migration in Supabase SQL editor</li>
                  <li>Verify all tables and functions are created</li>
                  <li>Check that enum values match your tiers</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Tier Testing</h3>
                <ol className="text-sm space-y-2 list-decimal list-inside text-gray-600">
                  <li>Set subscription override using the tester above</li>
                  <li>Test video processing limits on /process page</li>
                  <li>Test AI chat limits if implemented</li>
                  <li>Verify export format restrictions</li>
                </ol>
              </div>

              <div>
                <h3 className="font-medium mb-3">API Testing</h3>
                <ol className="text-sm space-y-2 list-decimal list-inside text-gray-600">
                  <li>Test subscription guards on API routes</li>
                  <li>Verify proper error messages for limit exceeded</li>
                  <li>Check usage counters increment correctly</li>
                </ol>
              </div>

              <div>
                <h3 className="font-medium mb-3">Monthly Reset</h3>
                <ol className="text-sm space-y-2 list-decimal list-inside text-gray-600">
                  <li>Manually test usage counter resets</li>
                  <li>Verify historical data is preserved</li>
                  <li>Check limits refresh for new month</li>
                </ol>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>💡 Pro Tip:</strong> Use the browser's developer tools to inspect network requests 
                and verify that subscription data is being passed correctly between components.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Links */}
        <Card>
          <CardHeader>
            <CardTitle>Documentation & Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Testing Guide</h3>
                <p className="text-sm text-gray-600">Complete testing instructions</p>
                <Badge variant="outline" className="mt-2">SUBSCRIPTION_TESTING_GUIDE.md</Badge>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Configuration</h3>
                <p className="text-sm text-gray-600">Subscription limits & features</p>
                <Badge variant="outline" className="mt-2">lib/subscription/config.ts</Badge>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Database Schema</h3>
                <p className="text-sm text-gray-600">Tables & migration scripts</p>
                <Badge variant="outline" className="mt-2">lib/db/migrations/</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}