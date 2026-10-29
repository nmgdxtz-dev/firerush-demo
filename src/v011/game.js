// A crowded coastal road: aim through the tide, then steer around physical obstacles.
export const W=420,H=760,GOAL=5400,MAX_ENEMIES=760,LIMIT=180;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function rng(seed){return()=>{let t=seed+=0x6d2b79f5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export const tier=p=>p>=70?2:p>=40?1:0;
export function road(z){const center=210+Math.sin(z*.0024)*20,bridge=z>=3600,half=bridge?144:156;return{center,left:center-half,right:center+half,half,biome:Math.min(2,Math.floor(Math.max(0,z)/1800))};}
export function obstacleX(s,o){return o.type==='cart'?o.x+Math.sin(s.time*.95+o.phase)*54:o.x;}
export function obstacleAhead(s,range=290){return s.obstacles.find(o=>!o.passed&&o.z>s.distance-40&&o.z<s.distance+range);}
export const weapons=['双生四弦','六弦破潮','八弦日冕'];
export function note(s,text,color='#ffe3a4'){s.notices.push({text,color,life:2.4});if(s.notices.length>2)s.notices.shift();}
export function createGame(seed=Date.now()){
 const s={seed,random:rng(seed),mode:'play',time:0,distance:0,camera:0,x:210,target:210,hull:100,power:26,width:1,tension:36,rear:0,kills:0,cleanRushes:0,hardRushes:0,cooldown:0,fire:0,spawn:.65,phase:0,dash:null,pulse:0,invulnerable:0,streak:0,serial:0,enemies:[],traces:[],particles:[],notices:[],choice:null,nextChoice:320,history:[],fronts:[],peak:0,weaponTier:0,reason:'',wakes:[],rings:[],chain:0,chainWindow:0,explosions:0,wakeKills:0,obstacles:[],obstacleHits:0,dodged:0,impact:0,obstacleGrace:0,nearMisses:0,tailwind:0,windRushes:0,footprints:[],footTimer:0,grid:new Uint16Array(30*52)};
 let previous=210;for(let i=0;i<9;i++){let x=70+s.random()*280;if(Math.abs(x-previous)<95)x=previous<210?315:105;s.fronts.push({z:430+i*520,x,baseX:x,hp:140+i*22,max:140+i*22,open:0,breached:false,phase:s.random()*6.28});previous=x;}
 for(let i=0;i<9;i++){const z=650+i*520,r=road(z);s.obstacles.push({z,x:r.center+((i+((seed>>>0)%2))%2?64:-64),width:i%3===1?76:96,type:i%3===1?'cart':'barrier',phase:i*1.7+((seed>>>0)%13)*.3,passed:false});}
 for(let row=0;row<25;row++)spawnRow(s,160+row*22,0);
 note(s,'沿海公路，出发！破潮之后看路障，提前绕行');return s;
}
export function spawnEnemy(s,x,z,type='swarm'){
 if(s.enemies.length>=MAX_ENEMIES)return;
 const hp=type==='lantern'?16:type==='heavy'?32+s.phase*3:10+s.phase;
 s.enemies.push({id:++s.serial,x:clamp(x,road(z).left+9,road(z).right-9),z,hp,max:hp,type,stun:0,phase:s.random()*6.28,dead:false});
}
export function spawnRow(s,z,phase=s.phase){
 const shift=Math.sin(z*.008)*9;
 for(let col=0;col<25;col++){const x=17+col*16+shift+(s.random()-.5)*5;spawnEnemy(s,x,z+Math.sin(col*.28+z*.012)*20+(s.random()-.5)*7,s.random()<.035?'lantern':s.random()<.06+phase*.065?'heavy':'swarm');}
}
export function burst(s,x,z,color,n=5){for(let i=0;i<n&&s.particles.length<170;i++)s.particles.push({x,z,vx:(s.random()-.5)*130,vz:(s.random()-.5)*130,life:.25+s.random()*.3,color});}
function kill(s,e){if(e.dead)return;e.dead=true;s.kills++;s.tension=Math.min(100,s.tension+.72);if(s.kills%24===0)s.power=Math.min(99,s.power+1);burst(s,e.x,e.z,e.type==='swarm'?'#94e6cc':'#ffb478',2);
 if(e.type==='lantern'){
  // Mark dead before cascading: a bounded chain can visit each creature only once.
  s.explosions++;s.rings.push({x:e.x,z:e.z,life:.55});if(s.rings.length>24)s.rings.shift();
  burst(s,e.x,e.z,'#ffd28b',12);
  for(const other of s.enemies)if(!other.dead&&Math.hypot(other.x-e.x,(other.z-e.z)*.8)<62){other.hp-=25;other.stun=.65;if(other.hp<=0)kill(s,other);}
  for(const f of s.fronts)if(!f.breached&&!f.held&&f.open<=0&&Math.hypot(f.x-e.x,f.z-e.z)<90){f.hp-=55;if(f.hp<=0){f.open=3.6;note(s,'灯蛹炸开潮眼！趁现在拉弦','#ffd28b');}}
 }
}
export function seam(s,x=s.x){
 const radius=22*s.width;let mass=0,count=0;
 for(const e of s.enemies)if(!e.dead&&e.z>s.distance+22&&e.z<s.distance+242&&Math.abs(e.x-x)<radius){count++;mass+=e.type==='heavy'?2:1;}
 for(const f of s.fronts)if(!f.breached&&f.z>s.distance&&f.z<s.distance+270&&((f.open<=0&&!f.held)||Math.abs(x-f.x)>33))mass+=24;
 return{mass,count,ready:mass<=7,clarity:clamp(Math.round(100-Math.max(0,mass-7)*5),0,100),radius};
}
export const choices=[
 {name:'收束成矛',op:'伤害 ×1.28 / 宽度 ÷1.28',factor:1/1.28,description:'更窄、更深，容易凿穿缺口'},
 {name:'展开成翼',op:'宽度 ×1.28 / 伤害 ÷1.28',factor:1.28,description:'更宽、击退更强，压住两侧'},
];
export function formationPreview(s,side){const width=clamp(s.width*choices[side].factor,.55,1.8);return{width,damage:1/width};}
export function chooseFormation(s,side){if(!s.choice)return false;const p=formationPreview(s,side);s.width=p.width;s.history.push(choices[side].name);s.choice=null;note(s,choices[side].name+'：伤害 ×'+p.damage.toFixed(2)+' / 宽度 ×'+p.width.toFixed(2));return true;}
export const rushCost=s=>s.chainWindow>0?22:32;
export const skillCost=s=>seam(s).ready?rushCost(s):12;
export function rush(s){
 if(s.mode!=='play'||s.dash||s.cooldown>0||s.tension<skillCost(s))return false;
 const gap=seam(s),clean=gap.ready;
 if(!clean){
  s.tension-=12;s.cooldown=1.05;s.invulnerable=.45;s.pulse=.35;s.hardRushes++;s.chain=0;s.chainWindow=0;
  for(const e of s.enemies)if(!e.dead&&Math.hypot(e.x-s.x,(e.z-s.distance)*.65)<100){e.hp-=18;e.z+=35;e.stun=.65;if(e.hp<=0)kill(s,e);}
  s.rings.push({x:s.x,z:s.distance,life:.45});note(s,'咕咕回旋护住墨墨 · 耗弦 12','#ffcf9e');return true;
 }
 s.tension-=rushCost(s);s.chain=s.chainWindow>0?s.chain+1:1;s.chainWindow=0;
 const windy=s.tailwind>0;if(windy){s.tailwind=0;s.windRushes++;}let length=windy?290:240;const blocking=s.fronts.find(f=>!f.breached&&f.z>s.distance&&f.z<=s.distance+length&&(f.open<=0||Math.abs(s.x-f.x)>33));if(blocking)length=Math.max(0,blocking.z-s.distance-32);
 s.cooldown=s.chain>=3?6.6:.98;s.invulnerable=.95;s.pulse=.7;
 const wake={points:[{x:s.x,z:s.distance}],life:5.5};s.wakes.push(wake);if(s.wakes.length>4)s.wakes.shift();
 s.dash={from:s.distance,to:s.distance+length,age:0,duration:.72,clean:true,x:s.x,wake};
 for(const f of s.fronts)if(!f.breached&&f.open>0&&f.z>s.dash.from&&f.z<=s.dash.to){f.held=true;f.holderX=f.x;s.dash.gate=f;}
 s.cleanRushes++;s.streak++;s.rear=Math.max(0,s.rear-12);s.power=Math.min(99,s.power+2);
 note(s,s.chain>1?'心弦接力 ×'+s.chain+'！留下的路也在战斗':'破潮织路！滑动可弯冲，金色心弦拦住回涌','#a7ffe1');return true;
}
function fire(s){
 const count=4+tier(s.power)*2,fan=18*s.width,damage=(9+s.power*.04)/s.width;
 const front=s.fronts.find(f=>!f.breached&&f.z>s.distance&&f.z<s.distance+325);
 const candidates=s.enemies.filter(e=>!e.dead&&e.z>s.distance+10&&e.z<s.distance+325&&(!front||e.z<front.z)).sort((a,b)=>a.z-b.z);
 for(let i=0;i<count;i++){
  const start=s.x+(i%2?1:-1)*19*s.width,spread=(i-(count-1)/2)*fan;
  let hits=0,tx=s.x+spread,tz=s.distance+325;
  for(const e of candidates){if(e.dead)continue;const along=(e.z-s.distance)/325,rayx=start+(tx-start)*along;if(Math.abs(e.x-rayx)>8)continue;
   e.hp-=damage;e.z+=2.2*s.width;if(e.hp<=0)kill(s,e);hits++;tz=e.z;if(e.type==='heavy'&&e.hp>0)break;if(hits>=2+tier(s.power))break;
  }
  if(front&&hits<2+tier(s.power)){const along=(front.z-s.distance)/325,hitx=start+(tx-start)*along;tz=front.z;if(front.open<=0&&!front.held&&Math.abs(hitx-front.x)<29){front.hp-=damage;if(front.hp<=0){front.open=3.6;burst(s,front.x,front.z,'#ffd89e',30);note(s,'缝眼破裂！裂口只维持 3.6 秒，拉弦向前！','#b1ffdc');}}}
  if(s.traces.length<130)s.traces.push({x:start,z:s.distance+15,tx,tz,life:.13,color:tier(s.power)>0?'#ffdf9d':'#a5f9df'});
 }
}
export function resolveObstacles(s,beforeZ,beforeX=s.x){
 for(const o of s.obstacles){
  const radius=22*s.width+8,near=o.z-28;
  if(o.passed||beforeZ>o.z+30)continue;
  if(s.distance>=near&&beforeZ<=o.z+28){
   const f=s.distance===beforeZ?1:clamp((near-beforeZ)/(s.distance-beforeZ),0,1),crossX=beforeX+(s.x-beforeX)*f;
   if(Math.abs(crossX-obstacleX(s,o))<o.width/2+radius){
    s.distance=Math.max(beforeZ,Math.min(s.distance,near-1));s.dash=null;s.chain=0;s.chainWindow=0;s.cooldown=Math.max(s.cooldown,.85);
    if(s.obstacleGrace<=0){s.hull=Math.max(0,s.hull-16);s.tension=Math.max(0,s.tension-8);s.obstacleGrace=1.1;s.impact=.5;s.obstacleHits++;o.hit=true;note(s,'撞上'+(o.type==='cart'?'横移货箱':'倒塌路障')+'！向空侧绕开','#ffb09a');burst(s,s.x,s.distance,'#ffbc9f',15);}
   }else{o.clearance=Math.min(o.clearance??Infinity,Math.abs(crossX-obstacleX(s,o))-o.width/2-radius);if(s.distance>o.z+28){o.passed=true;s.dodged++;s.tension=Math.min(100,s.tension+7);if(!o.hit&&o.clearance<22){s.nearMisses++;s.tailwind=4;s.tension=Math.min(100,s.tension+7);s.cooldown=Math.max(0,s.cooldown-.6);burst(s,s.x,s.distance,'#fff1a5',20);note(s,'漂亮擦边！尾风 4 秒 · 下一冲 +50','#fff0ad');}else note(s,'成功绕行 · 蓄弦 +7','#c0ffde');}}
  }
 }
}
function crowd(s,dt){
 s.grid.fill(0);const rangeStart=s.distance-90;
 for(const e of s.enemies){const xx=clamp(Math.floor(e.x/14),0,29),zz=clamp(Math.floor((e.z-rangeStart)/18),0,51);s.grid[zz*30+xx]++;}
 const crest=.5+.5*Math.sin(s.time*.72),speed=39+s.phase*8+crest*22;
 let contacts=0;
 for(const e of s.enemies){if(e.dead)continue;e.phase+=dt;e.stun=Math.max(0,e.stun-dt);
  if(e.stun<=0){const xx=clamp(Math.floor(e.x/14),1,28),zz=clamp(Math.floor((e.z-rangeStart)/18),0,51),index=zz*30+xx;
   const disperse=clamp((s.grid[index-1]-s.grid[index+1])*3,-14,14);
   const close=e.z<s.distance+210?clamp((s.x-e.x)*.09,-14,14):Math.sin(e.phase+s.time*.25)*6;
   e.x=clamp(e.x+(disperse+close)*dt,road(e.z).left+9,road(e.z).right-9);e.z-=speed*dt*(e.type==='heavy'?.75:1);
  }
  let caught=false;for(const w of s.wakes){for(let i=1;i<w.points.length;i+=3){const p=w.points[i];if(Math.abs(e.z-p.z)<18&&Math.abs(e.x-p.x)<23*s.width){e.hp-=70*dt;e.stun=.15;caught=true;break;}}if(caught)break;}if(e.hp<=0){s.wakeKills++;kill(s,e);continue;}
  if(s.dash&&e.z>s.distance-28&&e.z<s.distance+55){const dx=e.x-s.dash.x;if(Math.abs(dx)<29*s.width){kill(s,e);continue;}if(Math.abs(dx)<90){e.x=clamp(e.x+Math.sign(dx)*90*dt,15,405);e.stun=.45;}}
  if(e.z<s.distance+16&&e.z>s.distance-20&&Math.abs(e.x-s.x)<28*s.width){contacts+=e.type==='heavy'?2:1;if(s.invulnerable<=0){e.z=s.distance+17;e.hp-=35*dt;if(e.hp<=0)kill(s,e);}}
  if(e.z<s.distance-85){e.dead=true;s.rear=Math.min(100,s.rear+.14);}
 }
 if(s.invulnerable<=0)s.hull=Math.max(0,s.hull-Math.min(16,contacts)*.34*dt-Math.max(0,s.rear-35)*.05*dt);
 s.enemies=s.enemies.filter(e=>!e.dead);
}
export function result(s){
 const score=Math.max(0,Math.floor(s.distance*2+s.dodged*150+s.nearMisses*250+s.cleanRushes*50+Math.min(2000,s.kills)*.5-s.obstacleHits*400-s.time*30+(s.mode==='win'?10000+s.hull*20:0)));
 const grade=s.mode!=='win'?'未完成':s.obstacleHits===0&&s.nearMisses>=4?'S':s.obstacleHits<=2?'A':'B';return{score,grade};
}
export function step(s,dt){
 if(s.mode!=='play')return;dt=clamp(dt,0,.04);s.time+=dt;
 const beforeZ=s.distance,beforeX=s.x;const r=road(s.distance),edge=22*s.width+12;const squeeze=Math.max(0,s.rear-65)*.12;s.x+=(clamp(s.target,r.left+edge+squeeze,r.right-edge-squeeze)-s.x)*(1-Math.exp(-15*dt));
 s.footTimer-=dt;if(s.footTimer<=0){s.footTimer=.12;s.footprints.push({x:s.x+(Math.floor(s.time*8)%2?10:-10),z:s.distance-10,life:2});if(s.footprints.length>45)s.footprints.shift();}for(const p of s.footprints)p.life-=dt;s.footprints=s.footprints.filter(p=>p.life>0);
 s.chainWindow=Math.max(0,s.chainWindow-dt);for(const w of s.wakes)w.life-=dt;s.wakes=s.wakes.filter(w=>w.life>0);for(const r of s.rings)r.life-=dt;s.rings=s.rings.filter(r=>r.life>0);
 s.tailwind=Math.max(0,s.tailwind-dt);s.obstacleGrace=Math.max(0,s.obstacleGrace-dt);s.impact=Math.max(0,s.impact-dt);
 s.cooldown=Math.max(0,s.cooldown-dt);s.invulnerable=Math.max(0,s.invulnerable-dt);s.pulse=Math.max(0,s.pulse-dt);
 for(const a of s.traces)a.life-=dt;s.traces=s.traces.filter(a=>a.life>0);
 for(const p of s.particles){p.x+=p.vx*dt;p.z+=p.vz*dt;p.life-=dt;}s.particles=s.particles.filter(p=>p.life>0);
 for(const n of s.notices)n.life-=dt;s.notices=s.notices.filter(n=>n.life>0);
 if(s.dash){const d=s.dash;d.age+=dt;const f=clamp(d.age/d.duration,0,1);s.distance=d.from+(d.to-d.from)*(1-Math.pow(1-f,2));if(d.gate&&s.distance<d.gate.z+28)s.x+=(d.gate.holderX-s.x)*(1-Math.exp(-30*dt));d.x=s.x;if(d.wake.points.length<48)d.wake.points.push({x:s.x,z:s.distance});if(f>=1){s.dash=null;s.chainWindow=s.chain>=3?0:1.8;}}
 else{s.distance+=11*dt;const wall=s.fronts.find(f=>!f.breached&&!f.held&&f.z>s.distance-30);if(wall&&s.distance>wall.z-30)s.distance=wall.z-30;}
 resolveObstacles(s,beforeZ,beforeX);
 for(const f of s.fronts){const rr=road(f.z);f.x=f.held?f.holderX:clamp(f.baseX+Math.sin(s.time*.65+f.phase)*20,rr.left+54,rr.right-54);if(f.open>0){f.open-=dt;if(f.open<=0&&!f.breached&&!f.held){f.hp=f.max*.55;note(s,'裂口合拢了，再打一次缝眼','#ffb09a');}}if(!f.breached&&s.distance>=f.z){f.breached=true;f.held=false;note(s,'潮脊被甩在身后！继续向前','#a7ffe1');}}
 s.camera+=(s.distance-s.camera)*(1-Math.exp(-(s.dash?4:9)*dt));
 const phase=Math.min(2,Math.floor(s.distance/1800));if(phase!==s.phase){s.phase=phase;s.rear=Math.max(0,s.rear-8);note(s,phase===1?'红岩栈道：货箱横移，先看路线再冲':'风暴跨海桥：路更窄了，两个人一起出去','#ffbd9e');for(let i=0;i<6;i++)spawnRow(s,s.distance+350+i*27,phase);}
 if(!s.dash&&s.distance>=s.nextChoice&&!s.choice){s.choice={remaining:3.5};s.nextChoice+=550;}
 if(s.choice){s.choice.remaining-=dt;if(s.choice.remaining<=0)chooseFormation(s,s.x<210?0:1);}
 s.spawn-=dt;if(s.spawn<=0){s.spawn=.42-s.phase*.025;spawnRow(s,s.distance+560+Math.sin(s.time)*22);}
 s.fire-=dt;if(s.fire<=0){s.fire=.13;fire(s);}
 crowd(s,dt);
 if(s.hull<=0){s.mode='lose';s.reason='前潮压住矛头，后潮合拢了退路';}
 else if(s.distance>=GOAL){s.mode='win';s.reason='把三重敌潮撕成一条路，两个人一起冲了出去';}
 else if(s.time>=LIMIT){s.mode='lose';s.reason='停留太久，整片潮墙合拢；需要主动穿过缺口';}
 s.peak=Math.max(s.peak,s.enemies.length);
 const level=tier(s.power);if(level!==s.weaponTier){s.weaponTier=level;note(s,'心弦进化：'+weapons[level]);}
}
