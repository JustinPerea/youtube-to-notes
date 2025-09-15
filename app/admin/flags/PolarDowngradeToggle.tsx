"use client";
import React, { useEffect, useState } from 'react';

function Spinner() {
  return <span className="inline-block animate-spin">⏳</span>;
}

function Icon({ on }: { on: boolean }) {
  return <span className="inline-block">{on ? '🟢' : '⚪️'}</span>;
}

function Button({ disabled, onClick, children }: { disabled?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-2 rounded border text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
    >
      {children}
    </button>
  );
}

function Card({ children, title, description }: { children: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="border rounded p-4 space-y-3">
      <div>
        <div className="font-medium">{title}</div>
        {description && <div className="text-xs text-gray-500">{description}</div>}
      </div>
      {children}
    </div>
  );
}

export function PolarDowngradeToggle() {
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState<boolean>(false);
  const [defaultEnv, setDefaultEnv] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/debug/polar-downgrade-flag', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load flag');
      setValue(Boolean(json.value));
      setDefaultEnv(Boolean(json.defaultEnv));
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function toggle(next: boolean) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/debug/polar-downgrade-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save flag');
      setValue(Boolean(json.value));
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Card
      title="POLAR_DOWNGRADE_ON_CANCEL"
      description="When enabled, users are downgraded at period end after final cancellation (no admin override)."
    >
      {loading ? (
        <div className="flex items-center gap-2 text-sm"><Spinner /> Loading…</div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Icon on={value} />
            <div>
              <div><span className="font-mono">value</span>: {String(value)}</div>
              <div className="text-xs text-gray-500">env default: {String(defaultEnv)}</div>
            </div>
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
          <div className="flex gap-2">
            <Button disabled={saving || value} onClick={() => toggle(true)}>{saving && !value ? 'Saving…' : 'Enable'}</Button>
            <Button disabled={saving || !value} onClick={() => toggle(false)}>{saving && value ? 'Saving…' : 'Disable'}</Button>
            <Button disabled={saving} onClick={load}>Refresh</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

