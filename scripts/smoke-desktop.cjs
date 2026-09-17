const { app,BrowserWindow,utilityProcess,ipcMain } = require('electron');
const path=require('node:path'),os=require('node:os'),fs=require('node:fs');
const { pathToFileURL }=require('node:url');
const development=process.argv.includes('--dev');
let child,window;let result=1;
const temp=process.env.VEZORA_SMOKE_DATA;
if(!temp || path.dirname(temp)!==os.tmpdir() || !path.basename(temp).startsWith('vezora-desktop-'))throw new Error('Use npm run test:desktop');
app.setPath('userData',temp);
const timeout=setTimeout(()=>{console.error('Smoke test timeout');child?.kill();app.exit(1);},30000);
app.whenReady().then(async()=>{
 try {
  const { awaitBackend,trustedFrame }=await import('../desktop/lifecycle.js');
  const resources=path.resolve(process.argv.slice(2).find(arg=>!arg.startsWith('--')) || 'release-phase1/win-unpacked/resources');
  const appRoot=development?path.resolve('.'):path.join(resources,'app.asar');
  const { installRendererCsp }=await import(pathToFileURL(path.join(appRoot,'desktop','csp.js')).href);
  const backend=development?path.resolve('backend'):path.join(resources,'backend');
  const token='fixture-transport-'.repeat(4);
  child=utilityProcess.fork(path.join(backend,'bootstrap.js'),[],{cwd:backend,env:{SystemRoot:process.env.SystemRoot,PATH:process.env.PATH,TEMP:process.env.TEMP,TMP:process.env.TMP,DATA_DIR:temp,PORT:'0',VEZORA_ENV_FILE:path.join(temp,'absent'),VEZORA_TRANSPORT_TOKEN:token},stdio:'pipe'});
  child.stdout.resume();let errors='';child.stderr.on('data',d=>{errors+=d;});
  let port;try{port=await awaitBackend(child,15000);}catch(e){throw new Error(e.message+' '+errors);}
  const url=development?'http://localhost:5173/':pathToFileURL(path.join(appRoot,'dist','index.html')).href;
  window=new BrowserWindow({show:process.argv.includes('--show'),width:1280,height:800,webPreferences:{preload:path.join(appRoot,'desktop','preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
  ipcMain.handle('vezora:connection',event=>{if(!trustedFrame(event,window,url))throw new Error('Untrusted frame');return {url:'http://127.0.0.1:'+port,token};});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  installRendererCsp(window.webContents.session,{isPackaged:!development,backendUrl:'http://127.0.0.1:'+port});
  const rendererErrors=[];let viteConnected=false;
  window.webContents.on('console-message',(_event,level,message)=>{
    if(message.includes('[vite] connected.'))viteConnected=true;
    if(level===3 || /Refused to|can't detect preamble/.test(message))rendererErrors.push(message);
  });
  await window.loadURL(url);
  const rendered=await window.webContents.executeJavaScript(`(async()=>{
    for(let attempt=0;attempt<100;attempt++){
      const form=document.querySelector('#root form');
      if(form && form.getBoundingClientRect().height>0 && form.querySelector('input[type="password"]')){
        let visible=true;
        for(let element=form;element;element=element.parentElement){
          const style=getComputedStyle(element);
          if(Number(style.opacity)<0.95 || style.visibility==='hidden' || style.display==='none')visible=false;
        }
        if(visible)return true;
      }
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    return false;
  })()`);
  if(!rendered)throw new Error('Login UI did not render: '+rendererErrors.join('\n'));
  if(development){
    const refresh=await window.webContents.executeJavaScript('typeof window.$RefreshReg$ === "function" && typeof window.$RefreshSig$ === "function"');
    if(!refresh || !viteConnected)throw new Error('React Refresh preamble / Vite websocket failed');
  }
  if(rendererErrors.length)throw new Error('Renderer startup errors: '+rendererErrors.join('\n'));
  // Capture real rendered pixels for visual review; this generated directory is ignored.
  fs.mkdirSync('tmp',{recursive:true});
  fs.writeFileSync(path.join('tmp',development?'renderer-dev.png':'renderer-packaged.png'),(await window.webContents.capturePage()).toPNG());
  if(!development){
    const inlineRan=await window.webContents.executeJavaScript(`(async()=>{
      const script=document.createElement('script');script.textContent='window.__cspInlineRan=true';document.head.append(script);
      await new Promise(resolve=>setTimeout(resolve,50));script.remove();return window.__cspInlineRan===true;
    })()`);
    if(inlineRan)throw new Error('Packaged CSP allowed inline script execution');
  }
  const check=await window.webContents.executeJavaScript('(async()=>({ node:typeof window.require, process:typeof window.process, bridge:Object.keys(window.vezora), health:(await fetch((await window.vezora.connection()).url+"/health",{headers:{"X-Vezora-Token":(await window.vezora.connection()).token}})).status }))()');
  if(check.node!=='undefined'||check.process!=='undefined'||check.bridge.join()!=='connection'||check.health!==200)throw new Error('Isolation/IPC/transport check failed: '+JSON.stringify(check));
  const mutation=await window.webContents.executeJavaScript('(async()=>{ const user=await (await fetch("http://localhost:5000/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:"desktop@example.test",password:"test-password-42"})})).json();sessionStorage.setItem("authToken",user.token);const task=await (await fetch("http://localhost:5000/api/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:"desktop fixture"})})).json();window.confirm=()=>true;const deleted=await fetch("http://localhost:5000/api/tasks/"+task.task.id,{method:"DELETE"});return {status:deleted.status,result:await deleted.json()};})()');
  if(mutation.status!==200 || !mutation.result.success)throw new Error('Renderer confirmation transport failed');
  const exit=new Promise(resolve=>child.once('exit',resolve));child.postMessage({type:'shutdown'});if(await exit!==0)throw new Error('Unclean backend shutdown');
  console.log('PASS: '+(development?'Vite renderer + React Refresh + HMR websocket':'packaged renderer + inline-script rejection')+', shared app CSP, native SQLite, isolated preload IPC, paired HTTP, confirmation and graceful shutdown.');result=0;
 }catch(error){console.error(error.stack);}finally{
  clearTimeout(timeout);window?.destroy();child?.kill();
  app.exit(result);
 }
});
app.on('window-all-closed',()=>{});
