export class SoundDesign {
 constructor(){this.enabled=false;this.context=null;this.last=-Infinity;this.volume=.35;this.noise=null;this.ambient=false;this.ambientVolume=.15;this.ambientNodes=[];this.ambientGain=null;this.ambientContext=null;}
 async enable(){this.context??=new AudioContext();await this.context.resume();this.enabled=true;this.play('on');}
 disable(){this.enabled=false;this.noise=null;if(this.context){this.context.close();this.context=null;}}
 setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)||0));}
 async setAmbient(enabled){
  if(!enabled){this.stopAmbient();return;}
  if(this.ambient)return;
  const ctx=this.ambientContext=new AudioContext();await ctx.resume();this.ambient=true;
  const master=ctx.createGain();master.gain.setValueAtTime(0,ctx.currentTime);master.gain.linearRampToValueAtTime(this.ambientVolume,ctx.currentTime+2);master.connect(ctx.destination);this.ambientGain=master;
  // An unmetered, quiet soundscape. Separate from interface clicks, with no
  // microphone, remote stream, autoplay, or recurring JavaScript timers.
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=750;filter.Q.value=.3;filter.connect(master);
  for(const [i,frequency] of [110,164.8138,220,261.6256].entries()){
   const osc=ctx.createOscillator(),gain=ctx.createGain(),lfo=ctx.createOscillator(),depth=ctx.createGain();osc.type='sine';osc.frequency.value=frequency;osc.detune.value=i%2?-3:3;gain.gain.value=i===3?.006:.018;lfo.frequency.value=.022+i*.009;depth.gain.value=i===3?.005:.007;lfo.connect(depth);depth.connect(gain.gain);osc.connect(gain);gain.connect(filter);osc.start();lfo.start();this.ambientNodes.push(osc,lfo);
  }
 }
 setAmbientVolume(value){this.ambientVolume=Math.max(0,Math.min(.5,Number(value)||0));if(this.ambientGain)this.ambientGain.gain.setTargetAtTime(this.ambientVolume,this.ambientContext.currentTime,.15);}
 stopAmbient(){this.ambient=false;const ctx=this.ambientContext;for(const node of this.ambientNodes){try{node.stop();}catch{}}this.ambientNodes=[];this.ambientGain=null;this.ambientContext=null;if(ctx)ctx.close();}
 dispose(){this.disable();this.stopAmbient();}
 mechanical(kind='key'){
  if(!this.enabled||!this.context||this.context.state!=='running'||!this.volume)return;
  const ctx=this.context,now=ctx.currentTime;
  if(now-this.last<.028)return;this.last=now;
  if(!this.noise){this.noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.09),ctx.sampleRate);const channel=this.noise.getChannelData(0);for(let i=0;i<channel.length;i++)channel[i]=Math.random()*2-1;}
  const release=kind==='release',deep=kind==='space'||kind==='enter',click=kind==='switch';
  const strike=(delay,level,frequency,duration)=>{
   const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=this.noise;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.65;
   gain.gain.setValueAtTime(.0001,now+delay);gain.gain.linearRampToValueAtTime(level*this.volume,now+delay+.001);gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);source.start(now+delay);source.stop(now+delay+duration+.005);
  };
  const variance=.94+Math.random()*.12;
  strike(0,release?.075:.16,(release?3300:deep?1050:2200)*variance,release?.018:.034);
  if(!release)strike(deep?.018:.009,.07,(click?3900:deep?650:1500)*variance,.026);
  // A very short damped body resonance under the broadband switch click.
  const body=ctx.createOscillator(),gain=ctx.createGain();body.type='triangle';body.frequency.setValueAtTime((deep?175:310)*variance,now);body.frequency.exponentialRampToValueAtTime(deep?80:160,now+.04);gain.gain.setValueAtTime((release?.012:.035)*this.volume,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.04);body.connect(gain);gain.connect(ctx.destination);body.start(now);body.stop(now+.045);
 }
 play(name='tap'){
  if(!this.enabled||!this.context||this.context.state!=='running'||!this.volume)return;
  const now=this.context.currentTime;if(now-this.last<.045)return;this.last=now;
  const sounds={tap:[[620,0,.035,.025]],hover:[[920,0,.025,.008]],on:[[440,0,.12,.04],[660,.07,.16,.035]],off:[[440,0,.09,.035],[294,.07,.14,.03]],success:[[587,0,.09,.035],[880,.07,.18,.025]],pose:[[330,0,.08,.025],[495,.035,.12,.02]],error:[[180,0,.1,.03],[145,.08,.12,.02]],detect:[[740,0,.065,.03]]};
  for(const[freq,delay,duration,volume]of sounds[name]??sounds.tap){
   const osc=this.context.createOscillator(),gain=this.context.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,now+delay);osc.frequency.exponentialRampToValueAtTime(freq*.97,now+delay+duration);
   gain.gain.setValueAtTime(0,now+delay);gain.gain.linearRampToValueAtTime(volume*this.volume,now+delay+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);
   osc.connect(gain);gain.connect(this.context.destination);osc.start(now+delay);osc.stop(now+delay+duration+.01);
  }
 }
}
