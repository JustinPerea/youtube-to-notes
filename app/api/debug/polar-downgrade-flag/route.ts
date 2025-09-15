import { NextRequest, NextResponse } from 'next/server';
import { isDebugEnabled } from '@/lib/security/debug-gate';
import { getRuntimeFlag, setRuntimeFlag, FLAG_POLAR_DOWNGRADE_ON_CANCEL } from '@/lib/config/feature-flags';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isDebugEnabled()) {
    return new NextResponse(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  const current = getRuntimeFlag(FLAG_POLAR_DOWNGRADE_ON_CANCEL, process.env.POLAR_DOWNGRADE_ON_CANCEL === 'true');
  return NextResponse.json({ key: FLAG_POLAR_DOWNGRADE_ON_CANCEL, value: current, defaultEnv: process.env.POLAR_DOWNGRADE_ON_CANCEL === 'true' });
}

export async function POST(req: NextRequest) {
  if (!isDebugEnabled()) {
    return new NextResponse(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const valueParam = body?.value ?? body?.enabled ?? body?.flag;

    if (typeof valueParam === 'undefined') {
      return NextResponse.json({ error: "Missing 'value' (boolean) in body" }, { status: 400 });
    }

    const value = String(valueParam) === 'true' || valueParam === true;
    setRuntimeFlag(FLAG_POLAR_DOWNGRADE_ON_CANCEL, value);
    const current = getRuntimeFlag(FLAG_POLAR_DOWNGRADE_ON_CANCEL, process.env.POLAR_DOWNGRADE_ON_CANCEL === 'true');
    return NextResponse.json({ ok: true, key: FLAG_POLAR_DOWNGRADE_ON_CANCEL, value: current });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update flag', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

