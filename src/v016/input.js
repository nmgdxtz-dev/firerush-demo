// Native Touch Events are the phone's primary input. No pointer capture.
// Track one movement finger; the skill button may use a second finger independently.
export function bindInput({area,canvas,skill,host=window,active,onMove,onSkill}){
 let finger=null,mouse=false,lastTouch=-Infinity,lastSkillTouch=-Infinity;
 const move=clientX=>{if(!active())return;const r=canvas.getBoundingClientRect();if(r.width)onMove((clientX-r.left)*420/r.width);};
 const ignored=target=>!!target?.closest?.('button,#overlay,#top');
 const find=(list,id)=>Array.from(list||[]).find(t=>t.identifier===id);
 function reset(){finger=null;mouse=false;}
 area.addEventListener('touchstart',e=>{if(finger!==null&&e.touches&&!find(e.touches,finger))finger=null;if(!active()||finger!==null||ignored(e.target))return;const t=e.changedTouches[0];if(!t)return;finger=t.identifier;lastTouch=Date.now();move(t.clientX);if(e.cancelable)e.preventDefault();},{passive:false});
 host.addEventListener('touchmove',e=>{if(finger===null||!active())return;const t=find(e.touches,finger);if(t){move(t.clientX);if(e.cancelable)e.preventDefault();}},{passive:false,capture:true});
 const finish=e=>{if(finger!==null&&(find(e.changedTouches,finger)||(e.touches&&!find(e.touches,finger)))){finger=null;lastTouch=Date.now();}};
 host.addEventListener('touchend',finish,{passive:true,capture:true});
 host.addEventListener('touchcancel',finish,{passive:true,capture:true});
 skill.addEventListener('touchstart',e=>{lastTouch=Date.now();lastSkillTouch=Date.now();if(e.cancelable)e.preventDefault();e.stopPropagation();if(active()&&!skill.disabled)onSkill();},{passive:false});
 skill.addEventListener('click',()=>{if(Date.now()-lastSkillTouch>700&&active())onSkill();});
 area.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||Date.now()-lastTouch<800||!active()||ignored(e.target))return;mouse=true;move(e.clientX);});
 host.addEventListener('pointermove',e=>{if(mouse&&active())move(e.clientX);});
 host.addEventListener('pointerup',()=>mouse=false);
 host.addEventListener('pointercancel',()=>mouse=false);
 host.addEventListener('blur',reset);
 return {reset,trackedFinger:()=>finger};
}
