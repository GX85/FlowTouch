import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const index=readFileSync('dist/index.html','utf8');mkdirSync('dist/studio',{recursive:true});
writeFileSync('dist/studio/index.html',index.replace(/<title>.*?<\/title>/,'<title>FlowTouch Studio — камера и жесты</title>'));
