import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
export function appCommand(name, args = [], env = process.env) {
  if (typeof name !== 'string' || !Array.isArray(args) || args.length) throw new Error('App arguments are disabled');
  const system = path.join(env.SystemRoot || 'C:\\Windows', 'System32');
  const programFiles = env.ProgramFiles || 'C:\\Program Files';
  const local = env.LOCALAPPDATA || path.join(env.USERPROFILE || '', 'AppData','Local');
  const code = path.join(local,'Programs','Microsoft VS Code','Code.exe');
  const apps = { notepad: path.join(system,'notepad.exe'), calculator: path.join(system,'calc.exe'), paint: path.join(system,'mspaint.exe'),
    explorer:path.join(env.SystemRoot || 'C:\\Windows','explorer.exe'),
    chrome:path.join(programFiles,'Google','Chrome','Application','chrome.exe'),
    edge:path.join(env['ProgramFiles(x86)'] || programFiles,'Microsoft','Edge','Application','msedge.exe'),
    firefox:path.join(programFiles,'Mozilla Firefox','firefox.exe'), code, vscode:code };
  if (!Object.hasOwn(apps,name)) throw new Error('App is not allowlisted');
  return apps[name];
}
export async function launchApplication(name, args = []) {
  if (!config().apps) throw new Error('App launch disabled');
  const executable = appCommand(name,args);
  if (process.platform !== 'win32' || !fs.existsSync(executable)) throw new Error('Allowlisted application unavailable');
  return new Promise((resolve,reject) => {
    const child = spawn(executable, [], { shell: false, windowsHide: false, detached: true, stdio: 'ignore' });
    child.once('error',reject);
    child.once('spawn',() => { child.unref(); resolve({ success: true, app: name, pid: child.pid }); });
  });
}
export async function getInstalledApps() { return ['notepad','calculator','paint','explorer','chrome','edge','firefox','code'].filter(n => fs.existsSync(appCommand(n))).map(name => ({ name, displayName: name })); }
export async function isAppInstalled(name) { try { return fs.existsSync(appCommand(name)); } catch { return false; } }
