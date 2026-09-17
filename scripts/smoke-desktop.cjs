const { app,BrowserWindow,utilityProcess,ipcMain } = require('electron');
const path=require('node:path'),os=require('node:os');
const { pathToFileURL }=require('node:url');
let child,window;let result=1;
const temp=process.env.VEZORA_SMOKE_DATA;
if(!temp || path.dirname(temp)!==os.tmpdir() || !path.basename(temp).startsWith('vezora-desktop-'))throw new Error('Use npm run test:desktop');
app.setPath('userData',temp);
const timeout=setTimeout(()=>{console.error('Smoke test timeout');child?.kill();app.exit(1);},30000);
app.whenReady().then(async()=>{
 try {
  const { awaitBackend,trustedFrame }=await import('../desktop/lifecycle.js');
  const resources=path.resolve(process.argv[2] || 'release-phase1/win-unpacked/resources');
  const backend=path.join(resources,'backend');const token='fixture-transport-'.repeat(4);
  child=utilityProcess.fork(path.join(backend,'bootstrap.js'),[],{cwd:backend,env:{SystemRoot:process.env.SystemRoot,PATH:process.env.PATH,TEMP:process.env.TEMP,TMP:process.env.TMP,DATA_DIR:temp,PORT:'0',VEZORA_ENV_FILE:path.join(temp,'absent'),VEZORA_TRANSPORT_TOKEN:token},stdio:'pipe'});
  child.stdout.resume();let errors='';child.stderr.on('data',d=>{errors+=d;});
  let port;try{port=await awaitBackend(child,15000);}catch(e){throw new Error(e.message+' '+errors);}
  const url=pathToFileURL(path.join(resources,'app.asar','dist','index.html')).href;
  window=new BrowserWindow({show:false,webPreferences:{preload:path.join(resources,'app.asar','desktop','preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  ipcMain.handle('vezora:connection',event=>{if(!trustedFrame(event,window,url))throw new Error('Untrusted frame');return {url:'http://127.0.0.1:'+port,token};});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  await window.loadURL(url);
  const check=await window.webContents.executeJavaScript('(async()=>({ node:typeof window.require, process:typeof window.process, bridge:Object.keys(window.vezora), health:(await fetch((await window.vezora.connection()).url+"/health",{headers:{"X-Vezora-Token":(await window.vezora.connection()).token}})).status }))()');
  if(check.node!=='undefined'||check.process!=='undefined'||check.bridge.join()!=='connection'||check.health!==200)throw new Error('Isolation/IPC/transport check failed: '+JSON.stringify(check));
  const mutation=await window.webContents.executeJavaScript('(async()=>{ const user=await (await fetch("http://localhost:5000/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:"desktop@example.test",password:"test-password-42"})})).json();sessionStorage.setItem("authToken",user.token);const task=await (await fetch("http://localhost:5000/api/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:"desktop fixture"})})).json();window.confirm=()=>true;const deleted=await fetch("http://localhost:5000/api/tasks/"+task.task.id,{method:"DELETE"});return {status:deleted.status,result:await deleted.json()};})()');
  if(mutation.status!==200 || !mutation.result.success)throw new Error('Renderer confirmation transport failed');
  const exit=new Promise(resolve=>child.once('exit',resolve));child.postMessage({type:'shutdown'});if(await exit!==0)throw new Error('Unclean backend shutdown');
  console.log('PASS: packaged utility backend/native SQLite, hidden isolated renderer, real preload IPC, paired HTTP and graceful shutdown.');result=0;
 }catch(error){console.error(error.stack);}finally{
  clearTimeout(timeout);window?.destroy();child?.kill();
  app.exit(result);
 }
});
app.on('window-all-closed',()=>{});
