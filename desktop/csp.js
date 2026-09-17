// app.isPackaged is the authority: NODE_ENV must never relax a distributable.
export function rendererCsp({ isPackaged = true, backendUrl }) {
  if (!/^http:\/\/127\.0\.0\.1:[0-9]+$/.test(backendUrl)) throw new Error('Invalid backend CSP origin');
  const development = isPackaged === false;
  return [
    "default-src 'self'",
    // Vite's React Refresh preamble is inline; production has external scripts only.
    "script-src 'self'" + (development ? " 'unsafe-inline'" : ''),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "connect-src 'self' " + backendUrl + (development ? ' ws://localhost:5173' : ''),
    "object-src 'none'", "frame-src 'none'", "base-uri 'none'",
  ].join('; ');
}

export function installRendererCsp(session, options) {
  const policy = rendererCsp(options);
  session.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    for (const name of Object.keys(headers)) {
      if (name.toLowerCase() === 'content-security-policy') delete headers[name];
    }
    callback({ responseHeaders: { ...headers, 'Content-Security-Policy': [policy] } });
  });
}
