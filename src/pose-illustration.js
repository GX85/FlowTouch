const shapes={Closed_Fist:[0,0,0,0,0],Victory:[0,1,1,0,0],Pointing_Up:[0,1,0,0,0],Pinch:[1,.55,1,1,1],Thumb_Up:[1,0,0,0,0],Thumb_Down:[1,0,0,0,0],Open_Palm:[1,1,1,1,1],ILoveYou:[1,1,0,0,1],Three:[0,1,1,1,0],Four:[0,1,1,1,1],Rock:[0,1,0,0,1],Call:[1,0,0,0,1]};
export function poseIllustration(id){
 const swipe=id.startsWith('Swipe'),pose=shapes[swipe?'Open_Palm':id]??shapes.Open_Palm,down=id==='Thumb_Down';
 const fingers=[43,55,67,79].map((x,i)=>{const y=pose[i+1]?[24,14,20,32][i]:55+i*2;return `<path d="M${x} 65 L${x} ${y}"/>`;}).join('');
 const thumb=id==='Thumb_Up'?'M38 65 L28 29':id==='Pinch'?'M36 72 Q22 53 39 44':pose[0]?'M37 73 L17 54':'M38 73 L42 60';
 const arrow=swipe?({'Swipe_Up':'M93 52 V18 m-7 8 7-8 7 8','Swipe_Down':'M93 18 V52 m-7-8 7 8 7-8','Swipe_Left':'M99 25 H76 m8-7-8 7 8 7','Swipe_Right':'M76 25 H99 m-8-7 8 7-8 7'}[id]):'';
 return `<svg class="pose-illustration" viewBox="0 0 112 112" aria-hidden="true"><g ${down?'transform="translate(110 112) rotate(180)"':''} fill="none" stroke="currentColor" stroke-width="8.3" stroke-linecap="round" stroke-linejoin="round">${fingers}<path d="${thumb}"/><path d="M39 62 C33 66 33 77 38 85 L44 96 H72 L80 78 V62"/><path d="M44 96 H72" stroke-width="3"/></g>${arrow?`<path d="${arrow}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`:''}</svg>`;
}
