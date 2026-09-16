import { useEffect, useState } from 'react';
import { Activity, Filter, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface LogEntry {
  id: string;
  type?: string;
  action?: string;
  detail?: string;
  status?: string;
  timestamp?: string;
  message?: string;
}

const TYPES = ['all', 'tool', 'file', 'app', 'memory', 'settings', 'chat', 'voice', 'command'];

function scrub(text: string) {
  return text
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [redacted]')
    .replace(/(api[_-]?key|token|secret)["']?\s*[:=]\s*["']?[^"'\s]+/gi, '$1=[redacted]');
}

export function ActivityPage() {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        limit: '100',
        userId: user?.id || user?.email || 'default'
      });
      if (type !== 'all') params.set('type', type);

      const res = await fetch(`${BACKEND_URL}/api/logs?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load logs');
      setLogs(data.logs || []);
    } catch (e: any) {
      setError(e.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [type]);

  const clear = async () => {
    if (!confirm('Clear activity logs?')) return;
    await fetch(`${BACKEND_URL}/api/logs?userId=${encodeURIComponent(user?.id || 'default')}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    load();
  };

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center">
            <Activity size={18} className="text-secondary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Activity</h1>
            <p className="text-xs text-text/40">Audit trail of tools, files, and desktop actions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={clear} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 text-text/60 hover:text-red-300">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={12} className="text-text/40" />
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wide border ${
              type === t
                ? 'bg-primary/20 border-primary/40 text-primary'
                : 'bg-white/5 border-white/10 text-text/50 hover:bg-white/10'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto rounded-2xl border border-white/5 bg-black/20 divide-y divide-white/5">
        {logs.length === 0 && !loading && (
          <p className="p-8 text-center text-xs text-text/40">No activity yet.</p>
        )}
        {logs.map((log) => (
          <div key={log.id} className="px-4 py-3 flex gap-3 items-start hover:bg-white/[0.02]">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-secondary/70 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-primary/80 font-medium">
                  {log.type || 'event'}
                </span>
                {log.action && (
                  <span className="text-xs font-mono text-text/80">{log.action}</span>
                )}
                {log.status && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    log.status === 'ok' ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-text/50'
                  }`}>
                    {log.status}
                  </span>
                )}
                <span className="ml-auto text-[10px] font-mono text-text/30">
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                </span>
              </div>
              <p className="text-xs text-text/60 mt-1 break-all">
                {scrub(String(log.detail || log.message || ''))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
