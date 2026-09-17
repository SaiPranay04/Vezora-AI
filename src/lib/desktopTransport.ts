// Preserve existing fetch callers while constraining all backend transport to this desktop session.
export function installDesktopTransport() {
  const original = window.fetch.bind(window);
  const configured = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const backendOrigin = new URL(configured).origin;
  window.fetch = async (input, init) => {
    const source = input instanceof Request ? input.url : String(input);
    const url = new URL(source, window.location.href);
    if (![backendOrigin,'http://localhost:5000','http://127.0.0.1:5000'].includes(url.origin)) return original(input,init);
    if (!window.vezora) throw new Error('Open Vezora through Electron to access the protected local backend.');
    const connection = await window.vezora.connection();
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value,key) => headers.set(key,value));
    headers.set('X-Vezora-Token',connection.token);
    const token = sessionStorage.getItem('authToken');
    if (token && !headers.has('Authorization')) headers.set('Authorization','Bearer '+token);
    const destination = connection.url + url.pathname + url.search;
    if (input instanceof Request) return original(new Request(destination,input),{ ...init,headers,redirect:'error' });
    const response = await original(destination,{ ...init,headers,redirect:'error' });
    if (response.status !== 202 || !/^\/api\/(tasks|structured-memory|apps|files)(\/|$)/.test(url.pathname)) return response;
    const ticket = await response.clone().json();
    if (!ticket.requiresConfirmation) return response;
    const approve = window.confirm('Confirm this exact operation?\n'+ticket.preview);
    const confirmationHeaders = new Headers(headers);
    confirmationHeaders.set('Content-Type','application/json');
    const confirmed = await original(connection.url+'/api/tools/confirm',{ method:'POST', headers:confirmationHeaders, body:JSON.stringify({ pendingId:ticket.pendingId,approve }),redirect:'error' });
    if (!approve) return new Response(JSON.stringify({ error:'Operation cancelled' }),{ status:409,headers:{ 'Content-Type':'application/json' } });
    return confirmed;
  };
}
