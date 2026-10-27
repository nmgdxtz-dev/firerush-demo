import {W,H,FINISH,clamp,tier,weaponNames,createGame,step,pulse,routeValue,canRoute} from './game.js';
const canvas=document.querySelector('#c'),ctx=canvas.getContext('2d'),overlay=document.querySelector('#overlay'),controls=document.querySelector('#controls'),skill=document.querySelector('#skill');
let s=createGame(),view='menu',last=0,drag=false,keys={},sound=false,audio=null,previousKills=0,best=0,run=0,diagnosticFrozen=false;
try{best=Number(localStorage.getItem('fr07best'))||0;}catch{}
function resize(){const d=Math.min(devicePixelRatio||1,2);canvas.width=W*d;canvas.height=H*d;ctx.setTransform(d,0,0,d,0,0);}resize();addEventListener('resize',resize);
const C={mint:'#83e2c5',gold:'#f7cb91',red:'#fa8f97',ink:'#101e2a',muted:'#91b1bc'};
function box(x,y,w,h,color,r=0){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function text(str,x,y,size=14,color='#e4f2ed',align='center',weight=700){ctx.fillStyle=color;ctx.font=`${weight} ${size}px system-ui`;ctx.textAlign=align;ctx.fillText(str,x,y);}
function line(x,y,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
function momo(x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);circle(0,5,13,'#263646');ctx.fillStyle='#263646';ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(-13,-17);ctx.lineTo(-2,-10);ctx.lineTo(10,-18);ctx.lineTo(13,1);ctx.fill();box(-9,-2,5,3,C.mint,1);box(4,-2,5,3,C.mint,1);box(-10,13,20,5,C.mint,2);line(11,13,23,9,C.gold,4);ctx.restore();}
function gugu(x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);circle(-13,-7,8,'#bc7d51');circle(13,-7,8,'#bc7d51');circle(0,3,16,C.gold);circle(-6,0,2,C.ink);circle(6,0,2,C.ink);circle(0,6,3,C.ink);box(-12,16,24,5,'#ec8e9a',2);ctx.restore();}
function background(){
  const phase=Math.min(2,Math.floor(s.time/42)), palettes=[['#152b38','#233d46','#2d4e54'],['#1d253d','#323c51','#414b61'],['#252b32','#41474a','#535b58']];const p=palettes[phase];
  box(0,0,W,H,p[0]);
  for(let i=0;i<12;i++){const y=(i*95+s.time*34)%920-100;box(6,y,28,65,p[1],3);box(386,y+38,29,65,p[1],3);box(11,y+8,3,22,C.mint,1);}
  box(43,0,334,H,p[1]);box(50,0,320,H,p[0]);
  for(let i=0;i<16;i++){let y=(i*61+s.time*92)%850-70;line(51,y,369,y,p[1],2);box(151,y,3,23,p[2],1);box(266,y,3,23,p[2],1);}
  line(44,0,44,H,'#7acdbb',2);line(376,0,376,H,'#7acdbb',2);
  for(let i=0;i<7;i++){let y=(i*127+s.time*92)%850;box(39,y,9,29,C.gold,2);box(372,y,9,29,C.gold,2);}
  // Escort is a vulnerable destination for every leaked enemy.
  line(49,650,371,650,'#ed9f8566',1);
  box(147,620,126,44,'#1a2a35',10);box(158,625,104,29,'#496870',7);box(166,628,88,5,C.mint,2);
  for(let i=0;i<4;i++)box(171+i*22,640,15,9,s.hull>i*25?C.gold:'#263b46',2);
  circle(147,642,7,'#101c28');circle(273,642,7,'#101c28');
  text('能源车 · 漏敌会损伤车体',210,675,10,C.muted);
}
function render(){background();
  for(const o of s.barrels){circle(o.x,o.y,29,'#f7cb9116');box(o.x-18,o.y-22,36,44,'#e1a963',5);box(o.x-12,o.y-13,24,26,'#473e36',3);text('ϟ',o.x,o.y+9,26,C.gold);}
  for(const h of s.hazards){if(h.type==='wall'){box(h.x,h.y,h.w,h.h,'#465b66',4);for(let j=0;j<5;j++)line(h.x+j*25,h.y+5,h.x+j*25+16,h.y+30,C.gold,6);box(h.x+3,h.y+2,h.w-6,3,'#dce2c9',1);}else {box(h.x,h.y,h.w,h.h,'#fa6f8b55',3);line(h.x,h.y+h.h/2,h.x+h.w,h.y+h.h/2,'#ff9baa',4);}}
  if(s.boss){const b=s.boss;if(b.warning>0){box(b.lane*126+21,190,126,420,Math.sin(s.time*22)>0?'#fa8f9733':'#fa8f9715');text('撤离此车道',b.lane*126+84,490,15,C.red);}
    ctx.save();ctx.translate(b.x,b.y);for(const side of [-1,1]){box(side*45-16,-15,32,70,'#435b69',7);box(side*45-12,25,24,26,'#1b2a39',3);circle(side*45,50,6,C.red);}box(-41,-37,82,82,'#6e8991',12);circle(0,0,29,'#243b48');circle(0,0,19,b.exposed>0?C.gold:C.red);circle(0,0,9,'#fff1c3');ctx.restore();
  }
  for(const b of s.bullets){line(b.x,b.y+14,b.x,b.y-6,tier(s.charge)>=2?C.gold:C.mint,tier(s.charge)>=2?4:3);circle(b.x,b.y-6,2,'#fff4d9');}
  for(const e of s.enemies){ctx.save();ctx.translate(e.x,e.y);const col=e.type==='armor'?'#91a8b5':e.type==='runner'?C.red:e.type==='gunner'?'#be9dd6':'#6fb19e';circle(0,5,e.r+2,'#101e2a66');if(e.type==='armor'){box(-21,-18,42,37,col,6);box(-14,-9,28,8,'#2a414d',2);}else{ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(15,8);ctx.lineTo(8,15);ctx.lineTo(-8,15);ctx.lineTo(-15,8);ctx.fill();}circle(-5,1,2,C.ink);circle(5,1,2,C.ink);if(e.type==='gunner')box(-3,7,6,15,C.gold,2);if(e.hp<e.max)box(-16,-25,32*e.hp/e.max,3,C.red,2);ctx.restore();}
  for(const b of s.shots){circle(b.x,b.y,7,'#f58a9a33');circle(b.x,b.y,4,C.red);circle(b.x,b.y,2,'#ffe8d5');}
  for(const p of s.particles){ctx.globalAlpha=Math.min(1,p.life*3);box(p.x,p.y,4,4,p.color,1);}ctx.globalAlpha=1;
  if(s.pulse>0){ctx.strokeStyle=C.mint;ctx.lineWidth=5;ctx.globalAlpha=s.pulse;ctx.beginPath();ctx.arc(s.x,550,(.65-s.pulse)*850+30,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
  if(view!=='menu'){
    ctx.globalAlpha=s.invulnerable>0&&Math.floor(s.time*18)%2?.4:1;
    line(s.x-23,554,s.x+24,554,'#f6cab0',3);momo(s.x-18,543,1.1);gugu(s.x+21,553,.9);
    box(s.x-22,515,8,21,'#9fe8d5',3);box(s.x-20,512,4,8,'#fff0d2',1);
    for(let i=0;i<tier(s.charge);i++)box(s.x-35-i*7,525+i*4,5,18,C.gold,2);
    if(s.shield){ctx.strokeStyle=C.mint;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(s.x,551,48,37,0,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
  }
  // HUD is opaque so choices and threats remain legible.
  box(0,0,420,106,'#0d1c29f5');text('FIRE / RUSH',18,24,11,C.mint,'left',900);
  text('车体',18,49,10,C.muted,'left');box(52,40,126,10,'#2b414c',5);box(52,40,126*s.hull/100,10,s.hull<30?C.red:C.mint,5);text(Math.ceil(s.hull),187,49,12,'#fff','left');
  text('电荷',234,49,10,C.muted,'left');text(String(s.charge).padStart(2,'0'),287,52,25,C.gold,'left');text('警戒 '+ '◆'.repeat(s.alert)+'◇'.repeat(4-s.alert),18,72,10,C.red,'left');
  text(weaponNames[tier(s.charge)]+' · 回收 '+(s.kills%4)+'/4',397,73,12,C.gold,'right');
  const progress=Math.min(1,s.time/FINISH);box(18,88,384,3,'#2c4451',1);box(18,88,384*progress,3,C.mint,1);
  text(s.boss?'04 / 灯塔封锁':`${['01 / 雨港回收','02 / 霓虹水道','03 / 风化高架'][Math.min(2,Math.floor(s.time/42))]}`,18,122,12,C.mint,'left');
  text(`${Math.floor(s.time)}s · 击破 ${s.kills}`,401,122,11,C.muted,'right');
  if(s.boss){box(18,141,384,9,'#2c4451',4);box(18,141,384*Math.max(0,s.boss.hp/s.boss.max),9,C.red,4);text((s.boss.exposed>0?'核心暴露！集中火力':'装甲闭合 · 红线扫射后核心暴露')+' / '+Math.ceil(Math.max(0,s.boss.hp)),210,169,11,s.boss.exposed>0?C.gold:C.red);}
  if(s.gate){let gate=s.gate;
    for(let i=0;i<2;i++){const r=gate.options[i],selected=(s.x<210?0:1)===i,xx=12+i*203;box(xx,184,193,108,selected?'#30574fee':'#152b3aee',8);if(selected){ctx.strokeStyle=C.mint;ctx.lineWidth=2;ctx.strokeRect(xx+2,186,189,104);}text(r.title,xx+96,208,13,canRoute(s,r)?'#ecf5ec':C.red);text(`${s.charge} ${r.op} → ${routeValue(s.charge,r)}`,xx+96,239,20,C.gold);text(r.detail.split(' · ').slice(1).join(' · '),xx+96,261,11,C.muted);text(canRoute(s,r)?(selected?'当前路线':'移向此侧选择'):'不足：绕行扣 10 车体',xx+96,281,10,selected?C.mint:C.red);}
    text(`路线锁定 ${Math.ceil(gate.remaining)} 秒`,210,315,14,C.gold);line(210,330,210,550,'#83e2c555',2);
  }
  if(s.combo>=8&&!s.gate)text(`${s.combo} 连破`,210,207,21,C.gold);
  for(let i=0;i<s.texts.length;i++){const f=s.texts[i];ctx.globalAlpha=Math.min(1,f.life*2);box(22,370+i*29,376,25,'#101e2ad9',5);text(f.text,210,387+i*29,11,f.color);}ctx.globalAlpha=1;
  if(s.shield)text('护盾 ×'+s.shield,24,607,11,C.mint,'left');text('同心 '+s.bond+'%',397,607,11,C.mint,'right');
}
function show(html){overlay.innerHTML=html;overlay.hidden=false;controls.hidden=true;}
function menu(){view='menu';show(`<div class="eyebrow">ORIGINAL DUO SURVIVAL · V0.7</div><h1 class="title">火力突围<br><em>同心电路</em></h1><p class="subtitle">把最后一束光，送回家。</p><div class="duo">墨墨 · 穿甲双枪　♥　咕咕 · 共振守护</div><div class="rule">① <b>单指左右拖动</b>，自动开火，保护后方能源车。<br>② <b>每 4 击破 +1 电荷</b>，重甲额外 +2。<br>　 <b>18 / 40 / 70</b> 电荷进化武器。<br>③ 岔路按所在半边结算；高收益有代价。<br>④ 危急时点<b>咕咕共振</b>：花 12 电荷清弹震敌。</div><button class="primary" id="start">一起突围 →</button><p class="fine">约 3 分钟 · 6 次路线决策 · 最终封锁机甲<br>键盘：← → / A D 移动 · 空格共振 · P 暂停<br>最高击破 ${best} · 无外部素材 / 无网络加载</p>`);document.querySelector('#start').onclick=start;}
function start(seed){s=createGame(typeof seed==='number'?seed:Date.now()+(++run));view='play';last=performance.now();previousKills=0;overlay.hidden=true;controls.hidden=false;drag=false;keys={};}
function end(){view=s.mode;best=Math.max(best,s.kills);try{localStorage.setItem('fr07best',best);}catch{}
  show(`<div class="eyebrow">${view==='win'?'LIGHT DELIVERED':'ONE MORE ROUTE'}</div><h1 class="title">${view==='win'?'灯塔，为你亮起':'再靠近一点'}</h1><p class="result-reason">${s.reason}</p><div class="stats"><div>击破<strong>${s.kills}</strong></div><div>坚持<strong>${Math.floor(s.time)}s</strong></div><div>漏敌<strong>${s.leaked}</strong></div></div><div class="rule">${view==='win'?'咕咕：下次，换一条路回家？':'墨墨：再来，这次我们一起把路清出来。'}<br>${s.leaked>10?'后方失守较多：优先清理靠近车体的敌人。':s.hull<=0?'尝试留电荷进入维修支路，别把车体押在超载上。':'电荷决定枪型；共振前，留意是否会跌破进化门槛。'}<br>路线：${s.history.map(r=>r.title).join(' → ')||'尚未抵达第一处岔路'}</div><button class="primary" id="again">再走一条路线 ↻</button><button class="secondary" id="back">返回出发点</button><p class="fine">本机最高击破 ${best} · 每局敌潮与路障位置变化</p>`);document.querySelector('#again').onclick=start;document.querySelector('#back').onclick=menu;
}
function pause(){if(view==='play'){view='pause';drag=false;keys={};show('<div class="eyebrow">TAKE A BREATH</div><h1 class="title">靠一下肩膀</h1><div class="rule">移动和战斗已暂停。<br>电荷不是分数：花掉它可能降级武器，却能让你们活下来。</div><button class="primary" id="resume">继续护送 →</button><button class="secondary" id="restart">重新出发</button>');document.querySelector('#resume').onclick=resume;document.querySelector('#restart').onclick=start;}else if(view==='pause')resume();}
function resume(){view='play';last=performance.now();overlay.hidden=true;controls.hidden=false;}
function beep(freq=280){if(!sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),gain=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.55,audio.currentTime+.07);gain.gain.setValueAtTime(.025,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.08);o.connect(gain).connect(audio.destination);o.start();o.stop(audio.currentTime+.09);}catch{}}
function useSkill(){if(pulse(s)){beep(130);}}
skill.onclick=useSkill;document.querySelector('#pause').onclick=pause;document.querySelector('#sound').onclick=()=>{sound=!sound;document.querySelector('#sound').textContent='音效 '+(sound?'ON':'OFF');beep(500);};
function pointer(e){const r=canvas.getBoundingClientRect();s.target=clamp((e.clientX-r.left)*W/r.width,28,392);}
canvas.addEventListener('pointerdown',e=>{if(view!=='play')return;drag=true;canvas.setPointerCapture(e.pointerId);pointer(e);});canvas.addEventListener('pointermove',e=>{if(drag&&view==='play')pointer(e);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,()=>drag=false);
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(e.repeat)return;if(e.key===' '&&view==='play')useSkill();if(e.key.toLowerCase()==='p')pause();});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>{keys={};drag=false;if(view==='play')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&view==='play')pause();});
function frame(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;if(view==='play'&&!diagnosticFrozen){const direction=(keys.arrowright||keys.d?1:0)-(keys.arrowleft||keys.a?1:0);if(direction)s.target=clamp(s.target+direction*340*dt,28,392);step(s,dt);if(s.kills>previousKills){beep(300+tier(s.charge)*110);previousKills=s.kills;}skill.disabled=s.cooldown>0||s.charge<12;skill.querySelector('b').textContent=s.cooldown>0?`共振冷却 ${s.cooldown.toFixed(1)}s`:s.charge<12?'电荷不足 · 需要 12':'咕咕 · 共振';if(s.mode!=='play')end();}render();requestAnimationFrame(frame);}
menu();requestAnimationFrame(frame);
// Explicit opt-in diagnostics for browser tests; absent in ordinary play.
if(new URLSearchParams(location.search).has('test'))window.__game={state:()=>s,start,step:(dt)=>step(s,dt),pause,resume,pulse:useSkill,freeze:(v)=>diagnosticFrozen=v,render:()=>{render();if(s.mode!=='play'&&view==='play')end();}};
