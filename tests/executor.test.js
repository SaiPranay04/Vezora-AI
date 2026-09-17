import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from '../backend/node_modules/zod/index.js';
import { registry } from '../backend/core/toolRegistry.js';
import { executeTool,confirmTool } from '../backend/core/toolExecutor.js';
import { identities } from '../backend/security/identity.js';
import { initializeConfig } from '../backend/config.js';
initializeConfig({VEZORA_TRANSPORT_TOKEN:'t'.repeat(48)});
test('executor requires real context, uses registry risk, exact args, and executes only once',async()=>{
 let runs=0;registry.set('test.effect',{risky:true,schema:z.object({id:z.string()}),handler:async args=>{runs++;return args;}});
 assert.equal((await executeTool('test.effect',{id:'a'},{userId:'forged'})).denied,true);
 await identities.run({userId:'u',sessionId:'s'},async()=>{
  const ticket=await executeTool('test.effect',{id:'a'});assert.equal(ticket.requiresConfirmation,true);assert.equal(runs,0);
  assert.equal((await executeTool('test.effect',{id:'b'},{confirmed:true,pendingId:ticket.pendingId})).denied,true);
  const results=await Promise.all([confirmTool(ticket.pendingId,{approve:true}),confirmTool(ticket.pendingId,{approve:true})]);
  assert.equal(results.filter(r=>r.success).length,1);assert.equal(runs,1);
  assert.equal((await executeTool('app.open',{appName:'notepad'})).denied,true);
  assert.equal((await executeTool('file.read',{path:'x'})).denied,true);
 });registry.delete('test.effect');
});
