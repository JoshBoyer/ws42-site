import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT || 4242);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.jpeg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.ico':'image/x-icon'};
export const createPreviewServer=()=>http.createServer((req,res)=>{
  try {
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
    const name = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file = path.resolve(root, '.' + (name.endsWith('/') ? name+'index.html' : name));
    if (!file.startsWith(root+path.sep) || name.split('/').some(p=>p.startsWith('.')) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404);res.end('Not found');return;
    }
    const size=fs.statSync(file).size;
    const headers={'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
    let start=0,end=size-1,status=200;
    if(req.headers.range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if(match&&(match[1]||match[2])){
        start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
        end=match[1]?(match[2]?Math.min(Number(match[2]),size-1):size-1):size-1;
      }else start=NaN;
      if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start||(!match?.[1]&&Number(match?.[2])===0)){
        res.writeHead(416,{...headers,'Content-Range':`bytes */${size}`,'Content-Length':0});res.end();return;
      }
      status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;
    }
    headers['Content-Length']=size===0?0:end-start+1;
    res.writeHead(status,headers);
    if(req.method==='HEAD'||size===0){res.end();return;}
    const stream=fs.createReadStream(file,{start,end});
    stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  } catch {res.writeHead(400);res.end('Bad request');}
});
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))createPreviewServer().listen(port,'127.0.0.1',()=>console.log(`Workshop 42 preview: http://127.0.0.1:${port}`));
