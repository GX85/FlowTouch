import {readFileSync,writeFileSync,readdirSync,unlinkSync} from 'node:fs';

// Desktop packaging uses `npm run build`. Hosting adds this step: legacy
// /studio/ links open the polished download page, never a camera workspace.
const landing=readFileSync('dist/index.html','utf8');
writeFileSync('dist/studio/index.html',landing);
for(const name of readdirSync('dist/assets')){
 if(/^studio[-.]/.test(name))unlinkSync('dist/assets/'+name);
}
console.log('Public build: website and Studio download only.');
