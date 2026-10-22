import * as THREE from 'three';

// A real perspective room: seams are geometry, fog is depth-aware, and the
// pointer gently displaces the camera. No video download or background audio.
export function mountRoom(canvas){
 const host=canvas.parentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#dce4d5');scene.fog=new THREE.FogExp2('#e3e9dd',.042);
 const camera=new THREE.PerspectiveCamera(48,1,.1,80);camera.position.set(.4,1.4,12.5);
 scene.add(new THREE.HemisphereLight('#ffffff','#8a9a7c',3));
 const key=new THREE.DirectionalLight('#fff9ed',4);key.position.set(-4,10,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-16,right:16,top:15,bottom:-15,near:.5,far:45});key.shadow.bias=-.001;key.shadow.normalBias=.04;key.shadow.radius=4;scene.add(key);
 const fill=new THREE.PointLight('#e9f4dc',90,30,2);fill.position.set(7,3,0);scene.add(fill);
 const material=new THREE.MeshStandardMaterial({color:'#cbd6c2',roughness:.72,metalness:.06});
 const floorMat=new THREE.MeshStandardMaterial({color:'#d0dac7',roughness:.37,metalness:.14});
 const back=new THREE.Mesh(new THREE.PlaneGeometry(28,18),material);back.position.set(0,3,-12);scene.add(back);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(28,40),floorMat);floor.rotation.x=-Math.PI/2;floor.position.set(0,-4,-6);scene.add(floor);
 floor.receiveShadow=true;back.receiveShadow=true;
 const roof=new THREE.Mesh(new THREE.PlaneGeometry(28,40),material);roof.rotation.x=Math.PI/2;roof.position.set(0,11,-6);scene.add(roof);
 for(const side of [-1,1]){const wall=new THREE.Mesh(new THREE.PlaneGeometry(40,18),material);wall.rotation.y=-side*Math.PI/2;wall.position.set(side*14,3,-6);scene.add(wall);}
 const lines=[];
 const line=(a,b)=>lines.push(...a,...b);
 for(let x=-14;x<=14;x+=2){line([x,-4,-12],[x,12,-12]);line([x,-3.985,-12],[x,-3.985,15]);line([x,10.99,-12],[x,10.99,15]);}
 for(let y=-4;y<=12;y+=2){line([-14,y,-11.98],[14,y,-11.98]);for(const s of [-1,1])line([s*13.99,y,-12],[s*13.99,y,15]);}
 for(let z=-12;z<=16;z+=2){line([-14,-3.985,z],[14,-3.985,z]);line([-14,10.99,z],[14,10.99,z]);for(const s of [-1,1])line([s*13.99,-4,z],[s*13.99,12,z]);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));scene.add(new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:'#728963',transparent:true,opacity:.22})));
 // Sparse solid volumes give the perspective space contact and depth.
 const cubes=new THREE.Group();scene.add(cubes);
 [[8,-2.5,-6,3],[11,-2,-10,4],[5,-3.4,-8,1.2],[-10,-3,-7,2]].forEach(([x,y,z,size])=>{const cube=new THREE.Mesh(new THREE.BoxGeometry(size,size,size),new THREE.MeshStandardMaterial({color:'#d1dcca',roughness:.27,metalness:.12}));cube.castShadow=true;cube.receiveShadow=true;cube.position.set(x,y,z);cubes.add(cube);const edges=new THREE.LineSegments(new THREE.EdgesGeometry(cube.geometry),new THREE.LineBasicMaterial({color:'#879e76',transparent:true,opacity:.18}));cube.add(edges);});
 const hazeMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uPointer:{value:new THREE.Vector2()},uOpacity:{value:.3}},vertexShader:'varying vec2 vUv;uniform float uTime;uniform vec2 uPointer;void main(){vUv=uv;vec3 p=position;float d=distance(uv,uPointer*.25+.5);p.z+=sin(d*18.-uTime)*exp(-d*5.)*.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:'varying vec2 vUv;uniform float uTime;uniform float uOpacity;void main(){vec2 p=vUv;float n=sin(p.x*8.+sin(p.y*5.+uTime*.13))*sin(p.y*7.-uTime*.08);float a=smoothstep(-.7,.9,n)*smoothstep(0.,.3,p.y)*(1.-smoothstep(.65,1.,p.y))*uOpacity;gl_FragColor=vec4(.94,.96,.90,a);}'});
 const haze=new THREE.Mesh(new THREE.PlaneGeometry(35,20,50,30),hazeMat);haze.position.set(0,0,0);scene.add(haze);
 const rainPositions=new Float32Array(200*6),rainRandom=[];for(let i=0;i<200;i++)rainRandom.push([Math.random()*26-13,Math.random()*22-7,Math.random()*20-10,.12+Math.random()*.14]);
 const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.38}));rain.visible=false;scene.add(rain);
 const target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true});
 const lensScene=new THREE.Scene(),lensCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const lensMaterial=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{uTexture:{value:target.texture},uMouse:{value:new THREE.Vector2(.5,.5)},uResolution:{value:new THREE.Vector2(1,1)},uStrength:{value:reduced?0:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D uTexture;uniform vec2 uMouse;uniform vec2 uResolution;uniform float uStrength;varying vec2 vUv;void main(){vec2 p=vUv-uMouse;vec2 a=p*vec2(uResolution.x/uResolution.y,1.);float w=exp(-dot(a,a)*38.)*uStrength;vec2 uv=vUv+p*w*.065;vec2 d=vec2(1.8)/uResolution*w;vec4 c=texture2D(uTexture,uv)*.4;c+=texture2D(uTexture,uv+d)*.15;c+=texture2D(uTexture,uv-d)*.15;c+=texture2D(uTexture,uv+vec2(d.x,-d.y))*.15;c+=texture2D(uTexture,uv+vec2(-d.x,d.y))*.15;gl_FragColor=c;#include <colorspace_fragment>\n}'});
 // Keep the shader include on its own preprocessor line.
 lensMaterial.fragmentShader=lensMaterial.fragmentShader.replace(';#include',';\n#include');
 lensScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),lensMaterial));
 let pointer={x:0,y:0},current={x:0,y:0},motion=!reduced,visible=true,last=0,time=0,raf=0;
 const resize=()=>{const r=host.getBoundingClientRect();renderer.setSize(r.width,r.height,false);const size=renderer.getDrawingBufferSize(new THREE.Vector2());target.setSize(size.x,size.y);lensMaterial.uniforms.uResolution.value.copy(size);camera.aspect=r.width/r.height;camera.fov=r.width<720?59:48;camera.updateProjectionMatrix();render(0);};
 const move=e=>{const r=host.getBoundingClientRect();pointer={x:(e.clientX-r.left)/r.width*2-1,y:1-(e.clientY-r.top)/r.height*2};};
 host.addEventListener('pointermove',move,{passive:true});host.addEventListener('pointerleave',()=>{pointer={x:0,y:0};});
 function render(delta){
  if(motion){time+=delta;current.x+=(pointer.x-current.x)*.045;current.y+=(pointer.y-current.y)*.045;}
  else{current.x*=.9;current.y*=.9;}
  camera.position.set(.4+current.x*.6,1.4+current.y*.35,12.5);camera.lookAt(.4+current.x*.15,.5,-6);hazeMat.uniforms.uTime.value=time;hazeMat.uniforms.uPointer.value.set(current.x,current.y);
  if(rain.visible){for(let i=0;i<200;i++){const[x,y,z,len]=rainRandom[i];const fall=((y+7-time*5)%22+22)%22-7;rainPositions.set([x,fall,z,x-.015,fall+len,z],i*6);}rainGeo.attributes.position.needsUpdate=true;}
  lensMaterial.uniforms.uMouse.value.set(current.x*.5+.5,current.y*.5+.5);lensMaterial.uniforms.uStrength.value=motion?1:0;
  renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(lensScene,lensCamera);
 }
 function tick(stamp){raf=requestAnimationFrame(tick);if(!visible||document.hidden||stamp-last<32)return;const delta=Math.min(.1,(stamp-last)/1000||0);last=stamp;render(delta);}
 const watch=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;});watch.observe(host);
 const resizer=new ResizeObserver(resize);resizer.observe(host);resize();raf=requestAnimationFrame(tick);
 const fogButton=document.querySelector('#fog-toggle');fogButton.onclick=()=>{const on=fogButton.getAttribute('aria-pressed')!=='true';fogButton.setAttribute('aria-pressed',String(on));haze.visible=on;scene.fog.density=on?.042:.012;render(0);};
 const rainButton=document.querySelector('#rain-toggle');rainButton.onclick=()=>{rain.visible=!rain.visible;rainButton.setAttribute('aria-pressed',String(rain.visible));render(0);};
 const motionButton=document.querySelector('#motion-toggle');motionButton.onclick=()=>{motion=!motion;motionButton.setAttribute('aria-pressed',String(motion));render(0);};
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);watch.disconnect();resizer.disconnect();target.dispose();lensMaterial.dispose();renderer.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of [o.material].flat())m.dispose();});},{once:true});
}
