import test from 'node:test';
import assert from 'node:assert/strict';
import { createConfirmationStore, checkPermission } from '../backend/core/permissions.js';
import { validateConfig, initializeConfig } from '../backend/config.js';
import { appCommand } from '../backend/controllers/appsController.js';
import { generateToken, generateRefreshToken, verifyToken, revokeToken } from '../backend/utils/jwt.js';
const owner={userId:'owner',sessionId:'session'};
const settings={VEZORA_TRANSPORT_TOKEN:'t'.repeat(48),JWT_SECRET:'j'.repeat(48)};
initializeConfig(settings);
function fixture() { let time=100; const store=createConfirmationStore({now:()=>time,ttl:10}); const args={id:'task-1',nested:{b:2,a:1}}; const ticket=store.create({toolName:'todo.delete',args,...owner});return { store,args,ticket,expire:()=>{time=110;} }; }
test('permission denial without authenticated identity',()=>{assert.equal(checkPermission('todo.list',{}).allowed,false);assert.equal(checkPermission('shell.run',{},owner).allowed,false);});
test('expired confirmation is denied at expiry boundary',()=>{const f=fixture();f.expire();assert.equal(f.store.consume(f.ticket.pendingId,'todo.delete',f.args,owner),false);});
test('modified arguments and wrong tool are denied',()=>{const f=fixture();assert.equal(f.store.consume(f.ticket.pendingId,'todo.delete',{...f.args,id:'other'},owner),false);assert.equal(f.store.consume(f.ticket.pendingId,'file.write',f.args,owner),false);});
test('identity/session mismatch cannot approve or cancel',()=>{const f=fixture();for(const other of [{...owner,userId:'other'},{...owner,sessionId:'other'}]) {assert.equal(f.store.consume(f.ticket.pendingId,'todo.delete',f.args,other),false);assert.equal(f.store.cancel(f.ticket.pendingId,other),false);}assert.ok(f.store.get(f.ticket.pendingId,owner));});
test('nonce is unique; exact canonical arguments execute once',()=>{const f=fixture();const second=f.store.create({toolName:'todo.delete',args:f.args,...owner});assert.notEqual(second.pendingId,f.ticket.pendingId);assert.equal(f.store.consume(f.ticket.pendingId,'todo.delete',{nested:{a:1,b:2},id:'task-1'},owner),true);assert.equal(f.store.consume(f.ticket.pendingId,'todo.delete',f.args,owner),false);});
test('tickets clone arguments rather than retain mutable references',()=>{const f=fixture();f.args.id='mutated';assert.equal(f.store.get(f.ticket.pendingId,owner).args.id,'task-1');});
test('invalid confirmation fails closed rather than requesting a new ticket',()=>{const p=checkPermission('todo.delete',{id:'x'},{...owner,confirmed:true,pendingId:'missing'});assert.equal(p.allowed,false);assert.equal(p.denied,true);});
test('configuration fails without pairing, strong secret or absolute roots',()=>{assert.throws(()=>validateConfig({}));assert.throws(()=>validateConfig({...settings,PORT:'abc'}));assert.throws(()=>validateConfig({...settings,JWT_SECRET:'weak'}));assert.throws(()=>validateConfig({...settings,ENABLE_APP_LAUNCH:'yes'}));assert.throws(()=>validateConfig({...settings,VEZORA_APPROVED_ROOTS:'["relative"]'}));assert.equal(validateConfig(settings).host,'127.0.0.1');});
test('app shell strings, terminals and arguments are rejected',()=>{for(const name of ['cmd','powershell','terminal','notepad & calc','C:\\evil.exe','__proto__'])assert.throws(()=>appCommand(name));assert.throws(()=>appCommand('notepad',['evil.txt']));assert.ok(pathLike(appCommand('notepad')));});
function pathLike(value){return value.toLowerCase().endsWith('system32'+(process.platform==='win32'?'\\':'/')+'notepad.exe');}
test('access/refresh types cannot be interchanged; revoked access denied',()=>{const access=generateToken({userId:'u'}),refresh=generateRefreshToken({userId:'u'});assert.equal(verifyToken(access).userId,'u');assert.throws(()=>verifyToken(refresh));assert.throws(()=>verifyToken(access,'refresh'));revokeToken(access);assert.throws(()=>verifyToken(access));});
