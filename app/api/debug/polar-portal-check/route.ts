import { NextRequest, NextResponse } from 'next/server';
import { isDebugEnabled } from '@/lib/security/debug-gate';
import { getApiSessionWithDatabase } from '@/lib/auth-utils';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function tryCreatePortalSession(customerId: string, returnUrl: string): Promise<{ url?: string; status?: number; endpoint?: string; error?: string }[]> {
  const token = process.env.POLAR_ACCESS_TOKEN;
  const attempts: { url?: string; status?: number; endpoint?: string; error?: string }[] = [];
  if (!token || !customerId) return attempts;
  const endpoints = [
    'https://api.polar.sh/v1/customer-portal/sessions',
    'https://api.polar.sh/v1/customer_portal/sessions',
    `https://api.polar.sh/v1/customers/${customerId}/portal`,
  ];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, return_url: returnUrl }),
      });
      const txt = await res.text().catch(() => '');
      const url = (() => { try { const j = JSON.parse(txt); return j.url || j.portal_url || j.session_url; } catch { return undefined; } })();
      attempts.push({ url, status: res.status, endpoint });
      if (res.ok && url) break;
    } catch (e: any) {
      attempts.push({ endpoint, error: e?.message || 'request failed' });
    }
  }
  return attempts;
}

export async function GET(req: NextRequest) {
  if (!isDebugEnabled()) {
    return new NextResponse(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    const session = await getApiSessionWithDatabase(req);
    if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const rows = await db.select().from(users).where(eq(users.oauthId, session.user.id)).limit(1);
    if (!rows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const user = rows[0];

    const urlObj = new URL(req.url);
    const probe = urlObj.searchParams.get('probe') === 'true';
    const returnUrl = process.env.NODE_ENV === 'production' ? 'https://www.kyotoscribe.com/profile' : 'http://localhost:3003/profile';

    const hasToken = Boolean(process.env.POLAR_ACCESS_TOKEN);
    const hasCustomerId = Boolean(user.polarCustomerId);

    let attempts: any[] = [];
    if (probe && hasToken && hasCustomerId) {
      attempts = await tryCreatePortalSession(user.polarCustomerId as string, returnUrl);
    }

    const explanation: string[] = [];
    if (!hasCustomerId) explanation.push('No polarCustomerId on user');
    if (!hasToken) explanation.push('POLAR_ACCESS_TOKEN not set');
    if (hasCustomerId && hasToken && !probe) explanation.push('Set probe=true to attempt session creation');

    const sessionUrl = attempts.find(a => a.url)?.url;

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, polarCustomerId: user.polarCustomerId },
      config: { hasToken, hasCustomerId },
      probe,
      sessionUrl: sessionUrl || null,
      attempts,
      notes: explanation,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed', details: e?.message || String(e) }, { status: 500 });
  }
}

