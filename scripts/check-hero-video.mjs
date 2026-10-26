import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const code=fs.readFileSync('js/hero-video.js','utf8');
function setup({system=false,choice=false,saveData=false,denyPlay=false}={}){
 const events={},docEvents={},windowEvents={},attrs={},classes=new Set();let mutation,intersection,mediaChange,networkChange;
 const root={dataset:{motion:choice?'reduced':'full'}};const hero={dataset:{},classList:{add:n=>classes.add(n),remove:n=>classes.delete(n)},querySelector:s=>s==='video'?video:button};
 const label={textContent:''};const path={setAttribute(){}};const button={hidden:true,setAttribute:(k,v)=>attrs[k]=v,querySelector:s=>s==='path'?path:label,addEventListener:(n,f)=>events['button-'+n]=f};
 let src=null,time=0;const video={dataset:{videoSrc:'assets/video/Workshop42-Edge-Cut.mp4'},paused:true,ended:false,loop:false,muted:false,volume:1,addEventListener:(n,f)=>events[n]=f,hasAttribute:()=>src!==null,removeAttribute:()=>src=null,load(){this.paused=true;this.ended=false;time=0},pause(){this.paused=true;events.pause?.()},play(){if(denyPlay)return Promise.reject(Error('autoplay denied'));this.paused=false;events.playing?.();return Promise.resolve()}};
 Object.defineProperty(video,'src',{get:()=>src,set:v=>src=v});Object.defineProperty(video,'currentTime',{get:()=>time,set:v=>{time=v;video.ended=false}});
 const document={documentElement:root,hidden:false,querySelector:()=>hero,addEventListener:(n,f)=>docEvents[n]=f};const media={matches:system,addEventListener:(_,f)=>mediaChange=f};const connection={saveData,addEventListener:(_,f)=>networkChange=f};
 const window={matchMedia:()=>media,addEventListener:(n,f)=>windowEvents[n]=f,IntersectionObserver:true};class MO{constructor(f){mutation=f}observe(){}}class IO{constructor(f){intersection=f}observe(){}}
 vm.runInNewContext(code,{document,window,navigator:{connection},MutationObserver:MO,IntersectionObserver:IO});
 return {root,hero,video,button,attrs,label,classes,events,docEvents,windowEvents,document,media,connection,mutate:()=>mutation(),visible:v=>intersection([{isIntersecting:v}]),system:v=>{media.matches=v;mediaChange()},network:v=>{connection.saveData=v;networkChange()}};
}
let n=0;
for(const cfg of [{system:true},{choice:true},{saveData:true}]){const s=setup(cfg);assert.equal(s.video.src,null);assert.equal(s.button.hidden,true);assert.equal(s.hero.dataset.videoState,'poster');n++}
let s=setup();assert.equal(s.video.muted,true);assert.equal(s.video.volume,0);assert.equal(s.video.loop,false);assert.equal(s.hero.dataset.videoState,'playing');assert.ok(s.classes.has('video-ready'));n++;
s.visible(false);assert.equal(s.video.paused,true);s.visible(true);assert.equal(s.video.paused,false);n++;
s.events['button-click']();s.visible(false);s.visible(true);assert.equal(s.video.paused,true);s.events['button-click']();assert.equal(s.video.paused,false);n++;
s.video.ended=true;s.video.paused=true;s.events.ended();assert.equal(s.attrs['aria-label'],'Replay background video');s.visible(true);assert.equal(s.video.paused,true);s.events['button-click']();assert.equal(s.video.currentTime,0);assert.equal(s.video.paused,false);n++;
s.root.dataset.motion='reduced';s.mutate();assert.equal(s.video.src,null);assert.equal(s.button.hidden,true);assert.ok(!s.classes.has('video-ready'));n++;
s=setup();s.network(true);assert.equal(s.video.src,null);s.network(false);assert.equal(s.video.paused,false);s.document.hidden=true;s.docEvents.visibilitychange();assert.equal(s.video.paused,true);n++;
s=setup({denyPlay:true});await Promise.resolve();await Promise.resolve();assert.equal(s.button.hidden,false);assert.equal(s.attrs['aria-label'],'Play background video');n++;
s=setup();s.events.error();assert.equal(s.hero.dataset.videoState,'poster');assert.equal(s.button.hidden,true);assert.ok(!s.classes.has('video-ready'));n++;
console.log(`PASS: ${n} hero-video scenarios: source suppression, silence, offscreen/background pause, manual pause, play-once/replay, live reduction, Save-Data, autoplay denial and media failure.`);
