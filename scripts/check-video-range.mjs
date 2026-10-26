import assert from 'node:assert/strict';import fs from 'node:fs';import {once} from 'node:events';import {createPreviewServer} from './preview.mjs';
const s=createPreviewServer();s.listen(0,'127.0.0.1');await once(s,'listening');const url=`http://127.0.0.1:${s.address().port}/assets/video/Workshop42-Edge-Cut.mp4`;const source=fs.readFileSync(new URL('../assets/video/Workshop42-Edge-Cut.mp4',import.meta.url));
try{
let r=await fetch(url,{method:'HEAD'});assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'video/mp4');assert.equal(+r.headers.get('content-length'),source.length);assert.equal(r.headers.get('accept-ranges'),'bytes');
r=await fetch(url,{headers:{Range:'bytes=0-1023'}});assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),`bytes 0-1023/${source.length}`);assert.deepEqual(Buffer.from(await r.arrayBuffer()),source.subarray(0,1024));
r=await fetch(url,{headers:{Range:'bytes=-32'}});assert.equal(r.status,206);assert.deepEqual(Buffer.from(await r.arrayBuffer()),source.subarray(-32));
for(const range of [`bytes=${source.length}-`,'bytes=3-1','bytes=-0','bytes=0-1,5-6']){r=await fetch(url,{headers:{Range:range}});assert.equal(r.status,416);assert.equal(r.headers.get('content-range'),`bytes */${source.length}`);await r.arrayBuffer()}
console.log('PASS: video MIME/HEAD/content length, exact byte range, suffix range and4invalid range responses.');
}finally{s.closeAllConnections();s.close()}
