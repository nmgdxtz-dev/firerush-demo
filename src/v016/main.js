import {W,H,GOAL,LIMIT,LAYERS,clamp,tier,createGame,step,rush,road,laneX,laneAt,formula,applyOrders,result,waveClear} from './game.js';
import {RenderBudget} from './runtime.js';
import {bindInput} from './input.js';
const canvas=document.querySelector('#c'),overlay=document.querySelector('#overlay'),controls=document.querySelector('#controls'),skill=document.querySelector('#skill');
let g=canvas.getContext('2d');
const formation=document.querySelector('#formation'),skillTitle=skill.querySelector('b'),skillHint=skill.querySelector('small');
let s=createGame(),view='menu',keys={},last=0,freeze=false,hidden=document.hidden,muted=true,audio,lastPop=0,best=0,bestScore=0;
try{best=+localStorage.getItem('fr016best')||0;bestScore=+localStorage.getItem('fr016score')||0;}catch{}
const C={mint:'#9ffff0',gold:'#ffda9e',coral:'#ffad99',ink:'#12313a',pale:'#e8f4df'};
const box=(x,y,w,h,c,r=0)=>{g.fillStyle=c;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();};
const circle=(x,y,r,c)=>{g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();};
const line=(x,y,xx,yy,c,w=1)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke();};
function text(a,x,y,size=12,color=C.pale,align='center'){g.fillStyle=color;g.font=`800 ${size}px system-ui`;g.textAlign=align;g.fillText(a,x,y);}
const renderBudget=new RenderBudget(devicePixelRatio||1);
function resize(){const d=renderBudget.scale;canvas.width=W*d;canvas.height=H*d;g.setTransform(d,0,0,d,0,0);}resize();addEventListener('resize',resize);
const screen=z=>550-(z-s.camera)*.28;
// Original procedural sprites are cached once; crowd rendering uses drawImage, not hundreds of paths.
const sprites={};
// Four cached gait frames: human proportions, segmented armour, equipment and horse anatomy.
for(const army of ['roman','horse','han','hanhorse'])for(const type of ['swarm','heavy','lantern'])for(let frame=0;frame<4;frame++){
 const c=document.createElement('canvas');c.width=64;c.height=80;const q=c.getContext('2d'),stride=Math.sin(frame*Math.PI/2)*5,mounted=army==='horse'||army==='hanhorse';
 const stroke=(x,y,xx,yy,color,w)=>{q.strokeStyle=color;q.lineWidth=w;q.lineCap='round';q.beginPath();q.moveTo(x,y);q.lineTo(xx,yy);q.stroke();};
 const ellipse=(x,y,rx,ry,color)=>{q.fillStyle=color;q.beginPath();q.ellipse(x,y,rx,ry,0,0,7);q.fill();};
 ellipse(32,71,23,6,'#18211d55');
 if(type==='lantern'){q.fillStyle='#745036';q.fillRect(13,35,38,25);q.fillStyle='#bb925d';q.fillRect(17,38,30,19);for(const x of [16,47]){ellipse(x,64,6,9,'#302c25');stroke(x,57,x,71,'#b29b6b',2);}ellipse(32,31,11,15,'#a56833');stroke(22,30,42,30,'#e0b569',3);stroke(30,10,35,20,'#ffb55c',4);}
 else{
 if(mounted){ellipse(30,51,23,11,'#826044');ellipse(48,39,7,16,'#936f4c');ellipse(51,26,8,6,'#a17a51');stroke(45,23,43,18,'#493e30',3);stroke(12,49,4,61,'#3c3029',4);for(const [x,offset] of [[16,1],[24,-1],[41,-1],[47,1]]){stroke(x,54,x+stride*offset,69,'#795a40',4);stroke(x+stride*offset,69,x+stride*offset+2,73,'#302d28',3);}q.fillStyle='#6e3241';q.fillRect(20,40,17,10);stroke(47,29,34,37,'#d2b17c',1);}
 const y=mounted?-10:0,cloth=army.startsWith('han')?'#9d3c2e':mounted?'#715471':'#8e3c32';
 stroke(26,50+y,23+stride,66+y,'#594b3b',5);stroke(37,50+y,39-stride,66+y,'#594b3b',5);stroke(23+stride,66+y,19+stride,69+y,'#302f2a',5);stroke(39-stride,66+y,43-stride,69+y,'#302f2a',5);
 q.fillStyle=cloth;q.beginPath();q.moveTo(23,31+y);q.lineTo(41,31+y);q.lineTo(44,52+y);q.lineTo(20,52+y);q.fill();
 q.fillStyle=mounted?'#8d8066':'#a4a49a';q.fillRect(23,30+y,18,15);for(let row=0;row<4;row++)stroke(24,33+y+row*3,40,33+y+row*3,'#525955',1);
 stroke(22,33+y,17,45+y,'#c39d7b',4);stroke(42,33+y,47,44+y,'#c39d7b',4);ellipse(32,23+y,6,8,'#c7a382');
 ellipse(32,18+y,8,6, mounted?'#bdab89':'#b7bcb3');stroke(24,19+y,40,19+y,'#646d66',2);stroke(26,21+y,26,28+y,'#818c82',2);stroke(38,21+y,38,28+y,'#818c82',2);stroke(30,25+y,34,25+y,'#594838',1);
 if(army==='han'){stroke(19,40+y,45,40+y,'#dfbc7c',3);stroke(32,33+y,32,51+y,'#755133',4);stroke(19,40+y,32,47+y,'#d2c2a3',1);stroke(32,47+y,45,40+y,'#d2c2a3',1);}
 else if(!mounted){q.fillStyle=army==='han'?'#615641':'#963c30';q.beginPath();q.roundRect(8,35+y,type==='heavy'?23:17,26,4);q.fill();q.strokeStyle='#c1a361';q.lineWidth=2;q.stroke();stroke(13,40+y,25,54+y,'#d9ba70',2);ellipse(18,48+y,3,3,'#a8a69a');stroke(48,48+y,48,12+y,'#785c39',2);q.fillStyle='#c3c7b7';q.beginPath();q.moveTo(45,14+y);q.lineTo(48,3+y);q.lineTo(51,14+y);q.fill();}
 else{q.strokeStyle='#d9bd86';q.lineWidth=2;q.beginPath();q.ellipse(48,29+y,9,17,0,-1.4,1.4);q.stroke();stroke(49,12+y,49,46+y,'#c5bda0',1);stroke(39,30+y,59,30+y,'#d4b983',1);}
 }
 sprites[army+'-'+type+'-'+frame]=c;
}
function soldier(army,type,x,y,size,phase=0){const frame=Math.floor(s.time*9+phase)%4;g.drawImage(sprites[army+'-'+type+'-'+frame],x-size*.4,y-size*.62,size*.8,size);}
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
 const start=Math.floor((s.camera-1000)/72)*72;
 for(let z=start;z<s.camera+3600;z+=72){const r=road(z),n=road(z+72),y=screen(z),yy=screen(z+72),p=terrain[r.biome];
  box(0,yy,W,y-yy+1,p[0]);box(r.right+8,yy,W-r.right,y-yy+1,p[1]);
  if(r.biome===0){line(r.right+18,y,r.right+39,y-4,'#9cd8c095',2);}
  if(r.biome===2){line(0,y+4,r.left-9,y-7,'#69b2c65c',3);line(r.right+8,y,W,y-7,'#a0d1d660',3);}
  polygon([[r.left-9,y],[r.right+9,y],[n.right+9,yy],[n.left-9,yy]],'#172f3b70');
  polygon([[r.left,y],[r.right,y],[n.right,yy],[n.left,yy]],p[3]);
 }
 for(let z=Math.floor((s.camera-1000)/126)*126;z<s.camera+3600;z+=126){const r=road(z),y=screen(z),p=terrain[r.biome];
  const curb='#b6a482';line(r.left,y,r.left,screen(z+99),curb,5);line(r.right,y,r.right,screen(z+99),curb,5);
  for(const off of [-48,48])line(r.center+off,y,r.center+off,screen(z+126),'#614f3838',2);
  if(Math.floor(z/42)%4===0)box(r.center+Math.sin(z)*25,y,7,3,'#d6c9a655',1);
 }
 for(let z=Math.floor((s.camera-1000)/465)*465;z<s.camera+3600;z+=465){scenicProp(z,-1,Math.floor(z/155));scenicProp(z+70,1,Math.floor(z/155)+1);}
}
const groundTiles=new Map();
function tile(key){
 if(groundTiles.has(key))return groundTiles.get(key);
 const layer=document.createElement('canvas');layer.width=W;layer.height=1160;
 const savedG=g,savedCamera=s.camera;g=layer.getContext('2d');g.translate(0,400);s.camera=key*1000;staticGround();g=savedG;s.camera=savedCamera;
 groundTiles.set(key,layer);if(groundTiles.size>3)groundTiles.delete(groundTiles.keys().next().value);return layer;
}
function ground(){const key=Math.floor(s.camera/1000),image=tile(key);g.drawImage(image,0,-400+(s.camera-key*1000)*.28);
 for(const p of s.footprints){g.globalAlpha=p.life*.15;box(p.x-3,screen(p.z),5,9,C.gold,2);}g.globalAlpha=1;
 if(s.rear>45){const inset=(s.rear-45)*.42;box(0,130,inset,630,'#e4979540');box(W-inset,130,inset,630,'#e4979540');}
 if(s.dash){for(let i=0;i<14;i++){const x=(i*79+31)%420,y=(i*113+s.time*1800)%730;line(x,y,x,y+48,C.gold+'60',2);}}

}
function render(){formation.hidden=true;g.clearRect(0,0,W,H);ground();
 for(const f of s.fronts){if(f.crossed)continue;const y=screen(f.z);if(y<110||y>710)continue;for(const c of f.columns){g.globalAlpha=f.index===s.layer?1:.5;box(c.x-48,y-105,96,160,c.open?'#a7ffcf18':'#1c302b30',6);line(c.x-49,y-100,c.x-49,y+8,'#d5c08770',2);if(c.open){line(c.x-39,y,c.x+39,y,'#a7ffcf',5);text('缺口已开',c.x,y-8,12,C.mint);}else{text(c.name,c.x,y+20,11,C.gold);}g.globalAlpha=1;}}
 for(const body of (waveClear(s)?[]:s.corpses)){g.globalAlpha=Math.min(.4,body.life*.15);g.save();g.translate(body.x,screen(body.z));g.rotate(1.3);soldier(body.army===1?'horse':'roman','swarm',0,0,30);g.restore();}g.globalAlpha=1;
 for(const e of s.enemies){const y=screen(e.z);if(y<135||y>710||e.x<-30||e.x>450)continue;g.globalAlpha=e.retreat?.45:e.layer===s.layer?1:.65;soldier(e.army===1?'horse':'roman',e.type,e.x,y,e.army===1?41:36,e.phase);if(e.hp<e.max){box(e.x-9,y-21,18,3,'#302c26',1);box(e.x-9,y-21,18*Math.max(0,e.hp/e.max),3,C.coral,1);}}g.globalAlpha=1;
 for(const t of (waveClear(s)?[]:s.traces)){const f=1-t.life/.16;line(t.x+(t.tx-t.x)*f,screen(t.z+(t.tz-t.z)*f),t.tx,screen(t.tz),t.color,2);}
 for(const p of s.particles){g.globalAlpha=p.life*2;box(p.x,screen(p.z),3,3,p.color);}g.globalAlpha=1;
 for(const a of s.arrows){const y=screen(a.z);g.globalAlpha=a.hit?.2:.8;circle(a.x,y,26,a.age<1.05?'#ffb46480':'#ff684c');line(a.x-17,y-17,a.x+17,y+17,C.coral,2);line(a.x+17,y-17,a.x-17,y+17,C.coral,2);if(a.age>.75&&!a.hit)line(a.sourceX,screen(a.sourceZ),a.x,y,'#ffcb8d',2);g.globalAlpha=1;}
 if(waveClear(s)&&view==='play'){box(55,285,310,215,'#102c39ed',12);text('本波 96 / 96 全部击破',210,375,18,C.mint);text('点咕咕进入下一波',210,405,13,C.gold);}
 const py=screen(s.distance),span=21,run=Math.sin(s.time*18)*2;
 if(view!=='menu'){
  const followers=Math.min(20,3+Math.floor(s.army/8));for(let i=0;i<followers;i++)soldier('han','swarm',s.x+(i%5-2)*17,py+42+Math.floor(i/5)*17,28,i);
  line(s.x-span,py+15,s.x+span,py+15,C.gold,2);cat(s.x-span,py+run,1);dog(s.x+span,py-run,1);line(s.x+span+12,py+12,s.x+span+12,py-45,'#b39055',2);polygon([[s.x+span+12,py-45],[s.x+span+36,py-39],[s.x+span+29,py-24],[s.x+span+12,py-29]],'#a63e32');
  if(s.dash){for(let i=0;i<10;i++)line((i*83)%420,(s.time*1400+i*57)%760,(i*83)%420,(s.time*1400+i*57)%760+35,'#ffe3a47a',2);}
 }
 if(s.impact>0){g.globalAlpha=s.impact*.4;box(0,125,W,H-125,C.coral);g.globalAlpha=1;}
 box(0,0,W,126,'#102c39fa');text('火力突围 · 算阵破军 V0.16',15,24,13,C.mint,'left');text('军心 '+Math.ceil(s.hull),15,80,11,s.hull<30?C.coral:C.pale,'left');
 text('兵力 '+s.army,15,61,27,C.gold,'left');text('第 '+Math.min(12,s.layer+1)+' / 12 道防线',400,53,14,C.pale,'right');text(Math.floor(s.distance)+' / '+GOAL,400,77,12,C.pale,'right');
 box(15,90,390,5,'#35505a',2);box(15,90,390*s.crossed/LAYERS,5,C.gold,2);text('本波剩余 '+(s.fronts[s.layer]?.columns.reduce((n,c)=>n+c.remaining,0)??0)+' / 96 · 总击破 '+s.kills,15,115,11,C.pale,'left');text('箭列 '+Math.min(8,2+Math.floor(s.army/16))+' · '+(s.army<36?'基础弩阵':s.army<65?'强弩方阵':'重弩军团'),400,115,11,C.mint,'right');
 const f=s.fronts[s.layer];if(f&&view==='play'){
  text('清一列算一次 · 三列全清才进军 · 除法取整',210,145,11,C.pale);
  for(const c of f.columns){const selected=laneAt(s.x)===c.lane,x=c.x-49;box(x,183,98,91,selected?'#305351f5':'#15343cf0',6);if(selected){g.strokeStyle=C.gold;g.lineWidth=2;g.strokeRect(x,183,98,91);}text(c.name,c.x,200,11,C.pale);text(formula(c.orders),c.x,224,15,c.open?C.mint:C.gold);text(c.open?'已消灭 · 已结算':'守军 '+c.remaining+' / 32',c.x,245,11,c.open?C.mint:C.pale);text(c.heal?'军心 +14':'甲厚 ×'+c.armor,c.x,262,10,C.coral);}
  box(17,614,386,28,'#102c39ec',6);text(s.dash?'本波全部消灭，向下一波进军！':waveClear(s)?'本波96名守军全部消灭！点咕咕进入下一波':f.columns[laneAt(s.x)].open?'这一列已清空，移动到另两列继续歼敌':s.underFire>60?'援军将合围！清掉所有残余守军':'墨墨集火当前列 · 红圈出现时躲箭雨',210,633,11,C.pale);
  text('咕咕号令 '+Math.floor(s.tension)+' / 45',18,666,11,C.mint,'left');text('歼敌齐射消耗45 / 全歼推进不消耗号令',18,685,10,C.pale,'left');
 }
 const n=s.notices.at(-1);if(n&&view==='play'){box(6,153,408,22,'#152c36ed',4);text(n.text,210,168,10,n.color);}
}
function show(html){overlay.innerHTML=html;overlay.hidden=false;controls.hidden=true;}
function menu(){view='menu';show(`<div class="eyebrow">V0.16 · 算阵破军</div><h1 class="title">算出军势<br><em>凿穿敌阵</em></h1><p class="subtitle">墨墨集火，咕咕破阵。数学就是你的兵力。</p><div class="rule"><b>每波96名敌军，三列必须全部打光</b><br>每消灭一列，立即执行它的两步算式。<br>先打哪列，决定运算顺序和中途兵力。<br>先加后乘，与先乘后加，最终兵力不同。<br>兵力决定箭列与伤害；红圈箭雨会造成战损。<br>按箭头顺序算，除法向下取整，上限180。</div><button class="primary" id="start">看阵，出发 →</button><p class="fine">左右拖动自动射击 · 第二根手指点咕咕号令<br>闭阵齐射，开阵冲锋 · 架空历史演武<br>本波全部消灭后，点咕咕进入下一波；无敌人撤退</p>`);document.querySelector('#start').onclick=()=>start();}
function start(seed){s=createGame(typeof seed==='number'?seed:Date.now());view='play';overlay.hidden=true;controls.hidden=false;input.reset();keys={};last=performance.now();}
function end(){view=s.mode;input.reset();const r=result(s);bestScore=Math.max(bestScore,r.score);try{localStorage.setItem('fr016score',bestScore);}catch{}show(`<div class="eyebrow">${r.grade} · 算阵破军</div><h1 class="title">${s.mode==='win'?'十二阵，逐层凿穿':'换条兵法，再破一次'}</h1><div class="rule">${s.reason}<br>突破 ${s.crossed} / 12 · 剩余兵力 ${s.army} · 军心 ${Math.ceil(s.hull)}<br>击破 ${s.kills} · 用时 ${Math.floor(s.time)} 秒 · 得分 ${r.score}<br><b>最近的运算</b><br>${s.history.slice(-3).map(h=>h.before+' '+h.formula+' = '+h.raw+(h.raw>180?'（编制180）':'')).join('<br>')||'尚未穿过第一道防线'}<br>下次调整三列的清除顺序，比较中途兵力与最终收益。</div><button class="primary" id="again">换一场演武 ↻</button><button class="secondary" id="practice">重演此阵 · 换条路线</button><button class="secondary" id="back">返回出发点</button>`);document.querySelector('#again').onclick=()=>start();document.querySelector('#practice').onclick=()=>start(s.seed);document.querySelector('#back').onclick=menu;}
function pause(){if(view==='pause'){resume();return;}if(view!=='play')return;view='pause';input.reset();keys={};show('<h1 class="title">先看阵，再进军</h1><div class="rule">算式按箭头从左到右执行，除法向下取整。<br>三列96名敌军全部击破，才可进入下一波。<br>闭阵点咕咕：花45号令集中齐射。<br>全歼后点咕咕：免费推进下一波。<br>每清空一列立刻结算；先清哪列，就先算哪列。</div><button class="primary" id="resume">继续破阵 →</button><button class="secondary" id="restart">重新出发</button>');document.querySelector('#resume').onclick=resume;document.querySelector('#restart').onclick=()=>start();}
function resume(){view='play';overlay.hidden=true;controls.hidden=false;last=performance.now();}
function useSkill(){rush(s);}
const input=bindInput({area:document.querySelector('#game'),canvas,skill,active:()=>view==='play',onMove:x=>s.target=clamp(x,72,348),onSkill:useSkill});
document.querySelector('#pause').onclick=pause;document.querySelector('#sound').hidden=true;
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(!e.repeat){if(e.key===' '&&view==='play')useSkill();if(e.key.toLowerCase()==='p')pause();}});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>keys={});document.addEventListener('visibilitychange',()=>{hidden=document.hidden;input.reset();keys={};last=performance.now();});
let accumulator=0,lastUI=0,lastLabel='',lastHint='';
function frame(now){const elapsed=clamp((now-last)/1000,0,.1);last=now;if(renderBudget.observe(elapsed,view==='play'&&!freeze&&!hidden))resize();
 if(view==='play'&&!freeze&&!hidden){accumulator+=elapsed;let ticks=0;while(accumulator>=1/60&&ticks++<6){const d=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);if(d)s.target=clamp(s.target+d*370/60,72,348);step(s,1/60);accumulator-=1/60;if(s.mode!=='play'){end();break;}}}else accumulator=0;
 const disabled=!!s.dash||(!waveClear(s)&&(s.cooldown>0||s.tension<45));if(skill.disabled!==disabled)skill.disabled=disabled;
 if(now-lastUI>100){lastUI=now;const f=s.fronts[s.layer],open=waveClear(s),label=s.dash?'咕咕 · 突破中':open?'咕咕 · 进入下一波':'墨墨 · 集中齐射',hint=open?'本波全部击破 · 免费进军':s.tension<45?'号令回充中':'消耗45 · 当前列全排受击';if(label!==lastLabel){skillTitle.textContent=label;lastLabel=label;}if(hint!==lastHint){skillHint.textContent=hint;lastHint=hint;}}
 render();requestAnimationFrame(frame);
}
menu();requestAnimationFrame(frame);
if(new URLSearchParams(location.search).has('test'))window.__game={stats:()=>({renderScale:renderBudget.scale,tiles:groundTiles.size,cachePixels:groundTiles.size*420*1160,canvasPixels:canvas.width*canvas.height}),state:()=>s,start,pause,resume,input,step:dt=>step(s,dt),rush:useSkill,freeze:v=>{freeze=v;accumulator=0;},render:()=>{render();if(s.mode!=='play'&&view==='play')end();}};
