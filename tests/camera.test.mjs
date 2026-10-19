import test from 'node:test';
import assert from 'node:assert/strict';
import {openCamera,describeCameraError} from '../src/camera.js';
const stream=()=>({getVideoTracks:()=>[{applyConstraints:async()=>{throw new Error('unsupported ideal format');}}],getTracks:()=>[]});
test('default capture opens video without resolution requirements or audio',async()=>{
 const calls=[],value=stream();const devices={getUserMedia:async c=>{calls.push(c);return value;}};
 assert.equal(await openCamera(devices),value);assert.deepEqual(calls,[{video:true,audio:false}]);
});
test('stale selected device falls back to the system camera',async()=>{
 const calls=[],value=stream();const devices={getUserMedia:async c=>{calls.push(c);if(c.video!==true)throw {name:'OverconstrainedError'};return value;}};
 assert.equal(await openCamera(devices,'old-id'),value);assert.equal(calls.length,2);assert.equal(calls[1].video,true);
});
test('permission denial is preserved and not retried',async()=>{
 let calls=0;const devices={getUserMedia:async()=>{calls++;throw {name:'NotAllowedError'};}};
 await assert.rejects(()=>openCamera(devices,'id'),e=>e.name==='NotAllowedError');assert.equal(calls,1);
 assert.match(describeCameraError({name:'NotFoundError'}),/Браузер не получил/);
 assert.match(describeCameraError({name:'NotReadableError'}),/обнаружена/);
});
