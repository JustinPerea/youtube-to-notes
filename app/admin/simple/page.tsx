/**
 * Simple Admin Testing Page (No shadcn/ui dependencies)
 * Basic HTML elements for subscription testing
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';

interface SubscriptionInfo {
  subscription: {
    id: string;
    tier: 'free' | 'basic' | 'pro';
    status: string;
    adminOverride?: {
      tier: 'free' | 'basic' | 'pro';
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

export default function SimpleAdminPage() {
  const { data: session } = useSession();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testTier, setTestTier] = useState<'free' | 'basic' | 'pro'>('free');
  const [expiresInHours, setExpiresInHours] = useState<number>(24);
  const [testResults, setTestResults] = useState<any>(null);
  const [runningTest, setRunningTest] = useState<string>('');

  // Only show for admins in development or with admin email
  const isAdmin = process.env.NODE_ENV === 'development' || 
    session?.user?.email === 'justinmperea@gmail.com';

  useEffect(() => {
    if (isAdmin && session) {
      loadSubscriptionInfo();
    }
  }, [isAdmin, session]);

  const loadSubscriptionInfo = async () => {
    if (!session?.user?.id) {
      setError('Not authenticated - please sign in');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/subscription-override');
      const data = await response.json();

      if (response.ok) {
        setSubscriptionInfo(data);
        setError(null); // Clear any previous errors
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

  const runLimitTest = async (testType: 'video_limits' | 'ai_limits' | 'reset_usage') => {
    try {
      setRunningTest(testType);
      setError(null);
      setTestResults(null);

      const response = await fetch('/api/admin/test-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testType }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResults(data);
        setSuccess(data.message);
        // Reload subscription info to show updated usage
        await loadSubscriptionInfo();
      } else {
        setError(data.error || 'Failed to run test');
      }
    } catch (err) {
      setError('Failed to run test');
    } finally {
      setRunningTest('');
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Access Denied</h1>
        <p>This admin interface is only available to authorized users in development mode.</p>
      </div>
    );
  }

  const styles = {
    container: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f9fafb',
      minHeight: '100vh',
      color: '#111827', // Much darker text
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '2rem',
      color: '#111827',
    },
    title: {
      color: '#111827',
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
    },
    subtitle: {
      color: '#374151', // Darker gray for better readability
      fontSize: '1rem',
    },
    card: {
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1.5rem',
      marginBottom: '2rem',
      backgroundColor: '#fff',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    adminCard: {
      border: '2px dashed #fb7185',
      backgroundColor: '#fef7f7',
    },
    alert: {
      padding: '1rem',
      borderRadius: '6px',
      marginBottom: '1rem',
      fontSize: '0.875rem',
      fontWeight: '500',
    },
    alertError: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#991b1b',
    },
    alertSuccess: {
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0',
      color: '#166534',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '1rem',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '0.875rem',
      color: '#111827',
      backgroundColor: '#fff',
    },
    button: {
      padding: '0.75rem 1.5rem',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '600',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    buttonSecondary: {
      backgroundColor: '#6b7280',
    },
    badge: {
      display: 'inline-block',
      padding: '0.375rem 0.75rem',
      fontSize: '0.75rem',
      borderRadius: '6px',
      fontWeight: '700',
      textTransform: 'uppercase' as const,
    },
    badgeBlue: {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      border: '1px solid #93c5fd',
    },
    badgeOrange: {
      backgroundColor: '#fed7aa',
      color: '#c2410c',
      border: '1px solid #fdba74',
    },
    badgeGreen: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      border: '1px solid #86efac',
    },
    sectionTitle: {
      fontSize: '1.125rem',
      fontWeight: '700',
      color: '#111827',
      marginBottom: '0.75rem',
    },
    text: {
      color: '#374151',
      fontSize: '0.875rem',
      lineHeight: '1.5',
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#111827',
      display: 'block',
      marginBottom: '0.5rem',
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          🛡️ Admin Subscription Tester
        </h1>
        <p style={styles.subtitle}>
          Test different subscription tiers without payment. Only visible in development mode.
        </p>
      </div>

      {/* Development Notice */}
      <div style={{...styles.card, ...styles.adminCard}}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>⚙️ Development Mode</h3>
          <p style={{ color: '#7c2d12', fontSize: '0.875rem' }}>
            This admin interface is only visible in development mode or to admin users. 
            All subscription overrides are temporary and won't affect real billing.
          </p>
        </div>
      </div>

      {/* Sign In Section for Non-Authenticated Users */}
      {!session && (
        <div style={{...styles.card, backgroundColor: '#fef3c7', border: '2px solid #f59e0b'}}>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#92400e', marginBottom: '1rem' }}>🔐 Authentication Required</h3>
            <p style={{ color: '#78350f', marginBottom: '1.5rem' }}>
              You need to sign in to access the admin testing interface.
            </p>
            <button
              onClick={() => signIn('google')}
              style={{
                ...styles.button,
                backgroundColor: '#4285f4',
                fontSize: '1rem',
                padding: '1rem 2rem',
              }}
            >
              🚀 Sign In with Google
            </button>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div style={{...styles.alert, ...styles.alertError}}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{...styles.alert, ...styles.alertSuccess}}>
          ✅ {success}
        </div>
      )}

      {/* Debug Session Info (in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{...styles.card, backgroundColor: '#f3f4f6', border: '2px solid #9ca3af'}}>
          <h2 style={styles.sectionTitle}>🐛 Session Debug Info</h2>
          <div style={{ fontSize: '0.875rem', color: '#111827', backgroundColor: '#fff', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace' }}>
            <p><strong>Session Status:</strong> {session ? 'Loaded' : 'Not loaded'}</p>
            <p><strong>User Email:</strong> {session?.user?.email || 'Not available'}</p>
            <p><strong>User ID:</strong> {session?.user?.id || 'Not available'}</p>
            <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}

      {/* Current Status */}
      {subscriptionInfo && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>📊 Current Status</h2>
          <div style={styles.grid}>
            <div>
              <h3 style={styles.sectionTitle}>Subscription</h3>
              <span style={{...styles.badge, ...styles.badgeBlue}}>
                {subscriptionInfo.subscription.tier.toUpperCase()}
              </span>
              {subscriptionInfo.isTestAccount && (
                <span style={{...styles.badge, ...styles.badgeOrange, marginLeft: '0.5rem'}}>
                  TEST ACCOUNT
                </span>
              )}
              {subscriptionInfo.subscription.adminOverride?.expires && (
                <p style={{ fontSize: '0.875rem', color: '#374151', marginTop: '0.75rem', fontWeight: '500' }}>
                  Override expires: {new Date(subscriptionInfo.subscription.adminOverride.expires).toLocaleString()}
                </p>
              )}
            </div>
            
            <div>
              <h3 style={styles.sectionTitle}>Current Limits</h3>
              <div style={{ fontSize: '0.875rem', color: '#111827' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', padding: '0.25rem 0' }}>
                  <span style={{ fontWeight: '500' }}>Videos:</span>
                  <strong style={{ color: '#059669' }}>{subscriptionInfo.limits.videosPerMonth}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', padding: '0.25rem 0' }}>
                  <span style={{ fontWeight: '500' }}>AI Chat:</span>
                  <strong style={{ color: '#059669' }}>{subscriptionInfo.limits.aiQuestionsPerMonth}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', padding: '0.25rem 0' }}>
                  <span style={{ fontWeight: '500' }}>Storage:</span>
                  <strong style={{ color: '#059669' }}>{subscriptionInfo.limits.storageGB}GB</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                  <span style={{ fontWeight: '500' }}>Processing:</span>
                  <strong style={{ color: '#059669', textTransform: 'capitalize' }}>{subscriptionInfo.limits.processingSpeed}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Testing Controls */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>⚡ Test Subscription Tier</h2>
        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>
              Test Tier
            </label>
            <select 
              value={testTier} 
              onChange={(e) => setTestTier(e.target.value as any)}
              style={styles.input}
            >
              <option value="free">Free (5 notes)</option>
              <option value="basic">Basic ($3.99 - Unlimited)</option>
              <option value="pro">Pro ($9.99 - Unlimited + AI)</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>
              Expires In (Hours)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(parseInt(e.target.value) || 24)}
              style={styles.input}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
            <button
              onClick={setSubscriptionOverride}
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '⏳ Setting...' : '👥 Set Test Tier'}
            </button>
            
            {subscriptionInfo?.isTestAccount && (
              <button
                onClick={clearSubscriptionOverride}
                disabled={loading}
                style={{
                  ...styles.button,
                  ...styles.buttonSecondary,
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Automated Testing */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>🚀 Automated Limit Testing</h2>
        <p style={{ ...styles.text, marginBottom: '1rem' }}>
          Test subscription limits automatically without manually processing videos. Much faster and more reliable!
        </p>
        
        <div style={styles.formGrid}>
          <button
            onClick={() => runLimitTest('video_limits')}
            disabled={runningTest !== ''}
            style={{
              ...styles.button,
              backgroundColor: '#f59e0b',
              opacity: runningTest !== '' ? 0.5 : 1,
              cursor: runningTest !== '' ? 'not-allowed' : 'pointer',
            }}
          >
            {runningTest === 'video_limits' ? '🔄 Testing Videos...' : '📹 Test Video Limits'}
          </button>
          
          <button
            onClick={() => runLimitTest('ai_limits')}
            disabled={runningTest !== ''}
            style={{
              ...styles.button,
              backgroundColor: '#8b5cf6',
              opacity: runningTest !== '' ? 0.5 : 1,
              cursor: runningTest !== '' ? 'not-allowed' : 'pointer',
            }}
          >
            {runningTest === 'ai_limits' ? '🔄 Testing AI...' : '🤖 Test AI Limits'}
          </button>
          
          <button
            onClick={() => runLimitTest('reset_usage')}
            disabled={runningTest !== ''}
            style={{
              ...styles.button,
              backgroundColor: '#ef4444',
              opacity: runningTest !== '' ? 0.5 : 1,
              cursor: runningTest !== '' ? 'not-allowed' : 'pointer',
            }}
          >
            {runningTest === 'reset_usage' ? '🔄 Resetting...' : '🔄 Reset Usage'}
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div style={{...styles.card, backgroundColor: '#f0f9ff', border: '2px solid #0ea5e9'}}>
          <h2 style={styles.sectionTitle}>📊 Test Results</h2>
          <div style={{ fontSize: '0.875rem', color: '#111827' }}>
            <p style={{ fontWeight: '600', marginBottom: '1rem' }}>
              Test: {testResults.testType.replace('_', ' ').toUpperCase()} | 
              User: {testResults.userId}
            </p>
            
            {testResults.testResults && testResults.testResults.length > 0 && (
              <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '1rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Step-by-Step Results:</h3>
                {testResults.testResults.map((result: any, index: number) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.5rem 0', 
                    borderBottom: index < testResults.testResults.length - 1 ? '1px solid #f3f4f6' : 'none' 
                  }}>
                    <span>
                      <strong>#{result.attempt || index + 1}:</strong> {result.action || result.message}
                    </span>
                    <span style={{ 
                      color: result.allowed === false ? '#ef4444' : '#10b981',
                      fontWeight: '600'
                    }}>
                      {result.beforeUsage !== undefined ? `${result.beforeUsage}/${result.limit === -1 ? '∞' : result.limit}` : ''}
                      {result.allowed === false ? ' ⛔' : result.allowed === true ? ' ✅' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {testResults.finalUsage && (
              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', padding: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Final Usage:</h3>
                <div style={styles.formGrid}>
                  <div>
                    <strong>Videos:</strong> {testResults.finalUsage.videosProcessed}/{testResults.finalUsage.videoLimit === -1 ? '∞' : testResults.finalUsage.videoLimit}
                  </div>
                  <div>
                    <strong>AI Questions:</strong> {testResults.finalUsage.aiQuestionsAsked}/{testResults.finalUsage.aiQuestionLimit === -1 ? '∞' : testResults.finalUsage.aiQuestionLimit}
                  </div>
                  <div>
                    <strong>Storage:</strong> {Math.round(testResults.finalUsage.storageUsedMB)}MB/{Math.round(testResults.finalUsage.storageLimitMB)}MB
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Testing Instructions */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>📋 Testing Instructions</h2>
        <div style={styles.grid}>
          <div style={{ border: '2px solid #fbbf24', borderRadius: '8px', padding: '1rem', backgroundColor: '#fffbeb' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', color: '#92400e' }}>🆓 Free Tier Test</h3>
            <ul style={{ fontSize: '0.875rem', color: '#451a03', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '0.25rem' }}>• Try processing 6 videos</li>
              <li style={{ marginBottom: '0.25rem' }}>• 6th should be blocked</li>
              <li style={{ marginBottom: '0.25rem' }}>• AI chat should be disabled</li>
              <li style={{ marginBottom: '0.25rem' }}>• Only Basic Summary available</li>
            </ul>
          </div>
          
          <div style={{ border: '2px solid #3b82f6', borderRadius: '8px', padding: '1rem', backgroundColor: '#eff6ff' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', color: '#1e40af' }}>🎓 Student Tier Test</h3>
            <ul style={{ fontSize: '0.875rem', color: '#1e3a8a', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '0.25rem' }}>• Process unlimited videos</li>
              <li style={{ marginBottom: '0.25rem' }}>• Use AI chat 11 times</li>
              <li style={{ marginBottom: '0.25rem' }}>• 11th should be blocked</li>
              <li style={{ marginBottom: '0.25rem' }}>• Study Notes available</li>
            </ul>
          </div>

          <div style={{ border: '2px solid #10b981', borderRadius: '8px', padding: '1rem', backgroundColor: '#f0fdf4' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', color: '#065f46' }}>💼 Pro Tier Test</h3>
            <ul style={{ fontSize: '0.875rem', color: '#064e3b', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '0.25rem' }}>• Process unlimited videos</li>
              <li style={{ marginBottom: '0.25rem' }}>• Use unlimited AI chat</li>
              <li style={{ marginBottom: '0.25rem' }}>• All formats available</li>
              <li style={{ marginBottom: '0.25rem' }}>• Priority processing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{...styles.card, backgroundColor: '#f0f9ff', border: '2px solid #0ea5e9'}}>
        <h2 style={styles.sectionTitle}>🎯 Next Steps</h2>
        <ol style={{ fontSize: '0.875rem', color: '#111827', lineHeight: '1.6' }}>
          <li style={{ marginBottom: '0.5rem', fontWeight: '500' }}><strong style={{ color: '#0369a1' }}>Set a test tier</strong> using the controls above</li>
          <li style={{ marginBottom: '0.5rem', fontWeight: '500' }}><strong style={{ color: '#0369a1' }}>Visit /process</strong> to test video processing limits</li>
          <li style={{ marginBottom: '0.5rem', fontWeight: '500' }}><strong style={{ color: '#0369a1' }}>Try different tiers</strong> to see how limits change</li>
          <li style={{ marginBottom: '0.5rem', fontWeight: '500' }}><strong style={{ color: '#0369a1' }}>Check the database</strong> - usage should be tracked in `user_monthly_usage` table</li>
        </ol>
      </div>

      <div style={{ 
        backgroundColor: '#f3f4f6', 
        border: '1px solid #d1d5db', 
        borderRadius: '8px', 
        padding: '1rem', 
        textAlign: 'center', 
        marginTop: '2rem' 
      }}>
        <p style={{ fontSize: '0.875rem', color: '#374151', fontStyle: 'italic', margin: '0' }}>
          💡 This testing system lets you experience all subscription features without payment. 
          Overrides expire automatically and won't affect real billing.
        </p>
      </div>
    </div>
  );
}