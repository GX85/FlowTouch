import test from 'node:test';
import assert from 'node:assert/strict';
import {connectDesktop,expectsDesktop} from '../src/desktop.js';
test('desktop session accepts the Windows companion and rejects unrelated servers',async()=>{
 const session={app:'FlowTouch',platform:'windows',version:'1.2.0',token:'test',dryRun:false};
 assert.deepEqual(await connectDesktop(async()=>({ok:true,json:async()=>session})),session);
 await assert.rejects(connectDesktop(async()=>({ok:true,json:async()=>({token:'unrelated'})})),/несовместимый/);
 await assert.rejects(connectDesktop(async()=>({ok:false,status:404})),/HTTP 404/);
});
test('desktop mode is explicit on localhost and cannot silently become web demo',()=>{
 assert.equal(expectsDesktop({hostname:'127.0.0.1',port:'8765',search:''}),true);
 assert.equal(expectsDesktop({hostname:'localhost',port:'8765',search:''}),true);
 assert.equal(expectsDesktop({hostname:'example.com',port:'',search:''}),false);
 assert.equal(expectsDesktop({hostname:'localhost',port:'8765',search:'?demo=1'}),true);
});
