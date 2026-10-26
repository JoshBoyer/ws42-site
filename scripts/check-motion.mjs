import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync('js/motion.js','utf8');
function scenario({system=false,saved=null,storageFails=false,observerAvailable=true,animationAvailable=true}={}){
 const events={},windowEvents={},attrs={},animations=[];let mediaChange;let observer;let value=saved;
 const label={textContent:''};const button={hidden:true,disabled:false,setAttribute:(k,v)=>attrs[k]=v,querySelector:()=>label,addEventListener:(n,f)=>events['button-'+n]=f};
 const root={dataset:{}};const media={matches:system,addEventListener:(_,f)=>mediaChange=f};
 const makeElement=(photo=false)=>({contains:()=>false,matches:()=>photo,parentElement:{children:[]},...(animationAvailable?{animate:(frames,timing)=>{const listeners={};const a={frames,timing,cancelled:false,effect:{target:null},cancel(){this.cancelled=true;listeners.cancel?.()},addEventListener:(n,f)=>listeners[n]=f};animations.push(a);return a}}:{})});
 const words=[makeElement(),makeElement(),makeElement()];const photo=makeElement(true);photo.parentElement.children=[photo];
 const document={documentElement:root,hidden:false,activeElement:null,querySelector:()=>button,querySelectorAll:s=>s==='.motto-word'?words:[photo],addEventListener:(n,f)=>events[n]=f};
 const window={matchMedia:()=>media,addEventListener:(n,f)=>windowEvents[n]=f};
 class Observer{constructor(fn){this.fn=fn;this.unobserved=0;this.disconnected=false;observer=this}observe(){}unobserve(){this.unobserved++}disconnect(){this.disconnected=true}}
 if(observerAvailable)window.IntersectionObserver=Observer;
 vm.runInNewContext(source,{window,document,localStorage:{getItem:()=>{if(storageFails)throw Error('blocked');return value},setItem:(_,v)=>{if(storageFails)throw Error('blocked');value=v},removeItem:()=>{if(storageFails)throw Error('blocked');value=null}},...(observerAvailable?{IntersectionObserver:Observer}:{})});
 events.DOMContentLoaded();return {root,media,button,label,attrs,animations,observer,photo,document,events,windowEvents,get value(){return value},changeSystem(v){media.matches=v;mediaChange()}};
}
let cases=0;
for(const config of [{},{system:true},{saved:'1'},{storageFails:true},{observerAvailable:false},{animationAvailable:false}]){
 const s=scenario(config);const reduced=config.system||config.saved==='1';assert.equal(s.root.dataset.motion,reduced?'reduced':'full');assert.equal(s.button.hidden,false);assert.equal(s.attrs['aria-pressed'],String(!!reduced));assert.equal(s.button.disabled,!!config.system);
 assert.equal(s.animations.length,reduced||config.animationAvailable===false?0:3);for(const a of s.animations){assert.ok(a.timing.duration+a.timing.delay<=700);assert.equal(a.timing.fill,'none');assert.equal(a.timing.iterations,undefined)}
 if(s.observer){s.observer.fn([{isIntersecting:true,target:s.photo}]);assert.equal(s.observer.unobserved,1)}
 if(!config.system){s.events['button-click']();assert.equal(s.root.dataset.motion,reduced?'full':'reduced');if(!reduced)assert.ok(s.animations.every(a=>a.cancelled));}
 cases++;
}
const s=scenario();s.changeSystem(true);assert.equal(s.root.dataset.motion,'reduced');assert.equal(s.button.disabled,true);assert.ok(s.animations.every(a=>a.cancelled));s.changeSystem(false);assert.equal(s.root.dataset.motion,'full');s.windowEvents.storage({key:'ws42-reduced-motion',newValue:'1'});assert.equal(s.root.dataset.motion,'reduced');cases++;
const h=scenario();h.document.hidden=true;h.events.visibilitychange();assert.ok(h.animations.every(a=>a.cancelled));h.windowEvents.pagehide();assert.equal(h.observer.disconnected,true);cases++;
console.log(`PASS: ${cases} motion scenarios: system/local reduction, storage failure, API fallbacks, finite timing, one-shot observation, cross-tab preference and interruption cleanup.`);
