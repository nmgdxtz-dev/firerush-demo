import {W,H,GOAL,LIMIT,clamp,tier,weapons,createGame,step,rush,seam,choices,formationPreview,rushCost} from './game.js';
import {bindInput} from './input.js';
const canvas=document.querySelector('#c'),g=canvas.getContext('2d'),overlay=document.querySelector('#overlay'),controls=document.querySelector('#controls'),skill=document.querySelector('#skill');
let s=createGame(),view='menu',keys={},last=0,freeze=false,hidden=false,muted=true,audio,best=0;
try{best=+localStorage.getItem('fr010best')||0;}catch{}
const C={mint:'#9ffff0',gold:'#ffda9e',coral:'#ffad99',ink:'#12313a',pale:'#e8f4df'};
const box=(x,y,w,h,c,r=0)=>{g.fillStyle=c;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();};
const circle=(x,y,r,c)=>{g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();};
const line=(x,y,xx,yy,c,w=1)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke();};
function text(a,x,y,size=12,color=C.pale,align='center'){g.fillStyle=color;g.font=`800 ${size}px system-ui`;g.textAlign=align;g.fillText(a,x,y);}
function resize(){const d=Math.min(devicePixelRatio||1,2);canvas.width=W*d;canvas.height=H*d;g.setTransform(d,0,0,d,0,0);}resize();addEventListener('resize',resize);
const screen=z=>550-(z-s.camera)*.79;
// Original procedural sprites are cached once; crowd rendering uses drawImage, not hundreds of paths.
const sprites={};
for(const type of ['swarm','heavy','lantern']){const c=document.createElement('canvas');c.width=c.height=40;const q=c.getContext('2d');q.fillStyle='#05262a70';q.beginPath();q.ellipse(20,29,14,7,0,0,Math.PI*2);q.fill();q.fillStyle=type==='heavy'?'#b4b4a4':'#438e85';q.beginPath();q.moveTo(8,25);q.quadraticCurveTo(5,3,19,5);q.quadraticCurveTo(35,1,33,24);q.lineTo(29,32);q.lineTo(23,28);q.lineTo(18,33);q.lineTo(12,28);q.fill();q.fillStyle=type==='heavy'?'#545d66':'#1b5b60';q.fillRect(10,12,20,7);q.fillStyle=type==='heavy'?'#ffc38e':'#c1ffdc';q.fillRect(13,14,4,3);q.fillRect(24,14,4,3);if(type==='heavy'){q.fillStyle='#d7c0ab';q.fillRect(16,6,7,4);q.fillRect(11,25,18,5);}if(type==='lantern'){q.fillStyle='#ffbe62';q.beginPath();q.arc(20,19,12,0,Math.PI*2);q.fill();q.fillStyle='#fff0bb';q.fillRect(17,8,6,20);q.fillRect(9,16,22,5);}sprites[type]=c;}
function cat(x,y,k=1){g.save();g.translate(x,y);g.scale(k,k);circle(0,5,13,'#152b3b');g.fillStyle='#152b3b';g.beginPath();g.moveTo(-12,1);g.lineTo(-14,-17);g.lineTo(-3,-9);g.lineTo(11,-17);g.lineTo(13,3);g.fill();box(-9,-1,5,3,C.mint,1);box(4,-1,5,3,C.mint,1);box(-11,15,23,5,C.mint,2);g.restore();}
function dog(x,y,k=1){g.save();g.translate(x,y);g.scale(k,k);circle(-12,-4,8,'#b07b58');circle(12,-4,8,'#b07b58');circle(0,5,15,'#ffcf92');circle(-5,2,2,C.ink);circle(5,2,2,C.ink);circle(0,8,3,C.ink);box(-12,17,24,5,'#f29991',2);g.restore();}
function ground(){
 const palettes=[['#153b42','#224e53','#2d6263'],['#402e42','#59374b','#774458'],['#3d5058','#53666c','#738086']],p=palettes[s.phase];box(0,0,W,H,p[0]);
 for(let i=0;i<16;i++){const world=Math.floor(s.camera/90)*90+i*90-270,yy=screen(world);if(yy<-50||yy>810)continue;line(21,yy,399,yy,p[1],2);for(let j=0;j<5;j++)box(25+j*79+(i%2)*8,yy-45,66,36,p[1]+'66',4);}
 for(let i=0;i<10;i++){let world=Math.floor(s.camera/145)*145+i*145-300,y=screen(world);box(4,y,18,65,p[2],4);box(399,y+36,17,65,p[2],4);box(8,y+5,3,24,C.gold,1);box(407,y+40,3,24,C.gold,1);}
 for(const p of s.footprints){g.globalAlpha=p.life*.15;box(p.x-3,screen(p.z),5,9,C.gold,2);}g.globalAlpha=1;
 if(s.rear>45){const inset=(s.rear-45)*.42;box(0,130,inset,630,'#e4979540');box(W-inset,130,inset,630,'#e4979540');}
 if(s.dash){for(let i=0;i<18;i++){const x=(i*79+31)%420,y=(i*113+s.time*1800)%730;line(x,y,x,y+55,C.gold+'60',2);}}
}
function sea(){
 const leading=new Float32Array(26).fill(-70);let visible=[];
 for(const e of s.enemies){const y=screen(e.z);if(y<125||y>720)continue;visible.push(e);const col=clamp(Math.floor(e.x/16),0,25);leading[col]=Math.max(leading[col],y);}
 // An unbroken silhouette makes the crowd read as a moving mass. A cut is an actual notch.
 g.fillStyle=['#347c7350','#a06a7350','#9eaeb140'][s.phase];g.beginPath();g.moveTo(12,130);g.lineTo(408,130);for(let col=25;col>=0;col--){const yy=leading[col]>0?leading[col]:140;g.lineTo(10+col*16,yy+10);}g.closePath();g.fill();
 visible.sort((a,b)=>b.z-a.z);
 for(const e of visible){const y=screen(e.z),scale=clamp(1-(550-y)*.0006,.65,1.08),size=(e.type==='heavy'?29:24)*scale;g.drawImage(sprites[e.type],e.x-size/2,y-size/2,size,size);}
}
function fronts(){
 for(const f of s.fronts){const y=screen(f.z);if(y<135||y>710)continue;
  if(f.breached){line(20,y,f.x-42,y,'#a1f4d650',5);line(f.x+42,y,400,y,'#a1f4d650',5);continue;}
  const open=f.open>0||f.held;
  g.strokeStyle=s.phase===1?'#cb8b9c':'#7bb1a5';g.lineWidth=17;g.beginPath();
  for(let x=16;x<=404;x+=8){if(open&&Math.abs(x-f.x)<40){g.moveTo(x,y);continue;}const wave=Math.sin(x*.06+s.time*2)*4;if(x===16)g.moveTo(x,y+wave);else g.lineTo(x,y+wave);}g.stroke();
  for(let x=20;x<405;x+=17){if(open&&Math.abs(x-f.x)<40)continue;g.drawImage(sprites.heavy,x-14,y-16,28,28);}
  if(open){g.fillStyle='#ffdc9c33';g.beginPath();g.moveTo(f.x-32,y);g.lineTo(f.x+32,y);g.lineTo(s.x+32,550);g.lineTo(s.x-32,550);g.closePath();g.fill();line(f.x-35,y-22,f.x-35,y+20,C.gold,3);line(f.x+35,y-22,f.x+35,y+20,C.gold,3);text(f.held?'咕咕撑住了！':'裂口 '+f.open.toFixed(1)+'s',f.x,y-32,14,C.gold);}
  else{circle(f.x,y,21,'#ffce9360');circle(f.x,y,12,C.coral);circle(f.x,y,6,C.gold);box(f.x-27,y+25,54,5,'#12313a',2);box(f.x-27,y+25,54*Math.max(0,f.hp/f.max),5,C.gold,2);text('击碎缝眼',f.x,y-29,11,C.gold);}
 }
}
function render(){ground();
 for(const w of s.wakes){g.globalAlpha=Math.min(1,w.life);g.strokeStyle='#ffe0a0';g.lineWidth=13;g.lineCap='round';g.beginPath();w.points.forEach((p,i)=>i?g.lineTo(p.x,screen(p.z)):g.moveTo(p.x,screen(p.z)));g.stroke();g.strokeStyle='#fff5dc';g.lineWidth=3;g.stroke();g.globalAlpha=1;}
 sea();fronts();
 for(const r of s.rings){g.globalAlpha=Math.max(0,r.life/.55);g.strokeStyle='#ffdc96';g.lineWidth=4;g.beginPath();g.ellipse(r.x,screen(r.z),(1-r.life/.6)*78,(1-r.life/.6)*54,0,0,Math.PI*2);g.stroke();g.globalAlpha=1;}
 if(s.chainWindow>0)text('接力 ×'+s.chain+' · '+s.chainWindow.toFixed(1)+'s',210,155,20,C.gold);

 const playerY=screen(s.distance),span=22*s.width,run=s.dash?0:Math.sin(s.time*20)*2;
 for(const t of s.traces){const f=1-t.life/.13,yy=screen(t.z+(t.tz-t.z)*f),xx=t.x+(t.tx-t.x)*f;g.globalAlpha=clamp(t.life*10,0,1);line(xx,yy,xx+(t.tx-t.x)*.2,yy-(t.tz-t.z)*.79*.18,t.color,2);}
 g.globalAlpha=1;
 for(const p of s.particles){g.globalAlpha=Math.min(1,p.life*3);box(p.x,screen(p.z),3,3,p.color,1);}g.globalAlpha=1;
 if(view!=='menu'){
  if(s.dash){g.fillStyle='#ffce9250';g.beginPath();g.moveTo(s.dash.x-26*s.width,screen(s.dash.from));g.lineTo(s.dash.x+26*s.width,screen(s.dash.from));g.lineTo(s.x+span,playerY);g.lineTo(s.x-span,playerY);g.closePath();g.fill();}
  circle(s.x-span,playerY+19,11,'#09292d80');circle(s.x+span,playerY+19,12,'#09292d80');
  line(s.x-span,playerY+12,s.x,playerY+19,C.gold,s.dash?5:2);line(s.x,playerY+19,s.x+span,playerY+11,C.gold,s.dash?5:2);
  // Feet, scarves and a ground shadow distinguish running from a floating craft.
  line(s.x-span-4,playerY+17,s.x-span-6,playerY+24+run,'#152b3b',5);line(s.x-span+4,playerY+17,s.x-span+6,playerY+24-run,'#152b3b',5);
  line(s.x+span-5,playerY+18,s.x+span-7,playerY+24-run,'#bb895b',5);line(s.x+span+5,playerY+18,s.x+span+7,playerY+24+run,'#bb895b',5);
  cat(s.x-span,playerY+run,1.1);dog(s.x+span,playerY-run,1);
  line(s.x-span-13,playerY+12,s.x-span-30,playerY+18+run,C.mint,4);line(s.x+span+12,playerY+13,s.x+span+26,playerY+20-run,C.coral,4);
 }
 if(s.pulse>0){g.globalAlpha=s.pulse*.5;g.strokeStyle=C.gold;g.lineWidth=5;g.beginPath();g.ellipse(s.x,playerY,35+(1-s.pulse)*120,17+(1-s.pulse)*45,0,0,Math.PI*2);g.stroke();g.globalAlpha=1;}
 // Persistent forward progress is the hero of the dashboard.
 box(0,0,420,125,'#102c39f5');text('FIRE / RUSH',17,24,11,C.mint,'left');text('织光破潮 V0.10',17,44,10,'#a3c7c8','left');text(Math.min(GOAL,Math.floor(s.distance))+' / '+GOAL,398,72,23,C.gold,'right');
 text('心弦',17,70,10,C.pale,'left');box(48,61,107,9,'#325562',4);box(48,61,107*s.hull/100,9,s.hull<30?C.coral:C.mint,4);text(Math.ceil(s.hull),162,71,12,C.pale,'left');
 box(17,86,386,4,'#2c4d59',2);box(17,86,386*Math.min(1,s.distance/GOAL),4,C.gold,2);
 text('敌潮 '+s.enemies.length+' · 火力 '+s.power,17,111,11,C.pale,'left');text('回涌 '+Math.floor(s.rear)+'%',399,111,11,s.rear>65?C.coral:C.mint,'right');
 text(['01 / 青潮起浪','02 / 赤潮收拢','03 / 白潮破晓'][s.phase],18,147,11,C.mint,'left');text(weapons[tier(s.power)],400,147,11,C.gold,'right');
 const gap=seam(s),next=s.fronts.find(f=>!f.breached);
 if(view==='play'){
  const msg=s.dash?'一起向前！':next&&next.z-s.distance<330&&next.open<=0?'滑向橙色缝眼，集火凿开潮脊':gap.ready?'缺口贯通！点拉弦，向前冲':'缺口正在合拢 · 先清正前方';
  box(30,610,360,29,'#102d38e8',7);text(msg,210,629,12,gap.ready?C.gold:C.pale);
  text('心弦蓄力 '+Math.floor(s.tension)+'%',19,662,10,C.mint,'left');text('缺口 '+gap.clarity+'%',19,683,10,gap.ready?C.gold:C.coral,'left');
 }
 if(s.choice){for(let i=0;i<2;i++){const x=15+i*203,selected=(s.x<210?0:1)===i,p=formationPreview(s,i);box(x,173,187,63,selected?'#285562f2':'#123543ef',7);if(selected){g.strokeStyle=C.gold;g.lineWidth=2;g.strokeRect(x+1,174,185,61);}text(choices[i].name,x+93,196,15,C.gold);text('伤害 ×'+p.damage.toFixed(2)+' / 宽度 ×'+p.width.toFixed(2),x+93,219,11,C.pale);text((selected?'当前阵型 · ':'移至此侧 · ')+Math.ceil(s.choice.remaining)+'s',x+93,233,10,selected?C.mint:C.coral);}}
 for(let i=0;i<s.notices.length;i++){const n=s.notices[i];g.globalAlpha=Math.min(1,n.life);box(20,335+i*27,380,24,'#102c39e6',5);text(n.text,210,352+i*27,10,n.color);}g.globalAlpha=1;
}
function show(html){overlay.innerHTML=html;overlay.hidden=false;controls.hidden=true;}
function menu(){view='menu';show(`<div class="eyebrow">V0.10 · CUT A SEAM / PULL FORWARD</div><h1 class="title">火力突围<br><em>织光破潮</em></h1><p class="subtitle">把整片敌潮，撕成两个人的路。</p><div class="rule"><b>墨墨凿开缝眼，咕咕拉着你冲进裂口。</b><br>① 左右滑动，向橙色缝眼集中火力。<br>② 潮脊裂开后，趁 <b>3.6 秒</b> 窗口点右下角拉弦。<br>③ <b>滑动弯冲</b>，留下金色心弦阻挡回涌。<br>④ 落地后 <b>1.8 秒</b> 内再次冲锋，接力只耗 22 弦，最多三连冲。<br>⑤ 打爆<b>金色灯蛹</b>引发连锁；无缺口时拉弦会回旋护身。<br>⑥ 敌潮从两侧回涌，停留越久，退路越窄。<br>收束成矛或展开成翼，让心弦变成不同形状。</div><button class="primary" id="start">牵紧我，一起冲 →</button><p class="fine">原生触摸 · 越界持续控制 · 松手可继续<br>独立双指拉弦 · A/D 移动 · 空格冲锋 · P 暂停<br>前进目标 5400 · 最高击破 ${best} · 零外部素材下载</p>`);document.querySelector('#start').onclick=()=>start();}
function start(seed){s=createGame(typeof seed==='number'?seed:Date.now());view='play';overlay.hidden=true;controls.hidden=false;input.reset();keys={};last=performance.now();}
function end(){view=s.mode;input.reset();best=Math.max(best,s.kills);try{localStorage.setItem('fr010best',best);}catch{}show(`<div class="eyebrow">${s.mode==='win'?'WE TORE OPEN THE DAWN':'THE TIDE CLOSED IN'}</div><h1 class="title">${s.mode==='win'?'天亮了，手还牵着':'潮合拢了，再冲一次'}</h1><div class="stats"><div>前进<strong>${Math.floor(s.distance)}</strong></div><div>破浪<strong>${s.cleanRushes}</strong></div><div>护身<strong>${s.hardRushes}</strong></div></div><div class="rule">${s.reason}<br>${s.hardRushes>2?'别只按冲锋：先把正前方凿空，再看准橙色缝眼。':'潮脊开口后只剩 3.6 秒；留好拉弦蓄力和冷却，才能抓住窗口。'}<br>击破 ${s.kills} · 用时 ${Math.floor(s.time)}s<br>阵型 ${s.history.join(' / ')||'尚未调整'}</div><button class="primary" id="again">换一条裂口，再冲 ↻</button><button class="secondary" id="back">返回出发点</button>`);document.querySelector('#again').onclick=()=>start();document.querySelector('#back').onclick=menu;}
function pause(){if(view==='pause'){resume();return;}if(view!=='play')return;view='pause';input.reset();keys={};show('<div class="eyebrow">STILL HOLDING HANDS</div><h1 class="title">等你，潮也停了</h1><div class="rule">战场已暂停。<br>收束更容易穿透缝眼，展开能压住更多侧翼。<br>右下角显示风险：缺口未通时拉弦会消耗蓄力回旋护身。</div><button class="primary" id="resume">继续向前 →</button><button class="secondary" id="restart">重新出发</button>');document.querySelector('#resume').onclick=resume;document.querySelector('#restart').onclick=()=>start();}
function resume(){view='play';overlay.hidden=true;controls.hidden=false;last=performance.now();}
function sound(){if(muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),a=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(130,audio.currentTime);o.frequency.exponentialRampToValueAtTime(600,audio.currentTime+.2);a.gain.setValueAtTime(.035,audio.currentTime);a.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.3);o.connect(a).connect(audio.destination);o.start();o.stop(audio.currentTime+.3);}catch{}}
function useSkill(){if(rush(s))sound();}
const input=bindInput({area:document.querySelector('#game'),canvas,skill,active:()=>view==='play',onMove:x=>s.target=clamp(x,29,391),onSkill:useSkill});
document.querySelector('#pause').onclick=pause;document.querySelector('#sound').onclick=()=>{muted=!muted;document.querySelector('#sound').textContent='音效 '+(muted?'OFF':'ON');sound();};
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(!e.repeat){if(e.key===' '&&view==='play')useSkill();if(e.key.toLowerCase()==='p')pause();}});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>keys={});document.addEventListener('visibilitychange',()=>{hidden=document.hidden;input.reset();keys={};last=performance.now();});
function frame(now){const dt=clamp((now-last)/1000,0,.04);last=now;if(view==='play'&&!freeze&&!hidden){const d=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);if(d)s.target=clamp(s.target+d*370*dt,29,391);step(s,dt);if(s.mode!=='play')end();}const gap=seam(s);skill.disabled=!!s.dash||s.cooldown>0||s.tension<rushCost(s);skill.classList.toggle('risk',!gap.ready&&!skill.disabled);skill.querySelector('b').textContent=s.dash?'牵紧，一起向前！':s.cooldown>0?'拉弦冷却 '+s.cooldown.toFixed(1)+'s':s.tension<rushCost(s)?'蓄力 '+Math.floor(s.tension)+' / '+rushCost(s):gap.ready?'牵手 · 向前破浪':'咕咕 · 回旋护身';skill.querySelector('small').textContent=s.dash?'心弦正在把两人拉进缺口':gap.ready?s.chainWindow>0?'接力冲锋只耗 22 · 滑动弯冲':'推进 240 · 留下心弦拦潮':'清开近身敌群 · 耗弦 12';render();requestAnimationFrame(frame);}
menu();requestAnimationFrame(frame);
if(new URLSearchParams(location.search).has('test'))window.__game={state:()=>s,start,pause,resume,input,step:dt=>step(s,dt),rush:useSkill,freeze:v=>freeze=v,render:()=>{render();if(s.mode!=='play'&&view==='play')end();}};
