import {readFileSync,mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
const studio=readFileSync('dist/studio.html','utf8');
if(!/rel="stylesheet"/.test(studio))throw Error('Studio CSS was not bundled');
mkdirSync('dist/studio',{recursive:true});writeFileSync('dist/studio/index.html',studio);unlinkSync('dist/studio.html');
