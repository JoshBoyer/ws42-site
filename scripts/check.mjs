import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const htmlFiles=['index.html','workshop.html','about.html',...fs.readdirSync(path.join(root,'blog')).filter(f=>f.endsWith('.html')).map(f=>'blog/'+f)];
const errors=[];
const baseline=JSON.parse(fs.readFileSync(path.join(root,'scripts/content-baseline.json'),'utf8'));
const originalArticles=new Set(Object.keys(baseline.articleBodySHA256));
let references=0;
const contents=new Map(htmlFiles.map(f=>[f,fs.readFileSync(path.join(root,f),'utf8')]));
const genuineAboutParagraphs=baseline.aboutParagraphs;
if(genuineAboutParagraphs.length!==3||genuineAboutParagraphs.some(p=>!contents.get('about.html').includes(`<p>${p}</p>`)||!contents.get('index.html').includes(`<p>${p}</p>`))) errors.push('Genuine original About content missing');
const normalizeShell=s=>s.replaceAll('../','').replace(/ aria-current="page"/g,'').replace(/\s+/g,' ').trim();
const homeHeader=normalizeShell(contents.get('index.html').match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0]||'');
const homeFooter=normalizeShell(contents.get('index.html').match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0]||'');
for(const [file,html] of contents) {
  const header=html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0]||'';
  const footer=html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0]||'';
  if(!header||normalizeShell(header)!==homeHeader) errors.push(`${file}: shared header differs from Home`);
  if(!footer||normalizeShell(footer)!==homeFooter) errors.push(`${file}: shared footer differs from Home`);
  const aboutHref=file.startsWith('blog/')?'../about.html':'about.html';
  if(!header.includes(`href="${aboutHref}"`)||!footer.includes(`href="${aboutHref}"`)) errors.push(`${file}: About must link to actual About page`);
  if(!html.includes('css/header.css')||!html.includes('js/header.js')) errors.push(`${file}: missing shared header assets`);
  if(!html.includes('css/theme.css')||!html.includes('js/theme.js')||!header.includes('class="theme-toggle"')) errors.push(`${file}: shared theme assets/control missing`);
  if(!html.includes('css/motion.css')||!html.includes('js/motion.js')||!footer.includes('class="motion-toggle"')) errors.push(`${file}: shared motion assets/control missing`);
  if((html.match(/<script src="(?:\.\.\/)?js\/theme\.js"><\/script>/g)||[]).length!==1) errors.push(`${file}: theme bootstrap must appear once`);
  if(!html.includes('<meta name="theme-color" content="#191b1f">')) errors.push(`${file}: theme-color differs from #191b1f`);
  if(/(?:css\/style\.css|js\/main\.js|class="logo-mark"|class="logo-word")/.test(html)) errors.push(`${file}: legacy site shell still referenced`);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  if(new Set(ids).size!==ids.length) errors.push(`${file}: duplicate IDs`);
  if((html.match(/<h1\b/g)||[]).length!==1) errors.push(`${file}: expected one h1`);
  if((html.match(/<main\b/g)||[]).length!==1) errors.push(`${file}: expected one main landmark`);
  const localLinks=[...html.matchAll(/\b(?:href|src)="([^"]*)"/g)].map(m=>m[1]);
  for(const srcset of html.matchAll(/\bsrcset="([^"]*)"/g)) localLinks.push(...srcset[1].split(',').map(item=>item.trim().split(/\s+/)[0]));
  for(const link of localLinks) {
    if(!link || /^(?:https?:|mailto:|data:)/.test(link)) continue;
    const [withQuery,hash]=link.split('#');
    const name=withQuery.split('?')[0];
    const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),decodeURIComponent(name||path.posix.basename(file))));
    const absolute=path.join(root,target);
    references++;
    if(!fs.existsSync(absolute)) {errors.push(`${file}: missing ${link}`);continue;}
    if(hash && target.endsWith('.html') && !(contents.get(target)||fs.readFileSync(absolute,'utf8')).includes(`id="${hash}"`)) errors.push(`${file}: missing anchor ${link}`);
    if(/assets\/images\/(?!published\/).*\.(?:jpg|jpeg|png)$/i.test(link)) errors.push(`${file}: raw photo reference ${link}`);
  }
  for(const tag of html.matchAll(/<img\b[^>]*>/g)) {
    if(!/\balt="[^"]*"/.test(tag[0])) errors.push(`${file}: image lacks alt text`);
    if(!/\bwidth="\d+"/.test(tag[0])||!/\bheight="\d+"/.test(tag[0])) errors.push(`${file}: image lacks dimensions`);
  }
  if(file.startsWith('blog/') && originalArticles.has(file)) {
    // Explicitly marked new CAD evidence may be added while legacy prose remains exact.
    const articleText=s=>s.slice(s.indexOf('<div class="post-content">'),s.indexOf('</article>')).replace(/<!-- cad-study:start -->[\s\S]*?<!-- cad-study:end -->\r?\n/g,'').replace(/<!-- project-media:start -->[\s\S]*?<!-- project-media:end -->\r?\n/g,'').replace(/[ \t]*<!-- editorial-addition:start -->[\s\S]*?<!-- editorial-addition:end -->\r?\n/g,'').replace(/<img\b[^>]*>/g,'').replace(/\r\n/g,'\n');
    if(crypto.createHash('sha256').update(articleText(html)).digest('hex')!==baseline.articleBodySHA256[file]) errors.push(`${file}: article prose changed`);
  } else if(file.startsWith('blog/') && (!html.includes('data-review-draft="true"') || !html.includes('Local review draft'))) {
    errors.push(`${file}: new article must be marked as a local review draft`);
  }
}
const dims=['dimensions.json','cad-dimensions.json','illustration-dimensions.json','software-dimensions.json'].flatMap(name=>JSON.parse(fs.readFileSync(path.join(root,'assets/images/published',name),'utf8')));
for(const d of dims){const bytes=fs.readFileSync(path.join(root,d.Published));for(const marker of ['Exif\0\0','http://ns.adobe.com/xap/1.0/','Photoshop 3.0']) if(bytes.includes(Buffer.from(marker))) errors.push(`${d.Published}: metadata marker ${marker}`);}
if(fs.existsSync(path.join(root,'.site'))){
  const stagedImages=fs.readdirSync(path.join(root,'.site/assets/images'));
  if(stagedImages.some(f=>/\.(?:jpg|jpeg|png)$/i.test(f))) errors.push('Build includes raw raster originals');
  for(const forbidden of ['.env','.git','scripts','package.json','css/style.css','js/main.js','references','ARGON_REVIEW.md','HANDOFF.md']) if(fs.existsSync(path.join(root,'.site',forbidden))) errors.push(`Build includes ${forbidden}`);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`PASS: ${htmlFiles.length} pages, ${references} local references/anchors, article prose preserved, ${dims.length} sanitized assets, public-stage exclusions.`);
