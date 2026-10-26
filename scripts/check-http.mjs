// Smoke-test only the local preview. External links are preserved, never crawled here.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const base=new URL(`http://127.0.0.1:${process.env.PORT||4242}/`);
const pages=['index.html','workshop.html','about.html',...fs.readdirSync(path.join(root,'blog')).filter(f=>f.endsWith('.html')).map(f=>'blog/'+f)];
const targets=new Set(pages.map(page=>new URL(page,base).href));
for(const page of pages){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  const links=[...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(match=>match[1]);
  for(const srcset of html.matchAll(/\bsrcset="([^"]*)"/g)) links.push(...srcset[1].split(',').map(item=>item.trim().split(/\s+/)[0]));
  for(const raw of links){
    if(/^(?:https?:|mailto:|data:)/.test(raw)) continue;
    const url=new URL(raw,new URL(page,base));url.hash='';targets.add(url.href);
  }
}
const types={'.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.html':'text/html','.css':'text/css','.js':'text/javascript','.mp4':'video/mp4'};
let count=0;
for(const target of targets){
  const response=await fetch(target,{signal:AbortSignal.timeout(10000)});
  if(response.status!==200) throw new Error(`${target}: HTTP ${response.status}`);
  const expected=types[path.extname(new URL(target).pathname)];
  if(expected&&!response.headers.get('content-type')?.includes(expected)) throw new Error(`${target}: unexpected content type ${response.headers.get('content-type')}`);
  await response.arrayBuffer();count++;
}
console.log(`PASS: ${pages.length} routes and ${count} distinct local page/asset URLs return HTTP 200 with expected content types.`);
