import {W,H,LIMIT,LANES,clamp,tier,guns,laneOf,createGame,step,pulse,supplyValue} from './game.js';
import {bindInput} from './input.js';
const canvas=document.querySelector('#c'),g=canvas.getContext('2d'),overlay=document.querySelector('#overlay'),controls=document.querySelector('#controls'),skill=document.querySelector('#skill');
let s=createGame(),view='menu',last=0,keys={},muted=true,audio,best=0,freeze=false,hidden=false;
try{best=+localStorage.getItem('fr08best')||0;}catch{}
const C={ink:'#1b302e',mint:'#a0efd0',gold:'#ffe0a2',red:'#fa9a7b',pale:'#e8efd3'};
function box(x,y,w,h,c,r=0){g.fillStyle=c;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();}
function circle(x,y,r,c){g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}
function line(x,y,xx,yy,c,w=1){g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke();}
function text(a,x,y,size=12,c=C.pale,align='center'){g.fillStyle=c;g.font=`800 ${size}px system-ui`;g.textAlign=align;g.fillText(a,x,y);}
function resize(){let d=Math.min(devicePixelRatio||1,2);canvas.width=W*d;canvas.height=H*d;g.setTransform(d,0,0,d,0,0);}resize();addEventListener('resize',resize);
function cat(x,y,scale=1){g.save();g.translate(x,y);g.scale(scale,scale);circle(0,6,13,'#243a3b');g.fillStyle='#243a3b';g.beginPath();g.moveTo(-12,4);g.lineTo(-13,-16);g.lineTo(-2,-8);g.lineTo(11,-16);g.lineTo(13,4);g.fill();box(-9,0,6,3,C.mint,1);box(4,0,5,3,C.mint,1);box(-11,16,22,5,C.mint,2);g.restore();}
function dog(x,y,scale=1){g.save();g.translate(x,y);g.scale(scale,scale);circle(-12,-4,8,'#b48157');circle(12,-4,8,'#b48157');circle(0,4,15,'#f4c882');circle(-5,1,2,C.ink);circle(5,1,2,C.ink);circle(0,8,3,C.ink);box(-11,17,22,5,'#e98d7e',2);g.restore();}
function ground(){
 const palettes=[['#435d4e','#506c58','#8da173'],['#665b47','#766849','#b59d6c'],['#4f5264','#5f6173','#9a94aa']],p=palettes[Math.min(2,s.sector)];
 box(0,0,420,760,p[0]);
 for(let i=0;i<10;i++){let y=150+i*48;line(22,y,398,y,p[1],2);for(let j=0;j<6;j++){let x=23+j*67+(i%2)*12;box(x,y+4,57,38,p[1],4);}}
 box(22,140,376,14,'#293e37',3);for(let i=0;i<10;i++)box(25+i*38,132,25,15,p[2],2);
 for(const x of [15,405]){box(x-4,155,8,462,'#263e36',2);for(let y=175;y<600;y+=50)box(x-9,y,18,22,p[2],3);}
 for(const x of [145,275])for(let y=345;y<535;y+=24)line(x,y,x,y+11,'#cddbac33',2);
 // Fixed ground, fortification line, and an army: no endless flight background.
 for(const x of LANES){g.fillStyle='#dbe9b817';g.beginPath();g.moveTo(x-30,530);g.lineTo(x,505);g.lineTo(x+30,530);g.lineTo(x+20,530);g.lineTo(x,514);g.lineTo(x-20,530);g.fill();}
 box(25,603,370,44,'#203a34',8);box(36,609,349,29,'#779478',5);
 for(let i=0;i<12;i++)box(40+i*29,606,19,5,s.base>i*100/12?C.gold:'#405b4f',1);
 text('后 方 基 地',210,632,12,'#203a34');
 for(let i=0;i<6;i++){box(37+i*59,650,47,11,'#213831',2);box(40+i*59,647,41,6,p[2],2);}
 text('横移集火 · 别只清怪，要拆塔',21,710,10,'#d5e2be','left');
}
function links(){const core=s.towers[2];for(const t of s.towers.slice(0,2)){
 const color=t.owner==='ally'?C.mint:t.owner==='ruin'?'#e9d9b855':C.red;
 g.setLineDash(t.owner==='ally'?[6,5]:[]);line(t.x,t.y-30,core.x,core.y,color,t.owner==='enemy'?4:2);g.setLineDash([]);
 const midx=(t.x+core.x)/2,midy=(t.y-30+core.y)/2;text(t.owner==='enemy'?'供能':t.owner==='ally'?'已断电':'已瘫痪',midx,midy-7,9,color);
}}
function drawTower(t){
 const ally=t.owner==='ally',ruin=t.owner==='ruin',core=t.id==='core',w=core?82:60,color=ally?'#a2d9b9':ruin?'#8a8064':'#bb8160';
 g.save();g.translate(t.x,t.y);g.fillStyle='#172c3266';g.beginPath();g.ellipse(2,24,w*.65,17,0,0,Math.PI*2);g.fill();
 if(ruin){box(-30,2,60,19,'#544f41',4);for(let i=0;i<4;i++)box(-27+i*16,-8+(i%2)*5,13,15,color,2);
  const prog=t.capture/1.4;g.strokeStyle=C.gold;g.lineWidth=4;g.beginPath();g.arc(0,0,34,-Math.PI/2,-Math.PI/2+Math.PI*2*prog);g.stroke();text(t.contested?'敌人争夺中':'移到此侧占领',0,50,11,t.contested?C.red:C.gold);
 }else{
  box(-w/2,-30,w,55,'#2a4038',6);box(-w/2+4,-36,w-8,51,color,5);for(let i=0;i<(core?4:3);i++)box(-w/2+6+i*19,-47,13,17,color,2);
  box(-w/2+9,-27,w-18,11,ally?'#39594d':'#674b3f',2);
  circle(0,-4,core?22:16,ally?'#3e6c59':'#594b42');circle(0,-4,core?13:9,ally?C.mint:C.red);
  if(!core){box(-5,-12,10,32,ally?'#c4e9c8':'#d4a27c',3);box(-9,12,18,8,'#34453a',3);}
  else {const owned=s.towers.filter(t=>t.owner==='ally').length;if(owned<2){g.strokeStyle=owned===0?'#e8bc7780':'#e8bc7740';g.lineWidth=owned===0?7:3;g.beginPath();g.arc(0,-5,44,0,Math.PI*2);g.stroke();}text(owned===2?'断电！集火':'护盾 '+(owned===0?'100%':'82%'),0,59,11,owned===2?C.gold:C.red);}
  box(-w/2-3,33,w+6,6,'#213a32',2);box(-w/2-3,33,(w+6)*Math.max(0,t.hp/t.max),6,ally?C.mint:C.red,2);
  if(t.guard>0){box(-w/2-3,41,(w+6)*t.guard/180,3,'#eee6b4',1);}
  if(ally){line(20,-38,20,-73,'#e6e7b2',2);g.fillStyle=C.mint;g.beginPath();g.moveTo(21,-72);g.lineTo(42,-66);g.lineTo(21,-57);g.fill();text('己方火力点',0,61,10,C.mint);}
 }
 g.restore();
}
function soldier(e){g.save();g.translate(e.x,e.y);g.fillStyle='#21382c66';g.beginPath();g.ellipse(1,6,e.r+2,5,0,0,Math.PI*2);g.fill();const color=e.type==='shield'?'#b5bd8d':e.type==='sapper'?'#ffb875':'#b7d38b';
 box(-e.r+1,-5,e.r*2-2,e.r+10,color,3);box(-e.r,-9,e.r*2,8,e.type==='shield'?'#5f7670':'#48634b',3);box(-3,-2,6,2,'#243a32',1);box(-e.r+1,3,e.r*2-2,2,'#cb8266',1);line(-4,10,-5,13,'#253e32',2);line(4,10,5,13,'#253e32',2);
 if(e.type==='shield'){box(-10,4,20,10,'#728b80',2);line(-8,6,8,6,'#dbe5bb',2);}if(e.type==='sapper'){circle(0,8,5,'#795342');text('!',0,11,9,C.gold);}if(e.stun>0){text('✧',0,-15,12,C.gold);}g.restore();}
