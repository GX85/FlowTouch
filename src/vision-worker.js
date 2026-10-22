import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
let recognizer;
const lightCanvas=new OffscreenCanvas(32,24),lightContext=lightCanvas.getContext('2d',{willReadFrequently:true});
self.onmessage=async ({data})=>{
 if(data.type==='init'){
  try{
   const files=await FilesetResolver.forVisionTasks(data.base+'wasm');
   recognizer=await GestureRecognizer.createFromOptions(files,{baseOptions:{modelAssetPath:data.base+'models/gesture_recognizer.task',delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.5,minHandPresenceConfidence:.5,minTrackingConfidence:.5});
   self.postMessage({type:'ready'});
  }catch(error){self.postMessage({type:'error',message:error.message});}
 }else if(data.type==='frame'){
  try{lightContext.drawImage(data.bitmap,0,0,32,24);const pixels=lightContext.getImageData(0,0,32,24).data;let luminance=0;for(let i=0;i<pixels.length;i+=4)luminance+=pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722;luminance/=pixels.length/4;const result=recognizer.recognizeForVideo(data.bitmap,data.time);self.postMessage({type:'result',result,time:data.time,luminance});}
  catch(error){self.postMessage({type:'error',message:error.message});}
  finally{data.bitmap.close();}
 }
};
