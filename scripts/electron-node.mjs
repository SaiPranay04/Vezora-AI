import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const require = createRequire(import.meta.url);
const args=[];
for(const arg of process.argv.slice(2)) {
 if(arg==='tests/*.test.js') args.push(...(await fs.readdir('tests')).filter(n=>n.endsWith('.test.js')).map(n=>'tests/'+n));
 else args.push(arg);
}
const temp=args.includes('--test') ? await fs.mkdtemp(path.join(os.tmpdir(),'vezora-suite-')) : null;
const child = spawn(require('electron'),args,{ env:{...process.env,ELECTRON_RUN_AS_NODE:'1',...(temp?{DATA_DIR:temp}:{})},stdio:'inherit',windowsHide:true });
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',async code=>{
 process.exitCode=code??1;
 if(temp) {
  try { if(path.dirname(temp)!==os.tmpdir() || !path.basename(temp).startsWith('vezora-suite-'))throw new Error('Invalid test cleanup path');await fs.rm(temp,{recursive:true,force:true,maxRetries:5,retryDelay:200}); }
  catch(error){console.error(error.message);process.exitCode=1;}
 }
});
