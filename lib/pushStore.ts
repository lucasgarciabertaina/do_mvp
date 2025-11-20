export type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } };

const KEY = '__PUSH_STORE__';
const store: PushSub[] = (globalThis as any)[KEY] ?? [];
(globalThis as any)[KEY] = store;

export const addSub = (s: PushSub) => {
  if (!store.find(x => x.endpoint === s.endpoint)) store.push(s);
};
export const allSubs = () => store;
export const removeByEndpoints = (eps: string[]) => {
  for (let i = store.length - 1; i >= 0; i--) if (eps.includes(store[i].endpoint)) store.splice(i, 1);
};
export const count = () => store.length;
