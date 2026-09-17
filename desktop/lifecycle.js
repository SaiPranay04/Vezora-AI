export function awaitBackend(child, timeout = 20000) {
  return new Promise((resolve,reject) => {
    const timer = setTimeout(() => { cleanup(); child.kill(); reject(new Error('Backend readiness timeout')); },timeout);
    const cleanup = () => { clearTimeout(timer); child.off('message',message); child.off('exit',exit); };
    const exit = () => { cleanup(); reject(new Error('Backend exited before ready')); };
    const message = data => {
      if (data?.type !== 'ready' || !Number.isInteger(data.port) || data.port < 1 || data.port > 65535) return;
      cleanup(); resolve(data.port);
    };
    child.on('message',message); child.once('exit',exit);
  });
}
export function trustedFrame(event, window, expectedURL) {
  return !!window && event.sender === window.webContents && event.senderFrame === window.webContents.mainFrame && event.senderFrame.url === expectedURL;
}
