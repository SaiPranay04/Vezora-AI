import { trackChild,stopChildren } from '../backend/security/children.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { awaitBackend,trustedFrame } from '../desktop/lifecycle.js';
import { privateArtifact,backendSource } from '../scripts/package-policy.mjs';
test('readiness waits for valid IPC; early exit and timeout fail safely',async()=>{
 const child=new EventEmitter();let killed=false;child.kill=()=>{killed=true;};
 const ready=awaitBackend(child,100);child.emit('message',{type:'ready',port:0});child.emit('message',{type:'ready',port:5001});assert.equal(await ready,5001);
 const exit=awaitBackend(child,100);child.emit('exit',1);await assert.rejects(exit);
 await assert.rejects(awaitBackend(child,5));assert.equal(killed,true);assert.equal(child.listenerCount('message'),0);
});
test('only owning main frame has IPC access',()=>{
 const frame={url:'file:///app/index.html'},contents={mainFrame:frame},window={webContents:contents};
 assert.equal(trustedFrame({sender:contents,senderFrame:frame},window,frame.url),true);
 assert.equal(trustedFrame({sender:contents,senderFrame:{...frame}},window,frame.url),false);
 assert.equal(trustedFrame({sender:{},senderFrame:frame},window,frame.url),false);
 assert.equal(trustedFrame({sender:contents,senderFrame:frame},window,'https://evil.test'),false);
});
test('preload exposes exactly a fixed connection method and no generic IPC',async()=>{
 let bridge;const calls=[];vm.runInNewContext(await fs.readFile('desktop/preload.cjs','utf8'),{require:name=>{assert.equal(name,'electron');return {contextBridge:{exposeInMainWorld:(name,value)=>{assert.equal(name,'vezora');bridge=value;}},ipcRenderer:{invoke:channel=>{calls.push(channel);}}};}});
 assert.deepEqual(Object.keys(bridge),['connection']);bridge.connection();assert.deepEqual(calls,['vezora:connection']);assert.equal(Object.isFrozen(bridge),true);
 const main=await fs.readFile('main.js','utf8');assert.match(main,/contextIsolation:true/);assert.match(main,/nodeIntegration:false/);assert.match(main,/sandbox:true/);assert.equal(main.includes("spawn('node'"),false);
});
test('packaging excludes private artifacts and uses explicit backend source inclusion',async()=>{
 for(const p of ['.env','backend/.env.production','data/vezora.db','x/google-tokens.json','credentials.json','private.key','foo.sqlite-wal'])assert.equal(privateArtifact(p),true,p);
 assert.equal(backendSource('services/taskService.js'),true);for(const p of ['data/secret.js','.env','test-vector-simple.js','bin/random.exe'])assert.equal(backendSource(p),false,p);
 const pkg=JSON.parse(await fs.readFile('package.json','utf8'));assert.equal(pkg.build.extraResources[0].from,'.package/backend');assert.equal(pkg.build.files.includes('backend/**/*'),false);
});

test('backend shutdown terminates managed child processes',()=>{let kills=0;const a=new EventEmitter(),b=new EventEmitter();a.kill=b.kill=()=>kills++;trackChild(a);trackChild(b);b.emit('close');stopChildren();assert.equal(kills,1);stopChildren();assert.equal(kills,1);});
