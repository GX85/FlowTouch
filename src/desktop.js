export async function connectDesktop(fetcher) {
 const response=await fetcher('/api/session',{cache:'no-store',signal:AbortSignal.timeout(4000)});
 if(!response.ok)throw new Error('Помощник недоступен: HTTP '+response.status);
 const session=await response.json();
 if(session.app!=='FlowTouch'||!session.token||session.platform!=='windows')throw new Error('На этом порту работает несовместимый помощник');
 return session;
}
export function expectsDesktop(location) {
 return ['127.0.0.1','localhost'].includes(location.hostname)&&(location.port==='8765'||new URLSearchParams(location.search).get('desktop')==='1');
}
