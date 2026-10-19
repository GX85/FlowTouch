import test from 'node:test';
import assert from 'node:assert/strict';
import { GESTURES, GestureGate, SequenceGate, SwipeDetector, classify } from '../src/gestures.js';
test('32 unique commands with resolvable two-step sequences',()=>{
 assert.equal(GESTURES.length,32);assert.equal(new Set(GESTURES.map(g=>g.id)).size,32);
 for(const g of GESTURES.filter(g=>g.sequence))for(const id of g.sequence)assert.ok(GESTURES.some(p=>p.id===id&&!p.sequence));
 assert.equal(GESTURES.filter(g=>g.sequence).length,16);
});
test('hold, latch and sustained release prevent accidental repeats',()=>{
 const g=new GestureGate();assert.equal(g.update('Victory',0,true).fire,false);
 assert.equal(g.update('Victory',799,true).fire,false);assert.equal(g.update('Victory',800,true).fire,true);
 assert.equal(g.update('Victory',3000,true).fire,false);
 g.update(null,3100,true);g.update(null,3200,true);assert.equal(g.update('Victory',4000,true).fire,false);
 g.update(null,4100,true);g.update(null,4400,true);g.update('Victory',4500,true);
 assert.equal(g.update('Victory',5300,true).fire,true);
});
test('disarmed and interrupted holds cannot fire',()=>{
 const g=new GestureGate();g.update('Closed_Fist',0,true);g.update('Closed_Fist',1000,false);
 assert.equal(g.update('Closed_Fist',1001,true).fire,false);g.update('Victory',1200,true);
 assert.equal(g.update('Closed_Fist',1700,true).fire,false);
});
test('sequences require valid second pose within the time window',()=>{
 const s=new SequenceGate();assert.equal(s.update('Closed_Fist',0).waiting,true);
 assert.equal(s.update('Victory',1800).command,'Closed_Fist>Victory');
 s.update('Closed_Fist',3000);assert.equal(s.update('Four',4000).invalid,true);
 s.update('Closed_Fist',5000);assert.equal(s.update('Victory',7300).waiting,true);
});
test('swipe direction follows mirrored screen coordinates and requires travel',()=>{
 const s=new SwipeDetector();const hand=x=>Array.from({length:21},()=>({x,y:.5,z:0}));
 assert.equal(s.update(hand(.8),0),null);assert.equal(s.update(hand(.7),100),null);
 assert.equal(s.update(hand(.5),200),'Swipe_Right');assert.equal(s.update(hand(.1),300),null);
});
test('no hand never reports a gesture; a folded fist is not a pinch',()=>{
 assert.equal(classify({}).id,null);
 const h=Array.from({length:21},()=>({x:.5,y:.5,z:0}));h[0]={x:.5,y:.8,z:0};h[9]={x:.5,y:.6,z:0};
 assert.equal(classify({landmarks:[h],gestures:[[{categoryName:'Closed_Fist',score:.95}]]}).id,'Closed_Fist');
});
test('short recognition dropouts preserve the hold and reach 100 percent',()=>{
 const gate=new GestureGate();let fired=false;
 for(let t=0;t<=960;t+=60){const s=gate.update(t===300||t===360?null:'Closed_Fist',t,true);fired ||= s.fire;}
 assert.equal(fired,true);
});
