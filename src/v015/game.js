// Layered breakthrough: destroy a complete column, calculate the route, then cross it.
export const W=420,H=760,GOAL=21600,MAX_ENEMIES=320,LIMIT=480,LAYERS=12;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function rng(seed){return()=>{let t=seed+=0x6d2b79f5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export const tier=n=>n>=65?2:n>=36?1:0;
export function road(z){const center=210+Math.sin(z*.0014)*10,half=158;return{center,left:center-half,right:center+half,half,biome:Math.min(2,Math.floor(Math.max(0,z)/7200))};}
export const laneX=i=>105+i*105;
export const laneAt=x=>clamp(Math.round((x-105)/105),0,2);
export function note(s,text,color='#ffe3a4'){s.notices.push({text,color,life:3.2});if(s.notices.length>2)s.notices.shift();}
export function applyOrders(army,orders){let n=army;for(const op of orders){if(op.kind==='+')n+=op.value;if(op.kind==='−')n-=op.value;if(op.kind==='×')n*=op.value;if(op.kind==='÷')n=Math.floor(n/op.value);}return n;}
export function formula(orders){return orders.map(o=>o.kind+o.value).join(' → ');}
export function makeLayer(s,index){const shift=Math.floor(s.random()*3),cards=[
 {name:'步卒粮道',orders:[{kind:'+',value:14+Math.floor(s.random()*7)},{kind:'−',value:5+index*2+Math.floor(s.random()*4)}],armor:1,heal:0},
 {name:'重盾军械',orders:[{kind:'×',value:2},{kind:'−',value:24+index*2+Math.floor(s.random()*13)}],armor:1.8,heal:0},
 {name:'骑射补给',orders:[{kind:'÷',value:2},{kind:'+',value:18+index+Math.floor(s.random()*11)}],armor:1.15,heal:14}
 ];
 const f={index,z:940+index*1840,columns:[],crossed:false};
 for(let lane=0;lane<3;lane++){const c={...cards[(lane+shift)%3],lane,x:laneX(lane),open:false,remaining:32};f.columns.push(c);
  for(let row=0;row<8;row++)for(let col=0;col<4;col++){
   const hp=(25+index*6)*c.armor;
   s.enemies.push({id:++s.serial,x:c.x+(col-1.5)*18,z:f.z-180+row*76,hp,max:hp,type:c.armor>1.5?'heavy':'swarm',army:c.name==='骑射补给'?1:0,layer:index,lane,row,col,phase:s.random()*6.28,dead:false,retreat:false,stun:0});
  }
 }
 s.fronts.push(f);return f;
}
export function createGame(seed=Date.now()){
 const s={seed,random:rng(seed),mode:'play',time:0,distance:0,camera:0,x:210,target:210,hull:100,army:24,power:24,tension:100,width:1,layer:0,serial:0,enemies:[],fronts:[],traces:[],particles:[],notices:[],arrows:[],corpses:[],history:[],kills:0,retreated:0,crossed:0,mathLosses:0,cooldown:0,fire:0,nextVolley:4,underFire:0,dash:null,pulse:0,invulnerable:0,impact:0,footprints:[],footTimer:0,rear:0,wakes:[],rings:[],tailwind:0,cavalry:[],build:[0,0],choice:null,peak:0,emptyTime:0,maxEmptyTime:0,reason:'',shotCount:0,volleyIndex:0,blockedRushes:0};
 makeLayer(s,0);makeLayer(s,1);note(s,'先看算式，再选一列。凿穿八排，咕咕带队突破！');return s;
}
export function burst(s,x,z,color,n=4){for(let i=0;i<n&&s.particles.length<72;i++)s.particles.push({x,z,vx:(s.random()-.5)*90,vz:(s.random()-.5)*180,life:.25+s.random()*.2,color});}
function kill(s,e){if(e.dead)return;e.dead=true;s.kills++;s.tension=Math.min(100,s.tension+.2);s.corpses.push({x:e.x,z:e.z,army:e.army,life:3});if(s.corpses.length>32)s.corpses.shift();burst(s,e.x,e.z,'#e1bd82',2);}
function damage(s,e,n){e.hp-=n;if(e.hp<=0)kill(s,e);}
function updateOpen(s){const f=s.fronts[s.layer];if(!f)return;for(const c of f.columns){c.remaining=s.enemies.filter(e=>e.layer===s.layer&&e.lane===c.lane&&!e.dead&&!e.retreat).length;if(!c.remaining&&!c.open){c.open=true;note(s,'第'+(s.layer+1)+'阵 · '+c.name+'已凿穿！沿缺口冲锋');}}}
export const skillCost=()=>45;
export function rush(s){if(s.mode!=='play'||s.dash||s.cooldown>0||s.tension<45)return false;const f=s.fronts[s.layer],lane=laneAt(s.x),c=f.columns[lane];s.tension-=45;s.cooldown=2.2;s.pulse=.55;
 if(c.open&&Math.abs(s.x-c.x)<38){s.dash={from:s.distance,to:f.z+420,age:0,duration:.9,lane};s.invulnerable=1.1;note(s,'咕咕：缺口打开了，跟我冲！');}
 else {s.blockedRushes++;for(const e of s.enemies)if(!e.dead&&!e.retreat&&e.layer===s.layer&&e.lane===lane)damage(s,e,5+s.army*.025);note(s,'墨墨齐射！守军还在，不能穿墙冲锋');updateOpen(s);}return true;}
function fire(s){s.volleyIndex++;const f=s.fronts[s.layer];if(!f)return;const lane=laneAt(s.x),c=f.columns[lane];if(c.open)return;
 const candidates=s.enemies.filter(e=>!e.dead&&!e.retreat&&e.layer===s.layer&&e.lane===lane&&e.z>s.distance&&e.z<s.distance+975).sort((a,b)=>a.row-b.row);
 const count=clamp(2+Math.floor(s.army/16),3,8),damagePerArrow=2.4+s.army*.025;
 for(let ray=0;ray<count;ray++){const col=(ray+s.volleyIndex)%4,e=candidates.find(e=>!e.dead&&e.col===col);if(!e)continue;damage(s,e,damagePerArrow);s.shotCount++;if(s.traces.length<100)s.traces.push({x:s.x+(ray%2?18:-18),z:s.distance+20,tx:e.x,tz:e.z,life:.16,color:'#ffe1a0'});}
}
function cross(s,f,c){const before=s.army,raw=applyOrders(before,c.orders),after=Math.min(180,raw);s.history.push({layer:s.layer,lane:c.lane,before,after,raw,formula:formula(c.orders),time:s.time});s.army=after;s.power=after;s.hull=Math.min(100,s.hull+c.heal);s.crossed++;s.committed=null;f.crossed=true;
 // An outflanked formation withdraws sideways. It never turns around into the player's arrows.
 for(const e of s.enemies)if(e.layer===s.layer&&!e.dead){e.retreat=true;e.exitDirection=e.lane===0?-1:e.lane===2?1:e.x<c.x?-1:1;}
 note(s,before+'人 '+formula(c.orders)+' = '+raw+'人'+(raw>180?'（编制180）':'')+(c.heal?' · 补给军心 +14':''));
 if(after<=0){s.mathLosses++;s.mode='lose';s.reason='这条运粮路线耗尽兵力：'+before+' '+formula(c.orders)+' = '+after;return;}
 if(++s.layer===LAYERS){s.distance=GOAL;s.mode='win';s.reason='十二道防线逐列凿穿，兵力与军心带过每一道缺口';return;}
 s.nextVolley=2.8;s.underFire=0;if(s.layer+1<LAYERS)makeLayer(s,s.layer+1);
}
export function step(s,dt){if(s.mode!=='play')return;dt=clamp(dt,0,.04);s.time+=dt;
 s.x+=((s.dash?laneX(s.dash.lane):s.committed!==null&&s.committed!==undefined?laneX(s.committed):clamp(s.target,72,348))-s.x)*(1-Math.exp(-15*dt));s.tension=Math.min(100,s.tension+8*dt);s.cooldown=Math.max(0,s.cooldown-dt);s.invulnerable=Math.max(0,s.invulnerable-dt);s.pulse=Math.max(0,s.pulse-dt);s.impact=Math.max(0,s.impact-dt);
 for(const t of s.traces)t.life-=dt;s.traces=s.traces.filter(t=>t.life>0);for(const p of s.particles){p.life-=dt;p.x+=p.vx*dt;p.z+=p.vz*dt;}s.particles=s.particles.filter(p=>p.life>0);for(const n of s.notices)n.life-=dt;s.notices=s.notices.filter(n=>n.life>0);for(const body of s.corpses)body.life-=dt;s.corpses=s.corpses.filter(b=>b.life>0);
 const f=s.fronts[s.layer],c=f.columns[laneAt(s.x)];
 if(s.dash){const d=s.dash;d.age+=dt;s.distance=d.from+(d.to-d.from)*clamp(d.age/d.duration,0,1);if(d.age>=d.duration){s.dash=null;cross(s,f,f.columns[d.lane]);}}
 else s.distance=Math.min(f.z-330,s.distance+(f.z-s.distance>1100?560:280)*dt);
 if(s.mode!=='play')return;
 s.camera+=(s.distance-s.camera)*(1-Math.exp(-12*dt));s.power=s.army;
 for(const e of s.enemies){e.phase+=dt;if(e.retreat)e.x+=e.exitDirection*115*dt;}
 s.enemies=s.enemies.filter(e=>{if(e.retreat&&(e.x<-40||e.x>460)){s.retreated++;return false;}return !e.dead;});
 s.fire-=dt;if(s.fire<=0){s.fire=.17;fire(s);updateOpen(s);}
 const current=s.fronts[s.layer];if(current&&s.distance>current.z-1200){s.underFire+=dt;s.nextVolley-=dt;if(s.nextVolley<=0){s.nextVolley=Math.max(2.4,4.5-s.layer*.12);const sources=current.columns.filter(c=>!c.open);if(sources.length){const source=sources[Math.floor(s.random()*sources.length)];s.arrows.push({x:s.x,z:s.distance+25,age:0,hit:false,sourceX:source.x,sourceZ:current.z-120});}}}
 for(const a of s.arrows){a.age+=dt;if(!a.hit&&a.age>=1.05){a.hit=true;if(Math.abs(a.x-s.x)<25&&s.invulnerable<=0){s.hull=Math.max(0,s.hull-9);s.army=Math.max(0,s.army-2);s.impact=.35;note(s,'侧翼箭雨命中：军心 −9，兵力 −2','#ffae98');}}}s.arrows=s.arrows.filter(a=>a.age<1.5);
 if(s.underFire>28){s.hull=Math.max(0,s.hull-dt*3);if(Math.floor(s.time*2)!==Math.floor((s.time-dt)*2))note(s,'敌军援兵合围！必须集中打穿一列','#ffae98');}
 const visible=s.enemies.some(e=>!e.retreat&&e.z>s.distance&&e.z-s.distance<975);s.emptyTime=visible?0:s.emptyTime+dt;s.maxEmptyTime=Math.max(s.maxEmptyTime,s.emptyTime);s.peak=Math.max(s.peak,s.enemies.length);
 if(s.hull<=0||s.army<=0){s.mode='lose';s.reason=s.army<=0?'兵力耗尽：先算路线收益，躲开侧翼箭雨':'拖延与侧翼火力耗尽军心：集中凿穿一列，别把火力平均分散';}else if(s.time>=LIMIT){s.mode='lose';s.reason='战线迟迟未破，援军封锁了道路';}
}
export function result(s){return{score:Math.max(0,Math.floor(s.crossed*2000+s.army*40+s.hull*10+s.kills*3-s.time*15)),grade:s.mode!=='win'?'未突破':s.army>=100?'S':s.army>=60?'A':'B'};}
