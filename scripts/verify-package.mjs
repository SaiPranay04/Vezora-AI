import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { privateArtifact } from './package-policy.mjs';
const require=createRequire(import.meta.url);
const asar=require('@electron/asar');
const resources=path.resolve(process.argv[2] || 'release-phase1/win-unpacked/resources');
let count=0;const failures=[];
async function scan(dir,relative='') {
  for(const entry of await fs.readdir(dir,{withFileTypes:true})) {
    const rel=relative+'/'+entry.name;
    if(privateArtifact(rel)) failures.push(rel);
    if(entry.isSymbolicLink()) failures.push('Unexpected link: '+rel);
    else if(entry.isDirectory()) await scan(path.join(dir,entry.name),rel);
    else { count++; if(entry.name==='app.asar') for(const name of asar.listPackage(path.join(dir,entry.name))) if(privateArtifact(name)) failures.push('asar:'+name); }
  }
}
await scan(resources);
if(failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('PASS: inspected '+count+' resource files and app.asar paths; no .env, runtime data, database, token or private-key artifacts.');
