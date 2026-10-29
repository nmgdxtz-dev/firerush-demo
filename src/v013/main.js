import {W,H,GOAL,LIMIT,clamp,tier,weapons,createGame,step,rush,seam,choices,formationPreview,rushCost,road,obstacleX,obstacleAhead,result,skillCost,chooseFormation,chooseCamp,chapters} from './game.js';
import {RenderBudget} from './runtime.js';
import {bindInput} from './input.js';
const canvas=document.querySelector('#c'),overlay=document.querySelector('#overlay'),controls=document.querySelector('#controls'),skill=document.querySelector('#skill');
let g=canvas.getContext('2d');
const formation=document.querySelector('#formation'),skillTitle=skill.querySelector('b'),skillHint=skill.querySelector('small');
let s=createGame(),view='menu',keys={},last=0,freeze=false,hidden=document.hidden,muted=true,audio,lastPop=0,best=0,bestScore=0;
try{best=+localStorage.getItem('fr013best')||0;bestScore=+localStorage.getItem('fr013score')||0;}catch{}
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
for(const type of ['swarm','heavy','lantern','horse-swarm','horse-heavy','horse-lantern']){const c=document.createElement('canvas');c.width=c.height=40;const q=c.getContext('2d');q.fillStyle='#05262a70';q.beginPath();q.ellipse(20,29,14,7,0,0,Math.PI*2);q.fill();q.fillStyle=type==='heavy'?'#b4b4a4':'#438e85';q.beginPath();q.moveTo(8,25);q.quadraticCurveTo(5,3,19,5);q.quadraticCurveTo(35,1,33,24);q.lineTo(29,32);q.lineTo(23,28);q.lineTo(18,33);q.lineTo(12,28);q.fill();q.fillStyle=type==='heavy'?'#545d66':'#1b5b60';q.fillRect(10,12,20,7);q.fillStyle=type==='heavy'?'#ffc38e':'#c1ffdc';q.fillRect(13,14,4,3);q.fillRect(24,14,4,3);if(type==='heavy'){q.fillStyle='#d7c0ab';q.fillRect(16,6,7,4);q.fillRect(11,25,18,5);}if(type==='lantern'){q.fillStyle='#ffbe62';q.beginPath();q.arc(20,19,12,0,Math.PI*2);q.fill();q.fillStyle='#fff0bb';q.fillRect(17,8,6,20);q.fillRect(9,16,22,5);}q.clearRect(0,0,40,40);const horse=type.startsWith('horse'),oil=type.endsWith('lantern');
 if(oil){q.fillStyle='#805a37';q.fillRect(6,15,29,17);q.fillStyle='#d8ab61';q.fillRect(10,18,21,11);q.fillStyle='#f3c469';q.beginPath();q.arc(20,10,7,0,7);q.fill();q.fillStyle='#f18f57';q.fillRect(18,1,5,10);}
 else{if(horse){q.fillStyle='#ac8558';q.fillRect(6,25,28,9);q.fillRect(28,16,7,13);q.fillRect(9,31,4,8);q.fillRect(26,31,4,8);}q.fillStyle=horse?'#d3ae80':'#bcb9a5';q.beginPath();q.arc(20,12,8,0,7);q.fill();q.fillRect(12,16,16,12);q.fillStyle=horse?'#6f4478':'#a4473d';q.fillRect(13,4,14,4);q.fillRect(18,0,4,6);if(!horse){q.fillStyle=type==='heavy'?'#a23d34':'#8c5043';q.fillRect(10,17,21,19);q.strokeStyle='#deb879';q.lineWidth=2;q.strokeRect(11,18,19,17);q.fillStyle='#e4bb75';q.fillRect(18,20,4,13);}else{q.strokeStyle='#ebd0a2';q.lineWidth=2;q.beginPath();q.arc(29,17,9,-1.3,1.3);q.stroke();}}
 sprites[type]=c;}
