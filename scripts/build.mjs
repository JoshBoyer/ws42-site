// Stage only public site files. Raw photo sources, secrets and tooling stay local.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const out = path.join(root,'.site');
if (path.dirname(out)!==root || path.basename(out)!=='.site') throw new Error('Invalid staging path');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
const copy=(name)=>{const target=path.join(out,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,name),target);};
for(const name of ['index.html','workshop.html','about.html','CNAME']) copy(name);
for(const dir of ['blog']) {
  for(const file of fs.readdirSync(path.join(root,dir))) {
    if (/\.(?:html|css|js)$/.test(file)) copy(`${dir}/${file}`);
  }
}
for(const name of ['css/workshop.css','css/header.css','css/article.css','css/theme.css','css/motion.css','js/motion.js','js/theme.js','js/header.js','js/workshop.js','js/hero-video.js']) copy(name);
copy('assets/video/Workshop42-Edge-Cut.mp4');
copy('assets/images/Logo-nav.svg');
for(const file of fs.readdirSync(path.join(root,'assets/brands/stack'))) {
  if (/\.svg$/.test(file) || file==='LICENSE.md') copy(`assets/brands/stack/${file}`);
}
copy('assets/images/published/forage-logo.svg');
for(const icon of ['favicon-42.svg','favicon-42-16.png','favicon-42-32.png','favicon-42.ico']) copy(`assets/icons/${icon}`);
for(const file of ['bambu-lab.svg','creality.svg','creality-white.svg','lightburn.svg','milwaukee.webp']) copy(`assets/brands/${file}`);
for(const file of fs.readdirSync(path.join(root,'assets/images/published'))) {
  if (/\.(?:jpg|jpeg|png)$/i.test(file)) copy(`assets/images/published/${file}`);
}
console.log(`Staged public site in ${out}; raw originals and private/tooling files excluded.`);
