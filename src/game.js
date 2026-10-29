export const W=420,H=760,LANES=[80,210,340],LIMIT=200;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function rng(seed){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export const tier=p=>p>=70?3:p>=40?2:p>=26?1:0;
export const guns=['双生点射','四线连射','六线穿甲','八翼攻城'];
export function laneOf(x){return x<145?0:x>275?2:1;}
export function note(s,text,color='#ffe5b0'){s.notices.push({text,color,life:3});if(s.notices.length>2)s.notices.shift();}
export function createGame(seed=Date.now()){
 const s={seed,random:rng(seed),mode:'play',time:0,sector:0,x:210,target:210,power:22,base:100,kills:0,bond:30,cooldown:0,pulse:0,invulnerable:0,fire:0,spawn:1.2,mortar:5,surge:8,alert:0,transition:0,nextSupply:18,supply:null,history:[],towers:[],enemies:[],traces:[],particles:[],impacts:[],raids:[],notices:[],serial:0,peak:0,captures:0,recaptures:0,reason:'',slow:0,weaponTier:0};
 makeSector(s);note(s,'先拆侧塔 → 留在该侧占领 → 两塔断电，集火主堡');return s;
}
export function makeSector(s){
 const hp=620+s.sector*210;
 s.towers=[{id:'left',lane:0,x:80,y:300,hp,max:hp,owner:'enemy',capture:0,fire:0,guard:0},{id:'right',lane:2,x:340,y:300,hp,max:hp,owner:'enemy',capture:0,fire:0,guard:0},{id:'core',lane:1,x:210,y:203,hp:1700+s.sector*700,max:1700+s.sector*700,owner:'enemy',capture:0,fire:0,guard:0}];
 s.enemies=[];s.traces=[];s.impacts=[];s.raids=[];s.spawn=1.3;s.mortar=5;s.surge=7;
 for(let i=0;i<80+s.sector*10;i++)spawnEnemy(s,i%3,140+s.random()*290,i%6===0?'shield':'swarm');
}
export function spawnEnemy(s,lane,y=160,type='swarm'){
 if(s.enemies.length>=220)return;const hp=type==='shield'?40:type==='sapper'?20:12+s.sector*2;
 s.enemies.push({id:++s.serial,lane,x:LANES[lane]+(s.random()-.5)*86,y,hp,max:hp,type,r:type==='shield'?10:7,attack:.4+s.random()*.4,stun:0});
}
export const supplies=[
 [{name:'扩编',op:'+14',kind:'add',v:14,detail:'火力 +14 · 敌潮加速',alert:1},{name:'加固',op:'−8',kind:'pay',v:8,detail:'火力 −8 · 基地 +22 / 守塔 +60',heal:22,guard:60}],
 [{name:'过载',op:'×1.5',kind:'multiply',v:1.5,detail:'火力 ×1.5 · 敌潮加速',alert:1},{name:'共筑',op:'÷2',kind:'divide',v:2,detail:'火力减半 · 全塔装甲 +120',guard:120}],
 [{name:'拆借',op:'+18',kind:'add',v:18,detail:'火力 +18 · 基地 −15',damage:15},{name:'回援',op:'−12',kind:'pay',v:12,detail:'火力 −12 · 基地 +30',heal:30}],
];
export function supplyValue(power,r){return clamp(Math.floor(r.kind==='multiply'?power*r.v:r.kind==='divide'?power/r.v:r.kind==='pay'?power-r.v:power+r.v),8,99);}
export function chooseSupply(s,side){if(!s.supply)return false;const r=s.supply.options[side];if(r.kind==='pay'&&s.power-r.v<8){note(s,'火力不足，补给取消；没有扣费','#ffaaa0');s.supply=null;return false;}const before=s.power;s.power=supplyValue(s.power,r);s.base=clamp(s.base+(r.heal||0)-(r.damage||0),0,100);s.alert=Math.min(4,s.alert+(r.alert||0));for(const t of s.towers)if(t.id!=='core')t.guard=Math.min(180,t.guard+(r.guard||0));s.history.push(r.name);s.supply=null;note(s,r.name+'：'+before+' → '+s.power);if(s.base<=0){s.mode='lose';s.reason='拆借透支了最后的基地装甲';}return true;}
export function burst(s,x,y,color,n=10){for(let i=0;i<n&&s.particles.length<180;i++)s.particles.push({x,y,vx:(s.random()-.5)*180,vy:(s.random()-.5)*180,life:.25+s.random()*.35,color});}
function trace(s,x,y,tx,ty,color='#ffe4ac',width=2){if(s.traces.length<150)s.traces.push({x,y,tx,ty,color,width,life:.1});}
function kill(s,e){if(e.dead)return;e.dead=true;s.kills++;s.bond=Math.min(100,s.bond+1);if(s.kills%20===0)s.power=Math.min(99,s.power+1);burst(s,e.x,e.y,e.type==='sapper'?'#ffb45b':'#c0e5a7',3);}
export function damageEnemy(s,e,d){if(e.dead)return;e.hp-=d;if(e.hp<=0)kill(s,e);}
export function pulse(s){
 if(s.mode!=='play'||s.transition>0||s.cooldown>0||s.bond<45)return false;
 const charged=s.bond>=100;s.bond=0;s.cooldown=5;s.pulse=.65;s.pulseRadius=charged?270:185;s.invulnerable=1.2;
 for(const e of s.enemies){if(Math.hypot((e.x-s.x)*.9,(e.y-420)*.7)>(charged?270:185))continue;e.stun=2.2;damageEnemy(s,e,charged?42:22);if(!e.dead)e.y=Math.max(170,e.y-42);}
 // Resonance creates a capture opening but cannot capture a tower from afar.
 for(const t of s.towers)if(t.owner==='enemy'&&t.id!=='core'&&Math.abs(t.x-s.x)<(charged?240:150))damageTower(s,t,charged?65:30);
 s.slow=2.2;note(s,charged?'咕咕：满同心！破盾清场，趁现在夺塔！':'咕咕：震开了！趁现在占塔！','#a4f0d6');return true;
}
export function damageTower(s,t,damage){
 if(t.owner!=='enemy'||t.hp<=0)return;
 if(t.id==='core'){const owned=s.towers.filter(t=>t.id!=='core'&&t.owner==='ally').length;damage*=owned===2?1:owned===1?.18:0;}
 t.hp=Math.max(0,t.hp-damage);if(t.hp===0){burst(s,t.x,t.y,'#ffd497',36);if(t.id==='core'){s.transition=2;note(s,s.sector===2?'主堡崩解！突围成功':'主堡崩解！防线前推','#a5f6d2');}else{t.owner='ruin';t.capture=0;note(s,'供能塔已瘫痪：移到该侧，驻守 1.4 秒占领','#a5f6d2');}}
}
function playerFire(s){
 const lane=laneOf(s.x),level=tier(s.power),count=2+level*2;
 // Lane concentration rewards focusing a breach. Crowds screen fortifications.
 const targets=s.enemies.filter(e=>!e.dead&&Math.abs(e.x-s.x)<58+level*5).sort((a,b)=>b.y-a.y);
 const towers=s.towers.filter(t=>t.owner==='enemy'&&Math.abs(t.x-s.x)<72).sort((a,b)=>b.y-a.y);
 for(let i=0;i<count;i++){
  const target=targets.find(e=>!e.dead);if(target){const damage=(6+s.power*.085)*(target.type==='shield'&&target.stun<=0?.55:1);trace(s,s.x+(i-(count-1)/2)*13,548,target.x,target.y);damageEnemy(s,target,damage);}
  else if(towers[0]){const t=towers[0];trace(s,s.x+(i-(count-1)/2)*13,548,t.x+(s.random()-.5)*35,t.y,'#ffd594',3);damageTower(s,t,8+s.power*.12);}
  else trace(s,s.x+(i-(count-1)/2)*13,548,s.x+(i-(count-1)/2)*23,175,'#9fe5cc',1);
 }
}
function turretFire(s,t){
 const target=s.enemies.filter(e=>!e.dead&&Math.hypot(e.x-t.x,e.y-t.y)<210).sort((a,b)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(b.x-t.x,b.y-t.y))[0];
 if(target){trace(s,t.x,t.y,target.x,target.y,'#8df2d4',3);damageEnemy(s,target,13+s.sector*2);}
}
export function step(s,dt){
 if(s.mode!=='play')return;dt=clamp(dt,0,.04);s.time+=dt;s.x+=(clamp(s.target,30,390)-s.x)*(1-Math.exp(-17*dt));
 for(const arr of [s.traces,s.particles,s.notices])for(const a of arr){a.life-=dt;if(a.vx!=null){a.x+=a.vx*dt;a.y+=a.vy*dt;}}
 s.traces=s.traces.filter(a=>a.life>0);s.particles=s.particles.filter(a=>a.life>0);s.notices=s.notices.filter(a=>a.life>0);
 s.cooldown=Math.max(0,s.cooldown-dt);s.pulse=Math.max(0,s.pulse-dt);s.invulnerable=Math.max(0,s.invulnerable-dt);s.slow=Math.max(0,s.slow-dt);
 if(s.transition>0){s.transition-=dt;if(s.transition<=0){s.sector++;if(s.sector>=3){s.mode='win';s.reason='三座主堡倒下，墨墨与咕咕接通归途';}else{s.base=Math.min(100,s.base+14);s.power=Math.min(99,s.power+6);makeSector(s);note(s,'占领主堡：基地 +14 / 火力 +6，向前突围！');}}return;}
 if(s.time>=LIMIT){s.mode='lose';s.reason='敌方援军封路：需要更快抢塔、断电攻城';return;}
 if(s.time>=s.nextSupply&&!s.supply){s.supply={options:supplies[Math.floor((s.nextSupply-18)/25)%3],remaining:4};s.nextSupply+=25;}
 if(s.supply){s.supply.remaining-=dt;if(s.supply.remaining<=0)chooseSupply(s,s.x<210?0:1);}
 s.spawn-=dt;if(s.spawn<=0){s.spawn=Math.max(.65,1.18-s.alert*.09-s.sector*.1);for(const t of s.towers)if(t.owner==='enemy'){const n=t.id==='core'?2:3;for(let i=0;i<n;i++)spawnEnemy(s,t.lane,t.y+25+s.random()*22,s.random()<.08?'sapper':s.random()<.12?'shield':'swarm');}}
 s.surge-=dt;if(s.surge<=0){s.surge=12;const red=s.towers.filter(t=>t.owner==='enemy');for(let i=0;i<15&&red.length;i++){const t=red[i%red.length];spawnEnemy(s,t.lane,t.y+30+(i%5)*13,i%5===0?'sapper':'swarm');}for(const t of s.towers)if(t.owner==='ally')s.raids.push({lane:t.lane,remaining:2});note(s,'反扑预告：敌军将从侧翼围攻已占塔！','#ffb1a4');}
 for(const raid of s.raids){raid.remaining-=dt;if(raid.remaining<=0&&!raid.done){raid.done=true;for(let i=0;i<12;i++)spawnEnemy(s,raid.lane,255+(i%3)*13,i<3?'sapper':i<8?'shield':'swarm');}}s.raids=s.raids.filter(r=>!r.done);
 s.mortar-=dt;if(s.mortar<=0){s.mortar=6-s.sector*.5;const source=s.towers.find(t=>t.owner==='enemy');if(source)s.impacts.push({x:s.x,y:548,r:43,remaining:1.2,source:source.x});}
 s.fire-=dt;if(s.fire<=0){s.fire=.17;playerFire(s);}
 for(const t of s.towers){if(t.id==='core')continue;
  if(t.owner==='ruin'){
   const contested=s.enemies.some(e=>!e.dead&&Math.hypot(e.x-t.x,e.y-t.y)<62);
   t.contested=contested;
   if(laneOf(s.x)===t.lane&&!contested)t.capture+=dt;else t.capture=Math.max(0,t.capture-dt*.45);
   if(t.capture>=1.4){t.owner='ally';t.hp=160;t.max=160;s.captures++;s.bond=Math.min(100,s.bond+10);burst(s,t.x,t.y,'#8ff1cd',28);note(s,'咕咕架起守塔！它会替你挡住这一侧','#9cecd0');}
  }else if(t.owner==='ally'){t.fire-=dt;if(t.fire<=0){t.fire=.22;turretFire(s,t);}}
 }
 for(const e of s.enemies){if(e.dead)continue;e.stun=Math.max(0,e.stun-dt);if(e.stun>0)continue;
  const fort=s.towers.find(t=>t.owner==='ally'&&Math.abs(t.x-e.x)<73&&e.y>t.y-65&&e.y<t.y+100);
  if(fort){e.x+=(fort.x-e.x)*dt*1.5;e.y+=(fort.y+25-e.y)*dt*1.5;e.attack-=dt;if(e.attack<=0){e.attack=e.type==='sapper'?.5:.9;let hit=e.type==='sapper'?18:e.type==='shield'?5:3;
    const absorbed=Math.min(fort.guard,hit);fort.guard-=absorbed;hit-=absorbed;fort.hp-=hit;
    if(e.type==='sapper'){e.dead=true;burst(s,e.x,e.y,'#ff9f6c',8);}
    if(fort.hp<=0){fort.owner='enemy';fort.hp=280+s.sector*60;fort.max=fort.hp;fort.capture=0;s.recaptures++;note(s,'侧塔被夺回！供能重新接通','#ffb1a4');}
   }
  }else{e.y+=(e.type==='sapper'?55:e.type==='shield'?22:30+s.sector*3)*dt;e.x+=(LANES[e.lane]-e.x)*dt*.16;
   if(e.y>=540&&Math.abs(e.x-s.x)<45&&s.invulnerable<=0){s.base-=e.type==='sapper'?7:2;e.dead=true;burst(s,e.x,e.y,'#ff9f6c',3);}
   if(e.y>616){s.base-=e.type==='shield'?4:1.5;e.dead=true;}
  }
 }
 s.enemies=s.enemies.filter(e=>!e.dead);
 for(const a of s.impacts){a.remaining-=dt;if(a.remaining<=0&&!a.done){a.done=true;burst(s,a.x,a.y,'#ff9f70',20);if(Math.abs(s.x-a.x)<a.r&&s.invulnerable<=0){s.base-=10;s.invulnerable=.5;note(s,'迫击命中！留意地面红圈','#ffb1a4');}}}s.impacts=s.impacts.filter(a=>a.remaining>-.3);
 if(s.base<=0){s.base=0;s.mode='lose';s.reason='防线被压穿：敌潮冲垮了后方基地';}
 const lev=tier(s.power);if(lev!==s.weaponTier){note(s,'墨墨换装：'+guns[lev],'#ffe5b0');s.weaponTier=lev;}
 s.peak=Math.max(s.peak,s.enemies.length);
}
