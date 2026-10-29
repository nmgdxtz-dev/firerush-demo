import {W,H,GOAL,LIMIT,clamp,tier,weapons,createGame,step,rush,seam,choices,formationPreview,rushCost,road,obstacleX,obstacleAhead,result,skillCost,chooseFormation} from './game.js';
import {RenderBudget} from './runtime.js';
import {bindInput} from './input.js';
const canvas=document.querySelector('#c'),overlay=document.querySelector('#overlay'),controls=document.querySelector('#controls'),skill=document.querySelector('#skill');
let g=canvas.getContext('2d');
const formation=document.querySelector('#formation'),skillTitle=skill.querySelector('b'),skillHint=skill.querySelector('small');
let s=createGame(),view='menu',keys={},last=0,freeze=false,hidden=false,muted=true,audio,lastPop=0,best=0,bestScore=0;
try{best=+localStorage.getItem('fr012best')||0;bestScore=+localStorage.getItem('fr012score')||0;}catch{}
const C={mint:'#9ffff0',gold:'#ffda9e',coral:'#ffad99',ink:'#12313a',pale:'#e8f4df'};
const box=(x,y,w,h,c,r=0)=>{g.fillStyle=c;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();};
const circle=(x,y,r,c)=>{g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();};
const line=(x,y,xx,yy,c,w=1)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke();};
function text(a,x,y,size=12,color=C.pale,align='center'){g.fillStyle=color;g.font=`800 ${size}px system-ui`;g.textAlign=align;g.fillText(a,x,y);}
const renderBudget=new RenderBudget(devicePixelRatio||1);
function resize(){const d=renderBudget.scale;canvas.width=W*d;canvas.height=H*d;g.setTransform(d,0,0,d,0,0);}resize();addEventListener('resize',resize);
const screen=z=>550-(z-s.camera)*.79;
// Original procedural sprites are cached once; crowd rendering uses drawImage, not hundreds of paths.
const sprites={};
for(const type of ['swarm','heavy','lantern']){const c=document.createElement('canvas');c.width=c.height=40;const q=c.getContext('2d');q.fillStyle='#05262a70';q.beginPath();q.ellipse(20,29,14,7,0,0,Math.PI*2);q.fill();q.fillStyle=type==='heavy'?'#b4b4a4':'#438e85';q.beginPath();q.moveTo(8,25);q.quadraticCurveTo(5,3,19,5);q.quadraticCurveTo(35,1,33,24);q.lineTo(29,32);q.lineTo(23,28);q.lineTo(18,33);q.lineTo(12,28);q.fill();q.fillStyle=type==='heavy'?'#545d66':'#1b5b60';q.fillRect(10,12,20,7);q.fillStyle=type==='heavy'?'#ffc38e':'#c1ffdc';q.fillRect(13,14,4,3);q.fillRect(24,14,4,3);if(type==='heavy'){q.fillStyle='#d7c0ab';q.fillRect(16,6,7,4);q.fillRect(11,25,18,5);}if(type==='lantern'){q.fillStyle='#ffbe62';q.beginPath();q.arc(20,19,12,0,Math.PI*2);q.fill();q.fillStyle='#fff0bb';q.fillRect(17,8,6,20);q.fillRect(9,16,22,5);}sprites[type]=c;}
function cat(x,y,k=1){g.save();g.translate(x,y);g.scale(k,k);circle(0,5,13,'#152b3b');g.fillStyle='#152b3b';g.beginPath();g.moveTo(-12,1);g.lineTo(-14,-17);g.lineTo(-3,-9);g.lineTo(11,-17);g.lineTo(13,3);g.fill();box(-9,-1,5,3,C.mint,1);box(4,-1,5,3,C.mint,1);box(-11,15,23,5,C.mint,2);g.restore();}
function dog(x,y,k=1){g.save();g.translate(x,y);g.scale(k,k);circle(-12,-4,8,'#b07b58');circle(12,-4,8,'#b07b58');circle(0,5,15,'#ffcf92');circle(-5,2,2,C.ink);circle(5,2,2,C.ink);circle(0,8,3,C.ink);box(-12,17,24,5,'#f29991',2);g.restore();}
const districtNames=['01 / 薄荷港 · 沿海公路','02 / 赤岩湾 · 崖边栈道','03 / 白浪桥 · 风暴冲刺'];
const terrain=[['#286e67','#349b91','#d9c58b','#50615c'],['#8f5550','#d49873','#d7ad8d','#625864'],['#163c56','#286b83','#b6c8c6','#485b6b']];
function polygon(points,color){g.fillStyle=color;g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();}
function scenicProp(z,side,index){
 const y=screen(z);if(y<-400||y>1200)return;const r=road(z),x=side<0?r.left-25:r.right+25,t=r.biome;
 if(t===0){
  if(index%3===0&&side<0){box(x-24,y-29,43,38,'#dfd3ac',3);polygon([[x-29,y-28],[x-3,y-51],[x+25,y-28]],'#c27560');box(x-8,y-11,13,20,'#386b69',2);box(x-20,y-20,8,8,'#89c7bc',1);line(x+12,y-52,x+12,y-34,'#f0c59b',5);}
  else{line(x,y+12,x+Math.sin(index)*6,y-32,'#a8a078',6);const top=x+Math.sin(index)*6;for(let j=0;j<5;j++){const a=j*1.256;g.strokeStyle=j%2?'#70b78c':'#a1c98a';g.lineWidth=7;g.beginPath();g.moveTo(top,y-32);g.quadraticCurveTo(top+Math.cos(a)*24,y-43+Math.sin(a)*15,top+Math.cos(a)*28,y-26+Math.sin(a)*19);g.stroke();}circle(x,y-31,4,'#c6a16a');}
 }else if(t===1){
  polygon([[x-29,y+15],[x-21,y-23],[x-5,y-50],[x+15,y-30],[x+28,y+13]],'#b87962');polygon([[x-5,y-50],[x+2,y-3],[x+28,y+13],[x+15,y-30]],'#e1ad88');line(x-18,y-5,x-5,y-16,'#87544f',3);
  if(index%2===0){line(x-10,y+18,x-10,y-8,'#83a27e',5);line(x-10,y+3,x-20,y-1,'#83a27e',4);line(x-20,y-1,x-20,y-9,'#83a27e',4);}
 }else{
  box(x-7,y-65,14,91,'#839ba7',3);box(x-13,y-70,26,7,'#c7d8cf',2);line(x,y-63,x+side*29,y-90,'#bed6d7',2);line(x,y-63,x+side*29,y-20,'#bed6d7',2);box(x-3,y-55,6,10,C.gold,2);
 }
}
function staticGround(){
 box(0,0,W,H,'#286e67');
 const start=Math.floor((s.camera-500)/24)*24;
 for(let z=start;z<s.camera+1100;z+=24){const r=road(z),n=road(z+24),y=screen(z),yy=screen(z+24),p=terrain[r.biome];
  box(0,yy,W,y-yy+1,p[0]);box(r.right+8,yy,W-r.right,y-yy+1,p[1]);
  if(r.biome===0){line(r.right+18,y,r.right+39,y-4,'#9cd8c095',2);}
  if(r.biome===2){line(0,y+4,r.left-9,y-7,'#69b2c65c',3);line(r.right+8,y,W,y-7,'#a0d1d660',3);}
  polygon([[r.left-9,y],[r.right+9,y],[n.right+9,yy],[n.left-9,yy]],'#172f3b70');
  polygon([[r.left,y],[r.right,y],[n.right,yy],[n.left,yy]],p[3]);
 }
 for(let z=Math.floor((s.camera-500)/42)*42;z<s.camera+1100;z+=42){const r=road(z),y=screen(z),p=terrain[r.biome];
  const curb=Math.floor(z/42)%2?'#dbcbaa':'#aa7769';line(r.left,y,r.left,screen(z+33),curb,5);line(r.right,y,r.right,screen(z+33),curb,5);
  for(const off of [-48,48])line(r.center+off,y,r.center+off,screen(z+19),'#ead9b34a',2);
  if(Math.floor(z/42)%4===0){const x=r.center;line(x-7,y+7,x,y,'#e6dfbf80',2);line(x,y,x+7,y+7,'#e6dfbf80',2);}
 }
 for(let z=Math.floor((s.camera-500)/155)*155;z<s.camera+1100;z+=155){scenicProp(z,-1,Math.floor(z/155));scenicProp(z+70,1,Math.floor(z/155)+1);}
}
const groundTiles=new Map();
function tile(key){
 if(groundTiles.has(key))return groundTiles.get(key);
 const layer=document.createElement('canvas');layer.width=W;layer.height=1160;
 const savedG=g,savedCamera=s.camera;g=layer.getContext('2d');g.translate(0,400);s.camera=key*360;staticGround();g=savedG;s.camera=savedCamera;
 groundTiles.set(key,layer);if(groundTiles.size>3)groundTiles.delete(groundTiles.keys().next().value);return layer;
}
function ground(){const key=Math.floor(s.camera/360),image=tile(key);g.drawImage(image,0,-400+(s.camera-key*360)*.79);
 for(const p of s.footprints){g.globalAlpha=p.life*.15;box(p.x-3,screen(p.z),5,9,C.gold,2);}g.globalAlpha=1;
 if(s.rear>45){const inset=(s.rear-45)*.42;box(0,130,inset,630,'#e4979540');box(W-inset,130,inset,630,'#e4979540');}
 if(s.dash){for(let i=0;i<14;i++){const x=(i*79+31)%420,y=(i*113+s.time*1800)%730;line(x,y,x,y+48,C.gold+'60',2);}}

}
function obstacles(){
 for(const o of s.obstacles){const y=screen(o.z),x=obstacleX(s,o);if(y<110||y>790)continue;const near=o.z-s.distance;
  if(near>0&&near<360){g.globalAlpha=.32+.1*Math.sin(s.time*8);box(x-o.width/2-8,y+24,o.width+16,65,'#ffb498',4);g.globalAlpha=1;for(let i=0;i<3;i++){line(x-8,y+43+i*17,x,y+36+i*17,C.gold,2);line(x,y+36+i*17,x+8,y+43+i*17,C.gold,2);}}
  box(x-o.width/2-5,y-5,o.width+10,39,'#142d3c90',7);
  if(o.type==='cart'){
   const r=road(o.z);line(r.left+20,y,r.right-20,y,'#f9d39855',2);for(const dx of [-25,25]){circle(x+dx,y+15,8,'#20343b');circle(x+dx,y+15,3,'#c6d0bd');}
   box(x-o.width/2,y-27,o.width,38,'#b67c54',3);box(x-o.width/2+5,y-23,o.width-10,28,'#deac72',2);line(x-29,y-20,x+29,y+2,'#916c51',4);line(x+29,y-20,x-29,y+2,'#916c51',4);
   const direction=Math.cos(s.time*.95+o.phase)>0?1:-1;text(direction>0?'货箱 →':'← 货箱',x,y-36,11,C.gold);
  }else{
   box(x-o.width/2,y-19,o.width,25,'#f1cd83',3);g.save();g.beginPath();g.rect(x-o.width/2,y-19,o.width,25);g.clip();for(let dx=-o.width;dx<o.width;dx+=21)polygon([[x+dx,y+6],[x+dx+12,y+6],[x+dx+30,y-19],[x+dx+18,y-19]],'#5b5b52');g.restore();
   for(const dx of [-o.width/2+9,o.width/2-9]){line(x+dx,y+2,x+dx,y+23,'#adaca0',5);box(x+dx-10,y+21,20,5,'#d7c3a0',2);}text('绕行路障',x,y-28,11,'#ffe1a5');
  }
 }
}
function sea(){
 // Fixed-size cached sprites need neither a per-frame sort nor a large clipping path.
 for(const e of s.enemies){const y=screen(e.z);if(y<115||y>715)continue;const size=e.type==='heavy'?27:23;g.drawImage(sprites[e.type],e.x-size/2,y-size/2,size,size);}
}
function fronts(){
 for(const f of s.fronts){const rr=road(f.z),y=screen(f.z);if(y<135||y>710)continue;
  if(f.mobile){if(f.hp<=0)continue;const cx=road(f.z).center;box(cx-90,y-30,180,57,'#193a49',12);box(cx-73,y-23,146,42,'#587b76',9);for(let k=-2;k<=2;k++)box(cx+k*23-7,y-15,14,29,'#284c57',3);for(const side of [-1,1]){line(cx+side*32,y-25,cx+side*43,y-43,'#8da99b',5);circle(cx+side*43,y-43,9,'#c9cf9e');circle(cx+side*43,y-43,4,'#e78d73');}for(const d of [-1,1]){line(cx+d*80,y,cx+d*111,y+24,'#344f59',12);line(cx+d*111,y+24,cx+d*122,y+4,'#a5b9a0',7);}circle(f.x,y,19,'#ffca8b');circle(f.x,y,10,'#f29172');circle(f.x,y,4,'#fff1b8');box(cx-85,y+39,170,7,'#213943',3);box(cx-85,y+39,170*Math.max(0,f.hp/f.max),7,C.coral,3);text('封港蟹 · 击碎动力核',cx,y-42,14,C.gold);continue;}
  if(f.breached){line(rr.left,y,f.x-42,y,'#a1f4d650',5);line(f.x+42,y,rr.right,y,'#a1f4d650',5);continue;}
  const open=f.open>0||f.held;
  g.strokeStyle=s.phase===1?'#cb8b9c':'#7bb1a5';g.lineWidth=17;g.beginPath();
  for(let x=rr.left+2;x<=rr.right-2;x+=8){if(open&&Math.abs(x-f.x)<40){g.moveTo(x,y);continue;}const wave=Math.sin(x*.06+s.time*2)*4;if(x===rr.left+2)g.moveTo(x,y+wave);else g.lineTo(x,y+wave);}g.stroke();
  for(let x=rr.left+8;x<rr.right-4;x+=17){if(open&&Math.abs(x-f.x)<40)continue;g.drawImage(sprites.heavy,x-14,y-16,28,28);}
  if(open){g.fillStyle='#ffdc9c33';g.beginPath();g.moveTo(f.x-32,y);g.lineTo(f.x+32,y);g.lineTo(s.x+32,550);g.lineTo(s.x-32,550);g.closePath();g.fill();line(f.x-35,y-22,f.x-35,y+20,C.gold,3);line(f.x+35,y-22,f.x+35,y+20,C.gold,3);text(f.held?'咕咕撑住了！':'打穿了！',f.x,y-32,14,C.gold);}
  else{circle(f.x,y,21,'#ffce9360');circle(f.x,y,12,C.coral);circle(f.x,y,6,C.gold);box(f.x-27,y+25,54,5,'#12313a',2);box(f.x-27,y+25,54*Math.max(0,f.hp/f.max),5,C.gold,2);text('击碎缝眼',f.x,y-29,11,C.gold);}
 }
}
function render(){formation.hidden=!s.choice||view!=='play';ground();
 for(const w of s.wakes){g.globalAlpha=Math.min(1,w.life);g.strokeStyle='#ffe0a0';g.lineWidth=13;g.lineCap='round';g.beginPath();w.points.forEach((p,i)=>i?g.lineTo(p.x,screen(p.z)):g.moveTo(p.x,screen(p.z)));g.stroke();g.strokeStyle='#fff5dc';g.lineWidth=3;g.stroke();g.globalAlpha=1;}
 sea();obstacles();fronts();
 for(const z of [480,1900,3550])if(z>s.distance){const y=screen(z),x=road(z).center;if(y>140&&y<700){circle(x,y,26,'#ffe3a440');box(x-18,y-15,36,30,'#ffe3a4',4);box(x-13,y-10,26,20,'#345a60',3);line(x-8,y,x+8,y,C.mint,4);line(x,y-8,x,y+8,C.mint,4);text('武器补给',x,y-29,11,C.gold);}}

 for(const r of s.rings){g.globalAlpha=Math.max(0,r.life/.55);g.strokeStyle='#ffdc96';g.lineWidth=4;g.beginPath();g.ellipse(r.x,screen(r.z),(1-r.life/.6)*78,(1-r.life/.6)*54,0,0,Math.PI*2);g.stroke();g.globalAlpha=1;}
 if(s.impact>0){g.globalAlpha=s.impact*.35;box(0,125,W,H-125,'#ff8d76');g.globalAlpha=1;}
 if(s.tailwind>0)text('尾风 '+s.tailwind.toFixed(1)+'s · 冲锋更远',210,195,12,'#fff3b3');
 if(s.chainWindow>0)text('接力 ×'+s.chain+' · '+s.chainWindow.toFixed(1)+'s',s.x,screen(s.distance)-42,14,C.gold);

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
  if(s.build[1]){const a=s.time*7;line(s.x-Math.cos(a)*62,playerY+Math.sin(a)*25,s.x+Math.cos(a)*62,playerY-Math.sin(a)*25,C.mint,5);circle(s.x+Math.cos(a)*62,playerY-Math.sin(a)*25,7,C.gold);}
  cat(s.x-span,playerY+run,1.1);dog(s.x+span,playerY-run,1);
  line(s.x-span-13,playerY+12,s.x-span-30,playerY+18+run,C.mint,4);line(s.x+span+12,playerY+13,s.x+span+26,playerY+20-run,C.coral,4);
 }
 if(s.pulse>0){g.globalAlpha=s.pulse*.5;g.strokeStyle=C.gold;g.lineWidth=5;g.beginPath();g.ellipse(s.x,playerY,35+(1-s.pulse)*120,17+(1-s.pulse)*45,0,0,Math.PI*2);g.stroke();g.globalAlpha=1;}
 // Persistent forward progress is the hero of the dashboard.
 box(0,0,420,125,'#102c39f5');text('FIRE / RUSH',17,24,11,C.mint,'left');text('破阵狂奔 V0.12',17,44,10,'#a3c7c8','left');text(Math.min(GOAL,Math.floor(s.distance))+' / '+GOAL,398,72,23,C.gold,'right');
 text('心弦',17,70,10,C.pale,'left');box(48,61,107,9,'#325562',4);box(48,61,107*s.hull/100,9,s.hull<30?C.coral:C.mint,4);text(Math.ceil(s.hull),162,71,12,C.pale,'left');
 box(17,86,386,4,'#2c4d59',2);box(17,86,386*Math.min(1,s.distance/GOAL),4,C.gold,2);
 text('击破 '+s.kills+' · 火力 '+s.power,17,111,11,C.pale,'left');text('连爆 '+s.explosions+' 次',399,111,11,s.rear>65?C.coral:C.mint,'right');
 text(districtNames[s.phase],18,147,11,C.mint,'left');text(weapons[tier(s.power)],400,147,11,C.gold,'right');
 if(view==='play'){
 const hazard=obstacleAhead(s,280);const next=s.fronts.find(f=>!f.breached&&f.z-s.distance<300);const msg=s.time<3?'左右拖动就能跑 · 点咕咕冲破敌群':hazard?'绕开'+(hazard.type==='cart'?'横移货箱':'路障')+' · 擦边有尾风':next?'瞄准橙色弱点，打穿潮墙':'前进！打爆金色灯蛹引发连锁';
 box(30,610,360,27,'#102d38cf',7);text(msg,210,628,11,C.pale);
 text('咕咕蓄力 '+Math.floor(s.tension)+'%',19,662,11,C.mint,'left');text(s.tension>=45?'随时冲锋':'自动回充中',19,683,10,s.tension>=45?C.gold:C.pale,'left');
 }
 if(s.choice){for(let i=0;i<2;i++){const x=15+i*203,selected=(s.x<210?0:1)===i,p=formationPreview(s,i);box(x,173,187,63,selected?'#285562f2':'#123543ef',7);if(selected){g.strokeStyle=C.gold;g.lineWidth=2;g.strokeRect(x+1,174,185,61);}text('触选 · '+choices[i].name,x+93,196,15,C.gold);text('伤害 ×'+p.damage.toFixed(2)+' / 宽度 ×'+p.width.toFixed(2),x+93,219,11,C.pale);text('可选强化 · '+Math.ceil(s.choice.remaining)+'s',x+93,233,10,selected?C.mint:C.coral);}}
 const n=s.notices.at(-1);if(n&&!s.choice){g.globalAlpha=Math.min(1,n.life);box(10,157,400,22,'#102c39d9',5);text(n.text,210,172,10,n.color);}g.globalAlpha=1;
}
function show(html){overlay.innerHTML=html;overlay.hidden=false;controls.hidden=true;}
function menu(){view='menu';show(`<div class="eyebrow">V0.12 · KEEP RUNNING</div><h1 class="title">火力突围<br><em>破阵狂奔</em></h1><p class="subtitle">一路跑，一路变强。</p><div class="rule"><b>左右拖动，自动开火。</b><br>咕咕的冲锋随时能用，不用等缺口。<br>绕开路障，打爆灯蛹，击败堵住出口的封港蟹！</div><button class="primary" id="start">开跑 →</button><p class="fine">最高路线得分 ${bestScore}<br>原生触摸 · 可松手重按 · 独立双指冲锋<br>音效可开启 · 无需下载外部素材</p>`);document.querySelector('#start').onclick=()=>start();}
function start(seed){s=createGame(typeof seed==='number'?seed:Date.now());view='play';overlay.hidden=true;controls.hidden=false;input.reset();keys={};lastPop=0;last=performance.now();}
function end(){view=s.mode;input.reset();const finish=result(s),record=finish.score>bestScore;bestScore=Math.max(bestScore,finish.score);best=Math.max(best,s.kills);try{localStorage.setItem('fr012best',best);localStorage.setItem('fr012score',bestScore);}catch{}
 show(`<div class="eyebrow">${record?'新的个人纪录 · ':''}${finish.grade} / COAST ROAD</div><h1 class="title">${s.mode==='win'?'冲出潮水，奔向海风':'差一点，再牵紧一点'}</h1><div class="stats"><div>路线得分<strong>${finish.score}</strong></div><div>漂亮擦边<strong>${s.nearMisses}</strong></div><div>撞障<strong>${s.obstacleHits}</strong></div></div><div class="rule">${s.reason}<br>前进 ${Math.floor(s.distance)} / 5400 · 用时 ${Math.floor(s.time)}s<br>击破 ${s.kills} · 灯蛹引爆 ${s.explosions} · 绕行 ${s.dodged}/9<br><b>${s.obstacleHits?'提前看地面警示，绕向空侧继续跑。':s.nearMisses<4?'下次试着贴近路障绕过，攒尾风，挑战 S 级。':'漂亮！再换一条海岸线，看看还能冲多快。'}</b><br>个人最高 ${bestScore}</div><button class="primary" id="again">换一条海岸，再冲 ↻</button><button class="secondary" id="practice">重跑这条路 · 练习擦边</button><button class="secondary" id="back">返回出发点</button>`);
 document.querySelector('#again').onclick=()=>start();document.querySelector('#practice').onclick=()=>start(s.seed);document.querySelector('#back').onclick=menu;
}
function pause(){if(view==='pause'){resume();return;}if(view!=='play')return;view='pause';input.reset();keys={};show('<div class="eyebrow">STILL HOLDING HANDS</div><h1 class="title">等你，潮也停了</h1><div class="rule">战场已暂停。<br>聚束钻头穿透前方重甲，回旋双翼清扫侧翼。<br>冲锋消耗 45 蓄力，击杀与时间都会回充。</div><button class="primary" id="resume">继续向前 →</button><button class="secondary" id="restart">重新出发</button>');document.querySelector('#resume').onclick=resume;document.querySelector('#restart').onclick=()=>start();}
function resume(){view='play';overlay.hidden=true;controls.hidden=false;last=performance.now();}
function sound(kind='rush'){if(muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),a=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(kind==='pop'?80:kind==='wind'?440:130,audio.currentTime);o.frequency.exponentialRampToValueAtTime(kind==='pop'?35:kind==='wind'?880:600,audio.currentTime+.2);a.gain.setValueAtTime(.035,audio.currentTime);a.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.3);o.connect(a).connect(audio.destination);o.start();o.stop(audio.currentTime+.3);}catch{}}
function useSkill(){if(rush(s))sound();}
for(const [i,button] of [...document.querySelectorAll('#formation button')].entries())button.onclick=()=>{if(view==='play')chooseFormation(s,i);};
const input=bindInput({area:document.querySelector('#game'),canvas,skill,active:()=>view==='play',onMove:x=>s.target=clamp(x,29,391),onSkill:useSkill});
document.querySelector('#pause').onclick=pause;document.querySelector('#sound').onclick=()=>{muted=!muted;document.querySelector('#sound').textContent='音效 '+(muted?'OFF':'ON');sound();};
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(!e.repeat){if(e.key===' '&&view==='play')useSkill();if(e.key.toLowerCase()==='p')pause();}});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>keys={});document.addEventListener('visibilitychange',()=>{hidden=document.hidden;input.reset();keys={};lastPop=0;last=performance.now();});
let accumulator=0,lastUI=0,lastLabel='',lastHint='';
function frame(now){const elapsed=clamp((now-last)/1000,0,.1);last=now;if(renderBudget.observe(elapsed,view==='play'&&!freeze&&!hidden))resize();
 if(view==='play'&&!freeze&&!hidden){accumulator+=elapsed;let ticks=0;while(accumulator>=1/60&&ticks++<6){const d=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);if(d)s.target=clamp(s.target+d*370/60,29,391);const pops=s.explosions,near=s.nearMisses;step(s,1/60);if(s.nearMisses>near)sound('wind');else if(s.explosions>pops&&s.time-lastPop>.18){lastPop=s.time;sound('pop');}accumulator-=1/60;if(s.mode!=='play'){end();break;}}}else accumulator=0;
 if(now-lastUI>100){lastUI=now;skill.disabled=!!s.dash||s.cooldown>0||s.tension<45;skill.classList.remove('risk');const label=s.dash?'咕咕 · 破阵中！':s.tension<45?'回充 '+Math.floor(s.tension)+' / 45':'咕咕 · 破阵冲锋';const hint=s.tailwind>0?'借尾风冲出 230':'冲出 180 · 清开面前敌群';if(label!==lastLabel){skillTitle.textContent=label;lastLabel=label;}if(hint!==lastHint){skillHint.textContent=hint;lastHint=hint;}}
 render();requestAnimationFrame(frame);
}
menu();requestAnimationFrame(frame);
if(new URLSearchParams(location.search).has('test'))window.__game={stats:()=>({renderScale:renderBudget.scale,tiles:groundTiles.size,cachePixels:groundTiles.size*420*1160,canvasPixels:canvas.width*canvas.height}),state:()=>s,start,pause,resume,input,step:dt=>step(s,dt),rush:useSkill,freeze:v=>{freeze=v;accumulator=0;},render:()=>{render();if(s.mode!=='play'&&view==='play')end();}};
