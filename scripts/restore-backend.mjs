import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
function run(exe,args,cwd) { const r=spawnSync(exe,args,{cwd,stdio:'inherit',windowsHide:true}); if(r.status!==0) process.exit(r.status || 1); }
// npm_execpath is the npm JS entry, avoiding shell quoting and .cmd execution.
if (!process.env.npm_execpath) throw new Error('Use npm run setup:backend');
run(process.execPath,[process.env.npm_execpath,'ci','--legacy-peer-deps','--ignore-scripts'],path.resolve('backend'));
const version=require('electron/package.json').version;
run(process.execPath,[path.resolve('backend/node_modules/prebuild-install/bin.js'),'--runtime=electron','--target='+version],path.resolve('backend/node_modules/better-sqlite3'));
