import {poseIllustration} from './pose-illustration.js';
import {upgradeLanding, installLanguage, t, english} from './landing.js';
import {BindingStore, ACTIONS, KEY_NAMES, PROFILES, GameInputGate} from './bindings.js';
import { connectDesktop, expectsDesktop } from './desktop.js';
import './style.css';
import { appUrl, appBase } from './paths.js';
import { SoundDesign } from './sound';
import {mountSoundControls} from './sound-ui.js';
import './audio.css';
import { openCamera, describeCameraError } from './camera';
import './glass.css';
import './premium.css';
import './studio.css';
import { animate, inView, scroll, stagger } from 'motion';
import { createIcons, ArrowUpRight, ArrowRight, Play, Camera, ShieldCheck, Scan, Hand, MousePointer2, Volume2, X, Check, Download, Github, ChevronDown, SlidersHorizontal, CircleHelp, Pause, ArrowDown, Fingerprint, MoveUpRight, Monitor, VideoOff, Sparkles, ExternalLink, RotateCcw, Search } from 'lucide';
import { GESTURES, byId, classify, GestureGate, SwipeDetector, SequenceGate } from './gestures';
const icons={ArrowUpRight,ArrowRight,Play,Camera,ShieldCheck,Scan,Hand,MousePointer2,Volume2,X,Check,Download,Github,ChevronDown,SlidersHorizontal,CircleHelp,Pause,ArrowDown,Fingerprint,MoveUpRight,Monitor,VideoOff,Sparkles,ExternalLink,RotateCcw,Search};
const icon=name=>`<i data-lucide="${name}"></i>`;
const logo=`<a class="logo" href="#" aria-label="FlowTouch — главная"><span class="logo-mark"><b></b><b></b><b></b><b></b></span>FlowTouch<span class="logo-dot">®</span></a>`;
const bindings=new BindingStore(localStorage);
let profile=localStorage.getItem('flowtouch.profile')||'desktop';
if(!PROFILES.some(p=>p.id===profile))profile='desktop';
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bindingLabel=g=>{const b=bindings.get(g,profile);return b.mode==='pause'?t('Остановить управление','Pause control'):b.mode==='shortcut'?b.keys.join(' + '):b.mode==='url'?b.url:b.mode==='app'?b.path.split(/[\\/]/).pop():ACTIONS.find(a=>a.id===b.mode)?.[english?'en':'label']??g.action;};
const poseNamesEn={Closed_Fist:'Fist',Victory:'Victory',Pointing_Up:'Point',Pinch:'Pinch',Thumb_Up:'Thumb up',Thumb_Down:'Thumb down',Open_Palm:'Open palm',ILoveYou:'Love',Three:'Three fingers',Four:'Four fingers',Rock:'Rock',Call:'Call',Swipe_Up:'Swipe up',Swipe_Down:'Swipe down',Swipe_Left:'Swipe left',Swipe_Right:'Swipe right'};
const poseLabel=id=>english?(poseNamesEn[id]??byId(id)?.name??id):(byId(id)?.name??id);
const poseEmoji=id=>byId(id)?.emoji??'✦';
document.querySelector('#app').innerHTML=`
<header class="site-header"><div class="wrap nav">${logo}<nav aria-label="Главная навигация"><a href="#how">Как это работает</a><a href="#alphabet">Жесты <small>126</small></a><a href="#studio">Студия</a></nav><button id="sound-toggle" class="sound-toggle" aria-pressed="false" aria-label="Включить звуки интерфейса"><span class="sound-bars"><b></b><b></b><b></b></span><span id="sound-label">ЗВУК ВЫКЛ</span></button><a class="nav-cta" href="#studio">Попробовать ${icon('arrow-up-right')}</a></div></header>
<main>
<section class="hero-scroll" id="experience" aria-labelledby="hero-title"><div class="hero wrap"><div class="hero-wordmark" aria-hidden="true">FLOW</div><div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span> 126 ШАБЛОНОВ · БЕЗ КАСАНИЙ <span class="pill">BETA 01</span></div><h1 id="hero-title"><span class="hero-line">Твой жест.</span><br><span class="hero-line accent-text">И всё.</span></h1><p class="hero-description">126 шаблонов. Одна камера.<br>Всё остальное — в твоих руках.</p><div class="hero-actions"><a class="button primary magnetic" href="#studio">Войти в поток ${icon('arrow-up-right')}</a><button class="button quiet" id="watch-demo">${icon('play')} Открыть студию</button></div><div class="hero-note">${icon('camera')} Твоя камера. Твоя рука. Твои правила.</div></div>
<div class="hero-art" aria-label="Интерактивная рука: меняй жест кнопками и двигай курсор"><div class="art-grid"></div><span class="hand-loading">ЗАГРУЖАЕМ 3D-МОДЕЛЬ…</span><div id="hand-scene"></div><div class="hand-vertical-label">FORM FOLLOWS GESTURE</div><div class="art-label top"><span class="live-dot"></span> HAND MODEL / 25 JOINTS <span>3D / LIVE</span></div><div class="hand-target"><b></b><b></b><b></b><b></b></div><div class="tracking-tag"><span class="pose-number" id="hand-pose-number">01</span><div><small id="hand-pose-label">OPEN PALM</small><strong id="hand-action-label">Управление на паузе</strong></div><span class="tag-dot"></span></div><div class="hand-pose-controls" role="group" aria-label="Жест анимированной руки"><button data-hand-pose="0" aria-pressed="true" class="active"><span>01</span> Ладонь</button><button data-hand-pose="1" aria-pressed="false"><span>02</span> Кулак</button><button data-hand-pose="2" aria-pressed="false"><span>03</span> Два пальца</button></div><span class="coordinate">ПОВЕРНИ КУРСОРОМ · ВЫБЕРИ ЖЕСТ</span></div>
<div class="hero-bottom"><span class="scroll-invitation"><b></b> ПРОКРУТИ. ПОЧУВСТВУЙ ДВИЖЕНИЕ.</span><span class="hero-bottom-right">126 ШАБЛОНОВ <i>✳</i> НОЛЬ КАСАНИЙ</span><div id="hero-scroll-progress"></div></div></div></section>
<div class="signal-strip"><div class="wrap"><span>${icon('scan')} 126 жестовых шаблонов</span><span>${icon('shield-check')} Кадры остаются у тебя</span><span>${icon('fingerprint')} Никаких носимых устройств</span><span>${icon('sparkles')} Создан для твоего потока</span></div></div>
<section class="section wrap" id="how"><div class="section-heading"><div><div class="eyebrow muted">01 / НАЧАТЬ ЛЕГКО</div><h2>От движения<br>к действию.</h2></div><p>Не нужно переучиваться всему.<br>Просто дай рукам немного свободы.</p></div><div class="steps"><article class="step"><span class="step-number">01</span>${icon('camera')}<h3>Включи камеру</h3><p>Разреши доступ, устройся удобно и держи руку в кадре.</p></article><article class="step"><span class="step-number">02</span>${icon('hand')}<h3>Найди свой жест</h3><p>От простого кулака до связки движений. Тренируйся в своём темпе.</p></article><article class="step"><span class="step-number">03</span>${icon('move-up-right')}<h3>Поймай поток</h3><p>Медиа, навигация и окна. В браузере — демо, в Windows — локальный режим.</p></article></div></section>
<section class="section alphabet-section" id="alphabet"><div class="wrap"><div class="section-heading"><div><div class="eyebrow muted">02 / ЯЗЫК ДВИЖЕНИЯ</div><h2>Один жест.<br><span class="serif">Много смысла.</span></h2></div><div class="alphabet-summary"><span class="big-number">126<span>↗</span></span><p>12 поз · 4 свайпа · 110 последовательностей<br>Твой новый алфавит управления.</p></div></div><div class="catalog-toolbar"><div class="tabs" role="group" aria-label="Категории жестов"><button class="tab active" data-filter="all">Все жесты <span>126</span></button><button class="tab" data-filter="pose">Позы <span>12</span></button><button class="tab" data-filter="swipe">Свайпы <span>4</span></button><button class="tab" data-filter="combo">Последовательности <span>110</span></button></div><label class="search-box">${icon('search')}<input id="gesture-search" type="search" placeholder="Найти команду" aria-label="Найти команду"></label></div><div class="gesture-grid" id="gesture-grid"></div><div class="catalog-bottom"><p>Нажми на карточку, чтобы потренироваться. Связки — это два жеста подряд.</p><button class="text-button" id="expand-catalog">Показать все 126 ${icon('arrow-down')}</button></div></div></section>
<section class="section wrap studio-section" id="studio"><div class="section-heading"><div><div class="eyebrow muted">03 / ПОЧУВСТВУЙ FLOW</div><h2>Твоя рука.<br>Твой <span class="serif">контроль.</span></h2></div><p>Попробуй прямо здесь.<br>Камера включается только с твоего разрешения.</p></div><div class="studio-shell"><div class="studio-top"><div class="studio-title"><span class="live-dot" id="studio-dot"></span> FlowTouch Studio <span class="pill">LIVE LAB</span></div><span id="runtime-label">Веб-студия · 126 шаблонов</span><button class="icon-button" id="settings-toggle" aria-label="Настройки" aria-expanded="false">${icon('sliders-horizontal')}</button></div><div class="studio-body"><div class="camera-panel" id="camera-panel"><video id="camera" autoplay muted playsinline></video><canvas id="landmarks"></canvas><div class="camera-grid"></div><div class="camera-placeholder" id="camera-placeholder"><div class="camera-glyph">${icon('scan')}</div><h3>Здесь начинается поток</h3><p>Включи камеру и покажи руку.<br>Распознавание работает на твоём устройстве.</p><button class="button primary" id="start-camera">${icon('camera')} Подключить камеру</button><button class="text-button" id="start-simulation">Сначала посмотреть демо ${icon('arrow-right')}</button></div><span class="camera-meta" id="camera-meta">CAMERA OFF &nbsp; / &nbsp; LOCAL PROCESSING</span><div class="camera-bottom"><span id="tracking-status">Ожидание подключения</span><button class="icon-button" id="stop-camera" aria-label="Отключить камеру" hidden>${icon('video-off')}</button></div><span id="virtual-cursor" hidden></span><div id="simulation-label" hidden>ДЕМОНСТРАЦИЯ · БЕЗ КАМЕРЫ</div></div><aside class="studio-controls"><div class="control-heading"><span>РАСПОЗНАВАНИЕ</span><span id="fps">— FPS</span></div><div class="current-gesture"><span id="current-emoji">✋</span><div><small>ТЕКУЩИЙ ЖЕСТ</small><h3 id="current-name">Покажи руку</h3></div></div><div class="confidence-row"><span>Совпадение жеста</span><strong id="confidence">—</strong></div><div class="progress-track"><div id="hold-progress"></div></div><p class="hold-label" id="hold-label">Удерживай жест 0,8 секунды</p><label class="switch-row"><span>Выполнять команды<small id="arm-hint">Сначала подключи камеру</small></span><input type="checkbox" id="armed" disabled><span class="switch"></span></label><label class="field-label" for="recognition-mode">Режим алфавита</label><select id="recognition-mode"><option value="pose">Позы · 12 шаблонов</option><option value="swipe">Свайпы · 4 шаблона</option><option value="combo">Последовательности · 110 шаблонов</option></select><div id="settings-panel" hidden><label class="field-label" for="sensitivity">Порог уверенности <span id="threshold-label">60%</span></label><input type="range" id="sensitivity" min="45" max="95" value="60"><label class="field-label" for="camera-select">Камера</label><select id="camera-select"><option value="">По умолчанию</option></select><label class="check-row"><input type="checkbox" id="show-skeleton" checked> Показывать точки руки</label></div><div class="session-log"><span class="control-heading">ПОСЛЕДНЕЕ ДЕЙСТВИЕ</span><p id="last-action">Пока тихо. Дай знак.</p></div><div class="studio-security">${icon('shield-check')} Видео не записывается и не отправляется на сервер.</div></aside></div><div class="studio-footer"><span><kbd>Esc</kbd> Экстренная пауза</span><span>${icon('hand')} Ладонь — остановить управление</span><span id="bridge-status">${icon('monitor')} Windows: локальный помощник</span></div></div><div class="status-message" id="status-message" role="status" aria-live="polite"></div><div class="practice-panel"><div><span class="eyebrow muted">ПЕСОЧНИЦА</span><h3 id="practice-title">Потренируйся без лишних вкладок</h3><p id="practice-instruction">Выбери жест в алфавите или запусти демонстрацию.</p></div><div class="demo-player"><button id="demo-play" class="icon-button" aria-label="Пауза или воспроизведение демо">${icon('play')}</button><div class="waveform" id="waveform">${Array.from({length:24},(_,i)=>`<b style="--h:${18+((i*17)%35)}px;--d:${i*.055}s"></b>`).join('')}</div><span id="player-state">На паузе</span><label class="volume-label">${icon('volume-2')}<input type="range" id="demo-volume" min="0" max="100" value="50" aria-label="Громкость демо"><span id="volume-value">50%</span></label></div></div><div class="browser-limits">${icon('circle-help')} В браузере медиа и курсор работают в песочнице. Команды окон, вкладок и системная громкость доступны через помощник Windows. Свайпы и геометрические позы экспериментальные — проверь их в тренировке.</div></section>
<section class="section wrap local-section" id="desktop"><div class="local-copy"><div class="eyebrow">04 / ВЫЙТИ ЗА РАМКИ БРАУЗЕРА</div><h2>Больше пространства.<br><span class="serif">Тот же поток.</span></h2><p>Локальный помощник соединяет жесты с Windows: курсор, клики, медиаклавиши, вкладки и окна. Запусти его на своём компьютере и включи управление в локальной студии.</p><a class="button primary" href="/downloads/FlowTouch-Studio-Windows.zip" download>${icon('download')} Скачать FlowTouch.exe ${icon('arrow-up-right')}</a><small>Windows 10/11 · Python устанавливать не нужно</small></div><div class="local-visual"><div class="window-mini"><div class="mini-dots"><b></b><b></b><b></b><span>FlowTouch / local</span></div><div class="connection-diagram"><span>${icon('hand')}</span><i></i><span class="connection-center">${icon('fingerprint')}</span><i></i><span>${icon('monitor')}</span></div><div class="connection-caption"><span>Твоя рука</span><span>Твоё устройство</span></div><div class="local-badge"><span class="live-dot"></span> LOCAL. PRIVATE. IN YOUR CONTROL.</div></div></div></section>
<section class="section wrap faq-section"><div><div class="eyebrow muted">ЕЩЁ ПАРА ВЕЩЕЙ</div><h2>Без лишних<br>вопросов.</h2></div><div class="faq"><details><summary>Нужна специальная камера? ${icon('chevron-down')}</summary><p>Достаточно обычной веб-камеры. Для устойчивого распознавания держи всю кисть в кадре, обеспечь хорошее освещение и спокойный фон.</p></details><details><summary>Что происходит с видео? ${icon('chevron-down')}</summary><p>Кадры обрабатывает MediaPipe в браузере. FlowTouch не записывает видео и не загружает кадры. Модель поставляется вместе с приложением.</p></details><details><summary>Как работают 126 шаблонов? ${icon('chevron-down')}</summary><p>12 статических поз, 4 направления свайпа и 16 двухшаговых связок. Для каждого типа есть отдельный режим: открытая ладонь в режиме поз останавливает управление, а в режиме свайпов задаёт направление движения. Escape останавливает любой режим.</p></details><details><summary>Можно ли управлять всем компьютером? ${icon('chevron-down')}</summary><p>Да, через локального помощника для Windows. Он принимает только заданные команды от локальной студии и не исполняет произвольный код. В браузерной версии часть команд показывается как демонстрация.</p></details><details><summary>Как запустить программу? ${icon('chevron-down')}</summary><p>Скачай FlowTouch.exe и запусти его. Откроется локальная студия. Подключи камеру и нажми «Начать управление Windows». Чтобы завершить работу, закрой окно программы.</p></details></div></section>
<section class="final-cta wrap"><span class="eyebrow">LET YOUR HANDS DO THE TALKING</span><h2>Поймай свой <span class="serif">flow.</span> <span>↗</span></h2><a class="button primary" href="#studio">Начать с одного жеста ${icon('arrow-up-right')}</a></section>
</main><footer class="wrap footer">${logo}<span>Новый способ быть в потоке.</span><span>FlowTouch · экспериментальная бета · 2026</span><a href="#">Наверх ↑</a></footer><div class="toast" id="toast" role="status" hidden></div><dialog id="gesture-dialog"><button class="dialog-close icon-button" id="dialog-close" aria-label="Закрыть">${icon('x')}</button><div id="dialog-content"></div></dialog>`;
createIcons({icons});
const $=s=>document.querySelector(s);
const isStudio=location.pathname.replace(/\/$/,'')===appUrl('studio');
document.querySelectorAll('a[href="#studio"]').forEach(a=>a.href=appUrl('studio/'));
const demoLink=$('#watch-demo');if(demoLink){const a=document.createElement('a');a.className=demoLink.className;a.id='watch-demo';a.href=appUrl('studio/');a.innerHTML=demoLink.innerHTML;demoLink.replaceWith(a);}
if(isStudio){
 const studio=$('#studio'),catalog=$('#alphabet');
 document.querySelector('main').replaceChildren(studio,catalog);
 document.querySelector('main').className='studio-page';document.body.classList.add('is-studio');
 $('.site-header nav').innerHTML='<a href="https://flowtouch-peach.vercel.app/" target="_blank">← О продукте</a><a href="/studio/" aria-current="page">Студия</a><a href="#alphabet">Алфавит</a>';
 $('.site-header .logo').href='https://flowtouch-peach.vercel.app/';$('.site-header .nav-cta').href='#studio';$('.site-header .nav-cta').textContent='Рабочее пространство';
 $('#studio .section-heading h2').textContent='FlowTouch Studio';
 $('#studio .section-heading .eyebrow').textContent='ТВОЁ РАБОЧЕЕ ПРОСТРАНСТВО';
 $('#studio .section-heading > p').textContent='Камера, жесты и команды. Всё в одном пространстве.';
 $('#studio').insertAdjacentHTML('afterbegin','<div class="studio-page-breadcrumb"><a href="/">FlowTouch</a><span>/</span> Studio <span class="studio-version">2.1.0 / 126 ШАБЛОНОВ</span></div>');
 $('#studio .section-heading').insertAdjacentHTML('afterend','<div id="execution-mode-banner" class="execution-banner"><div><strong id="execution-mode-title">Браузерная студия</strong><p id="execution-mode-detail">Здесь работают камера и тренировка. Для открытия программ запусти FlowTouch.exe.</p></div><a class="button primary" id="desktop-download" href="/downloads/FlowTouch-Studio-Windows.zip" download>Скачать FlowTouch.exe ↗</a></div>');
 $('.confidence-row').insertAdjacentHTML('afterend','<div class="activation-label"><span>Прогресс удержания</span><strong id="hold-percent">0%</strong></div>');
 $('.switch-row').insertAdjacentHTML('afterend','<button id="control-toggle" class="button primary control-toggle" disabled>Начать управление</button><label class="field-label" for="fist-target">Кулак запускает</label><select id="fist-target"><option value="youtube">YouTube</option><option value="calculator">Калькулятор Windows</option><option value="notepad">Блокнот</option><option value="explorer">Проводник</option></select>');
 $('#camera-placeholder').insertAdjacentHTML('beforeend','<button class="text-button" id="camera-diagnostics">Не видишь камеру? Проверить подключение</button>');
 $('#status-message').insertAdjacentHTML('afterend','<section id="camera-diagnostic-panel" class="diagnostic-panel" hidden><div class="diagnostic-heading"><h3>Подключение камеры</h3><button id="refresh-cameras" class="text-button">Повторить поиск ↻</button></div><div id="diagnostic-results"></div><p id="diagnostic-advice"></p><a href="https://support.microsoft.com/en-us/windows/hardware/camera/camera-doesn-t-work-in-windows" target="_blank" rel="noopener noreferrer">Инструкция Microsoft ↗</a></section>');
 document.title='FlowTouch Studio — жесты и камера';$('.footer .logo').href='/';
}else{$('#studio').remove();upgradeLanding();}
installLanguage();document.body.classList.add('flowtouch-v2');
// Keep links valid on both a GitHub project site and the local desktop server.
document.querySelectorAll('a[href^="/"]').forEach(a=>{const path=a.getAttribute('href');if(!path.startsWith(appBase))a.setAttribute('href',appUrl(path));});
function notify(message){const target=$('#status-message');if(target)target.textContent=message;else toast(message);}

