const SITES={youtube:'https://www.youtube.com/',spotify:'https://open.spotify.com/',google:'https://www.google.com/',github:'https://github.com/',wiki:'https://www.wikipedia.org/'};
export function browserUrl(binding){
 const value=binding.mode==='url'?binding.url:SITES[binding.mode];
 if(!value)return null;
 try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function mountWebWorkspace({notify,t}){
 const panel=document.querySelector('.practice-panel');
 panel.className='web-workspace';
 panel.innerHTML=`<div class="web-tools"><div><span class="eyebrow muted">BROWSER WORKSPACE</span><h3>${t('Действия в браузере','Browser actions')}</h3><p>${t('Это рабочие элементы страницы. Камера распознаёт настоящие жесты; Windows-программы отсюда недоступны.','These are working page controls. The camera recognizes real gestures; Windows applications are outside the browser’s scope.')}</p></div><button id="connect-web-tab" class="button primary">${t('Подключить вкладку для сайтов','Connect a tab for websites')} ↗</button><span id="web-tab-status">${t('Сначала подключи вкладку обычным кликом. Затем кулак сможет открыть в ней YouTube.','Connect a tab with a click first. A fist can then navigate it to YouTube.')}</span></div><div class="web-labs"><section><h3>${t('Твой медиаплеер','Your media player')}</h3><label class="text-button">${t('Выбрать аудио или видео','Choose audio or video')}<input id="web-media-file" type="file" accept="audio/*,video/*"></label><video id="web-media" controls playsinline preload="metadata"></video><p>${t('Файл остаётся на устройстве. Два пальца — пауза, большой палец — громкость.','The file stays on your device. Victory controls playback; thumbs control volume.')}</p><button class="text-button" id="web-play">${t('Воспроизведение / пауза','Play / pause')}</button></section><section><h3>${t('Проверка игрового ввода','Game input test')}</h3><div class="web-game" id="web-game"><div class="web-runner" id="web-runner"></div><div class="web-ground"></div><span id="web-key-state">Space ↑</span></div><button class="text-button" id="web-jump">${t('Прыжок · Space','Jump · Space')}</button><p>${t('Профиль Geometry Dash: щепотка удерживает Space, отпускание жеста отпускает клавишу. Это мини-тренажёр внутри Studio.','Geometry Dash profile: pinch holds Space and releasing the pose releases the key. This is an in-page input trainer.')}</p></section></div><div class="web-observer" id="web-observer" role="status">${t('Локальная модель готова к запуску камеры. Облачный ключ не нужен.','The on-device model is ready for camera setup. No cloud key is needed.')}</div>`;
 const media=panel.querySelector('#web-media'),runner=panel.querySelector('#web-runner'),keyState=panel.querySelector('#web-key-state');
 let tab=null,mediaUrl=null,held=false,lastMove=0;
 panel.querySelector('#connect-web-tab').onclick=()=>{
  tab=window.open('about:blank','flowtouch-web-target');
  if(!tab){notify(t('Браузер заблокировал вкладку. Разреши её открытие для FlowTouch.','The browser blocked the tab. Allow this site to open it.'));return;}
  tab.opener=null;
  panel.querySelector('#web-tab-status').textContent=t('Вкладка подключена. Вернись в Studio и включи команды.','Tab connected. Return to Studio and enable commands.');
 };
 const jump=()=>{runner.getAnimations().forEach(a=>a.cancel());runner.animate([{transform:'translateY(0) rotate(0)'},{transform:'translateY(-85px) rotate(45deg)',offset:.5},{transform:'translateY(0) rotate(90deg)'}],{duration:620,easing:'cubic-bezier(.3,0,.7,1)'});};
 const setHeld=value=>{held=value;keyState.textContent='Space '+(value?'↓':'↑');runner.classList.toggle('held',value);if(value)jump();};
 panel.querySelector('#web-jump').onclick=jump;
 async function play(){if(!media.src)throw Error(t('Сначала выбери аудио или видео.','Choose an audio or video file first.'));if(media.paused)await media.play();else media.pause();}
 panel.querySelector('#web-play').onclick=()=>play().catch(e=>notify(e.message));
 panel.querySelector('#web-media-file').onchange=e=>{const file=e.target.files[0];if(!file)return;if(mediaUrl)URL.revokeObjectURL(mediaUrl);mediaUrl=URL.createObjectURL(file);media.src=mediaUrl;notify(t('Файл подключён. Запусти его кнопкой плеера один раз, затем управляй жестами.','File ready. Start it once with the player control, then use gestures.'));};
 const onMovement=({detail})=>{if(performance.now()-lastMove<300)return;lastMove=performance.now();panel.querySelector('#web-observer').textContent=detail.id?t('Локальное распознавание: ','On-device recognition: ')+detail.id+' · '+Math.round(detail.score*100)+'%':t('Рука не обнаружена. Держи кисть целиком в кадре.','No hand detected. Keep the entire hand in view.');};
 window.addEventListener('flowtouch:movement',onMovement);
 window.addEventListener('pagehide',()=>{media.pause();if(mediaUrl)URL.revokeObjectURL(mediaUrl);window.removeEventListener('flowtouch:movement',onMovement);},{once:true});
 return {
  release:()=>setHeld(false),
  hold(keys){if(keys.some(k=>['Space','ArrowUp'].includes(k)))setHeld(true);},
  async execute(binding){
   const url=browserUrl(binding);
   if(url){if(!tab||tab.closed)throw Error(t('Подключи вкладку для сайтов кнопкой в рабочей области.','Connect a website tab using the workspace button first.'));tab.location.href=url;return t('Открыто во вкладке: ','Opened in connected tab: ')+url;}
   switch(binding.mode){
    case 'media':await play();break;
    case 'stopmedia':media.pause();media.currentTime=0;break;
    case 'volumeup':media.volume=Math.min(1,media.volume+.1);break;
    case 'volumedown':media.volume=Math.max(0,media.volume-.1);break;
    case 'mute':media.muted=!media.muted;break;
    case 'scrollup':window.scrollBy({top:-350,behavior:'smooth'});break;
    case 'scrolldown':window.scrollBy({top:350,behavior:'smooth'});break;
    case 'click':case 'doubleclick':jump();break;
    case 'pointer':return t('Указатель движется в окне камеры.','The pointer moves inside the camera panel.');
    case 'shortcut':if(binding.keys?.some(k=>['Space','ArrowUp'].includes(k))){jump();break;}throw Error(t('Эта клавиша предназначена для Windows. В веб-тренажёре доступны Space и ↑.','This key mapping is for Windows. The web trainer supports Space and ↑.'));
    case 'none':return '';
    default:throw Error(t('Это системная команда Windows. Веб-версия её не выполняет.','This is a Windows system command and cannot run in the web version.'));
   }
   return t('Выполнено в браузере','Executed in the browser');
  }
 };
}