function render(){ground();box(LANES[laneOf(s.x)]-49,342,98,250,'#ffdc8b10',5);links();
 for(const raid of s.raids){const x=LANES[raid.lane];circle(x,300,51,'#f39c7c30');text('侧翼反扑 '+raid.remaining.toFixed(1)+'s',x,393,10,C.red);}
 const objects=[...s.towers.map(t=>({...t,kind:'tower',original:t})),...s.enemies.map(e=>({...e,kind:'enemy'}))].sort((a,b)=>a.y-b.y);
 for(const o of objects)if(o.kind==='tower')drawTower(o.original);else soldier(o);
 for(const a of s.impacts){const alpha=a.remaining>0?.25+Math.sin(s.time*16)*.1:.5;g.globalAlpha=alpha;circle(a.x,a.y,a.r,C.red);g.globalAlpha=1;g.strokeStyle=C.red;g.lineWidth=2;g.beginPath();g.arc(a.x,a.y,a.r,0,Math.PI*2);g.stroke();line(a.x-10,a.y,a.x+10,a.y,C.red,2);line(a.x,a.y-10,a.x,a.y+10,C.red,2);if(a.remaining>0)text('撤',a.x,a.y-52,14,C.red);}
 for(const a of s.traces){g.globalAlpha=clamp(a.life*10,0,1);const f=1-a.life*10,px=a.x+(a.tx-a.x)*f,py=a.y+(a.ty-a.y)*f;line(px,py,px+(a.tx-a.x)*.15,py+(a.ty-a.y)*.15,a.color,a.width);circle(a.tx,a.ty,3,a.color);}g.globalAlpha=1;
 for(const p of s.particles){g.globalAlpha=Math.min(1,p.life*3);box(p.x,p.y,3,3,p.color,1);}g.globalAlpha=1;
 if(view!=='menu'){
  const n=4+tier(s.power)*3;for(let i=0;i<n;i++){const col=i%6,row=Math.floor(i/6),xx=s.x+(col-2.5)*13,yy=576+row*17;box(xx-4,yy-5,8,10,'#bfd5aa',2);box(xx-5,yy-10,10,7,'#567667',2);box(xx-2,yy-15,4,8,C.gold,1);}
  g.globalAlpha=s.invulnerable>0?.7:1;cat(s.x-17,542,1.05);dog(s.x+19,550,.9);line(s.x-6,558,s.x+6,558,'#f1d2a0',2);
  const chosen=s.towers.find(t=>t.owner==='ruin'&&t.lane===laneOf(s.x));if(chosen){g.setLineDash([4,6]);line(s.x,520,chosen.x,chosen.y+40,C.gold,2);g.setLineDash([]);}
  g.globalAlpha=1;
 }
 if(s.pulse>0){g.globalAlpha=s.pulse;g.strokeStyle=C.mint;g.lineWidth=7;g.beginPath();g.arc(s.x,420,(.65-s.pulse)*(s.pulseRadius||185)/.65+15,0,Math.PI*2);g.stroke();g.globalAlpha=1;}
 // Clean dashboard: progress is occupied terrain, not elapsed flight time.
 box(0,0,420,125,'#1b302ff5');text('FIRE / RUSH',17,25,11,C.mint,'left');text('夺塔战线 V0.8',17,46,10,'#adc4a8','left');
 text('基地',17,72,10,'#afc7b3','left');box(49,63,112,9,'#465d4c',4);box(49,63,112*Math.max(0,s.base)/100,9,s.base<30?C.red:C.mint,4);text(Math.ceil(s.base),170,73,12,C.pale,'left');
 text('火力 '+s.power,237,73,20,C.gold,'left');text(guns[tier(s.power)],399,96,11,C.gold,'right');text('敌潮 '+s.enemies.length+' · 击破 '+s.kills,17,96,11,C.pale,'left');
 for(let i=0;i<3;i++){box(17+i*76,109,67,4,i<s.sector?C.mint:i===s.sector?C.gold:'#506252',2);}text('援军封路 '+Math.max(0,Math.ceil(LIMIT-s.time))+'s',399,116,10,C.red,'right');
 text(['01 / 青苔旧堡','02 / 熔炉堤坝','03 / 断桥母巢'][Math.min(2,s.sector)],22,167,11,C.gold,'left');text('占领 '+s.towers.filter(t=>t.owner==='ally').length+'/2',396,167,11,C.mint,'right');
 if(s.supply){for(let i=0;i<2;i++){const a=s.supply.options[i],x=17+i*202,selected=(s.x<210?0:1)===i;box(x,600,184,72,selected?'#345e4df5':'#213c38f5',6);if(selected){g.strokeStyle=C.gold;g.lineWidth=2;g.strokeRect(x+1,601,182,70);}const affordable=a.kind!=='pay'||s.power-a.v>=8;text(affordable?a.name+' '+s.power+a.op+' → '+supplyValue(s.power,a):a.name+' · 火力不足，取消',x+92,624,13,affordable?C.gold:C.red);text(a.detail.split(' · ')[1],x+92,644,10,C.pale);text((selected?'当前选择 · ':'移至此侧 · ')+Math.ceil(s.supply.remaining)+'s',x+92,661,10,selected?C.mint:C.red);}}
 else {text('同心 '+Math.floor(s.bond)+'% · 满值破盾',19,684,10,C.mint,'left');text('驻守占塔，塔会帮你清潮',19,731,10,'#b2c8a9','left');}
 for(let i=0;i<s.notices.length;i++){const a=s.notices[i];g.globalAlpha=Math.min(1,a.life);box(20,443+i*28,380,24,'#18392ce6',4);text(a.text,210,460+i*28,10,a.color);}g.globalAlpha=1;
 if(s.transition>0){box(24,320,372,82,'#19392eed',12);text('防线前推',210,355,29,C.gold);text('塔已夺下，带着伙伴向下一座主堡推进',210,383,11,C.mint);}
}
function show(html){overlay.innerHTML=html;overlay.hidden=false;controls.hidden=true;}
function menu(){view='menu';show(`<div class="eyebrow">V0.8 · SIEGE / RECLAIM / ADVANCE</div><h1 class="title">火力突围<br><em>夺塔战线</em></h1><p class="subtitle">把敌人的堡垒，变成我们的路。</p><div class="rule"><b>墨墨集火攻城，咕咕破阵夺塔。</b><br>① 左右滑动，先拆一侧供能塔。<br>② 留在该侧 <b>1.4 秒</b>，清掉争夺者，夺塔支援。<br>③ 两侧塔都占领，主堡护盾失效，转中路突破。<br>④ 敌潮会反扑夺塔；<b>同心 45 起可用破阵</b>，满值能破盾。<br>夺下三座主堡，在援军封路前打通归途。</div><button class="primary" id="start">墨墨，跟紧我 →</button><p class="fine">手机原生触摸 · 手指滑出画布仍可控制<br>松手可重新按住 · 右下角独立破阵按钮<br>键盘 A/D 移动 · 空格破阵 · P 暂停<br>最高击破 ${best} · 无外部资源加载</p>`);document.querySelector('#start').onclick=()=>start();}
function start(seed){s=createGame(typeof seed==='number'?seed:Date.now());view='play';input.reset();keys={};overlay.hidden=true;controls.hidden=false;last=performance.now();}
function end(){view=s.mode;input.reset();best=Math.max(best,s.kills);try{localStorage.setItem('fr08best',best);}catch{}show(`<div class="eyebrow">${view==='win'?'THE ROAD IS OURS':'REGROUP · TRY ANOTHER BREACH'}</div><h1 class="title">${view==='win'?'这条路，我们夺回来了':'防线失守'}</h1><p class="subtitle">${view==='win'?'墨墨 ♥ 咕咕，一起回家。':'换个突破口，再冲一次。'}</p><div class="stats"><div>击破<strong>${s.kills}</strong></div><div>夺塔<strong>${s.captures}</strong></div><div>攻破主堡<strong>${Math.min(3,s.sector)}/3</strong></div></div><div class="rule">${s.reason}<br>${s.recaptures?'有 '+s.recaptures+' 次侧塔被反夺；反扑红圈出现时记得回援。':s.captures===0?'敌潮会不断补充。先拆侧塔，才能削弱兵源、打开主堡护盾。':'不要只清兵；侧塔断电后，转到中路集中攻城。'}<br>耗时 ${Math.floor(s.time)} 秒 · 补给 ${s.history.join(' / ')||'尚未领取'}</div><button class="primary" id="again">换条突破路线 ↻</button><button class="secondary" id="back">返回营地</button>`);document.querySelector('#again').onclick=()=>start();document.querySelector('#back').onclick=menu;}
function pause(){if(view==='pause'){resume();return;}if(view!=='play')return;view='pause';input.reset();keys={};show('<div class="eyebrow">HOLD THE LINE</div><h1 class="title">停一下，等你</h1><div class="rule">战场已暂停。<br>拆掉塔还不够，需要留在对应侧完成占领。侧塔被夺回时，主堡会重新获得供能。</div><button class="primary" id="resume">继续突破 →</button><button class="secondary" id="restart">重新开局</button>');document.querySelector('#resume').onclick=resume;document.querySelector('#restart').onclick=()=>start();}
function resume(){view='play';overlay.hidden=true;controls.hidden=false;last=performance.now();}
function beep(){if(muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),a=audio.createGain();o.frequency.value=110;o.type='triangle';a.gain.setValueAtTime(.04,audio.currentTime);a.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.connect(a).connect(audio.destination);o.start();o.stop(audio.currentTime+.2);}catch{}}
function useSkill(){if(pulse(s))beep();}
const input=bindInput({area:document.querySelector('#game'),canvas,skill,active:()=>view==='play',onMove:x=>s.target=clamp(x,30,390),onSkill:useSkill});
document.querySelector('#pause').onclick=pause;document.querySelector('#sound').onclick=()=>{muted=!muted;document.querySelector('#sound').textContent='音效 '+(muted?'OFF':'ON');beep();};
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(!e.repeat){if(e.key===' '&&view==='play')useSkill();if(e.key.toLowerCase()==='p')pause();}});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>keys={});
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;input.reset();keys={};last=performance.now();});
function frame(now){const dt=clamp((now-last)/1000,0,.04);last=now;if(view==='play'&&!freeze&&!hidden){const d=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);if(d)s.target=clamp(s.target+d*370*dt,30,390);step(s,dt);if(s.mode!=='play')end();}skill.disabled=s.bond<45||s.cooldown>0||s.transition>0;skill.querySelector('b').textContent=s.cooldown>0?'破阵冷却 '+s.cooldown.toFixed(1)+'s':s.bond>=100?'咕咕 · 满值破阵':s.bond>=45?'咕咕 · 破阵':'同心 '+Math.floor(s.bond)+' / 45';render();requestAnimationFrame(frame);}
menu();requestAnimationFrame(frame);
if(new URLSearchParams(location.search).has('test'))window.__game={state:()=>s,start,pause,resume,input,step:dt=>step(s,dt),pulse:useSkill,freeze:v=>freeze=v,render:()=>{render();if(s.mode!=='play'&&view==='play')end();}};
