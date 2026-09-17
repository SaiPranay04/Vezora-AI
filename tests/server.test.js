import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { awaitBackend } from '../desktop/lifecycle.js';
test('real backend startup, protected HTTP, scoped tools, disabled legacy and shutdown',async t=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'vezora-server-'));const secret='s'.repeat(48);
 const child=fork(path.resolve('backend/bootstrap.js'),[],{env:{SystemRoot:process.env.SystemRoot,PATH:process.env.PATH,TEMP:process.env.TEMP,TMP:process.env.TMP,ELECTRON_RUN_AS_NODE:'1',PORT:'0',DATA_DIR:temp,VEZORA_ENV_FILE:path.join(temp,'no-config'),VEZORA_TRANSPORT_TOKEN:secret},stdio:['ignore','pipe','pipe','ipc'],windowsHide:true});
 let output='';child.stdout.on('data',d=>{output+=d;});child.stderr.on('data',d=>{output+=d;});
 t.after(async()=>{if(child.exitCode===null){const exit=once(child,'exit');child.kill();await exit;}if(path.dirname(temp)!==os.tmpdir() || !path.basename(temp).startsWith('vezora-server-'))throw new Error('Unexpected cleanup path');await fs.rm(temp,{recursive:true,force:true});});
 let port;try{port=await awaitBackend(child,20000);}catch(e){throw new Error(e.message+'\n'+output);}
 const base='http://127.0.0.1:'+port;
 async function request(route,{token,body,method='GET',paired=true,origin}={}){return fetch(base+route,{method,headers:{'Content-Type':'application/json',...(paired?{'X-Vezora-Token':secret}:{}),...(token?{Authorization:'Bearer '+token}:{}),...(origin?{Origin:origin}:{})},body:body===undefined?undefined:JSON.stringify(body)});}
 assert.equal((await request('/health',{paired:false})).status,401);assert.equal((await request('/health')).status,200);assert.equal((await request('/api/tools/execute',{method:'POST',body:{toolName:'todo.list'}})).status,401);assert.equal((await request('/health',{origin:'https://evil.test'})).status,403);
 for(const route of ['/api/tools','/api/tasks','/api/files/list','/api/gmail','/api/workflows'])assert.equal((await request(route)).status,401,route);
 async function register(email){const r=await request('/api/auth/register',{method:'POST',body:{email,password:'fixture-password-42',name:'Fixture'}});assert.equal(r.status,201);return r.json();}
 const user=await register('one@example.test'),other=await register('two@example.test');
 assert.equal((await request('/api/auth/verify-token',{method:'POST',body:{token:user.token}})).status,200);
 const localTool=await request('/api/chat',{token:user.token,method:'POST',body:{message:'my tasks'}});assert.equal(localTool.status,200);assert.equal((await localTool.json()).provider,'tools');
 const listed=await request('/api/tasks?userId='+other.user.id,{token:user.token});assert.equal(listed.status,200);
 const created=await request('/api/tasks',{token:user.token,method:'POST',body:{title:'fixture task',userId:other.user.id}});assert.equal(created.status,201);const task=(await created.json()).task;
 assert.equal(task.user_id,user.user.id);
 const deletion=await request('/api/tasks/'+task.id,{token:user.token,method:'DELETE'});assert.equal(deletion.status,202);const ticket=await deletion.json();
 let response=await request('/api/tools/confirm',{token:other.token,method:'POST',body:{pendingId:ticket.pendingId,approve:true}});assert.equal(response.status,400);
 response=await request('/api/tools/execute',{token:user.token,method:'POST',body:{toolName:'todo.delete',args:{id:task.id},confirmed:true,pendingId:ticket.pendingId}});assert.equal(response.status,400);
 response=await request('/api/tools/confirm',{token:user.token,method:'POST',body:{pendingId:ticket.pendingId,approve:true}});assert.equal(response.status,200);
 response=await request('/api/tools/confirm',{token:user.token,method:'POST',body:{pendingId:ticket.pendingId,approve:true}});assert.equal(response.status,400);
 for(const route of ['/api/gmail','/api/calendar','/api/workflows','/api/ocr','/api/coordinator','/api/chat/stream'])assert.equal((await request(route,{token:user.token})).status,403,route);
 assert.equal((await request('/api/auth/logout',{token:user.token,method:'POST'})).status,200);assert.equal((await request('/api/tools',{token:user.token})).status,401);
 const exit=once(child,'exit');child.send({type:'shutdown'});const [code]=await exit;assert.equal(code,0);
});
