// A crowded coastal road: aim through the tide, then steer around physical obstacles.
export const W=420,H=760,GOAL=21600,MAX_ENEMIES=420,LIMIT=600;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function rng(seed){return()=>{let t=seed+=0x6d2b79f5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export const tier=p=>p>=70?2:p>=40?1:0;
export function road(z){const center=210+Math.sin(z*.0024)*20,bridge=z>=14400,half=bridge?144:156;return{center,left:center-half,right:center+half,half,biome:Math.min(2,Math.floor(Math.max(0,z)/7200))};}
export function obstacleX(s,o){return o.type==='cart'?o.x+Math.sin(s.time*.95+o.phase)*54:o.x;}
export function obstacleAhead(s,range=290){return s.obstacles.find(o=>!o.passed&&o.z>s.distance-40&&o.z<s.distance+range);}
export const weapons=['汉弩齐射','强弩列阵','弩骑协同'];
export const chapters=[{name:'盾阵平原',enemy:'罗马式盾阵',tip:'强弩破甲，冲锋扰阵'},{name:'骑射隘口',enemy:'帕提亚式骑射',tip:'看落点，避箭雨，留好冲锋'},{name:'营垒决战',enemy:'罗马式营垒',tip:'带着战损夺下最后的军旗'}];
export function note(s,text,color='#ffe3a4'){s.notices.push({text,color,life:2.4});if(s.notices.length>2)s.notices.shift();}
export function createGame(seed=Date.now()){
 const s={seed,random:rng(seed),mode:'play',time:0,distance:0,camera:0,x:210,target:210,hull:100,power:26,width:1,tension:100,rear:0,kills:0,cleanRushes:0,hardRushes:0,cooldown:0,fire:0,spawn:.65,phase:0,dash:null,pulse:0,invulnerable:0,streak:0,serial:0,enemies:[],traces:[],particles:[],notices:[],choice:null,nextChoice:720,history:[],fronts:[],peak:0,weaponTier:0,reason:'',wakes:[],rings:[],chain:0,chainWindow:0,explosions:0,wakeKills:0,obstacles:[],obstacleHits:0,dodged:0,impact:0,obstacleGrace:0,nearMisses:0,tailwind:0,windRushes:0,footprints:[],footTimer:0,campHistory:[],nextCamp:7200,arrows:[],nextVolley:2,arrowHits:0,shieldBlocks:0,nextSurge:11,surges:0,wallHits:0,build:[0,0],choiceNumber:0,sector:0,sectorSpawned:0,sectorQuota:18,cleared:0,holding:false,corpses:[],cavalry:[],cavalryTimer:0,grid:new Uint16Array(30*52)};
 let previous=210;for(let i=0;i<12;i++){let x=70+s.random()*280;if(Math.abs(x-previous)<95)x=previous<210?315:105;s.fronts.push({z:1080+i*1650,x,baseX:x,hp:100+i*10,max:100+i*10,open:0,breached:false,phase:s.random()*6.28});previous=x;}
 s.fronts[11].z=21600;s.fronts[11].mobile=true;s.fronts[11].hp=s.fronts[11].max=850;
 for(let i=0;i<9;i++){const z=1470+i*2160,r=road(z);s.obstacles.push({z,x:r.center+((i+((seed>>>0)%2))%2?64:-64),width:i%3===1?76:96,type:i%3===1?'cart':'barrier',phase:i*1.7+((seed>>>0)%13)*.3,passed:false});}
 for(let row=0;row<8;row++){spawnRow(s,160+row*35,0);s.sectorSpawned++;}
 note(s,'汉弩营出阵！墨墨掌弩，咕咕执旗');return s;
}
export function spawnEnemy(s,x,z,type='swarm'){
 if(s.enemies.length>=MAX_ENEMIES)return;
 const hp=type==='lantern'?16:type==='heavy'?32+s.phase*3:10+s.phase;
 s.enemies.push({id:++s.serial,x:clamp(x,road(z).left+9,road(z).right-9),z,hp,max:hp,type,shield:type==='heavy'&&s.phase!==1?20:0,stun:0,phase:s.random()*6.28,dead:false,army:s.phase});
}
export function spawnRow(s,z,phase=s.phase){
 const r=road(z),shift=Math.sin(z*.008)*4;
 for(let col=0;col<17;col++){const x=r.left+13+col*(r.right-r.left-26)/16+shift+(s.random()-.5)*4;spawnEnemy(s,x,z+Math.sin(col*.28+z*.012)*20+(s.random()-.5)*7,s.random()<.035?'lantern':s.random()<.06+phase*.065?'heavy':'swarm');}
}
export function burst(s,x,z,color,n=5){for(let i=0;i<n&&s.particles.length<90;i++)s.particles.push({x,z,vx:(s.random()-.5)*130,vz:(s.random()-.5)*130,life:.2+s.random()*.25,color});}
function kill(s,e){if(e.dead)return;e.dead=true;s.corpses.push({x:e.x,z:e.z,army:e.army,life:5});if(s.corpses.length>36)s.corpses.shift();s.kills++;s.tension=Math.min(100,s.tension+.25);if(s.kills%24===0)s.power=Math.min(99,s.power+1);burst(s,e.x,e.z,e.type==='swarm'?'#94e6cc':'#ffb478',2);
 if(e.type==='lantern'){
  // Mark dead before cascading: a bounded chain can visit each creature only once.
  s.explosions++;s.rings.push({x:e.x,z:e.z,life:.55});if(s.rings.length>24)s.rings.shift();
  burst(s,e.x,e.z,'#ffd28b',12);
  for(const other of s.enemies)if(!other.dead&&Math.hypot(other.x-e.x,(other.z-e.z)*.8)<62){other.hp-=25;other.stun=.65;if(other.hp<=0)kill(s,other);}
  for(const f of s.fronts)if(!f.breached&&!f.held&&f.open<=0&&Math.hypot(f.x-e.x,f.z-e.z)<90){f.hp-=55;if(f.hp<=0){f.open=99;note(s,'灯蛹炸开潮眼！趁现在拉弦','#ffd28b');}}
 }
}
export function seam(s,x=s.x){
 const radius=22*s.width;let mass=0,count=0;
 for(const e of s.enemies)if(!e.dead&&e.z>s.distance+22&&e.z<s.distance+242&&Math.abs(e.x-x)<radius){count++;mass+=e.type==='heavy'?2:1;}
 for(const f of s.fronts)if(!f.breached&&f.z>s.distance&&f.z<s.distance+270&&((f.open<=0&&!f.held)||Math.abs(x-f.x)>33))mass+=24;
 return{mass,count,ready:mass<=7,clarity:clamp(Math.round(100-Math.max(0,mass-7)*5),0,100),radius};
}
export const choices=[
 {name:'汉弩贯甲',op:'穿透 ×2 / 射幅 ÷1.15',factor:1/1.15,description:'强弩破盾，正面贯甲'},
 {name:'汉骑掠阵',op:'侧翼伤害 + / 射幅 ×1.08',factor:1.08,description:'骑队掠过侧翼，清扫近身敌人'},
];
export function formationPreview(s,side){const width=clamp(s.width*choices[side].factor,.7,1.25);return{width,damage:1/width};}
export function chooseFormation(s,side){if(!s.choice)return false;const p=formationPreview(s,side);s.width=p.width;s.build[side]++;s.cavalryTimer=0;s.power=Math.min(99,s.power+12);s.history.push(choices[side].name);s.choice=null;note(s,choices[side].name+'就位！','#ffe3a4');return true;}
export const rushCost=()=>45;
export const skillCost=()=>45;
export function rush(s){
 if(s.mode!=='play'||s.dash||s.cooldown>0||s.tension<45)return false;
 s.tension-=45;s.chain=s.chainWindow>0?s.chain+1:1;s.chainWindow=0;
 const windy=s.tailwind>0;if(windy){s.tailwind=0;s.windRushes++;}const length=windy?230:180;
 s.cooldown=.28;s.invulnerable=.65;s.pulse=.5;
 const wake={points:[{x:s.x,z:s.distance}],life:2.5};s.wakes.push(wake);if(s.wakes.length>2)s.wakes.shift();
 s.dash={from:s.distance,to:s.distance+length,age:0,duration:.45,clean:true,x:s.x,wake};
 for(const f of s.fronts)if(!f.mobile&&!f.breached&&f.z>s.distance&&f.z<s.distance+length&&Math.abs(s.x-f.x)<50){f.open=99;f.hp=0;}
 for(const e of s.enemies)if(!e.dead&&Math.abs(e.x-s.x)<70&&e.z>s.distance-30&&e.z<s.distance+100){e.hp-=30;e.stun=.6;if(e.hp<=0)kill(s,e);}
 s.cleanRushes++;s.streak++;s.rear=Math.max(0,s.rear-12);
 note(s,windy?'借着海风，一口气冲出去！':'咕咕：牵紧，交给我！','#a7ffe1');return true;
}
function fire(s){
 const count=4+tier(s.power)*2+Math.min(2,Math.floor(s.kills/600))*2,fan=18*s.width,damage=(12+s.power*.06)/s.width;
 const front=s.fronts.find(f=>!f.breached&&f.z>s.distance&&f.z<s.distance+325);
 const candidates=s.enemies.filter(e=>!e.dead&&e.z>s.distance-60&&e.z<s.distance+325&&(!front||e.z<front.z)).sort((a,b)=>a.z-b.z);
 for(let i=0;i<count;i++){
  const start=s.x+(i%2?1:-1)*19*s.width,spread=(i-(count-1)/2)*fan;
  let hits=0,tx=s.x+spread,tz=s.distance+325;
  for(const e of candidates){if(e.dead)continue;const along=(e.z-s.distance)/325,rayx=start+(tx-start)*along;if(Math.abs(e.x-rayx)>8)continue;
   let hit=damage;if(e.shield>0){if(s.build[0]>0){e.shield=Math.max(0,e.shield-hit);hit*=.85;}else{e.shield=Math.max(0,e.shield-hit*.4);hit*=.3;s.shieldBlocks++;}}e.hp-=hit;e.z+=2.2*s.width;if(e.hp<=0)kill(s,e);hits++;tz=e.z;if(e.type==='heavy'&&e.hp>0)break;if(hits>=2+tier(s.power)+s.build[0]*2)break;
  }
  if(front&&hits<2+tier(s.power)+s.build[0]*2){const along=(front.z-s.distance)/325,hitx=start+(tx-start)*along;tz=front.z;if(front.open<=0&&!front.held&&Math.abs(hitx-front.x)<29){front.hp-=damage;if(front.hp<=0){front.open=99;burst(s,front.x,front.z,'#ffd89e',30);note(s,'缝眼破裂！一路向前！','#b1ffdc');}}}
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
    s.dash=null;s.chain=0;s.chainWindow=0;s.cooldown=Math.max(s.cooldown,.3);
    if(s.obstacleGrace<=0){s.hull=Math.max(0,s.hull-16);s.tension=Math.max(0,s.tension-8);s.obstacleGrace=1.1;s.impact=.5;s.obstacleHits++;o.hit=true;o.passed=true;s.x=clamp(obstacleX(s,o)+(s.x<obstacleX(s,o)?-1:1)*(o.width/2+radius+5),road(s.distance).left+radius,road(s.distance).right-radius);s.invulnerable=1.1;note(s,'撞上'+(o.type==='cart'?'横移货箱':'倒塌路障')+'！继续跑，下一个绕过去','#ffb09a');burst(s,s.x,s.distance,'#ffbc9f',15);}
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
   const er=road(e.z);e.x=clamp(e.x+(disperse+close)*dt,er.left+9,er.right-9);e.z+=(e.z<s.distance+48?speed*1.9:-speed)*(e.army===1?1.2:e.type==='heavy'?.75:1)*dt;
  }
  for(const rider of s.cavalry)if(Math.abs(e.z-rider.z)<38&&Math.abs(e.x-rider.x)<25){e.hp-=(100+s.build[1]*20)*dt; e.stun=.2;if(e.hp<=0){kill(s,e);break;}}if(e.dead)continue;
  let caught=false;if(e.z<s.distance+24)for(const w of s.wakes){for(let i=1;i<w.points.length;i+=3){const p=w.points[i];if(Math.abs(e.z-p.z)<18&&Math.abs(e.x-p.x)<23*s.width){e.hp-=70*dt;e.stun=.15;caught=true;break;}}if(caught)break;}if(e.hp<=0){s.wakeKills++;kill(s,e);continue;}
  if(s.dash&&e.z>s.distance-28&&e.z<s.distance+55){const dx=e.x-s.dash.x;if(Math.abs(dx)<29*s.width){kill(s,e);continue;}if(Math.abs(dx)<90){e.x=clamp(e.x+Math.sign(dx)*90*dt,15,405);e.stun=.45;}}
  if(e.z<s.distance+16&&e.z>s.distance-20&&Math.abs(e.x-s.x)<28*s.width){contacts+=e.type==='heavy'?2:1;if(s.invulnerable<=0){e.z=s.distance+17;e.hp-=35*dt;if(e.hp<=0)kill(s,e);}}
  // Enemies remain alive and pursue the column; nobody is silently culled.
  if(e.z<s.distance-28){e.x+=(s.x-e.x)*dt*.8;e.z+=180*dt;}
 }
 if(s.invulnerable<=0)s.hull=Math.max(0,s.hull-Math.min(16,contacts)*.34*dt-Math.max(0,s.rear-35)*.025*dt);
 s.enemies=s.enemies.filter(e=>!e.dead);
}
export function chooseCamp(s,option){if(s.mode!=='camp'||(option!==0&&option!==1))return false;if(option===0){s.hull=Math.min(100,s.hull+28);s.campHistory.push('整补军心');}else{s.build[0]++;s.power=Math.min(99,s.power+8);s.campHistory.push('整训强弩');}s.tension=100;s.arrows=[];s.mode='play';note(s,option===0?'军心重振，继续进军！':'强弩整训完成，带伤破阵！');return true;}
export function result(s){
 const score=Math.max(0,Math.floor(s.distance*2+s.dodged*150+s.nearMisses*250+s.cleanRushes*50+Math.min(2000,s.kills)*.5-s.obstacleHits*400-s.time*30+(s.mode==='win'?15000+s.hull*20:0)));
 const grade=s.mode!=='win'?'未完成':s.obstacleHits===0&&s.nearMisses>=4?'S':s.obstacleHits<=2?'A':'B';return{score,grade};
}
export function step(s,dt){
 if(s.mode!=='play')return;dt=clamp(dt,0,.04);s.time+=dt;
 const beforeZ=s.distance,beforeX=s.x;const r=road(s.distance),edge=22*s.width+12;const squeeze=Math.max(0,s.rear-65)*.12;s.x+=(clamp(s.target,r.left+edge+squeeze,r.right-edge-squeeze)-s.x)*(1-Math.exp(-15*dt));
 s.footTimer-=dt;if(s.footTimer<=0){s.footTimer=.12;s.footprints.push({x:s.x+(Math.floor(s.time*8)%2?10:-10),z:s.distance-10,life:2});if(s.footprints.length>45)s.footprints.shift();}for(const p of s.footprints)p.life-=dt;s.footprints=s.footprints.filter(p=>p.life>0);
 s.tension=Math.min(100,s.tension+10*dt);s.chainWindow=Math.max(0,s.chainWindow-dt);for(const w of s.wakes)w.life-=dt;s.wakes=s.wakes.filter(w=>w.life>0);for(const r of s.rings)r.life-=dt;s.rings=s.rings.filter(r=>r.life>0);
 s.tailwind=Math.max(0,s.tailwind-dt);s.obstacleGrace=Math.max(0,s.obstacleGrace-dt);s.impact=Math.max(0,s.impact-dt);
 s.cooldown=Math.max(0,s.cooldown-dt);s.invulnerable=Math.max(0,s.invulnerable-dt);s.pulse=Math.max(0,s.pulse-dt);
 for(const a of s.traces)a.life-=dt;s.traces=s.traces.filter(a=>a.life>0);
 for(const p of s.particles){p.x+=p.vx*dt;p.z+=p.vz*dt;p.life-=dt;}s.particles=s.particles.filter(p=>p.life>0);
 for(const n of s.notices)n.life-=dt;s.notices=s.notices.filter(n=>n.life>0);
 if(s.dash){const d=s.dash;d.age+=dt;const f=clamp(d.age/d.duration,0,1);s.distance=d.from+(d.to-d.from)*f;d.x=s.x;if(d.wake.points.length<48)d.wake.points.push({x:s.x,z:s.distance});if(f>=1){s.dash=null;s.chainWindow=1.8;}}
 else s.distance+=(72+s.phase*7)*dt;
 const boundary=(s.sector+1)*2400;
 const blocking=s.fronts.find(f=>!f.breached&&f.hp>0&&f.z>=beforeZ&&f.z<s.distance+65);
 s.distance=Math.min(s.distance,boundary-80,blocking?blocking.z-65:Infinity);
 if(s.dash&&s.distance<s.dash.from+(s.dash.to-s.dash.from)*clamp(s.dash.age/s.dash.duration,0,1)-1)s.dash=null;
 s.holding=s.distance>=boundary-81;
 s.cavalryTimer-=dt;if(s.build[1]&&s.cavalryTimer<=0){s.cavalryTimer=4/(1+s.build[1]*.12);for(const side of [-1,1])s.cavalry.push({x:clamp(s.x+side*75,65,355),z:s.distance-60,life:2.5});}
 for(const rider of s.cavalry){rider.z+=210*dt;rider.life-=dt;}s.cavalry=s.cavalry.filter(r=>r.life>0);
 for(const body of s.corpses)body.life-=dt;s.corpses=s.corpses.filter(b=>b.life>0);
 resolveObstacles(s,beforeZ,beforeX);
 for(const f of s.fronts){if(f.mobile&&s.distance>=19800&&f.hp>0){f.z=Math.min(21600,s.distance+235);f.baseX=210+Math.sin(s.time*.8)*90;if(!f.active){f.active=true;note(s,'军团弩车挡住出口！瞄准橙色绞盘！','#ffd89e');}}const rr=road(f.z);f.x=f.held?f.holderX:clamp(f.baseX+Math.sin(s.time*.65+f.phase)*20,rr.left+54,rr.right-54);if(f.open>0){f.open-=dt;if(f.open<=0&&!f.breached&&!f.held){f.hp=f.max*.55;note(s,'裂口合拢了，再打一次缝眼','#ffb09a');}}if(!f.breached&&s.distance>=f.z){if(f.open<=0){s.hull=Math.max(0,s.hull-18);s.wallHits++;s.impact=.35;note(s,'潮墙擦伤！提前瞄准橙色弱点','#ffb09a');}else{s.tension=Math.min(100,s.tension+15);burst(s,f.x,f.z,'#ffd89e',20);}f.breached=true;f.held=false;}}
 s.camera+=(s.distance-s.camera)*(1-Math.exp(-15*dt));
 const phase=Math.min(2,Math.floor(s.distance/7200));if(phase!==s.phase){s.phase=phase;s.rear=Math.max(0,s.rear-8);note(s,phase===1?'骑射隘口：注意地面箭雨落点':'营垒决战：夺旗，击破军团弩车','#ffbd9e');}
 if(s.choiceNumber<6&&s.distance>=s.nextChoice&&!s.choice){s.choice={remaining:6};note(s,'武器补给到手，触选一种新武器！');s.choiceNumber++;s.nextChoice=[720,3900,7800,11100,15000,18300,99999][s.choiceNumber];}
 if(s.choice){s.choice.remaining-=dt;if(s.choice.remaining<=0)chooseFormation(s,0);}
 s.spawn-=dt;if(s.spawn<=0&&s.sectorSpawned<s.sectorQuota){s.spawn=1.25;spawnRow(s,Math.min(boundary+30,s.distance+480));s.sectorSpawned++;}
 if(s.phase===1){s.nextVolley-=dt;if(s.nextVolley<=0){s.nextVolley=3.6;const center=s.x;for(const dx of [-62,0,62])s.arrows.push({x:clamp(center+dx,80,340),z:s.distance+165,age:0,hit:false});}}
 for(const a of s.arrows){a.age+=dt;if(!a.hit&&a.age>.75&&Math.abs(a.z-s.distance)<30&&Math.abs(a.x-s.x)<24&&s.invulnerable<=0){s.hull=Math.max(0,s.hull-10);s.arrowHits++;a.hit=true;s.impact=.2;}}
 s.arrows=s.arrows.filter(a=>a.age<3.4&&a.z>s.distance-80);
 s.fire-=dt;if(s.fire<=0){s.fire=.13;fire(s);}
 crowd(s,dt);
 if(s.hull<=0){s.mode='lose';s.reason='军心耗尽，远征暂止；下次试试战间整补';}
 else if(s.time>=LIMIT){s.mode='lose';s.reason='战线久攻不下，重整兵法再来';}
 const sectorBoss=s.sector===8?s.fronts.find(f=>f.mobile):null;
 if(s.mode==='play'&&s.holding&&s.sectorSpawned===s.sectorQuota&&s.enemies.length===0&&(!sectorBoss||sectorBoss.hp<=0)){
  s.cleared++;s.distance=boundary;s.dash=null;
  if(s.sector===8){s.mode='win';s.reason='九段战线全部肃清，没有一名敌军被镜头跳过';}
  else {s.sector++;s.sectorSpawned=0;s.holding=false;note(s,'战线肃清！向下一阵推进');if(s.sector%3===0){s.mode='camp';s.choice=null;s.nextCamp+=7200;}}
 }
 s.peak=Math.max(s.peak,s.enemies.length);
 const level=tier(s.power);if(level!==s.weaponTier){s.weaponTier=level;note(s,'心弦进化：'+weapons[level]);}
}
