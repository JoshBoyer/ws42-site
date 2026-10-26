import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const code=fs.readFileSync('js/theme.js','utf8');
for(const dark of [true,false])for(const saved of [null,'light','dark','invalid']){
let value=saved;const handlers={};let mediaListener;const attrs={};const button={hidden:true,setAttribute:(k,v)=>attrs[k]=v,querySelector:()=>({textContent:''}),addEventListener:(n,f)=>handlers[n]=f};
const root={dataset:{}};const doc={documentElement:root,querySelector:s=>s==='.theme-toggle'?button:null,addEventListener:(n,f)=>handlers[n]=f};
const media={matches:dark,addEventListener:(_,f)=>mediaListener=f};
const context={document:doc,window:{matchMedia:()=>media,addEventListener:()=>{}},localStorage:{getItem:()=>value,setItem:(_,v)=>value=v,removeItem:()=>value=null}};
vm.runInNewContext(code,context);handlers.DOMContentLoaded();
const pref=['light','dark'].includes(saved)?saved:'system';assert.equal(root.dataset.themePreference,pref);assert.equal(root.dataset.theme,pref==='system'?(dark?'dark':'light'):pref);assert.equal(button.hidden,false);
if(pref==='system'){media.matches=!dark;mediaListener();assert.equal(root.dataset.theme,dark?'light':'dark');}
for(let i=0;i<3;i++)handlers.click();assert.equal(root.dataset.themePreference,pref);assert.equal(value,pref==='system'?null:pref);
}
console.log('PASS: system light/dark, valid/invalid stored preferences, system changes, accessible control and persisted/reset three-state cycle (8 scenarios).');