function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,3500);}
const sound=new SoundDesign();
$('#sound-toggle').onclick=async()=>{try{if(sound.enabled)sound.disable();else await sound.enable();$('#sound-toggle').setAttribute('aria-pressed',String(sound.enabled));$('#sound-label').textContent=sound.enabled?'ЗВУК ВКЛ':'ЗВУК ВЫКЛ';$('#sound-toggle').setAttribute('aria-label',sound.enabled?'Выключить звуки интерфейса':'Включить звуки интерфейса');}catch{notify('Браузер не разрешил звук. Повтори нажатие.');}};
mountSoundControls(sound,$('#sound-toggle'),{english});
if(!isStudio)import('./hand-scene').then(({mountHandScene})=>mountHandScene($('#hand-scene'),$('#experience'))).catch(()=>{document.querySelector('.hand-loading').textContent='Для 3D нужен браузер с WebGL';});
let filter='all',expanded=false,search='';
function renderCatalog(){
 const matches=GESTURES.filter(g=>(filter==='all'||(filter==='combo'?g.sequence:filter==='swipe'?g.id.startsWith('Swipe'):!g.sequence&&!g.id.startsWith('Swipe')))&&`${poseLabel(g.id)} ${bindingLabel(g)} ${g.sequence?.map(poseLabel).join(' ')??''}`.toLowerCase().includes(search));
 const visible=expanded||filter!=='all'||search?matches:matches.slice(0,8);
 $('#gesture-grid').innerHTML=visible.map(g=>`<button class="gesture-card" data-gesture="${g.id}"><span class="gesture-index">${String(GESTURES.indexOf(g)+1).padStart(3,'0')}</span><div class="pose-preview ${g.sequence?'is-sequence':''}">${g.sequence?g.sequence.map(poseIllustration).join('<span>→</span>'):poseIllustration(g.id)}</div><div class="gesture-details"><span class="gesture-type">${g.sequence?t('ПОСЛЕДОВАТЕЛЬНОСТЬ','SEQUENCE'):g.id.startsWith('Swipe')?t('СВАЙП','SWIPE'):t('ПОЗА','POSE')}</span><h3>${escapeHtml(bindingLabel(g))}</h3><p>${escapeHtml(g.sequence?g.sequence.map(poseLabel).join(' → '):poseLabel(g.id))}</p></div><span class="card-arrow">↗</span></button>`).join('')||'<p class="no-results">'+t('Ничего не найдено.','No matches.')+'</p>';
 $('#expand-catalog').hidden=filter!=='all'||!!search;$('#expand-catalog').innerHTML=expanded?t('Свернуть ↑','Show less ↑'):t('Показать все 126 ↓','Show all 126 ↓');
 createIcons({icons});
 document.querySelectorAll('[data-gesture]').forEach(b=>b.addEventListener('click',()=>showGesture(b.dataset.gesture)));
}
renderCatalog();
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));renderCatalog();});
$('#gesture-search').oninput=e=>{search=e.target.value.toLowerCase().trim();renderCatalog();};$('#expand-catalog').onclick=()=>{expanded=!expanded;renderCatalog();};
const profileBar=document.createElement('div');profileBar.className='profile-bar';profileBar.innerHTML=`<label>${t('Профиль приложения','Application profile')}<select id="profile-select">${PROFILES.map(p=>`<option value="${p.id}" ${p.id===profile?'selected':''}>${escapeHtml(english?p.en:p.name)}</option>`).join('')}</select></label><button id="add-profile" class="text-button">+ ${t('Свой профиль','New profile')}</button><button id="export-bindings" class="text-button">${t('Экспорт','Export')} ↗</button><label class="text-button import-label">${t('Импорт','Import')}<input type="file" id="import-bindings" accept="application/json,.json" hidden></label>`;$('#alphabet .catalog-toolbar').before(profileBar);
$('#profile-select').onchange=e=>{profile=e.target.value;localStorage.setItem('flowtouch.profile',profile);renderCatalog();window.dispatchEvent(new CustomEvent('flowtouch:profile'));};
$('#add-profile').onclick=()=>{const name=prompt(t('Название приложения или профиля','Application or profile name'));if(name?.trim()){const id=bindings.addProfile(name);profile=id;localStorage.setItem('flowtouch.profile',id);const o=new Option(name,id);$('#profile-select').add(o);$('#profile-select').value=id;renderCatalog();window.dispatchEvent(new CustomEvent('flowtouch:profile'));}};
$('#export-bindings').onclick=()=>{const url=URL.createObjectURL(new Blob([bindings.export()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='FlowTouch-profiles.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#import-bindings').onchange=async e=>{try{const file=e.target.files[0];if(!file||file.size>150000)throw Error();bindings.import(await file.text(),GESTURES.map(g=>g.id));$('#profile-select').replaceChildren(...PROFILES.map(p=>new Option(english?p.en:p.name,p.id,false,p.id===profile)));renderCatalog();toast(t('Привязки импортированы','Mappings imported'));}catch{toast(t('Не удалось прочитать файл профилей','Invalid profile file'));}e.target.value='';};
let training=null;
function showGesture(id){
 const g=byId(id),binding=bindings.get(g,profile),locked=g.id==='Open_Palm';
 $('#dialog-content').innerHTML=`<span class="eyebrow muted">FLOWTOUCH / ${escapeHtml(PROFILES.find(p=>p.id===profile)?.name)} / ${String(GESTURES.indexOf(g)+1).padStart(3,'0')}</span><div class="dialog-gesture">${g.sequence?g.sequence.map(poseIllustration).join('<span>→</span>'):poseIllustration(g.id)}</div><h2>${escapeHtml(g.sequence?g.sequence.map(poseLabel).join(' → '):poseLabel(id))}</h2><p>${g.sequence?t('Два жеста по очереди. Удержи первый, затем второй в течение 2,2 секунды.','Two poses in order. Hold the first, then the second within 2.2 seconds.'):t('Удержи жест для подтверждения. В режиме игры ввод реагирует на смену позы.','Hold to confirm. Game mode responds to pose changes.')}</p>${locked?'<p>'+t('Ладонь всегда останавливает управление.','Open palm always pauses control.')+'</p>':`<form id="binding-form" class="binding-form"><label>${t('Действие','Action')}<select id="binding-action">${ACTIONS.map(a=>`<option value="${a.id}" ${a.id===binding.mode?'selected':''}>${english?a.en:a.label}</option>`).join('')}</select></label><div id="shortcut-options"><label>${t('Клавиша','Key')}<select id="binding-key">${KEY_NAMES.filter(k=>!['Control','Shift','Alt'].includes(k)).map(k=>`<option ${k===(binding.keys??['Space']).at(-1)?'selected':''}>${k}</option>`).join('')}</select></label><div class="modifier-row">${['Control','Shift','Alt'].map(k=>`<label><input type="checkbox" value="${k}" ${(binding.keys??[]).includes(k)?'checked':''}> ${k}</label>`).join('')}</div><label>${t('Поведение в режиме игры','Behavior in game mode')}<select id="binding-behavior"><option value="tap">${t('Нажатие','Tap')}</option><option value="hold" ${binding.behavior==='hold'?'selected':''}>${t('Удержание, пока показан жест','Hold while the gesture is visible')}</option></select></label></div><label id="url-options">URL<input type="url" id="binding-url" value="${escapeHtml(binding.url??'https://www.youtube.com/')}" placeholder="https://example.com"></label><label id="app-options">${t('Путь к программе (.exe)','Application path (.exe)')}<input id="binding-path" value="${escapeHtml(binding.path??'')}" placeholder="C:\Apps\App.exe"></label><p class="dialog-note">${t('Сохраняется только на этом устройстве. Системный ввод выполняет FlowTouch.exe.','Saved on this device. System input is handled by FlowTouch.exe.')}</p><button class="button primary" type="submit">${t('Сохранить привязку','Save mapping')} ↗</button><button type="button" class="text-button" id="reset-binding">${t('Сбросить действие','Reset mapping')}</button></form>`}<button class="text-button" id="train-this">${t('Тренировать этот жест','Practice this gesture')} →</button>`;
 createIcons({icons});$('#gesture-dialog').showModal();
 if(!locked){const update=()=>{$('#shortcut-options').hidden=$('#binding-action').value!=='shortcut';$('#url-options').hidden=$('#binding-action').value!=='url';$('#app-options').hidden=$('#binding-action').value!=='app';};$('#binding-action').onchange=update;update();
 $('#binding-form').onsubmit=e=>{e.preventDefault();const b={mode:$('#binding-action').value,keys:[...document.querySelectorAll('.modifier-row input:checked')].map(x=>x.value).concat($('#binding-key').value),behavior:$('#binding-behavior').value,url:$('#binding-url').value,path:$('#binding-path').value};try{bindings.set(id,profile,b);renderCatalog();$('#gesture-dialog').close();toast(t('Привязка сохранена','Mapping saved'));}catch{toast(t('Проверь URL, клавиши или путь к .exe','Check the URL, keys or .exe path'));}};
 $('#reset-binding').onclick=()=>{bindings.reset(id,profile);renderCatalog();$('#gesture-dialog').close();};}
 $('#train-this').onclick=()=>{if(!isStudio){location.href=appUrl('studio/?gesture='+encodeURIComponent(id));return;}$('#gesture-dialog').close();window.dispatchEvent(new CustomEvent('flowtouch:train',{detail:id}));};
}
$('#dialog-close').onclick=()=>$('#gesture-dialog').close();$('#gesture-dialog').onclick=e=>{if(e.target===$('#gesture-dialog'))$('#gesture-dialog').close();};
if(isStudio){
const gate=new GestureGate(),swipe=new SwipeDetector(),sequence=new SequenceGate(),gameGate=new GameInputGate();
$('#recognition-mode').add(new Option(t('Игра · быстрый ввод','Game · fast input'),'game'));
const changeProfile=()=>{setArmed(false);if(profile==='geometry-dash')$('#recognition-mode').value='game';resetGates();};window.addEventListener('flowtouch:profile',changeProfile);
let captureTimer=0,lastKeyPulse=0,heldKeys=null,nativeQueue=Promise.resolve(),frameSentAt=0,controlEpoch=0;
let stream=null,worker=null,ready=false,busy=false,frameId=0,lastFrame=0,epoch=0,simulation=null,threshold=.6,bridge=null,armed=false,playing=false,volume=50,selected=null,pointer={x:.5,y:.5},lastPointer=0;
function resetGates(){gate.reset();sequence.reset();swipe.samples=[];gameGate.reset();releaseGameKeys();}
function releaseGameKeys(){if(heldKeys&&bridge)sendNative('keyup',{keys:heldKeys});heldKeys=null;}

function setArmed(value){controlEpoch++;armed=value;$('#armed').checked=value;resetGates();$('#arm-hint').textContent=value?'Управление активно · Esc для паузы':'Команды на паузе';$('#control-toggle').textContent=value?'Остановить управление':bridge?'Начать управление Windows':'Включить демокоманды';$('#control-toggle').classList.toggle('running',value);$('#studio-dot').classList.toggle('on',value);if(!value)$('#virtual-cursor').hidden=true;if(bridge)sendNative(value?'arm':'disarm',{});}
$('#control-toggle').onclick=()=>{training=null;setArmed(!armed);notify(armed?(bridge?'Управление Windows включено. Сожми кулак на 0,8 секунды.':'Демокоманды включены. Для запуска программ нужен FlowTouch.exe.'):'Команды остановлены. Распознавание продолжает работать.');};
$('#armed').onchange=e=>{training=null;setArmed(e.target.checked);};
$('#recognition-mode').onchange=()=>{setArmed(false);resetGates();notify('Режим: '+$('#recognition-mode').selectedOptions[0].textContent+'. Escape всегда ставит управление на паузу.');};
$('#fist-target').previousElementSibling.remove();$('#fist-target').remove();
$('#settings-toggle').onclick=()=>{const hidden=!$('#settings-panel').hidden;$('#settings-panel').hidden=hidden;$('#settings-toggle').setAttribute('aria-expanded',String(!hidden));};
const modelCheck=document.createElement('button');modelCheck.className='text-button';modelCheck.textContent='Проверить модель без камеры';$('#settings-panel').append(modelCheck);
modelCheck.textContent='Проверить распознавание на примере';
modelCheck.onclick=()=>{
 modelCheck.disabled=true;modelCheck.textContent='Проверяем реальный жест…';
 const probe=new Worker(appUrl('vision-worker.bundle.js'));
 const finish=message=>{clearTimeout(timer);probe.terminate();modelCheck.disabled=false;modelCheck.textContent='Проверить распознавание на примере';notify(message);};
 const timer=setTimeout(()=>finish('Проверка заняла слишком долго. Повтори после перезапуска программы.'),30000);
 probe.onerror=()=>finish('Ошибка запуска локальной модели. Попробуй Chrome или Edge.');
 probe.onmessage=async({data})=>{
  if(data.type==='ready'){try{const response=await fetch(appUrl('diagnostics/fist.jpg'));if(!response.ok)throw Error('HTTP '+response.status);const bitmap=await createImageBitmap(await response.blob());probe.postMessage({type:'frame',bitmap,time:performance.now()},[bitmap]);}catch(error){finish('Не удалось открыть контрольное фото: '+error.message);}}
  if(data.type==='result'){const found=classify(data.result,.6);finish(found.id==='Closed_Fist'?'Проверка пройдена: на контрольном фото распознан КУЛАК ('+Math.round(found.score*100)+'%). Это тест модели, камера не использовалась.':'Модель не распознала кулак на контрольном фото. Результат: '+(found.id||'нет жеста')+'.');}
  if(data.type==='error')finish('Ошибка модели: '+data.message);
 };
 probe.postMessage({type:'init',base:new URL(appBase,location.origin).href});
};
$('#sensitivity').oninput=e=>{threshold=Number(e.target.value)/100;$('#threshold-label').textContent=e.target.value+'%';resetGates();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){setArmed(false);training=null;notify('Управление остановлено. Включи переключатель, когда будешь готов.');}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!bridge){setArmed(false);}});
function stopCamera(){epoch++;cancelAnimationFrame(frameId);clearTimeout(captureTimer);stream?.getTracks().forEach(t=>t.stop());stream=null;worker?.terminate();worker=null;ready=false;busy=false;clearInterval(simulation);simulation=null;setArmed(false);$('#armed').disabled=true;$('#control-toggle').disabled=true;$('#hold-percent').textContent='0%';$('#stop-camera').hidden=true;$('#camera-placeholder').hidden=false;$('#simulation-label').hidden=true;$('#camera').srcObject=null;$('#camera').style.opacity='0';$('#landmarks').getContext('2d').clearRect(0,0,$('#landmarks').width,$('#landmarks').height);$('#camera-meta').textContent='CAMERA OFF / LOCAL PROCESSING';$('#tracking-status').textContent='Камера выключена';$('#current-name').textContent='Покажи руку';$('#confidence').textContent='—';$('#fps').textContent='— FPS';$('#hold-progress').style.width='0';$('#hold-label').textContent='Удерживай жест 0,8 секунды';$('#current-emoji').textContent='✋';resultTime=0;$('#start-camera').disabled=false;$('#start-camera').innerHTML=icon('camera')+' Подключить камеру';createIcons({icons});}
$('#stop-camera').onclick=()=>{stopCamera();notify('Камера отключена, доступ к видеопотоку закрыт.');};
async function startCamera(){
 stopCamera();const myEpoch=epoch;$('#start-camera').disabled=true;$('#start-camera').textContent='Подключаем камеру…';notify('Разреши доступ к камере в окне браузера.');
 try{
  const nextStream=await openCamera(navigator.mediaDevices,$('#camera-select').value);
  if(myEpoch!==epoch){nextStream.getTracks().forEach(t=>t.stop());return;}
  stream=nextStream;const activeTrack=stream.getVideoTracks()[0];activeTrack.addEventListener('ended',()=>{if(myEpoch===epoch)cameraFailure('Видеопоток остановлен системой. Проверь USB-подключение и повтори поиск камер.');});$('#camera').srcObject=stream;await $('#camera').play();
  if(myEpoch!==epoch)return;
  $('#camera').style.opacity='1';$('#camera-placeholder').hidden=true;$('#stop-camera').hidden=false;$('#tracking-status').textContent='Загружаем модель…';notify('Подготавливаю локальную модель распознавания…');
  worker=new Worker(appUrl('vision-worker.bundle.js'));
  const loadingTimer=setTimeout(()=>{if(myEpoch===epoch&&!ready)cameraFailure('Модель не загрузилась за 30 секунд. Проверь подключение и нажми «Подключить камеру» снова.');},30000);
  worker.onerror=()=>cameraFailure('Не удалось запустить распознавание. Перезагрузи страницу и попробуй Chrome или Edge.');
  worker.onmessage=({data})=>{
   if(myEpoch!==epoch)return;
   if(data.type==='ready'){clearTimeout(loadingTimer);ready=true;$('#armed').disabled=nativeExpected&&!bridge;$('#control-toggle').disabled=nativeExpected&&!bridge;$('#arm-hint').textContent='Нажми «Начать управление»';$('#camera-meta').textContent='LIVE CAMERA / ON-DEVICE VISION';notify('Камера готова. Прогресс жеста работает сразу. Для выполнения команды включи управление.');capture(myEpoch);}
   if(data.type==='error')cameraFailure('Ошибка модели: '+data.message);
   if(data.type==='result'){busy=false;processResult(data.result,data.time,data.luminance);}
  };
  worker.postMessage({type:'init',base:new URL(appBase,location.origin).href});
  refreshCameraList(false);
 }catch(error){if(myEpoch!==epoch)return;cameraFailure(describeCameraError(error));refreshCameraList(true);}
}
function cameraFailure(message){stopCamera();notify(message);}
async function capture(myEpoch){
 if(myEpoch!==epoch||!ready)return;
 const time=performance.now();
 if(busy&&time-frameSentAt>5000){cameraFailure('Распознавание перестало отвечать. Камера и команды остановлены. Подключи камеру снова.');return;}
 if(!busy&&time-lastFrame>($('#recognition-mode').value==='game'?40:65)&&$('#camera').readyState>=2){
  busy=true;lastFrame=time;frameSentAt=time;
  try{const bitmap=await createImageBitmap($('#camera'));if(myEpoch!==epoch){bitmap.close();return;}worker.postMessage({type:'frame',bitmap,time},[bitmap]);}catch(e){cameraFailure('Не удалось прочитать видеокадр. Попробуй другую камеру.');return;}
 }
 captureTimer=setTimeout(()=>capture(myEpoch),$('#recognition-mode').value==='game'?20:45);
}
const deviceBar=document.createElement('div');deviceBar.className='device-bar';
const deviceLabel=document.querySelector('label[for="camera-select"]');deviceLabel.textContent='Источник видео';deviceBar.append(deviceLabel,$('#camera-select'));
deviceBar.insertAdjacentHTML('beforeend','<span id="camera-count">Проверяем устройства…</span><button id="refresh-device-list" class="text-button">Обновить ↻</button>');$('.studio-shell').before(deviceBar);
async function refreshCameraList(showDiagnostics=false){
 let devices=[],permission='Не запрашивалось',policy=true;
 try{devices=(await navigator.mediaDevices?.enumerateDevices()??[]).filter(d=>d.kind==='videoinput'&&d.deviceId);}catch{}
 try{permission=({granted:'Разрешён',denied:'Запрещён',prompt:'Ожидает разрешения'})[(await navigator.permissions.query({name:'camera'})).state]??'Неизвестно';}catch{permission='Браузер не сообщает';}
 try{policy=(document.permissionsPolicy??document.featurePolicy)?.allowsFeature('camera')??true;}catch{}
 const select=$('#camera-select'),previous=select.value,active=stream?.getVideoTracks()[0]?.getSettings().deviceId;
 select.replaceChildren(new Option('Автоматически',''));
 devices.forEach((d,i)=>select.add(new Option(d.label||'Камера '+(i+1),d.deviceId)));
 if(devices.some(d=>d.deviceId===(active||previous)))select.value=active||previous;
 $('#camera-count').textContent=devices.length?'Видеоустройств: '+devices.length:!showDiagnostics&&permission==='Ожидает разрешения'?'Проверка после разрешения':'Браузер видит 0 камер';
 if(showDiagnostics){
  $('#camera-diagnostic-panel').hidden=false;
  $('#diagnostic-results').innerHTML='<div><span>Видеоустройства браузера</span><strong>'+devices.length+'</strong></div><div><span>Разрешение сайта</span><strong>'+permission+'</strong></div><div><span>Защищённое соединение</span><strong>'+(isSecureContext?'Да':'Нет')+'</strong></div><div><span>Доступ в этом окне</span><strong>'+(policy?'Разрешён политикой':'Ограничен')+'</strong></div>';
  $('#diagnostic-advice').textContent=devices.length?'Камера видна браузеру. Выбери нужный источник и нажми «Подключить камеру». Если видеопоток не открывается, закрой другие приложения с камерой.':'Браузер не видит источников видео. Проверь изображение в приложении Windows «Камера», переподключи USB в другой порт без хаба. Если там камера работает — открой эту студию в системном Chrome или Edge. Подключённый кабель сам по себе не подтверждает, что драйвер распознал камеру.';
 }
 return devices;
}
$('#camera-diagnostics').onclick=()=>refreshCameraList(true);$('#refresh-cameras').onclick=()=>refreshCameraList(true);$('#refresh-device-list').onclick=()=>refreshCameraList(true);
navigator.mediaDevices?.addEventListener?.('devicechange',()=>refreshCameraList(!$('#camera-diagnostic-panel').hidden));refreshCameraList(false);
$('#start-camera').onclick=startCamera;$('#camera-select').onchange=()=>{if(stream)startCamera();};
const connections=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
function drawHand(hand){const c=$('#landmarks'),ctx=c.getContext('2d');c.width=640;c.height=480;ctx.clearRect(0,0,640,480);if(!hand||!$('#show-skeleton').checked)return;ctx.strokeStyle='#7da6ff';ctx.lineWidth=2;for(const[a,b]of connections){ctx.beginPath();ctx.moveTo((1-hand[a].x)*640,hand[a].y*480);ctx.lineTo((1-hand[b].x)*640,hand[b].y*480);ctx.stroke();}for(const p of hand){ctx.beginPath();ctx.fillStyle='#e4efff';ctx.arc((1-p.x)*640,p.y*480,3,0,Math.PI*2);ctx.fill();}}
let resultTime=0;
function processResult(result,time,luminance){
 const {id,score,hand}=classify(result,threshold);window.dispatchEvent(new CustomEvent('flowtouch:movement',{detail:{id,score,time,profile}}));drawHand(hand);$('#fps').textContent=resultTime?Math.round(1000/(time-resultTime))+' FPS':'— FPS';resultTime=time;$('#confidence').textContent=hand?Math.round(score*100)+'%':'—';$('#tracking-status').textContent=hand?'Рука в кадре':'Покажи руку целиком';
 handleGesture(id,score,hand,time);
 if(!hand&&luminance<18){$('#tracking-status').textContent='Кадр слишком тёмный';$('#hold-label').textContent='Открой шторку камеры или включи свет';notify('Камера передаёт почти чёрное изображение. Проверь шторку объектива и освещение: кисть должна быть видна целиком.');}
}
function handleGesture(id,score,hand,time){
 const mode=$('#recognition-mode').value;let current=id;
 if(mode==='game'){
  $('#current-emoji').textContent=poseEmoji(id);$('#current-name').textContent=poseLabel(id??'')||t('Покажи руку','Show your hand');
  const edge=gameGate.update(id,time);$('#hold-progress').style.width=gameGate.current?'100%':'0';$('#hold-percent').textContent=gameGate.current?'100%':'0%';$('#hold-label').textContent=t('Быстрый ввод · Escape — пауза','Fast input · Escape pauses control');
  if(edge){releaseGameKeys();if(edge.press&&armed&&!training){if(edge.press==='Open_Palm'){setArmed(false);return;}const g=byId(edge.press),b=g&&bindings.get(g,profile);if(b?.mode==='shortcut'&&b.behavior==='hold'&&bridge){heldKeys=b.keys;sendNative('keydown',{keys:b.keys});$('#last-action').textContent=b.keys.join(' + ')+t(' · удержание',' · held');}else if(g)execute(g.id);}}
  if(heldKeys&&bridge&&armed&&hand&&time-lastKeyPulse>240){lastKeyPulse=time;sendNative('keydown',{keys:heldKeys});}
  if(armed&&!bridge)notify(t('Для системного ввода запусти FlowTouch.exe. Браузер показывает распознанные движения.','Run FlowTouch.exe for system input. The browser shows recognized movements.'));return;
 }
 if(mode==='swipe')current=swipe.update(id==='Open_Palm'||id==='Four'?hand:null,time);
 $('#current-emoji').textContent=poseEmoji(current);$('#current-name').textContent=byId(current)?.name??(hand?'Ищем знакомый жест…':'Покажи руку');
 if(mode==='swipe'){
  $('#hold-progress').style.width=current?'100%':'0';$('#hold-percent').textContent=current?'100%':'0%';$('#hold-label').textContent='Проведи открытой ладонью через кадр';
  if(current&&(armed||training))dispatchGesture(current,time);return;
 }
 const state=gate.update(current,time,true);$('#hold-progress').style.width=state.progress*100+'%';$('#hold-percent').textContent=Math.round(state.progress*100)+'%';
 $('#hold-label').textContent=mode==='combo'&&sequence.pending?'Теперь: второй жест · 2,2 секунды':state.progress===1?'Жест подтверждён · отпусти руку для повтора':armed?'Удерживай жест 0,8 секунды':'Проверка жеста · команды выключены';
 if(mode==='pose'&&bindings.get(byId(current)??{},profile).mode==='pointer'&&hand&&armed&&!training){pointer={x:pointer.x*.65+(1-hand[8].x)*.35,y:pointer.y*.65+hand[8].y*.35};$('#virtual-cursor').hidden=false;$('#virtual-cursor').style.left=pointer.x*100+'%';$('#virtual-cursor').style.top=pointer.y*100+'%';if(bridge&&time-lastPointer>80){lastPointer=time;sendNative('pointer',pointer);}}
 if(state.fire){if(armed||training)dispatchGesture(gate.candidate,time);else notify('Жест подтверждён на 100%. Нажми «Начать управление», чтобы выполнять команды.');}
}
function dispatchGesture(id,time){
 if($('#recognition-mode').value==='combo'&&id!=='Open_Palm'){
  const result=sequence.update(id,time);if(result.waiting){notify('Первый жест: '+poseLabel(id)+'. Покажи второй.');return;}if(result.invalid){notify('Такой связки нет в алфавите. Попробуй ещё раз.');return;}id=result.command;
 }
 if(training){const success=id===training;notify(success?'Отлично! Жест «'+byId(training).action+'» распознан. Команда не выполнена.':'Распознано: '+(byId(id)?.name??id)+'. Цель: '+byId(training).action);if(success)toast('Жест освоен ✓');return;}
 if(armed)execute(id);
}
function setPlaying(value){playing=value;$('#waveform').classList.toggle('playing',value);$('#player-state').textContent=value?'В потоке':'На паузе';$('#demo-play').innerHTML=icon(value?'pause':'play');createIcons({icons});}
function setVolume(value){volume=Math.max(0,Math.min(100,value));$('#demo-volume').value=volume;$('#volume-value').textContent=volume+'%';}
$('#demo-play').onclick=()=>setPlaying(!playing);$('#demo-volume').oninput=e=>setVolume(Number(e.target.value));
async function execute(id){
 const g=byId(id);if(!g)return;
 if(g.mode==='pause'){setArmed(false);notify('Ладонь: управление остановлено. Для продолжения включи переключатель.');return;}
 const binding=bindings.get(g,profile);if(binding.mode==='none')return;
 if(bridge){const mode=binding.mode;const label=bindingLabel(g);const ok=await sendNative(mode,['click','pointer'].includes(binding.mode)?pointer:{keys:binding.keys,url:binding.url,path:binding.path});if(ok){$('#last-action').textContent='Выполнено: '+label;toast(label);sound.play('success');}return;}
 $('#last-action').textContent='Демо: '+g.action;
 const urls={youtube:'https://www.youtube.com/',spotify:'https://open.spotify.com/',google:'https://www.google.com/',github:'https://github.com/',wiki:'https://www.wikipedia.org/'};
 if(urls[g.mode]){notify('Команда готова. Браузер требует клик, чтобы открыть внешнюю вкладку.');const a=document.createElement('a');a.href=urls[g.mode];a.target='_blank';a.rel='noopener noreferrer';a.className='action-link';a.textContent='Открыть '+g.action.replace('Открыть ','')+' ↗';$('#status-message').append(' ',a);}
 else if(g.mode==='media')setPlaying(!playing);
 else if(g.mode==='stopmedia')setPlaying(false);
 else if(g.mode==='volumeup')setVolume(volume+10);
 else if(g.mode==='volumedown')setVolume(volume-10);
 else if(g.mode==='mute')setVolume(volume?0:50);
 else if(g.mode==='click'){setPlaying(!playing);notify('Щепотка нажала кнопку плеера в песочнице.');}
 else if(g.mode==='scrollup'||g.mode==='scrolldown'){$('#practice-title').textContent=g.mode==='scrollup'?'↑ Прокрутка вверх':'↓ Прокрутка вниз';notify('Свайп распознан. В локальном режиме он прокрутит активное окно.');}
 else if(g.mode==='pointer')notify('Перемещай указательный палец: курсор движется в окне камеры.');
 else notify('Распознано: '+g.action+'. Для системного действия запусти помощник Windows.');
}
function sendNative(action,payload){
 const generation=controlEpoch,queuedAt=performance.now();
 const task=async()=>{
  if(!bridge)return false;
  if(!['keyup','disarm'].includes(action)&&(generation!==controlEpoch||performance.now()-queuedAt>600))return false;
  try{
   const r=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json','X-FlowTouch-Token':bridge.token},body:JSON.stringify({action,...payload}),signal:AbortSignal.timeout(2500)});
   if(!r.ok){const response=await r.json().catch(()=>({}));throw new Error(response.error||'HTTP '+r.status);}
   return true;
  }catch(error){
   armed=false;$('#armed').checked=false;$('#control-toggle').textContent='Начать управление Windows';$('#studio-dot').classList.remove('on');resetGates();
   notify('Управление остановлено: '+error.message+'. Проверь активное окно и включи команды снова.');sound.play('error');return false;
  }
 };const result=nativeQueue.then(task);nativeQueue=result.catch(()=>{});return result;
}
setInterval(()=>{if(bridge&&armed)sendNative('heartbeat',{});},1000);
const nativeExpected=expectsDesktop(location);
async function refreshDesktop(){
 if(!nativeExpected)return;
 $('#runtime-label').textContent='Подключение FlowTouch Desktop…';
 try{
  bridge=await connectDesktop(fetch.bind(window));
  $('#runtime-label').textContent='Windows · '+bridge.version+(bridge.dryRun?' · тест':' · 126 шаблонов');
  $('#bridge-status').textContent='✓ FlowTouch Desktop подключён';
  $('#execution-mode-title').textContent='FlowTouch Desktop '+bridge.version;
  $('#execution-mode-detail').textContent=bridge.dryRun?'Тестовый запуск: системные действия отключены.':'Подключи камеру, затем нажми «Начать управление Windows». Кулак — YouTube; 126 шаблонов в алфавите.';
  $('#desktop-download').hidden=true;$('#execution-mode-banner').classList.add('connected');
  $('#control-toggle').textContent='Начать управление Windows';
  $('#control-toggle').disabled=!ready;
  $('#start-simulation').remove();$('.practice-panel').hidden=true;$('.browser-limits').textContent='Команды отправляются в активное окно Windows. Выбери профиль, проверь жесты и переключись в нужное приложение. Escape — глобальная пауза. Игры с защитой и приложения с повышенными правами могут ограничивать ввод.';
 }catch(error){
  bridge=null;setArmed(false);$('#armed').disabled=true;$('#control-toggle').disabled=true;
  $('#runtime-label').textContent='Windows-помощник не подключён';
  $('#execution-mode-title').textContent='Нет подключения к FlowTouch.exe';
  $('#execution-mode-detail').textContent=error.message+'. Закрой старое окно программы и запусти FlowTouch.exe 2.1.0 заново.';
  notify('Подключение не удалось. Повторная попытка через 3 секунды.');
  setTimeout(refreshDesktop,3000);
 }
}
refreshDesktop();if(profile==='geometry-dash')$('#recognition-mode').value='game';
import('./ollama-ui.js').then(m=>m.mountAgent({getBridge:()=>bridge,getProfile:()=>profile,notify,t}));
function startSimulation(){
 stopCamera();$('#camera-placeholder').hidden=true;$('#simulation-label').hidden=false;$('#stop-camera').hidden=false;$('#camera-meta').textContent='SIMULATION / NO CAMERA';$('#tracking-status').textContent='Иллюстрация распознавания';$('#arm-hint').textContent='Демонстрация — команды отключены';notify('Это симуляция интерфейса. Камера выключена, команды не выполняются.');
 let i=0;const samples=['Closed_Fist','Victory','Thumb_Up','Pinch'];
 simulation=setInterval(()=>{const id=training??samples[i++%samples.length],g=byId(id);$('#current-emoji').textContent=g.emoji;$('#current-name').textContent=g.sequence?g.sequence.map(poseLabel).join(' → '):g.name;$('#confidence').textContent='ДЕМО';$('#hold-percent').textContent='ДЕМО';$('#hold-progress').style.width='100%';$('#hold-label').textContent='Иллюстрация · не распознавание';$('#last-action').textContent=g.action+' · пример';$('#fps').textContent='ДЕМО';setPlaying(i%2===0);},1600);
}
if($('#start-simulation'))$('#start-simulation').onclick=startSimulation;
window.addEventListener('pagehide',()=>{stopCamera();sound.disable();});
function startTraining(id){const g=byId(id);if(!g)return;training=id;setArmed(false);$('#practice-title').textContent='Тренировка: '+g.action;$('#practice-instruction').textContent=g.desc+' Команды во время тренировки не исполняются.';$('#recognition-mode').value=g.sequence?'combo':g.id.startsWith('Swipe')?'swipe':'pose';resetGates();$('#studio').scrollIntoView({behavior:'smooth'});notify('Тренировка включена. Подключи камеру или выбери демо.');}
window.addEventListener('flowtouch:train',event=>startTraining(event.detail));
const routeParams=new URLSearchParams(location.search);if(byId(routeParams.get('gesture')))startTraining(routeParams.get('gesture'));if(routeParams.get('demo')==='1'&&!nativeExpected)startSimulation();
}

