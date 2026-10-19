export class SoundDesign {
 constructor(){this.enabled=false;this.context=null;this.last=0;}
 async enable(){this.context??=new AudioContext();await this.context.resume();this.enabled=true;this.play('on');}
 disable(){this.enabled=false;if(this.context){this.context.close();this.context=null;}}
 play(name='tap'){
  if(!this.enabled||!this.context||this.context.state!=='running')return;
  const now=this.context.currentTime;if(now-this.last<.045)return;this.last=now;
  const sounds={tap:[[620,0,.035,.025]],hover:[[920,0,.025,.008]],on:[[440,0,.12,.04],[660,.07,.16,.035]],off:[[440,0,.09,.035],[294,.07,.14,.03]],success:[[587,0,.09,.035],[880,.07,.18,.025]],pose:[[330,0,.08,.025],[495,.035,.12,.02]],error:[[180,0,.1,.03],[145,.08,.12,.02]],detect:[[740,0,.065,.03]]};
  for(const[freq,delay,duration,volume]of sounds[name]??sounds.tap){
   const osc=this.context.createOscillator(),gain=this.context.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,now+delay);osc.frequency.exponentialRampToValueAtTime(freq*.97,now+delay+duration);
   gain.gain.setValueAtTime(0,now+delay);gain.gain.linearRampToValueAtTime(volume,now+delay+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);
   osc.connect(gain);gain.connect(this.context.destination);osc.start(now+delay);osc.stop(now+delay+duration+.01);
  }
 }
}
