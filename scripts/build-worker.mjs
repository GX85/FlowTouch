import { build } from 'esbuild';
// MediaPipe's WASM loader uses importScripts, requiring a classic worker.
await build({entryPoints:['src/vision-worker.js'],bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,outfile:'public/vision-worker.bundle.js'});
