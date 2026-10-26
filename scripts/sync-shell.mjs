import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const pages=['index.html','workshop.html','about.html',...fs.readdirSync(path.join(root,'blog')).filter(f=>f.endsWith('.html')).map(f=>'blog/'+f)];
const header=fs.readFileSync(path.join(root,'partials/header.tpl'),'utf8').trim();
const footer=fs.readFileSync(path.join(root,'partials/footer.tpl'),'utf8').trim();
for(const page of pages){
  const article=page.startsWith('blog/');
  const prefix=article?'../':'';
  const render=template=>template.replaceAll('{{root}}',prefix).replaceAll('{{notesCurrent}}',article?' aria-current="page"':'').replaceAll('{{workshopCurrent}}',page==='workshop.html'?' aria-current="page"':'').replaceAll('{{aboutCurrent}}',page==='about.html'?' aria-current="page"':'');
  const file=path.join(root,page);
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/\s*<link\b[^>]*rel="(?:icon|shortcut icon)"[^>]*>/g,'');
  const iconVersion='20261025-42-2';
  const icons=[`<link rel="icon" type="image/png" sizes="32x32" href="${prefix}assets/icons/favicon-42-32.png?v=${iconVersion}">`,`<link rel="icon" type="image/png" sizes="16x16" href="${prefix}assets/icons/favicon-42-16.png?v=${iconVersion}">`,`<link rel="shortcut icon" type="image/x-icon" href="${prefix}assets/icons/favicon-42.ico?v=${iconVersion}">`,`<link rel="icon" type="image/svg+xml" sizes="any" href="${prefix}assets/icons/favicon-42.svg?v=${iconVersion}">`].join('\n');
  html=html.replace('</head>',icons+'\n</head>');
  html=html.replace(/<header class="site-header">[\s\S]*?<\/header>|<nav class="nav">[\s\S]*?<\/nav>/,render(header));
  html=html.replace(/<footer class="(?:site-footer|footer)">[\s\S]*?<\/footer>/,render(footer));
  html=html.replace(/<meta name="theme-color" content="[^"]*">/,'<meta name="theme-color" content="#191b1f">');
  html=html.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2[^\"]*" rel="stylesheet">/,'<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&amp;family=IBM+Plex+Sans:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500;700;800&amp;display=swap" rel="stylesheet">');
  html=html.replace(/\s*<script src="(?:\.\.\/)?js\/theme\.js"><\/script>/g,'');
  html=html.replace('<meta charset="UTF-8">',`<meta charset="UTF-8">\n<script src="${prefix}js/theme.js"></script>`);
  if(!html.includes('js/theme.js')) html=html.replace('<head>',`<head>\n<script src="${prefix}js/theme.js"></script>`);
  html=html.replace(/\s*<script src="(?:\.\.\/)?js\/motion\.js"><\/script>/g,'');
  html=html.replace('</head>',`<script src="${prefix}js/motion.js"></script>\n</head>`);
  html=html.replace(/\s*<link rel="stylesheet" href="(?:\.\.\/)?css\/(?:style|workshop|header|article|theme|motion)\.css">/g,'');
  const sheets=['workshop','header',...((article||page==='about.html')?['article']:[]),'theme','motion'].map(name=>`<link rel="stylesheet" href="${prefix}css/${name}.css">`).join('\n');
  html=html.replace('</head>',sheets+'\n</head>');
  html=html.replace(/\s*<script src="(?:\.\.\/)?js\/(?:main|workshop|header|hero-video)\.js">\s*<\/script>/g,'');
  const scripts=['header',...(!article?['workshop']:[]),...(page==='index.html'?['hero-video']:[])].map(name=>`<script src="${prefix}js/${name}.js"></script>`).join('\n');
  html=html.replace('</body>',scripts+'\n</body>');
  if(article){
    if(!/<main\b/.test(html)) html=html.replace('<article class="post"','<main id="main">\n<article class="post"').replace('</article>','</article>\n</main>');
    html=html.replace(/<body(?: class="article-page")?>/,'<body class="article-page">');
    html=html.replace('class="article-skip"','class="skip-link"').replace('&larr; Back to Blog','&larr; Back to build notes');
  }
  fs.writeFileSync(file,html);
}
console.log(`Synchronized approved header, footer, fonts and assets across ${pages.length} pages.`);
