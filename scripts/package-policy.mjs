const privateName = /(^|\/)(\.env(?:\..*)?|credentials\.json|.*tokens?\.json|.*service-account.*|client_secret.*)(\/|$)|\.(db|sqlite3?|pem|key|pfx|p12)(-|$)/i;
export function privateArtifact(relative) { const name=relative.replaceAll('\\','/'); return privateName.test(name) || /^(?:\/?backend\/)?(?:data|logs|temp)(\/|$)/i.test(name); }
export const backendDirectories = ['controllers','core','middleware','models','routes','services','utils','security'];
export function backendSource(relative) {
  const p=relative.replaceAll('\\','/');
  return !privateArtifact(p) && (['bootstrap.js','index.js','config.js','package.json'].includes(p) || (backendDirectories.includes(p.split('/')[0]) && p.endsWith('.js')));
}
