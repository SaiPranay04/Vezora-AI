import { useState, useEffect } from 'react';
import { Folder, File, Search, RefreshCw, FileText, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { ConfirmModal } from '../components/ConfirmModal';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface DirEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size?: number;
}

export function FilesPage() {
  const { token } = useAuth();
  const { setSelectedFile, selectedFile, pushAction } = useAppContext();
  const [cwd, setCwd] = useState('');
  const [entries, setEntries] = useState<DirEntry[]>([]);
  const [preview, setPreview] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    loadDir('');
  }, []);

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  async function loadDir(path: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/files/list`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ path })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Failed to list');
      setCwd(data.path || path);
      setEntries(data.files || data.entries || data || []);
      pushAction(`list:${data.path || path}`);
    } catch (e: any) {
      setError(e.message || 'Could not list directory. Enable ENABLE_FILE_SYSTEM=true in backend/.env');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  async function readSelected(path: string) {
    setSelectedFile(path);
    setPreview('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/files/read`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ path })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Read failed');
      setPreview(typeof data.content === 'string' ? data.content : JSON.stringify(data, null, 2));
      pushAction(`read:${path}`);
    } catch (e: any) {
      setPreview(`Error: ${e.message}`);
    }
  }

  const filtered = entries.filter((e) =>
    !query ? true : e.name.toLowerCase().includes(query.toLowerCase())
  );

  const parentPath = cwd.includes('/') || cwd.includes('\\')
    ? cwd.replace(/[\\/][^\\/]+$/, '') || '.'
    : '.';

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Files</h1>
          <p className="text-xs text-text/40 font-mono mt-0.5 truncate max-w-xl">{cwd || '—'}</p>
        </div>
        <button
          onClick={() => loadDir(cwd || '.')}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm outline-none focus:border-primary/40"
        />
      </div>

      {error && (
        <div className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <div className="rounded-2xl border border-white/5 bg-black/20 overflow-y-auto">
          <button
            onClick={() => loadDir(parentPath)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-text/50 hover:bg-white/5 border-b border-white/5"
          >
            <Folder size={14} /> ..
          </button>
          {filtered.map((entry) => (
            <button
              key={entry.path}
              onClick={() => (entry.isDirectory ? loadDir(entry.path) : readSelected(entry.path))}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-white/5 border-b border-white/5 ${
                selectedFile === entry.path ? 'bg-primary/10' : ''
              }`}
            >
              {entry.isDirectory ? (
                <Folder size={14} className="text-secondary shrink-0" />
              ) : /\.(png|jpe?g|gif|webp)$/i.test(entry.name) ? (
                <ImageIcon size={14} className="text-pink-400 shrink-0" />
              ) : (
                <FileText size={14} className="text-text/50 shrink-0" />
              )}
              <span className="truncate">{entry.name}</span>
            </button>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="p-6 text-xs text-text/40 text-center">No files here yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/20 flex flex-col min-h-0">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2 text-xs text-text/50">
            <File size={12} />
            <span className="truncate font-mono">{selectedFile || 'Select a file to preview'}</span>
          </div>
          <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-text/80 whitespace-pre-wrap">
            {preview || '—'}
          </pre>
        </div>
      </div>

      <ConfirmModal
        open={!!pendingDelete}
        title="Delete file?"
        preview={pendingDelete || ''}
        confirmLabel="Delete"
        onConfirm={() => setPendingDelete(null)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
