// A moving crowd is the level. Cutting a traversable seam enables a forward leap.
export const W=420,H=760,GOAL=3600,MAX_ENEMIES=760,LIMIT=180;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function rng(seed){return()=>{let t=seed+=0x6d2b79f5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export const tier=p=>p>=70?2:p>=40?1:0;
export const weapons=['双生四弦','六弦破潮','八弦日冕'];
export function note(s,text,color='#ffe3a4'){s.notices.push({text,color,life:2.4});if(s.notices.length>2)s.notices.shift();}
export function createGame(seed=Date.now()){
 const s={seed,random:rng(seed),mode:'play',time:0,distance:0,camera:0,x:210,target:210,hull:100,power:26,width:1,tension:36,rear:0,kills:0,cleanRushes:0,hardRushes:0,cooldown:0,fire:0,spawn:.65,phase:0,dash:null,pulse:0,invulnerable:0,streak:0,serial:0,enemies:[],traces:[],particles:[],notices:[],choice:null,nextChoice:320,history:[],fronts:[],peak:0,weaponTier:0,reason:'',footprints:[],footTimer:0,grid:new Uint16Array(30*52)};
 let previous=210;for(let i=0;i<6;i++){let x=70+s.random()*280;if(Math.abs(x-previous)<95)x=previous<210?315:105;s.fronts.push({z:430+i*520,x,baseX:x,hp:140+i*22,max:140+i*22,open:0,breached:false,phase:s.random()*6.28});previous=x;}
 for(let row=0;row<25;row++)spawnRow(s,160+row*22,0);
 note(s,'先打穿正前方缺口，再按右下角牵手冲锋');return s;
}
export function spawnEnemy(s,x,z,type='swarm'){
 if(s.enemies.length>=MAX_ENEMIES)return;
 const hp=type==='heavy'?32+s.phase*3:10+s.phase;
 s.enemies.push({id:++s.serial,x:clamp(x,18,402),z,hp,max:hp,type,stun:0,phase:s.random()*6.28,dead:false});
}
export function spawnRow(s,z,phase=s.phase){
 const shift=Math.sin(z*.008)*9;
 for(let col=0;col<25;col++){const x=17+col*16+shift+(s.random()-.5)*5;spawnEnemy(s,x,z+Math.sin(col*.28+z*.012)*20+(s.random()-.5)*7,s.random()<.06+phase*.065?'heavy':'swarm');}
}
export function burst(s,x,z,color,n=5){for(let i=0;i<n&&s.particles.length<170;i++)s.particles.push({x,z,vx:(s.random()-.5)*130,vz:(s.random()-.5)*130,life:.25+s.random()*.3,color});}
function kill(s,e){if(e.dead)return;e.dead=true;s.kills++;s.tension=Math.min(100,s.tension+.72);if(s.kills%24===0)s.power=Math.min(99,s.power+1);burst(s,e.x,e.z,e.type==='heavy'?'#ffb478':'#94e6cc',2);}
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
export function rush(s){
 if(s.mode!=='play'||s.dash||s.cooldown>0||s.tension<32)return false;
 const gap=seam(s),clean=gap.ready;let length=clean?240:110;const blocking=s.fronts.find(f=>!f.breached&&f.z>s.distance&&f.z<=s.distance+length&&(f.open<=0||Math.abs(s.x-f.x)>33));if(blocking)length=Math.max(0,blocking.z-s.distance-32);
 s.tension-=32;s.cooldown=5.4;s.invulnerable=1.1;s.pulse=.7;
 s.dash={from:s.distance,to:s.distance+length,age:0,duration:.72,clean,x:s.x};
 if(clean)for(const f of s.fronts)if(!f.breached&&f.open>0&&f.z>s.dash.from&&f.z<=s.dash.to){f.held=true;f.holderX=f.x;}
 if(clean){s.cleanRushes++;s.streak++;s.hull=Math.min(100,s.hull+3);s.rear=Math.max(0,s.rear-18);s.power=Math.min(99,s.power+2);note(s,'墨墨开路，咕咕拉弦！破浪 +240','#a7ffe1');}
 else{s.hardRushes++;s.streak=0;const loss=Math.min(44,13+gap.mass*.65);s.hull=Math.max(0,s.hull-loss);note(s,blocking?'撞上潮脊！先击碎橙色缝眼':'缺口未通，硬闯受伤！只推进 110','#ffb09a');if(s.hull===0){s.mode='lose';s.reason='连续硬闯敌潮，心弦被压断';}}
 return true;
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
function crowd(s,dt){
 s.grid.fill(0);const rangeStart=s.distance-90;
 for(const e of s.enemies){const xx=clamp(Math.floor(e.x/14),0,29),zz=clamp(Math.floor((e.z-rangeStart)/18),0,51);s.grid[zz*30+xx]++;}
 const crest=.5+.5*Math.sin(s.time*.72),speed=39+s.phase*8+crest*22;
 let contacts=0;
 for(const e of s.enemies){if(e.dead)continue;e.phase+=dt;e.stun=Math.max(0,e.stun-dt);
  if(e.stun<=0){const xx=clamp(Math.floor(e.x/14),1,28),zz=clamp(Math.floor((e.z-rangeStart)/18),0,51),index=zz*30+xx;
   const disperse=clamp((s.grid[index-1]-s.grid[index+1])*3,-14,14);
   const close=e.z<s.distance+210?clamp((s.x-e.x)*.09,-14,14):Math.sin(e.phase+s.time*.25)*6;
   e.x=clamp(e.x+(disperse+close)*dt,15,405);e.z-=speed*dt*(e.type==='heavy'?.75:1);
  }
  if(s.dash&&e.z>s.distance-28&&e.z<s.distance+55){const dx=e.x-s.dash.x;if(Math.abs(dx)<29*s.width){kill(s,e);continue;}if(Math.abs(dx)<90){e.x=clamp(e.x+Math.sign(dx)*90*dt,15,405);e.stun=.45;}}
  if(e.z<s.distance+16&&e.z>s.distance-20&&Math.abs(e.x-s.x)<28*s.width){contacts+=e.type==='heavy'?2:1;if(s.invulnerable<=0){e.z=s.distance+17;e.hp-=35*dt;if(e.hp<=0)kill(s,e);}}
  if(e.z<s.distance-85){e.dead=true;s.rear=Math.min(100,s.rear+.14);}
 }
 if(s.invulnerable<=0)s.hull=Math.max(0,s.hull-Math.min(16,contacts)*.34*dt-Math.max(0,s.rear-35)*.025*dt);
 s.enemies=s.enemies.filter(e=>!e.dead);
}
export function step(s,dt){
 if(s.mode!=='play')return;dt=clamp(dt,0,.04);s.time+=dt;
 const squeeze=Math.max(0,s.rear-45)*.35;const edge=Math.max(29,22*s.width+18);s.x+=(clamp(s.target,edge+squeeze,W-edge-squeeze)-s.x)*(1-Math.exp(-15*dt));
 s.footTimer-=dt;if(s.footTimer<=0){s.footTimer=.12;s.footprints.push({x:s.x+(Math.floor(s.time*8)%2?10:-10),z:s.distance-10,life:2});if(s.footprints.length>45)s.footprints.shift();}for(const p of s.footprints)p.life-=dt;s.footprints=s.footprints.filter(p=>p.life>0);
 s.cooldown=Math.max(0,s.cooldown-dt);s.invulnerable=Math.max(0,s.invulnerable-dt);s.pulse=Math.max(0,s.pulse-dt);
 for(const a of s.traces)a.life-=dt;s.traces=s.traces.filter(a=>a.life>0);
 for(const p of s.particles){p.x+=p.vx*dt;p.z+=p.vz*dt;p.life-=dt;}s.particles=s.particles.filter(p=>p.life>0);
 for(const n of s.notices)n.life-=dt;s.notices=s.notices.filter(n=>n.life>0);
 if(s.dash){const d=s.dash;d.age+=dt;const f=clamp(d.age/d.duration,0,1);s.distance=d.from+(d.to-d.from)*(1-Math.pow(1-f,2));s.x+=(d.x-s.x)*(1-Math.exp(-30*dt));if(f>=1)s.dash=null;}
 else{s.distance+=11*dt;const wall=s.fronts.find(f=>!f.breached&&!f.held&&f.z>s.distance-30);if(wall&&s.distance>wall.z-30)s.distance=wall.z-30;}
 for(const f of s.fronts){f.x=f.held?f.holderX:clamp(f.baseX+Math.sin(s.time*.65+f.phase)*20,48,372);if(f.open>0){f.open-=dt;if(f.open<=0&&!f.breached&&!f.held){f.hp=f.max*.55;note(s,'裂口合拢了，再打一次缝眼','#ffb09a');}}if(!f.breached&&s.distance>=f.z){f.breached=true;f.held=false;note(s,'潮脊被甩在身后！继续向前','#a7ffe1');}}
 s.camera+=(s.distance-s.camera)*(1-Math.exp(-(s.dash?4:9)*dt));
 const phase=Math.min(2,Math.floor(s.distance/1200));if(phase!==s.phase){s.phase=phase;s.rear=Math.max(0,s.rear-8);note(s,phase===1?'进入赤潮：重甲正在填住裂口':'最后的白潮！抓住缺口，一口气冲出去','#ffbd9e');for(let i=0;i<6;i++)spawnRow(s,s.distance+350+i*27,phase);}
 if(s.distance>=s.nextChoice&&!s.choice){s.choice={remaining:3.5};s.nextChoice+=550;}
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
