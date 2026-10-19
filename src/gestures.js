export const GESTURES = [
 {id:'Closed_Fist',name:'Кулак',action:'Открыть YouTube',icon:'hand-fist',emoji:'✊',desc:'Сожми ладонь. Любимые видео — одним движением.',mode:'youtube'},
 {id:'Victory',name:'Два пальца',action:'Пауза / воспроизведение',icon:'hand',emoji:'✌',desc:'Покажи V, чтобы управлять воспроизведением.',mode:'media'},
 {id:'Pointing_Up',name:'Указательный',action:'Двигать курсор',icon:'mouse-pointer-2',emoji:'☝',desc:'Подними указательный палец и перемещай руку.',mode:'pointer'},
 {id:'Pinch',name:'Щепотка',action:'Нажать на элемент',icon:'scan',emoji:'🤏',desc:'Соедини большой и указательный пальцы.',mode:'click'},
 {id:'Thumb_Up',name:'Палец вверх',action:'Громче',icon:'thumbs-up',emoji:'👍',desc:'Подними большой палец, чтобы добавить громкость.',mode:'volumeup'},
 {id:'Thumb_Down',name:'Палец вниз',action:'Тише',icon:'thumbs-down',emoji:'👎',desc:'Опусти большой палец, чтобы убавить громкость.',mode:'volumedown'},
 {id:'Open_Palm',name:'Открытая ладонь',action:'Остановить управление',icon:'hand',emoji:'✋',desc:'Покажи ладонь — команды сразу встанут на паузу.',mode:'pause'},
 {id:'ILoveYou',name:'Love',action:'Открыть Spotify',emoji:'🤟',desc:'Большой, указательный и мизинец раскрыты.',mode:'spotify'},
 {id:'Three',name:'Три пальца',action:'Следующий трек',emoji:'Ⅲ',desc:'Указательный, средний и безымянный раскрыты; остальные согнуты.',mode:'next'},
 {id:'Four',name:'Четыре пальца',action:'Предыдущий трек',emoji:'Ⅳ',desc:'Четыре пальца раскрыты, большой прижат к ладони.',mode:'previous'},
 {id:'Rock',name:'Рок',action:'Выключить / включить звук',emoji:'🤘',desc:'Указательный и мизинец раскрыты, большой прижат.',mode:'mute'},
 {id:'Call',name:'Звонок',action:'Домой в браузере',emoji:'🤙',desc:'Большой и мизинец раскрыты, три пальца согнуты.',mode:'home'},
 ...[['Swipe_Up','Свайп вверх','Прокрутить вверх','↑','scrollup'],['Swipe_Down','Свайп вниз','Прокрутить вниз','↓','scrolldown'],['Swipe_Left','Свайп влево','Предыдущая вкладка','←','prevtab'],['Swipe_Right','Свайп вправо','Следующая вкладка','→','nexttab']].map(([id,name,action,emoji,mode])=>({id,name,action,emoji,mode,desc:'Режим «Свайпы»: проведи открытой ладонью в нужную сторону.'})),
 ...[
 ['Closed_Fist','Victory','Google','google'],['Closed_Fist','Thumb_Up','GitHub','github'],['Closed_Fist','Thumb_Down','Wikipedia','wiki'],
 ['Victory','Closed_Fist','Остановить медиа','stopmedia'],['Victory','Thumb_Up','Следующий трек','next'],['Victory','Thumb_Down','Предыдущий трек','previous'],
 ['Pointing_Up','Closed_Fist','Копировать','copy'],['Pointing_Up','Victory','Вставить','paste'],
 ['Thumb_Up','Victory','Переключить окно','switchwindow'],['Thumb_Down','Victory','Свернуть окно','minimize'],
 ['Three','Victory','Увеличить масштаб','zoomin'],['Four','Victory','Уменьшить масштаб','zoomout'],['Rock','Victory','Сбросить масштаб','zoomreset'],
 ['Call','Victory','Новая вкладка','newtab'],['ILoveYou','Victory','Полный экран','fullscreen'],['ILoveYou','Closed_Fist','Показать рабочий стол','desktop']
 ].map(([a,b,action,mode])=>({id:a+'>'+b,name:'Связка',action,emoji:'↳',mode,sequence:[a,b],desc:'Режим «Связки»: удержи первый жест, затем второй в течение 2,2 секунды.'}))
];
export const byId=id=>GESTURES.find(g=>g.id===id);
export function classify(result, threshold=.6) {
 const hand=result.landmarks?.[0];
 const category=result.gestures?.[0]?.[0];
 if (!hand) return {id:null,score:0,hand:null};
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 const palm=distance(hand[0],hand[9]);
 // A pinch needs an extended index: a folded fist can also put both tips close.
 const indexExtended=distance(hand[8],hand[0])>distance(hand[6],hand[0])*1.12;
 if (palm>.025 && distance(hand[4],hand[8])/palm<.24 && indexExtended) return {id:'Pinch',score:.95,hand};
 if(category?.score>=threshold && ['Closed_Fist','Victory','Pointing_Up','Thumb_Up','Thumb_Down','Open_Palm','ILoveYou'].includes(category.categoryName))return {id:category.categoryName,score:category.score,hand};
 const extended=[8,12,16,20].map(t=>distance(hand[t],hand[0])>distance(hand[t-2],hand[0])*1.15);
 const thumbOut=distance(hand[4],hand[17])/Math.max(.001,palm)>1.25;
 const code=extended.map(Number).join('');
 let custom=null;
 if(code==='1110'&&!thumbOut)custom='Three';
 if(code==='1111'&&!thumbOut)custom='Four';
 if(code==='1001'&&!thumbOut)custom='Rock';
 if(code==='0001'&&thumbOut)custom='Call';
 if(custom)return {id:custom,score:.82,hand};
 return {id:category?.score>=threshold && GESTURES.some(g=>g.id===category.categoryName)?category.categoryName:null,score:category?.score??0,hand};
}
export class SwipeDetector {
 constructor(){this.samples=[];this.last=-Infinity;}
 update(hand,time){
  if(!hand){this.samples=[];return null;}
  this.samples.push({x:1-hand[9].x,y:hand[9].y,t:time});
  this.samples=this.samples.filter(s=>time-s.t<500);
  if(time-this.last<1200||this.samples.length<3)return null;
  const a=this.samples[0],b=this.samples.at(-1),dx=b.x-a.x,dy=b.y-a.y;
  if(Math.max(Math.abs(dx),Math.abs(dy))<.22)return null;
  this.last=time;this.samples=[];
  return Math.abs(dx)>Math.abs(dy)?(dx>0?'Swipe_Right':'Swipe_Left'):(dy>0?'Swipe_Down':'Swipe_Up');
 }
}
export class SequenceGate {
 constructor(){this.pending=null;}
 reset(){this.pending=null;}
 update(id,time){
  const a=this.pending;
  if(a && time-a.time<=2200){this.pending=null;const combo=byId(a.id+'>'+id);return {command:combo?.id??null,invalid:!combo};}
  this.pending={id,time};return {waiting:true};
 }
}
export class GestureGate {
 constructor(hold=800,cooldown=1600,grace=220){this.hold=hold;this.cooldown=cooldown;this.grace=grace;this.reset();}
 reset(){this.candidate=null;this.since=0;this.lastSeen=-Infinity;this.lastFired=-Infinity;this.latched=null;this.releaseSince=null;this.pending=null;this.pendingSince=0;}
 update(id,time,armed){
  if(!armed){this.candidate=null;this.since=time;this.releaseSince=null;this.pending=null;return {progress:0,fire:false};}
  if(!id){
   if(this.releaseSince===null)this.releaseSince=time;
   if(time-this.releaseSince>=250)this.latched=null;
   if(time-this.lastSeen>this.grace){this.candidate=null;this.pending=null;this.since=time;}
   return {progress:this.candidate?Math.min(1,(this.lastSeen-this.since)/this.hold):0,fire:false};
  }
  if(this.releaseSince!==null && time-this.lastSeen>this.grace){this.candidate=null;this.pending=null;}
  this.releaseSince=null;
  if(id!==this.candidate){
   if(this.candidate){
    if(this.pending!==id){this.pending=id;this.pendingSince=time;}
    if(time-this.pendingSince<120)return {progress:Math.min(1,(this.lastSeen-this.since)/this.hold),fire:false};
   }
   this.candidate=id;this.since=time;
  }
  this.pending=null;this.lastSeen=time;
  if(this.latched===id)return {progress:1,fire:false};
  const progress=Math.min(1,(time-this.since)/this.hold);
  if(progress===1 && time-this.lastFired>=this.cooldown){this.lastFired=time;this.latched=id;return {progress:1,fire:true};}
  return {progress,fire:false};
 }
}
