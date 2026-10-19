import test from 'node:test';
import assert from 'node:assert/strict';
import {SoundDesign} from '../src/sound.js';
test('sound requires opt-in and disabling prevents future oscillators',async()=>{
 let starts=0;
 const parameter=()=>({setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}});
 globalThis.AudioContext=class {constructor(){this.currentTime=1;this.state='running';this.destination={};}async resume(){}close(){this.state='closed';}createOscillator(){return {frequency:parameter(),connect(){},start(){starts++;},stop(){}};}createGain(){return {gain:parameter(),connect(){}};}};
 const sound=new SoundDesign();sound.play('success');assert.equal(starts,0);
 await sound.enable();assert.equal(starts,2);
 sound.context.currentTime=2;sound.play('success');assert.equal(starts,4);
 sound.context.currentTime=3;sound.disable();assert.equal(starts,4);assert.equal(sound.context,null);
 sound.play('success');assert.equal(starts,4);
 delete globalThis.AudioContext;
});
