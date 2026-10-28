/* Decorative, always-silent hero. Reduced/Save-Data mode requests no video bytes. */
(() => {
  'use strict';
  const hero=document.querySelector('.hero-with-video');
  const video=hero?.querySelector('video');
  const button=hero?.querySelector('.hero-video-control');
  if(!hero||!video||!button)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection=navigator.connection;
  let userPaused=false, visible=true, failed=false;
  const blocked=()=>reduced.matches||document.documentElement.dataset.motion==='reduced'||connection?.saveData===true;
  const update=()=>{
    const ended=video.ended,paused=video.paused;
    button.setAttribute('aria-label',ended?'Replay background video':paused?'Play background video':'Pause background video');
    button.querySelector('span').textContent=ended?'Replay video':paused?'Play video':'Pause video';
    button.querySelector('path').setAttribute('d',ended||paused?'M6 4l10 6-10 6z':'M5 4h3v12H5zM12 4h3v12h-3z');
    hero.dataset.videoState=blocked()||failed?'poster':ended?'ended':paused?'paused':'playing';
  };
  const play=(userGesture=false)=>{
    if(blocked()||document.hidden||failed||userPaused||(!userGesture&&(!visible||video.ended)))return;
    try{
      video.play()?.catch(()=>{button.hidden=false;update();});
    }catch{button.hidden=false;update();}
  };
  const sync=()=>{
    if(blocked()){
      video.pause();
      if(video.hasAttribute('src')){video.removeAttribute('src');video.load();}
      hero.classList.remove('video-ready');button.hidden=true;update();return;
    }
    if(failed)return;
    if(!video.hasAttribute('src')){video.muted=true;video.defaultMuted=true;video.volume=0;video.src=video.dataset.videoSrc;}
    button.hidden=false;
    if(document.hidden||!visible)video.pause();else play();
    update();
  };
  video.addEventListener('playing',()=>{hero.classList.add('video-ready');update();});
  ['pause','ended'].forEach(name=>video.addEventListener(name,update));
  video.addEventListener('error',()=>{if(!video.hasAttribute('src'))return;failed=true;video.pause();hero.classList.remove('video-ready');button.hidden=true;update();});
  button.addEventListener('click',()=>{
    if(blocked())return;
    if(video.ended){video.currentTime=0;userPaused=false;play(true);}
    else if(video.paused){userPaused=false;play(true);}
    else{userPaused=true;video.pause();}
    update();
  });
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  reduced.addEventListener('change',sync);connection?.addEventListener?.('change',sync);
  document.addEventListener('visibilitychange',sync);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(hero);
  window.addEventListener('pagehide',()=>video.pause());window.addEventListener('pageshow',sync);
  sync();
})();
