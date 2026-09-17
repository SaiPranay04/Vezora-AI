import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const development=process.argv.includes('--dev');
let server;
if(development){
 const {createServer}=await import('vite');
 server=await createServer({server:{host:'localhost',port:5173,strictPort:true}});
 await server.listen();
}
const require=createRequire(import.meta.url);
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'vezora-desktop-'));
const env={...process.env,VEZORA_SMOKE_DATA:temp};delete env.ELECTRON_RUN_AS_NODE;
const child=spawn(require('electron'),['scripts/smoke-desktop.cjs',...process.argv.slice(2)],{env,stdio:'inherit',windowsHide:true});
child.on('error',async e=>{console.error(e.message);process.exitCode=1;await server?.close();});
child.on('exit',async code=>{
 process.exitCode=code??1;
 await server?.close();
 try { if(path.dirname(temp)!==os.tmpdir() || !path.basename(temp).startsWith('vezora-desktop-'))throw new Error('Unexpected test cleanup path');await fs.rm(temp,{recursive:true,force:true,maxRetries:8,retryDelay:250}); }
 catch(error){console.error('Test cleanup failed: '+error.message);process.exitCode=1;}
});
