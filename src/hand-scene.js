import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export async function mountHandScene(container, section) {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x000000,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 renderer.domElement.setAttribute('aria-label','Анатомическая 3D-модель кисти с анимацией суставов');
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,70);camera.position.set(0,.25,11);
 const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
 scene.add(new THREE.AmbientLight(0xffffff,.7));const light=new THREE.DirectionalLight(0xffffff,2.7);light.position.set(-3,6,6);scene.add(light);
 const edge=new THREE.DirectionalLight(0xb8c9ff,2);edge.position.set(4,2,-4);scene.add(edge);
 const group=new THREE.Group();scene.add(group);
 const gltf=await new GLTFLoader().loadAsync('/models/hand-right.glb');
 const model=gltf.scene;const mesh=model.getObjectByProperty('type','SkinnedMesh');
 if(!mesh){renderer.dispose();return;}
 mesh.frustumCulled=false;
 mesh.material=new THREE.MeshStandardMaterial({color:0x8a8e99,roughness:.48,metalness:.18,envMapIntensity:.42});
 const skeleton=mesh.skeleton,bind=new Map();
 model.updateMatrixWorld(true);
 const wrist=model.getObjectByName('wrist');
 const names=['thumb','index-finger','middle-finger','ring-finger','pinky-finger'];
 const chains=names.map(name=>{
  const labels=name==='thumb'?['metacarpal','phalanx-proximal','phalanx-distal','tip']:['metacarpal','phalanx-proximal','phalanx-intermediate','phalanx-distal','tip'];
  const bones=labels.map(label=>model.getObjectByName(name+'-'+label));
  let parent=wrist;for(const bone of bones){parent.attach(bone);parent=bone;bind.set(bone,bone.quaternion.clone());}
  return bones;
 });
 const wire=new THREE.SkinnedMesh(mesh.geometry,new THREE.MeshBasicMaterial({color:0x294eff,wireframe:true,transparent:true,opacity:.11,depthWrite:false}));
 wire.bind(skeleton,mesh.bindMatrix);wire.frustumCulled=false;mesh.parent.add(wire);wire.position.copy(mesh.position);wire.quaternion.copy(mesh.quaternion);wire.scale.copy(mesh.scale);
 const oriented=new THREE.Group();oriented.add(model);
 oriented.quaternion.setFromRotationMatrix(new THREE.Matrix4().set(0,0,1,0,0,-1,0,0,1,0,0,0,0,0,0,1));
 oriented.scale.setScalar(22);oriented.updateMatrixWorld(true);
 const bbox=new THREE.Box3().setFromObject(oriented),center=bbox.getCenter(new THREE.Vector3());oriented.position.sub(center);group.add(oriented);
 const dotGeo=new THREE.SphereGeometry(.0013,8,6),dotMat=new THREE.MeshBasicMaterial({color:0x244aff});
 for(const chain of chains)for(const bone of chain.slice(1)){const dot=new THREE.Mesh(dotGeo,dotMat);dot.position.x=.006;bone.add(dot);}
 container.append(renderer.domElement);container.classList.add('has-hand3d');
 const poses=[[0,0,0,0,0],[.68,1,1,1,1],[.58,0,0,1,1]],curls=[0,0,0,0,0];
 const axis=new THREE.Vector3(1,0,0),rotation=new THREE.Quaternion();
 const pointer={x:0,y:0},smooth={x:0,y:0};let progress=0,selected=-1,selectedAt=0,visible=true,raf=0,last=0,lastPose=-1;
 const buttons=[...document.querySelectorAll('[data-hand-pose]')];
 const label=document.querySelector('#hand-pose-label'),number=document.querySelector('#hand-pose-number'),action=document.querySelector('#hand-action-label'),line=document.querySelector('#hero-scroll-progress');
 const poseNames=['ЛАДОНЬ','КУЛАК','ДВА ПАЛЬЦА'],actions=['Пауза управления','Открыть YouTube','Пауза / воспроизведение'];
 buttons.forEach((b,i)=>b.addEventListener('click',()=>{selected=i;selectedAt=performance.now();window.dispatchEvent(new CustomEvent('flowtouch:pose',{detail:i}));if(reduce){poses[i].forEach((v,k)=>curls[k]=v);last=0;raf=requestAnimationFrame(tick);}}));
 function move(e){const r=container.getBoundingClientRect();pointer.x=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));pointer.y=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));}
 function readScroll(){const r=section.getBoundingClientRect();progress=Math.max(0,Math.min(1,-r.top/Math.max(1,r.height-innerHeight)));}
 window.addEventListener('pointermove',move,{passive:true});window.addEventListener('scroll',readScroll,{passive:true});
 const resize=new ResizeObserver(()=>{const w=container.clientWidth,h=container.clientHeight;if(w&&h){renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=w<450?12.5:10.8;camera.updateProjectionMatrix();}});resize.observe(container);
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!raf)raf=requestAnimationFrame(tick);},{rootMargin:'100px'});observer.observe(section);
 function tick(time){
  raf=0;if(!visible)return;if(time-last<32){raf=requestAnimationFrame(tick);return;}last=time;
  const t=time*.001,pose=selected>=0&&time-selectedAt<9000?selected:reduce?0:progress>.035?Math.min(2,Math.floor(progress*3)):Math.floor(t/5.5)%3;
  if(pose!==lastPose){lastPose=pose;buttons.forEach((b,i)=>{b.classList.toggle('active',i===pose);b.setAttribute('aria-pressed',String(i===pose));});label.textContent=poseNames[pose];number.textContent='0'+(pose+1);action.textContent=actions[pose];}
  chains.forEach((bones,i)=>{
   curls[i]+=(poses[pose][i]-curls[i])*.09;
   for(let j=0;j<bones.length;j++){
    const bone=bones[j];bone.quaternion.copy(bind.get(bone));
    if(j>0&&j<bones.length-1){const angle=curls[i]*(i===0?.65:j===1?1.28:j===2?1.56:1.05);rotation.setFromAxisAngle(axis,angle);bone.quaternion.multiply(rotation);}
   }
  });
  smooth.x+=(pointer.x-smooth.x)*.05;smooth.y+=(pointer.y-smooth.y)*.05;
  group.rotation.set(.06+smooth.y*.09,-.22+smooth.x*.27+progress*.75,-.16+progress*.12);
  group.position.y=reduce?0:Math.sin(t*.85)*.055;
  if(line)line.style.transform=`scaleX(${progress})`;
  renderer.render(scene,camera);if(!reduce)raf=requestAnimationFrame(tick);
 }
 raf=requestAnimationFrame(tick);
 return {dispose(){cancelAnimationFrame(raf);resize.disconnect();observer.disconnect();window.removeEventListener('pointermove',move);window.removeEventListener('scroll',readScroll);environment.dispose();renderer.dispose();}};
}
