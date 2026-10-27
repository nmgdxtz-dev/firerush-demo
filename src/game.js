// Platform-independent simulation. World units: 420 × 760, seconds.
export const W = 420, H = 760, FINISH = 126;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function tier(charge) { return charge >= 70 ? 3 : charge >= 40 ? 2 : charge >= 18 ? 1 : 0; }
export const weaponNames = ['点火双枪', '三叉脉冲', '穿甲五线', '七曜风暴'];
export const routeTimes = [15, 34, 54, 75, 96, 115];
export function routes(index) {
  return [
    [{title:'回收支路', op:'+12', kind:'add', value:12, detail:'电荷 +12 · 放出一队追兵', threat:4}, {title:'安静通道', op:'−6', kind:'pay', value:6, detail:'电荷 −6 · 车体 +15', heal:15}],
    [{title:'超载变电站', op:'×1.6', kind:'multiply', value:1.6, detail:'电荷 ×1.6 · 警戒 +1', alert:1}, {title:'维修站', op:'−14', kind:'pay', value:14, detail:'电荷 −14 · 车体 +28', heal:28}],
    [{title:'冷却水道', op:'÷2', kind:'divide', value:2, detail:'电荷减半 · 护盾 +2', shield:2}, {title:'废料熔炉', op:'+18', kind:'add', value:18, detail:'电荷 +18 · 警戒 +1', alert:1}],
    [{title:'增幅塔', op:'×1.4', kind:'multiply', value:1.4, detail:'电荷 ×1.4 · 车体 −12', damage:12}, {title:'安全补给', op:'+8', kind:'add', value:8, detail:'电荷 +8 · 无额外代价'}],
    [{title:'紧急维修', op:'−20', kind:'pay', value:20, detail:'电荷 −20 · 车体 +35', heal:35}, {title:'直闯封锁', op:'+16', kind:'add', value:16, detail:'电荷 +16 · 警戒 +1', alert:1}],
    [{title:'破城电容', op:'×1.5', kind:'multiply', value:1.5, detail:'电荷 ×1.5 · 车体 −15', damage:15}, {title:'最后的拥抱', op:'−16', kind:'pay', value:16, detail:'电荷 −16 · 车体 +20 / 护盾 +1', heal:20, shield:1}]
  ][index];
}
export function routeValue(charge, r) { return clamp(Math.floor(r.kind === 'multiply' ? charge*r.value : r.kind === 'divide' ? charge/r.value : r.kind === 'pay' ? charge-r.value : charge+r.value), 0, 99); }
export function canRoute(s, r) { return r.kind !== 'pay' || s.charge >= r.value; }
export function createGame(seed = Date.now()) {
  return {seed, random:rng(seed), mode:'play', time:0, x:210, target:210, hull:100, charge:12, weaponTier:0, shield:0, alert:0, kills:0, leaked:0, combo:0, comboTime:0, bond:0, invulnerable:0, cooldown:0, pulse:0, fire:0, spawn:.8, hazard:7, barrel:4, alarm:9, nextRoute:0, gate:null, boss:null, bossStarted:false, bullets:[], enemies:[], shots:[], hazards:[], barrels:[], particles:[], texts:[], history:[], serial:0, reason:'', peak:0};
}
export function say(s, text, color='#ffe3a6') { s.texts.push({text,color,life:2}); if(s.texts.length>3)s.texts.shift(); }
function particles(s,x,y,color,n=8) { for(let i=0;i<n&&s.particles.length<160;i++)s.particles.push({x,y,vx:(s.random()-.5)*170,vy:(s.random()-.5)*170,life:.4+s.random()*.25,color}); }
export function damage(s, n, reason='车体损毁') {
  if(s.mode!=='play')return;
  if(s.shield>0){s.shield--;say(s,'咕咕：护盾挡住了！','#8ef5df');return;}
  s.hull=Math.max(0,s.hull-n); s.reason=reason;
  if(s.hull<=0)s.mode='lose';
}
export function spawnEnemy(s, type='swarm', x=40+s.random()*340, y=-25) {
  if(s.enemies.length>=110)return;
  const phase=Math.min(2,Math.floor(s.time/42));
  const hp=type==='armor'?90:type==='runner'?22:type==='gunner'?38:22+phase*4;
  s.enemies.push({id:++s.serial,type,x,y,hp,max:hp,r:type==='armor'?22:13,speed:type==='runner'?115:type==='armor'?36:type==='gunner'?43:57+phase*5,shot:2.1,phase:s.random()*6});
}
function kill(s,e) { if(e.dead)return; e.dead=true;s.kills++;s.combo++;s.comboTime=2.5;s.charge=clamp(s.charge+(s.kills%4===0?1:0)+(e.type==='armor'?2:0),0,99);s.bond=Math.min(100,s.bond+5);particles(s,e.x,e.y,'#ffbb70'); }
export function pulse(s) {
  if(s.mode!=='play'||s.cooldown>0||s.charge<12)return false;
  s.charge-=12;s.cooldown=8;s.pulse=.65;s.invulnerable=1.4;
  s.shots=[];
  for(const e of s.enemies)if(e.y>120){e.hp-=80;if(e.hp<=0)kill(s,e);}
  // A full bond restores the escort. It is earned only through kills.
  if(s.bond>=100){s.bond=0;s.hull=Math.min(100,s.hull+12);say(s,'同心共振！车体 +12','#99f6d4');}
  else say(s,'咕咕：牵紧我！震退敌潮 · 电荷 −12','#99f6d4');
  if(s.boss&&Math.hypot(s.boss.x-s.x,s.boss.y-550)<510)s.boss.hp-=s.boss.exposed>0?100:20;
  return true;
}
export function chooseRoute(s, side) {
  const gate=s.gate;if(!gate||gate.resolved)return false;const r=gate.options[side];
  if(!canRoute(s,r)){say(s,'电荷不足：空手绕行，车体 −10','#ff8e9d');damage(s,10,'补给费用不足');}
  else {const before=s.charge;s.charge=routeValue(s.charge,r);s.hull=clamp(s.hull+(r.heal||0)-(r.damage||0),0,100);s.shield=Math.min(3,s.shield+(r.shield||0));s.alert=Math.min(4,s.alert+(r.alert||0));for(let i=0;i<(r.threat||0);i++)spawnEnemy(s,'runner',55+i*90,-30-i*25);s.history.push({title:r.title,before,after:s.charge});say(s,r.title+'：'+before+' → '+s.charge);if(s.hull<=0){s.reason='超载透支了最后的车体';s.mode='lose';}}
  gate.resolved=true;return true;
}
function shoot(s) {
  const level=tier(s.charge), n=1+level*2;
  for(let j=0;j<n&&s.bullets.length<190;j++)s.bullets.push({x:s.x+(j-(n-1)/2)*7,y:528,vx:(j-(n-1)/2)*18,damage:17+level*2,pierce:level>=2?2:1,hits:[]});
}
function explosion(s,b) {particles(s,b.x,b.y,'#ffd176',24);for(const e of s.enemies)if(Math.hypot(e.x-b.x,e.y-b.y)<125){e.hp-=120;if(e.hp<=0)kill(s,e);}if(s.boss&&Math.hypot(s.boss.x-b.x,s.boss.y-b.y)<170)s.boss.hp-=110;say(s,'墨墨：引爆电池，借它清路！','#ffd176');}
export function step(s, dt) {
  if(s.mode!=='play')return;dt=clamp(dt,0,.04);s.time+=dt;
  s.x+=(clamp(s.target,28,392)-s.x)*(1-Math.exp(-14*dt));
  s.cooldown=Math.max(0,s.cooldown-dt);s.invulnerable=Math.max(0,s.invulnerable-dt);s.pulse=Math.max(0,s.pulse-dt);
  s.comboTime-=dt;if(s.comboTime<=0)s.combo=0;
  for(const f of s.texts)f.life-=dt;s.texts=s.texts.filter(f=>f.life>0);
  for(const p of s.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}s.particles=s.particles.filter(p=>p.life>0);
  if(s.nextRoute<routeTimes.length&&s.time>=routeTimes[s.nextRoute]){s.gate={options:routes(s.nextRoute),remaining:5,resolved:false};s.nextRoute++;say(s,'岔路将至：拖向左 / 右，按车头所在侧结算','#acf5ef');}
  if(s.gate){s.gate.remaining-=dt;if(s.gate.remaining<=0){chooseRoute(s,s.x<210?0:1);s.gate=null;}}
  s.fire-=dt;if(s.fire<=0){s.fire+=.19-tier(s.charge)*.025;shoot(s);}
  if(s.time<FINISH){
    s.spawn-=dt;if(s.spawn<=0){s.spawn=.62-s.alert*.055-Math.min(2,Math.floor(s.time/42))*.06;let type=s.random()<.18?'runner':s.random()<.16?'armor':s.random()<.15?'gunner':'swarm';spawnEnemy(s,type);if(Math.floor(s.time)%18<4)for(let i=0;i<2;i++)spawnEnemy(s,'swarm',40+s.random()*340,-40-i*28);}
    if(s.alert>0){s.alarm-=dt;if(s.alarm<=0){s.alarm=9-s.alert;const lane=clamp(Math.floor((s.x-21)/126),0,2);s.hazards.push({x:lane*126+21,w:126,y:240,h:22,type:'laser',hit:false});say(s,'警戒炮：红色光栅正在逼近','#ff8e9d');}}
    s.hazard-=dt;if(s.hazard<=0){s.hazard=7.5-s.alert*.4;const lane=Math.floor(s.random()*3);s.hazards.push({x:lane*126+21,w:126,y:-70,h:36,type:Math.floor(s.time/42)===1?'laser':'wall',hit:false});}
    s.barrel-=dt;if(s.barrel<=0){s.barrel=10;s.barrels.push({x:65+s.random()*290,y:-30,hp:34});}
  } else if(!s.bossStarted){s.bossStarted=true;s.boss={x:210,y:230,hp:5000,max:5000,age:0,shot:2,sweep:6,warning:0,lane:0,exposed:0};say(s,'封锁机甲：躲开红线，击穿核心！','#ff8e9d');}
  if(s.boss){const b=s.boss;b.age+=dt;b.exposed=Math.max(0,b.exposed-dt);b.x=210+Math.sin(b.age*.65)*110;b.shot-=dt;b.sweep-=dt;
    if(b.shot<=0){b.shot=b.hp<800?1.1:1.65;const aim=Math.atan2(550-b.y,s.x-b.x);for(let j=-2;j<=2;j++)s.shots.push({x:b.x,y:b.y+28,vx:Math.cos(aim+j*.2)*155,vy:Math.sin(aim+j*.2)*155});}
    if(b.sweep<=0){b.sweep=6;b.lane=s.x<140?0:s.x>280?2:1;b.warning=1.5;}
    if(b.warning>0){b.warning-=dt;if(b.warning<=0){b.exposed=2.5;s.hazards.push({x:b.lane*126+21,w:126,y:505,h:80,type:'laser',hit:false,life:.7});}}
    if(Math.floor(b.age)%10===0&&s.enemies.length<5)spawnEnemy(s,'runner',40+s.random()*340,-20);
    if(b.hp<=0){s.mode='win';s.reason='封锁核心击破，双人能源车抵达灯塔';return;}
    if(b.age>80){s.reason='封锁过久，能源车耗尽';s.mode='lose';return;}
  }
  for(const h of s.hazards){if(h.life!=null)h.life-=dt;else h.y+=95*dt;if(!h.hit&&Math.abs(s.x-(h.x+h.w/2))<h.w/2+13&&Math.abs(550-(h.y+h.h/2))<h.h/2+15){h.hit=true;if(s.invulnerable<=0){damage(s,16,'撞上封锁障碍');s.invulnerable=.7;s.charge=Math.max(0,s.charge-5);say(s,'撞击：车体 −16 / 电荷 −5','#ff8e9d');}}}
  s.hazards=s.hazards.filter(h=>h.y<740&&(h.life==null||h.life>0));
  for(const b of s.barrels)b.y+=53*dt;
  for(const b of s.bullets){b.x+=b.vx*dt;b.y-=650*dt;
    for(const e of s.enemies){if(e.dead||b.pierce<=0||b.hits.includes(e.id))continue;if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+6){e.hp-=b.damage;b.hits.push(e.id);b.pierce--;if(e.hp<=0)kill(s,e);}}
    if(s.boss&&b.pierce>0&&Math.hypot(s.boss.x-b.x,s.boss.y-b.y)<53){s.boss.hp-=b.damage*(s.boss.exposed>0?1:.12);b.pierce=0;particles(s,b.x,b.y,'#f6d799',2);}
    for(const o of s.barrels)if(!o.dead&&b.pierce>0&&Math.hypot(o.x-b.x,o.y-b.y)<23){o.hp-=b.damage;b.pierce=0;if(o.hp<=0){o.dead=true;explosion(s,o);}}
    // Solid barriers absorb bullets; laser strips do not.
    for(const h of s.hazards)if(h.type==='wall'&&b.x>h.x&&b.x<h.x+h.w&&b.y>h.y&&b.y<h.y+h.h)b.pierce=0;
  }
  s.bullets=s.bullets.filter(b=>b.y>-25&&b.pierce>0&&b.x>-20&&b.x<440);
  s.barrels=s.barrels.filter(b=>!b.dead&&b.y<720);
  for(const e of s.enemies){if(e.dead)continue;e.y+=e.speed*dt;e.phase+=dt;
    if(e.type==='runner'&&e.y<480)e.x+=clamp(s.x-e.x,-45,45)*dt;
    if(e.type==='gunner'){e.shot-=dt;if(e.shot<=0){e.shot=2.8;s.shots.push({x:e.x,y:e.y,vx:(s.x-e.x)*.16,vy:155});}}
    if(e.y>520&&e.y<580&&Math.abs(e.x-s.x)<e.r+15&&s.invulnerable<=0){damage(s,9,'搭档遭到撞击');s.invulnerable=.8;e.hp=0;e.dead=true;particles(s,e.x,e.y,'#ff8e9d');}
    if(e.y>650){e.dead=true;s.leaked++;damage(s,e.type==='armor'?8:3,'敌人突破后方能源车');particles(s,e.x,650,'#ff8e9d',3);}
  }
  s.enemies=s.enemies.filter(e=>!e.dead);
  for(const b of s.shots){b.x+=b.vx*dt;b.y+=b.vy*dt;if(Math.hypot(b.x-s.x,b.y-550)<21){b.dead=true;if(s.invulnerable<=0){damage(s,8,'受到敌方弹幕攻击');s.invulnerable=.65;}}}
  s.shots=s.shots.filter(b=>!b.dead&&b.y<740&&b.x>-30&&b.x<450).slice(-110);
  const newTier=tier(s.charge);if(newTier!==s.weaponTier){say(s,(newTier>s.weaponTier?'墨墨：电荷到位，':'电荷下降，切换为')+weaponNames[newTier],newTier>s.weaponTier?'#ffe3a6':'#91b1bc');s.weaponTier=newTier;}
  s.peak=Math.max(s.peak,s.enemies.length);
}
