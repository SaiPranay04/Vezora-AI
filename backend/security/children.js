const children=new Set();
export function trackChild(child) {
 children.add(child);const forget=()=>children.delete(child);
 child.once('close',forget);child.once('error',forget);return child;
}
export function stopChildren() { for(const child of children) child.kill(); children.clear(); }
