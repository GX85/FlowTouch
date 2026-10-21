import React from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,interpolate,spring} from 'remotion';
const h=React.createElement;
export function FlowSignal({english=false}){
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),phase=frame%(fps*4),progress=phase/(fps*4),jump=progress>.22&&progress<.72?Math.sin((progress-.22)/.5*Math.PI):0;
 const pulse=spring({frame:Math.max(0,phase-fps*.2),fps,config:{damping:24}});
 return h(AbsoluteFill,{style:{background:'#1c1711',color:'#eef0f4',fontFamily:'InterTight,system-ui',padding:48,overflow:'hidden'}},
 h('div',{style:{fontSize:12,letterSpacing:3,color:'#8793a3'}},'FLOWTOUCH / INPUT SIGNAL'),
 h('div',{style:{position:'absolute',inset:'15% 0',background:'radial-gradient(ellipse at 55% 40%,#6188b228,transparent 65%)'}}),
 h('div',{style:{position:'absolute',left:48,top:125,fontSize:52,fontWeight:500,letterSpacing:-2}},english?'From intention.':'От движения.'),
 h('div',{style:{position:'absolute',left:48,top:185,fontSize:52,fontWeight:500,letterSpacing:-2,color:'#a28e70'}},english?'Into motion.':'К действию.'),
 h('div',{style:{position:'absolute',left:50,right:50,top:320,height:1,background:'#fff2'}},h('div',{style:{position:'absolute',left:`${interpolate(progress,[0,1],[0,100])}%`,top:-3,width:6,height:6,borderRadius:'50%',background:'#d9bd8c',boxShadow:'0 0 22px #86bbff'}})),
 h('div',{style:{position:'absolute',left:50,bottom:58,fontSize:14,color:'#a79579'}},english?'PINCH DETECTED':'ЩЕПОТКА РАСПОЗНАНА'),
 h('div',{style:{position:'absolute',right:48,top:135,width:200,height:105,display:'grid',placeItems:'center',border:`1px solid ${jump>0?'#b8d6ff88':'#fff2'}`,borderRadius:20,background:jump>0?'#bddeff18':'#ffffff06',boxShadow:jump>0?'0 0 70px #7eabff14':'none',scale:.98+pulse*.02,fontSize:26}},'Space'),
 h('div',{style:{position:'absolute',right:80,bottom:100+110*jump,width:45,height:45,border:'2px solid #dbc8a5',background:'#b1d3ff18',borderRadius:5,rotate:`${jump*90}deg`}}),
 h('div',{style:{position:'absolute',bottom:96,left:440,right:48,height:1,background:'#ffffff28'}}),
 h('div',{style:{position:'absolute',left:48,right:48,bottom:25,display:'flex',justifyContent:'space-between',fontSize:10,color:'#88765c',letterSpacing:2}},h('span',null,'ON-DEVICE VISION'),h('span',null,'KEY DOWN / KEY UP')));
}
export function mountFilm(container,english){const root=createRoot(container);root.render(h(Player,{component:FlowSignal,inputProps:{english},compositionWidth:900,compositionHeight:520,durationInFrames:240,fps:30,autoPlay:!matchMedia('(prefers-reduced-motion: reduce)').matches,loop:true,muted:true,controls:true,showVolumeControls:false,style:{width:'100%',borderRadius:24}}));return()=>root.unmount();}
