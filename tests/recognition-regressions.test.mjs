import test from 'node:test';
import assert from 'node:assert/strict';
import {classify} from '../src/gestures.js';

// An anatomically bent index in a pinch, not a perfectly straight finger.
function pinch(){
 const h=Array.from({length:21},()=>({x:.5,y:.58,z:0}));
 h[0]={x:.5,y:.9,z:0};h[9]={x:.5,y:.6,z:0};h[17]={x:.65,y:.64,z:0};
 h[5]={x:.4,y:.6,z:0};h[6]={x:.34,y:.4,z:0};h[8]={x:.48,y:.42,z:0};h[4]={x:.49,y:.43,z:0};
 h[10]={x:.5,y:.4,z:0};h[12]={x:.5,y:.2,z:0};
 return h;
}
test('bent-index pinch is recognized and does not require a straight index',()=>{
 assert.equal(classify({landmarks:[pinch()]}).id,'Pinch');
});
test('pinch geometry is rotation-invariant and respects confidence threshold',()=>{
 const rotated=pinch().map(({x,y,z})=>({x:1-y,y:x,z}));
 assert.equal(classify({landmarks:[rotated]}).id,'Pinch');
 assert.equal(classify({landmarks:[rotated]},.95).id,null);
});
test('invalid hand scale and absent landmarks cannot synthesize a command',()=>{
 assert.equal(classify({landmarks:[Array.from({length:21},()=>({x:.5,y:.5,z:0}))],gestures:[[{categoryName:'Closed_Fist',score:.99}]]}).id,null);
});
