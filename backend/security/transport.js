import { timingSafeEqual } from 'node:crypto';
export function localTransport(token) {
  return (req, res, next) => {
    const supplied = req.get('X-Vezora-Token');
    const origin = req.get('Origin');
    const host = req.hostname;
    if (!['127.0.0.1','localhost'].includes(host) || (origin && !['null','http://localhost:5173','http://127.0.0.1:5173'].includes(origin))) return res.status(403).json({ error: 'Untrusted local origin' });
    if (typeof supplied !== 'string' || Buffer.byteLength(supplied) !== Buffer.byteLength(token) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))) return res.status(401).json({ error: 'Desktop pairing required' });
    next();
  };
}
export const disabled = (_req, res) => res.status(403).json({ error: 'This legacy operation is disabled in Phase 1. Use the authenticated tools UI where available.' });
