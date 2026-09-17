import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { rendererCsp, installRendererCsp } from '../desktop/csp.js';
const backendUrl = 'http://127.0.0.1:54321';
const directives = policy => Object.fromEntries(policy.split('; ').map(item => { const [name, ...sources] = item.split(' '); return [name, sources]; }));
test('only explicit development permits React Refresh inline preamble and Vite websocket', () => {
  const prod = directives(rendererCsp({ isPackaged: true, backendUrl }));
  const dev = directives(rendererCsp({ isPackaged: false, backendUrl }));
  assert.deepEqual(prod['script-src'], ["'self'"]);
  assert.deepEqual(dev['script-src'], ["'self'", "'unsafe-inline'"]);
  assert.deepEqual(prod['connect-src'], ["'self'", backendUrl]);
  assert.deepEqual(dev['connect-src'], [...prod['connect-src'], 'ws://localhost:5173']);
  for (const name of Object.keys(prod)) if (!['script-src', 'connect-src'].includes(name)) assert.deepEqual(dev[name], prod[name]);
  assert.equal(rendererCsp({backendUrl}), rendererCsp({isPackaged:true,backendUrl}));
  assert.equal(rendererCsp({isPackaged:undefined,backendUrl}).includes('unsafe-eval'),false);
  assert.deepEqual(prod['style-src'], ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']);
  assert.deepEqual(prod['font-src'], ["'self'", 'https://fonts.gstatic.com']);
  for (const name of ['object-src','frame-src','base-uri']) assert.deepEqual(prod[name], ["'none'"]);
  assert.throws(() => rendererCsp({backendUrl: backendUrl + "; script-src *"}));
});
test('actual main window installs shared policy using packaging state', async () => {
  const main = await fs.readFile('main.js','utf8');
  assert.match(main, /installRendererCsp\(window.webContents.session, \{ isPackaged: app.isPackaged, backendUrl: connection.url \}\)/);
  let handler;
  installRendererCsp({webRequest:{onHeadersReceived:fn=>{handler=fn;}}},{isPackaged:true,backendUrl});
  handler({responseHeaders:{'content-security-policy':['old'], 'X-Test':['retained']}}, result => {
    assert.deepEqual(result.responseHeaders, {'X-Test':['retained'],'Content-Security-Policy':[rendererCsp({backendUrl})]});
  });
});
