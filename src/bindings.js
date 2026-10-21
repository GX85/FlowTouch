// Configuration is data only. The companion validates every command again.
export const KEY_NAMES = ['Space','Enter','Tab','Escape','Backspace','Delete','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Shift','Control','Alt',...Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ'),...Array.from('0123456789'),...Array.from({length:12},(_,i)=>'F'+(i+1))];
export const PROFILES = [{id:'desktop',name:'Повседневный',en:'Everyday'},{id:'geometry-dash',name:'Geometry Dash',en:'Geometry Dash'},{id:'creative',name:'Творчество',en:'Creative'}];
export const ACTIONS = [
 ['youtube','Открыть YouTube','Open YouTube'],['spotify','Открыть Spotify','Open Spotify'],['google','Открыть Google','Open Google'],['github','Открыть GitHub','Open GitHub'],['wiki','Wikipedia','Wikipedia'],
 ['calculator','Калькулятор','Calculator'],['notepad','Блокнот','Notepad'],['explorer','Проводник','File Explorer'],['media','Пауза / воспроизведение','Play / pause'],['next','Следующий трек','Next track'],['previous','Предыдущий трек','Previous track'],['mute','Выключить звук','Mute'],['volumeup','Громче','Volume up'],['volumedown','Тише','Volume down'],
 ['click','Левый клик','Left click'],['rightclick','Правый клик','Right click'],['doubleclick','Двойной клик','Double click'],['pointer','Курсор','Pointer'],['scrollup','Прокрутить вверх','Scroll up'],['scrolldown','Прокрутить вниз','Scroll down'],['copy','Копировать','Copy'],['paste','Вставить','Paste'],['switchwindow','Переключить окно','Switch window'],['desktop','Рабочий стол','Desktop'],['newtab','Новая вкладка','New tab'],['nexttab','Следующая вкладка','Next tab'],['prevtab','Предыдущая вкладка','Previous tab'],['minimize','Свернуть окно','Minimize window'],['fullscreen','Полный экран','Full screen'],['zoomin','Увеличить','Zoom in'],['zoomout','Уменьшить','Zoom out'],['zoomreset','Сбросить масштаб','Reset zoom'],['stopmedia','Остановить медиа','Stop media'],['home','Домой','Home'],
 ['app','Запустить приложение','Launch application'],['shortcut','Клавиша / сочетание','Key / shortcut'],['url','Открыть свой URL','Open custom URL'],['none','Без действия','No action']
].map(([id,label,en])=>({id,label,en}));
export function validKeys(keys){return Array.isArray(keys)&&keys.length>0&&keys.length<=4&&keys.every(k=>KEY_NAMES.includes(k))&&new Set(keys).size===keys.length;}
export function validBinding(b){return !!b&&ACTIONS.some(a=>a.id===b.mode)&&(b.mode!=='shortcut'||validKeys(b.keys))&&(b.mode!=='url'||safeUrl(b.url)!==null)&&(b.mode!=='app'||typeof b.path==='string'&&/^[A-Za-z]:[\\/].+\.exe$/i.test(b.path))&&(!b.behavior||['tap','hold'].includes(b.behavior));}
export function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function defaultBinding(g,profile='desktop'){
 if(profile==='geometry-dash'&&g.id==='Pinch')return {mode:'shortcut',keys:['Space'],behavior:'hold'};
 if(profile==='geometry-dash'&&g.id==='Closed_Fist')return {mode:'shortcut',keys:['Space'],behavior:'tap'};
 if(profile==='geometry-dash'&&g.id==='Victory')return {mode:'shortcut',keys:['ArrowUp'],behavior:'hold'};
 if(profile==='geometry-dash'&&g.id!=='Open_Palm')return {mode:'none'};
 if(profile==='creative'&&g.id==='Pinch')return {mode:'shortcut',keys:['Control','Z'],behavior:'tap'};
 return {mode:g.mode,keys:g.keys??['Space'],url:'https://www.youtube.com/',behavior:'tap'};
}
export class BindingStore {
 constructor(storage){this.storage=storage;try{for(const p of JSON.parse(storage?.getItem('flowtouch.profiles.v2')??'[]'))if(/^custom-[a-z0-9-]+$/.test(p.id)&&typeof p.name==='string'&&p.name.length<=50&&!PROFILES.some(x=>x.id===p.id))PROFILES.push(p);}catch{}this.data={};try{const raw=JSON.parse(storage?.getItem('flowtouch.bindings.v2')??'{}');if(raw&&typeof raw==='object'&&!Array.isArray(raw))this.data=raw;}catch{}}
 addProfile(name){name=name.trim().slice(0,50);if(!name)throw Error('Profile name required');const id='custom-'+Date.now().toString(36);PROFILES.push({id,name,en:name});this.storage?.setItem('flowtouch.profiles.v2',JSON.stringify(PROFILES.filter(p=>p.id.startsWith('custom-'))));return id;}
 get(g,profile){const b=this.data[profile]?.[g.id];return validBinding(b)?structuredClone(b):defaultBinding(g,profile);}
 set(id,profile,binding){if(!PROFILES.some(p=>p.id===profile)||!validBinding(binding))throw Error('Invalid binding');this.data[profile]??={};this.data[profile][id]=structuredClone(binding);this.save();}
 reset(id,profile){delete this.data[profile]?.[id];this.save();}
 save(){try{this.storage?.setItem('flowtouch.bindings.v2',JSON.stringify(this.data));}catch{}}
 export(){return JSON.stringify({version:2,profileNames:PROFILES,profiles:this.data},null,2);}
 import(text,ids){const file=JSON.parse(text);if(file.version!==2||!file.profiles||typeof file.profiles!=='object')throw Error('Invalid file');const additions=(file.profileNames??[]).filter(p=>typeof p?.id==='string'&&/^custom-[a-z0-9-]+$/.test(p.id)&&typeof p.name==='string'&&p.name.length>0&&p.name.length<=50&&!PROFILES.some(x=>x.id===p.id)).map(p=>({id:p.id,name:p.name,en:p.name}));const next={};for(const p of [...PROFILES,...additions]){next[p.id]={};for(const [id,b]of Object.entries(file.profiles[p.id]??{})){if(!ids.includes(id)||!validBinding(b))throw Error('Invalid binding');next[p.id][id]=structuredClone(b);}}PROFILES.push(...additions);this.data=next;this.storage?.setItem('flowtouch.profiles.v2',JSON.stringify(PROFILES.filter(p=>p.id.startsWith('custom-'))));this.save();}

}
// Edges, rather than a recurring timer, drive game input. Lost tracking releases keys.
export class GameInputGate {
 constructor(){this.current=null;this.pending=null;this.since=0;}
 update(id,time){if(id===this.current){this.pending=null;return null;}if(!id){const previous=this.current;this.current=null;this.pending=null;return previous?{release:previous,press:null}:null;}if(this.pending!==id){this.pending=id;this.since=time;return null;}if(time-this.since<90)return null;const previous=this.current;this.current=id;this.pending=null;return {release:previous,press:id};}
 reset(){this.current=null;this.pending=null;this.since=0;}
}