if(!isStudio&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 animate('.hero-copy > *',{opacity:[0,1],y:[22,0]},{duration:.8,delay:stagger(.1),ease:[.22,1,.36,1]});
 animate('.hero-art',{opacity:[0,1],scale:[.96,1]},{duration:1.3,ease:[.22,1,.36,1]});
 inView('.section-heading, .step, .local-section, .practice-panel',element=>{animate(element,{opacity:[0,1],y:[24,0]},{duration:.7,ease:[.22,1,.36,1]});});
 // scroll(animate('.hero-wordmark',{x:[0,-180],opacity:[.07,.02]},{ease:'linear'}),{target:$('#experience'),offset:['start start','end end']});
 scroll(animate('.hero-copy',{y:[0,-45],opacity:[1,.75]},{ease:'linear'}),{target:$('#experience'),offset:['start start','end end']});
 scroll(animate('.signal-strip .wrap',{x:[90,-90]},{ease:'linear'}),{target:$('.signal-strip'),offset:['start end','end start']});
 document.querySelectorAll('.magnetic').forEach(button=>{button.addEventListener('pointermove',event=>{const r=button.getBoundingClientRect();animate(button,{x:(event.clientX-r.left-r.width/2)*.15,y:(event.clientY-r.top-r.height/2)*.2},{duration:.2});});button.addEventListener('pointerleave',()=>animate(button,{x:0,y:0},{type:'spring',stiffness:180,damping:13}));});
}

if(english)import('./studio-language.js').then(m=>m.translateStudio());
