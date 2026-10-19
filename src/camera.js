export async function openCamera(devices, preferredId='') {
 if(!devices?.getUserMedia)throw Object.assign(new Error('MediaDevices unavailable'),{name:'UnsupportedError'});
 let stream;
 if(preferredId){
  try{stream=await devices.getUserMedia({video:{deviceId:{exact:preferredId}},audio:false});}
  catch(error){if(!['OverconstrainedError','NotFoundError'].includes(error.name))throw error;}
 }
 stream??=await devices.getUserMedia({video:true,audio:false});
 const track=stream.getVideoTracks()[0];
 if(!track){stream.getTracks().forEach(t=>t.stop());throw Object.assign(new Error('No video track'),{name:'NotFoundError'});}
 try{await track.applyConstraints?.({width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30}});}catch{/* Keep the camera's supported default format. */}
 return stream;
}
export function describeCameraError(error){
 const messages={
  NotAllowedError:'Браузер отклонил доступ к камере. Разреши камеру в настройках этого сайта и проверь разрешение для браузера в Windows.',
  NotFoundError:'Браузер не получил видеоустройство. Проверь список источников ниже. Если камера работает в Windows, открой студию в системном Chrome или Edge.',
  NotReadableError:'Камера обнаружена, но видеопоток не открылся. Закрой приложения, которые используют камеру, и проверь USB-подключение.',
  OverconstrainedError:'Выбранный режим камеры недоступен. Выбери «Автоматически» и повтори подключение.',
  SecurityError:'Доступ к камере ограничен политикой браузера. Открой студию в отдельном окне Chrome или Edge.',
  UnsupportedError:'Камера недоступна в этом браузере или контексте. Открой HTTPS-версию либо локальную студию в Chrome или Edge.',
  AbortError:'Подключение камеры прервано. Проверь USB-кабель и повтори попытку.'
 };
 return messages[error.name]??'Не удалось открыть видеопоток. Повтори поиск устройств или выбери другую камеру.';
}
