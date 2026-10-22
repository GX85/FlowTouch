const shapes={Closed_Fist:[0,0,0,0,0],Victory:[0,1,1,0,0],Pointing_Up:[0,1,0,0,0],Pinch:[1,.55,1,1,1],Thumb_Up:[1,0,0,0,0],Thumb_Down:[1,0,0,0,0],Open_Palm:[1,1,1,1,1],ILoveYou:[1,1,0,0,1],Three:[0,1,1,1,0],Four:[0,1,1,1,1],Rock:[0,1,0,0,1],Call:[1,0,0,0,1]};
export function poseIllustration(id){
 const swipe=id.startsWith('Swipe'),pose=shapes[swipe?'Open_Palm':id]??shapes.Open_Palm,down=id==='Thumb_Down';
 const point=(x,y)=>[+x.toFixed(2),+y.toFixed(2)];
 const joint=([x,y],r=3)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#56634e"/><circle cx="${x}" cy="${y}" r="${r*.4}" fill="#c3cdbb"/>`;
 const bone=(a,b,w=9)=>`<path d="M${a} L${b}" stroke="#53604c" stroke-width="${w+2}"/><path d="M${a} L${b}" stroke="#edf2e7" stroke-width="${w-1}"/><path d="M${a[0]+1.5},${a[1]} L${b[0]+1.5},${b[1]}" stroke="#c9d3bf" stroke-width="1.1"/>`;
 const fingers=[52,68,84,100].map((x,i)=>{
  let points;
  if(id==='Pinch'&&i===0)points=[[x,81],[50,57],[42,49],[34,59]];
  else if(pose[i+1]){const angle=(-90+[-9,-2,4,11][i])*Math.PI/180,lengths=[[21,16,12],[28,17,12],[25,16,11],[19,13,10]][i];points=[[x,81]];for(const length of lengths){const a=points.at(-1);points.push(point(a[0]+Math.cos(angle)*length,a[1]+Math.sin(angle)*length));}}
  else points=[[x,81],[x-1,65],[x+1,76],[x+1,88]];
  return `<g stroke-linecap="round" stroke-linejoin="round">${points.slice(1).map((p,j)=>bone(points[j],p,j===2?7:9)).join('')}${points.slice(0,3).map(p=>joint(p,3.2)).join('')}<circle cx="${points[3][0]}" cy="${points[3][1]}" r="2.8" fill="#7b8971"/></g>`;
 }).join('');
 const thumb=id==='Pinch'?[[45,111],[27,94],[25,76],[34,59]]:id==='Thumb_Up'||down?[[46,110],[30,85],[29,61],[30,44]]:pose[0]?[[45,111],[29,96],[18,81],[12,73]]:[[45,111],[43,99],[55,93],[65,94]];
 const arrow=swipe?({'Swipe_Up':'M122 63 V28 m-7 8 7-8 7 8','Swipe_Down':'M122 28 V63 m-7-8 7 8 7-8','Swipe_Left':'M132 36 H110 m8-7-8 7 8 7','Swipe_Right':'M110 36 H132 m-8-7 8 7-8 7'}[id]):'';
 return `<svg class="pose-illustration" viewBox="0 0 144 170" aria-hidden="true"><g ${down?'transform="translate(140 170) rotate(180)"':''}><path d="M57 136 H91 L95 153 H54Z" fill="#d4deca" stroke="#637658" stroke-width="1.2"/><rect x="55" y="150" width="40" height="10" rx="4" fill="#687b5b"/>${fingers}<path d="M44 91 Q44 79 52 78 L100 78 Q109 80 109 91 L105 119 Q102 135 89 140 H60 Q46 135 43 120Z" fill="#edf2e7" stroke="#637658" stroke-width="1.6"/><path d="M48 88 Q73 87 101 101 M51 99 Q75 98 101 112 M53 112 62 131 H88 Q99 126 100 116" fill="none" stroke="#a0b394" stroke-width="1.1"/><path d="M46 90 49 116 Q51 127 60 131" fill="none" stroke="#768b69" stroke-width="4"/>${[[51,86],[100,88],[60,133],[93,130]].map(p=>joint(p,1.9)).join('')}<g stroke-linecap="round" stroke-linejoin="round">${thumb.slice(1).map((p,i)=>bone(thumb[i],p,i===0?12:9)).join('')}${thumb.slice(0,3).map(p=>joint(p,3.3)).join('')}</g></g>${arrow?`<path d="${arrow}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`:''}</svg>`;
}
