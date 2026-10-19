import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
let recognizer;
self.onmessage=async ({data})=>{
 if(data.type==='init'){
  try{
   const files=await FilesetResolver.forVisionTasks(data.base+'wasm');
   recognizer=await GestureRecognizer.createFromOptions(files,{baseOptions:{modelAssetPath:data.base+'models/gesture_recognizer.task',delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.65,minHandPresenceConfidence:.65,minTrackingConfidence:.65});
   self.postMessage({type:'ready'});
  }catch(error){self.postMessage({type:'error',message:error.message});}
 }else if(data.type==='frame'){
  try{const result=recognizer.recognizeForVideo(data.bitmap,data.time);self.postMessage({type:'result',result,time:data.time});}
  catch(error){self.postMessage({type:'error',message:error.message});}
  finally{data.bitmap.close();}
 }
};
