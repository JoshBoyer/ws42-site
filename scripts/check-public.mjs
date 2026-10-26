// Validate the exact deployable tree, without printing secret-like values on failure.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../.site/',import.meta.url));
const errors=[];let files=0,bytes=0;
const secretPatterns=[/gh[pousr]_[A-Za-z0-9]{20,}/,/github_pat_[A-Za-z0-9_]{30,}/,/sk-(?:proj-|ant-)?[A-Za-z0-9_-]{24,}/,/AKIA[0-9A-Z]{16}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/];
const privatePatterns=[/C:[\\/]+Users[\\/]/,/libfile_[a-f0-9]+/,/task-3[\\/]/];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  const full=path.join(dir,item.name),name=path.relative(root,full).replaceAll('\\','/');
  if(item.isSymbolicLink()){errors.push(`${name}: symbolic link`);continue;}
  if(/(^|\/)(?:\.git|\.env(?:\.|$)|references|test-screenshots|scripts|HANDOFF\.md|ARGON_REVIEW\.md|transfer\.json|node_modules)(?:\/|$)/i.test(name))errors.push(`${name}: private/tooling artifact`);
  if(item.isDirectory()){walk(full);continue;}
  const content=fs.readFileSync(full);files++;bytes+=content.length;
  if(content.length>100*1024*1024)errors.push(`${name}: exceeds ordinary repository file size`);
  if(/\.(?:html|css|js|json|md|txt|svg)$/i.test(name)){
    const text=content.toString('utf8');
    if(secretPatterns.some(p=>p.test(text)))errors.push(`${name}: credential-like value`);
    if(privatePatterns.some(p=>p.test(text)))errors.push(`${name}: private workspace/Library reference`);
  }
  if(/\.(?:jpe?g|png)$/i.test(name)){
    if(!name.startsWith('assets/images/published/')&&!['assets/icons/favicon-42-16.png','assets/icons/favicon-42-32.png'].includes(name))errors.push(`${name}: raw raster outside publication directory`);
    for(const marker of ['Exif\0\0','http://ns.adobe.com/xap/1.0/','Photoshop 3.0'])if(content.includes(Buffer.from(marker)))errors.push(`${name}: source metadata`);
  }
}}
walk(root);
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`PASS: deploy artifact ${files} files/${bytes} bytes; no private artifacts, credential-like values or source-photo metadata.`);