function cat(x,y,k=1){g.save();g.translate(x,y);g.scale(k,k);circle(0,5,13,'#152b3b');g.fillStyle='#152b3b';g.beginPath();g.moveTo(-12,1);g.lineTo(-14,-17);g.lineTo(-3,-9);g.lineTo(11,-17);g.lineTo(13,3);g.fill();box(-9,-1,5,3,C.mint,1);box(4,-1,5,3,C.mint,1);box(-11,15,23,5,C.mint,2);g.restore();}
function dog(x,y,k=1){g.save();g.translate(x,y);g.scale(k,k);circle(-12,-4,8,'#b07b58');circle(12,-4,8,'#b07b58');circle(0,5,15,'#ffcf92');circle(-5,2,2,C.ink);circle(5,2,2,C.ink);circle(0,8,3,C.ink);box(-12,17,24,5,'#f29991',2);g.restore();}
const districtNames=['一战 / 盾阵平原 · 罗马式盾阵','二战 / 骑射隘口 · 帕提亚骑射','三战 / 营垒决战 · 罗马式营垒'];
const terrain=[['#697456','#bba675','#d9c58b','#7e805f'],['#b38b60','#d0b17d','#dfc69a','#a28a65'],['#58615d','#798581','#b6c8c6','#797d73']];
function polygon(points,color){g.fillStyle=color;g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();}
function scenicProp(z,side,index){const y=screen(z);if(y<-400||y>1200)return;const r=road(z),x=side<0?r.left-25:r.right+25;
 if(r.biome===0){if(index%3===0){polygon([[x-26,y+15],[x,y-33],[x+26,y+15]],'#c7b18b');polygon([[x,y-33],[x+4,y+15],[x+26,y+15]],'#9c805d');line(x,y-33,x,y+16,'#5e5143',3);}else{line(x,y+16,x,y-57,'#715940',4);polygon([[x,y-55],[x+side*28,y-50],[x+side*23,y-17],[x,y-22]],side<0?'#a03d37':'#79515d');text(side<0?'漢':'阵',x+side*13,y-31,13,'#e3c58a');}}
 else if(r.biome===1){polygon([[x-27,y+15],[x-17,y-24],[x+2,y-39],[x+22,y-13],[x+28,y+15]],'#c8a576');line(x-20,y+4,x+14,y-8,'#9d7c58',3);if(index%2===0){line(x,y+18,x,y-45,'#66533c',3);polygon([[x,y-43],[x+26,y-37],[x+21,y-15],[x,y-20]],'#785275');}}
 else{box(x-18,y-60,36,78,'#a6a493',2);box(x-24,y-62,48,10,'#d1c5a5',2);for(let j=0;j<3;j++)box(x-21+j*17,y-74,10,15,'#bbb7a1');box(x-7,y-31,14,24,'#3f4c49',3);line(x,y-75,x,y-100,'#62533b',3);polygon([[x,y-99],[x+24,y-94],[x+19,y-77],[x,y-81]],'#a4473d');}}
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
  const curb='#b6a482';line(r.left,y,r.left,screen(z+33),curb,5);line(r.right,y,r.right,screen(z+33),curb,5);
  for(const off of [-48,48])line(r.center+off,y,r.center+off,screen(z+42),'#614f3838',2);
  if(Math.floor(z/42)%4===0)box(r.center+Math.sin(z)*25,y,7,3,'#d6c9a655',1);
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
   const direction=Math.cos(s.time*.95+o.phase)>0?1:-1;text(direction>0?'辎重 →':'← 辎重',x,y-36,11,C.gold);
  }else{
   for(let dx=-o.width/2;dx<=o.width/2;dx+=19){line(x+dx-7,y+20,x+dx+5,y-23,'#604b35',6);polygon([[x+dx+2,y-22],[x+dx+8,y-29],[x+dx+8,y-17]],'#c5ac7c');}line(x-o.width/2-5,y,x+o.width/2+5,y,'#a58b5e',5);text('拒马 · 绕行',x,y-35,11,C.gold);

  }
 }
}
function sea(){
 // Fixed-size cached sprites need neither a per-frame sort nor a large clipping path.
 for(const e of s.enemies){const y=screen(e.z);if(y<115||y>715)continue;const size=e.type==='heavy'?27:23;g.drawImage(sprites[(s.phase===1?'horse-':'')+e.type],e.x-size/2,y-size/2,size,size);}
}
function fronts(){
 for(const f of s.fronts){const rr=road(f.z),y=screen(f.z);if(y<135||y>710)continue;
  if(f.mobile){if(f.hp<=0)continue;const cx=road(f.z).center;for(const side of [-1,1]){circle(cx+side*70,y+18,15,'#473e32');circle(cx+side*70,y+18,7,'#b18a55');}box(cx-77,y-13,154,34,'#8b663e',5);line(cx-84,y-22,cx,y+5,'#d0b484',9);line(cx,y+5,cx+84,y-22,'#d0b484',9);line(cx-84,y-22,cx+84,y-22,'#d8c7a0',2);line(cx,y+12,cx,y-43,'#614b32',8);polygon([[cx-8,y-39],[cx,y-55],[cx+8,y-39]],'#b9c3bb');circle(f.x,y,15,'#d4b67b');circle(f.x,y,7,'#a53e35');box(cx-85,y+42,170,7,'#473e32',3);box(cx-85,y+42,170*Math.max(0,f.hp/f.max),7,C.coral,3);text('军团弩车 · 击碎绞盘',cx,y-62,14,C.gold);continue;}
  if(f.breached){line(rr.left,y,f.x-42,y,'#a1f4d650',5);line(f.x+42,y,rr.right,y,'#a1f4d650',5);continue;}
  const open=f.open>0||f.held;
  g.strokeStyle=s.phase===1?'#cb8b9c':'#7bb1a5';g.lineWidth=17;g.beginPath();
  for(let x=rr.left+2;x<=rr.right-2;x+=8){if(open&&Math.abs(x-f.x)<40){g.moveTo(x,y);continue;}const wave=Math.sin(x*.06+s.time*2)*4;if(x===rr.left+2)g.moveTo(x,y+wave);else g.lineTo(x,y+wave);}g.stroke();
  for(let x=rr.left+8;x<rr.right-4;x+=17){if(open&&Math.abs(x-f.x)<40)continue;g.drawImage(sprites[s.phase===1?'horse-heavy':'heavy'],x-14,y-16,28,28);}
  if(open){g.fillStyle='#ffdc9c33';g.beginPath();g.moveTo(f.x-32,y);g.lineTo(f.x+32,y);g.lineTo(s.x+32,550);g.lineTo(s.x-32,550);g.closePath();g.fill();line(f.x-35,y-22,f.x-35,y+20,C.gold,3);line(f.x+35,y-22,f.x+35,y+20,C.gold,3);text(f.held?'咕咕撑住了！':'打穿了！',f.x,y-32,14,C.gold);}
  else{circle(f.x,y,21,'#ffce9360');circle(f.x,y,12,C.coral);circle(f.x,y,6,C.gold);box(f.x-27,y+25,54,5,'#12313a',2);box(f.x-27,y+25,54*Math.max(0,f.hp/f.max),5,C.gold,2);text('击碎缝眼',f.x,y-29,11,C.gold);}
 }
}
function render(){formation.hidden=!s.choice||view!=='play';ground();
 for(const w of s.wakes){g.globalAlpha=Math.min(1,w.life);g.strokeStyle='#ffe0a0';g.lineWidth=13;g.lineCap='round';g.beginPath();w.points.forEach((p,i)=>i?g.lineTo(p.x,screen(p.z)):g.moveTo(p.x,screen(p.z)));g.stroke();g.strokeStyle='#fff5dc';g.lineWidth=3;g.stroke();g.globalAlpha=1;}
 sea();obstacles();fronts();
 for(const a of s.arrows){const y=screen(a.z);if(y<130||y>730)continue;g.globalAlpha=a.hit?.2:.65;circle(a.x,y,25,a.age<.75?'#efd08d':'#c45b48');g.globalAlpha=1;line(a.x-12,y-12,a.x+12,y+12,C.gold,2);line(a.x+12,y-12,a.x-12,y+12,C.gold,2);if(a.age>=.75){for(let i=0;i<3;i++)line(a.x-12+i*12,y-42,a.x-8+i*12,y,'#efd9a7',2);}}

 for(const z of [480,2600,5200,7400,10000,12200])if(z>s.distance){const y=screen(z),x=road(z).center;if(y>140&&y<700){circle(x,y,26,'#ffe3a440');box(x-18,y-15,36,30,'#ffe3a4',4);box(x-13,y-10,26,20,'#345a60',3);line(x-8,y,x+8,y,C.mint,4);line(x,y-8,x,y+8,C.mint,4);text('武器补给',x,y-29,11,C.gold);}}

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
  for(let i=0;i<Math.min(12,4+Math.floor(s.kills/140));i++){const xx=s.x+(i%4-1.5)*15,yy=playerY+36+Math.floor(i/4)*15;if(s.build[1]){box(xx-7,yy+6,15,6,'#9e7448',2);line(xx-5,yy+10,xx-5,yy+16,'#735337',2);line(xx+5,yy+10,xx+5,yy+16,'#735337',2);}circle(xx,yy,5,'#b5b6a2');box(xx-4,yy+3,8,8,'#9c4239',1);line(xx-6,yy+4,xx+6,yy+4,C.gold,1);}
  line(s.x+span+8,playerY,s.x+span+8,playerY-46,'#a58350',2);polygon([[s.x+span+8,playerY-46],[s.x+span+32,playerY-41],[s.x+span+28,playerY-24],[s.x+span+8,playerY-27]],'#a83d39');
  cat(s.x-span,playerY+run,1.1);dog(s.x+span,playerY-run,1);
  line(s.x-span-13,playerY+12,s.x-span-30,playerY+18+run,C.mint,4);line(s.x+span+12,playerY+13,s.x+span+26,playerY+20-run,C.coral,4);
 }
 if(s.pulse>0){g.globalAlpha=s.pulse*.5;g.strokeStyle=C.gold;g.lineWidth=5;g.beginPath();g.ellipse(s.x,playerY,35+(1-s.pulse)*120,17+(1-s.pulse)*45,0,0,Math.PI*2);g.stroke();g.globalAlpha=1;}
 // Persistent forward progress is the hero of the dashboard.
 box(0,0,420,125,'#102c39f5');text('公元1世纪 · 架空演武',17,24,11,C.mint,'left');text('万军演武 V0.13',17,44,10,'#a3c7c8','left');text(Math.min(GOAL,Math.floor(s.distance))+' / '+GOAL,398,72,23,C.gold,'right');
 text('军心',17,70,10,C.pale,'left');box(48,61,107,9,'#325562',4);box(48,61,107*s.hull/100,9,s.hull<30?C.coral:C.mint,4);text(Math.ceil(s.hull),162,71,12,C.pale,'left');
 box(17,86,386,4,'#2c4d59',2);box(17,86,386*Math.min(1,s.distance/GOAL),4,C.gold,2);
 text('战功 '+s.kills+' · 兵力 '+Math.min(18,6+Math.floor(s.kills/100)),17,111,11,C.pale,'left');text('连爆 '+s.explosions+' 次',399,111,11,s.rear>65?C.coral:C.mint,'right');
 text(districtNames[s.phase],18,147,11,C.mint,'left');text(weapons[tier(s.power)],400,147,11,C.gold,'right');
 if(view==='play'){
 const hazard=obstacleAhead(s,280);const next=s.fronts.find(f=>!f.breached&&f.z-s.distance<300);const msg=s.time<3?'汉弩列阵 · 左右拖动 · 点咕咕冲锋':hazard?'绕开'+(hazard.type==='cart'?'横移货箱':'路障')+' · 擦边有尾风':next?'瞄准橙色弱点，打穿敌阵':'前进！击破火油车引发连锁';
 box(30,610,360,27,'#102d38cf',7);text(msg,210,628,11,C.pale);
 text('咕咕蓄力 '+Math.floor(s.tension)+'%',19,662,11,C.mint,'left');text(s.tension>=45?'执旗冲阵':'自动回充中',19,683,10,s.tension>=45?C.gold:C.pale,'left');
 }
 if(s.choice){for(let i=0;i<2;i++){const x=15+i*203,selected=(s.x<210?0:1)===i,p=formationPreview(s,i);box(x,173,187,63,selected?'#285562f2':'#123543ef',7);if(selected){g.strokeStyle=C.gold;g.lineWidth=2;g.strokeRect(x+1,174,185,61);}text('触选 · '+choices[i].name,x+93,196,15,C.gold);text('伤害 ×'+p.damage.toFixed(2)+' / 宽度 ×'+p.width.toFixed(2),x+93,219,11,C.pale);text('可选强化 · '+Math.ceil(s.choice.remaining)+'s',x+93,233,10,selected?C.mint:C.coral);}}
 const n=s.notices.at(-1);if(n&&!s.choice){g.globalAlpha=Math.min(1,n.life);box(10,157,400,22,'#102c39d9',5);text(n.text,210,172,10,n.color);}g.globalAlpha=1;
}
function show(html){overlay.innerHTML=html;overlay.hidden=false;controls.hidden=true;}
function menu(){view='menu';show(`<div class="eyebrow">V0.13 · 第一卷 / 汉弩西行</div><h1 class="title">火力突围<br><em>万军演武</em></h1><p class="subtitle">墨墨掌弩，咕咕执旗。带一支军队走完远征。</p><div class="rule"><b>盾阵平原 → 骑射隘口 → 营垒决战</b><br>对盾阵，选择强弩贯甲；对骑射，看落点躲箭雨。<br>战间选择整补军心或整训强弩，损耗带入下一战。<br>左右拖动自动射击，另一根手指点冲锋。</div><button class="primary" id="start">汉弩营，出阵 →</button><button class="secondary" id="lore">史料原型与架空设定</button><p class="fine">公元1世纪 · 兵种原型参考史料，对阵为架空演武<br>本次实装汉代三战 · 全程 14400 · 最高战绩 ${bestScore}<br>不是历史战力排名 · 原生触摸 · 独立双指</p>`);document.querySelector('#start').onclick=()=>start();document.querySelector('#lore').onclick=lore;}
function lore(){view='lore';show(`<div class="eyebrow">史料原型 / 游戏演绎</div><h1 class="title">同代军队，沙盘相逢</h1><div class="rule"><b>汉弩</b>：史密森尼馆藏有断代为 1–3 世纪的东汉弩机。游戏以此作为强弩兵器的原型。<br><b>罗马军团</b>：参考军团装备与盾牌传统，画面并非 1 世纪军备的精确复原。<br><b>帕提亚骑射</b>：参考骑马射击与回身射击的特点，以落点预警表达机动压迫。<br><br>汉军与这些对手的三场交锋为架空演武，不是曾发生的西征。阵型加成、火油车连锁与伤害数值均为玩法设计。</div><button class="primary" id="back-lore">回到演武台 →</button>`);document.querySelector('#back-lore').onclick=menu;}
function camp(){view='camp';input.reset();keys={};const index=Math.min(2,Math.floor(s.distance/4800));show(`<div class="eyebrow">行军休整 · 下一战 ${index+1}/3</div><h1 class="title">${chapters[index].name}</h1><div class="rule"><b>侦察：${chapters[index].enemy}</b><br>${chapters[index].tip}<br>${s.hull<45?'咕咕：旗还在，先照顾伤兵。':'墨墨：整补队伍，还是再加强弩？'}<br>当前军心 ${Math.ceil(s.hull)} · 已积累战功 ${s.kills}<br>整补恢复 28 军心；整训增加一层穿透，保留战损。</div><button class="primary" id="repair">整补军心 +28 →</button><button class="secondary" id="drill">整训强弩 · 穿透 +1 →</button><p class="fine">这是一场连续远征，已有武器、战损和战功均保留。</p>`);const go=option=>{chooseCamp(s,option);view='play';overlay.hidden=true;controls.hidden=false;last=performance.now();};document.querySelector('#repair').onclick=()=>go(0);document.querySelector('#drill').onclick=()=>go(1);}
function start(seed){s=createGame(typeof seed==='number'?seed:Date.now());view='play';overlay.hidden=true;controls.hidden=false;input.reset();keys={};lastPop=0;last=performance.now();}
function end(){if(s.mode==='camp'){camp();return;}view=s.mode;input.reset();const finish=result(s),record=finish.score>bestScore;bestScore=Math.max(bestScore,finish.score);best=Math.max(best,s.kills);try{localStorage.setItem('fr013best',best);localStorage.setItem('fr013score',bestScore);}catch{}
 show(`<div class="eyebrow">${record?'新的个人纪录 · ':''}${finish.grade} / HAN CAMPAIGN</div><h1 class="title">${s.mode==='win'?'三战告捷，军旗还在':'兵势未尽，重整再来'}</h1><div class="stats"><div>路线得分<strong>${finish.score}</strong></div><div>漂亮擦边<strong>${s.nearMisses}</strong></div><div>撞障<strong>${s.obstacleHits}</strong></div></div><div class="rule">${s.reason}<br>前进 ${Math.floor(s.distance)} / 14400 · 用时 ${Math.floor(s.time)}s<br>击破 ${s.kills} · 火油车引爆 ${s.explosions} · 绕行 ${s.dodged}/9<br><b>${s.obstacleHits?'提前看地面警示，绕向空侧继续跑。':s.nearMisses<4?'下次试着贴近路障绕过，攒尾风，挑战 S 级。':'漂亮！再换一条海岸线，看看还能冲多快。'}</b><br>最高战绩 ${bestScore}</div><button class="primary" id="again">再开一卷远征 ↻</button><button class="secondary" id="practice">重演此役 · 调整兵法</button><button class="secondary" id="back">返回出发点</button>`);
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
 const disabled=!!s.dash||s.cooldown>0||s.tension<45;if(skill.disabled!==disabled)skill.disabled=disabled;
 if(now-lastUI>100){lastUI=now;skill.classList.remove('risk');const label=s.dash?'咕咕 · 破阵中！':s.tension<45?'回充 '+Math.floor(s.tension)+' / 45':'咕咕 · 执旗冲阵';const hint=s.tailwind>0?'借尾风冲出 230':'冲出 180 · 清开面前敌群';if(label!==lastLabel){skillTitle.textContent=label;lastLabel=label;}if(hint!==lastHint){skillHint.textContent=hint;lastHint=hint;}}
 render();requestAnimationFrame(frame);
}
menu();requestAnimationFrame(frame);
if(new URLSearchParams(location.search).has('test'))window.__game={stats:()=>({renderScale:renderBudget.scale,tiles:groundTiles.size,cachePixels:groundTiles.size*420*1160,canvasPixels:canvas.width*canvas.height}),state:()=>s,start,pause,resume,input,step:dt=>step(s,dt),rush:useSkill,freeze:v=>{freeze=v;accumulator=0;},render:()=>{render();if(s.mode!=='play'&&view==='play')end();}};
