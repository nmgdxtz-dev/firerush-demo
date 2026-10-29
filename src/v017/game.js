export const W=420,H=760,WAVES=8,GOAL=8000,LIMIT=420;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function rng(seed){return()=>{let t=seed+=0x6d2b79f5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export const laneX=i=>78+i*132,entryAt=x=>clamp(Math.round((x-78)/132),0,2);
export const mirrorCells=[[0,0],[2,0],[4,0],[0,2],[2,2],[4,2]],coreCells=[[1,2],[3,2],[1,0],[3,0]];
export function note(s,text){s.notices=[{text,life:2.8}];}
export function makeWave(s,index){const rand=rng((s.seed>>>0)^Math.imul(index+1,0x45d9f3b)),base=index*1000;s.mirrors=mirrorCells.map(([x,y],id)=>({id,x,y,slash:rand()>.5}));const cells=index%3===1?[[1,2],[3,2],[0,1],[4,1]]:index%3===2?[[1,2],[3,2],[2,1],[index%2?0:4,1]]:coreCells;s.cores=cells.map(([x,y],id)=>({id,x,y,dead:false}));s.enemies=[];for(let group=0;group<4;group++)for(let row=0;row<4;row++)for(let col=0;col<6;col++)s.enemies.push({id:++s.serial,group,x:(group%2?286:134)+(col-2.5)*17,z:base+(group<2?260:550)+row*38,hp:16,army:group<2?0:1,phase:rand()*6.28,dead:false});s.nextVolley=index===0?6:4;s.waveAge=0;}
export function createGame(seed=Date.now()){const s={seed,random:rng(seed),mode:'play',wave:0,time:0,waveAge:0,distance:0,camera:0,x:210,target:210,hull:100,energy:100,kills:0,serial:0,shots:0,misses:0,turns:0,combo:0,maxCombo:0,cleared:0,mirrors:[],cores:[],enemies:[],pulse:null,traces:[],particles:[],rings:[],notices:[],arrows:[],nextVolley:4,fire:0,reason:'',history:[],advance:0};makeWave(s,0);note(s,'点棱盾旋转，左右拖动选入口；咕咕发射折光弩！');return s;}
export function rotateMirror(s,id){if(s.mode!=='play'||s.pulse||!Number.isInteger(id)||!s.mirrors[id])return false;s.mirrors[id].slash=!s.mirrors[id].slash;s.turns++;return true;}
export const waveClear=s=>s.cores.every(c=>c.dead)&&!s.enemies.some(e=>!e.dead);
// Grid routing, not an answer service. A pulse can loop, exit or strike protected cores.
export function route(s,entry){let x=entry*2,y=3,dx=0,dy=-1;const points=[{x,y}],hits=[],local=s.cores.map(c=>c.dead),seen=new Set();let blocked=false;
 for(let i=0;i<45;i++){x+=dx;y+=dy;points.push({x,y});if(x<0||x>4||y<0||y>3)break;const key=x+','+y+','+dx+','+dy;if(seen.has(key)){blocked=true;break;}seen.add(key);
  const core=s.cores.find(c=>c.x===x&&c.y===y);if(core&&!local[core.id]){if(core.id>=2&&!(local[0]&&local[1])){blocked=true;break;}local[core.id]=true;hits.push({id:core.id,at:points.length-1});}
  const m=s.mirrors.find(m=>m.x===x&&m.y===y);if(m){const old=dx;if(m.slash){dx=-dy;dy=-old;}else{dx=dy;dy=old;}}
 }return{points,hits,blocked};}
export function shoot(s){if(s.mode!=='play'||s.pulse||s.energy<40||waveClear(s))return false;const entry=entryAt(s.x),path=route(s,entry);s.energy-=40;s.shots++;s.pulse={...path,entry,age:0,speed:11,processed:0};s.combo=0;return true;}
function blast(s,id){const c=s.cores[id];if(c.dead)return;c.dead=true;s.combo++;s.maxCombo=Math.max(s.maxCombo,s.combo);s.energy=Math.min(100,s.energy+15);let kills=0;for(const e of s.enemies)if(e.group===id&&!e.dead){e.dead=true;e.hp=0;s.kills++;kills++;if(s.particles.length<90)for(let i=0;i<2;i++)s.particles.push({x:e.x,z:e.z,vx:(s.random()-.5)*110,vz:(s.random()-.5)*200,life:.25+s.random()*.35});}s.rings.push({x:id%2?286:134,z:s.wave*1000+(id<2?310:600),life:.8});s.advance=1.3;note(s,s.combo>1?'连锁爆破 ×'+s.combo+'！弩车向前压进！':'火油核心引爆，'+kills+'名守军击破！');}
export function step(s,dt){if(s.mode!=='play')return;dt=clamp(dt,0,.04);s.time+=dt;s.waveAge+=dt;s.x+=(clamp(s.target,66,354)-s.x)*(1-Math.exp(-13*dt));s.energy=Math.min(100,s.energy+12*dt);s.advance=Math.max(0,s.advance-dt);
 for(const n of s.notices)n.life-=dt;s.notices=s.notices.filter(n=>n.life>0);for(const p of s.particles){p.x+=p.vx*dt;p.z+=p.vz*dt;p.life-=dt;}s.particles=s.particles.filter(p=>p.life>0);for(const r of s.rings)r.life-=dt;s.rings=s.rings.filter(r=>r.life>0);for(const t of s.traces)t.life-=dt;s.traces=s.traces.filter(t=>t.life>0);
 if(s.pulse){const p=s.pulse;p.age+=dt;const reached=p.age*p.speed;for(const hit of p.hits)if(hit.at<=reached&&!s.cores[hit.id].dead)blast(s,hit.id);if(reached>=p.points.length-1){if(!p.hits.length){s.hull=Math.max(0,s.hull-5);s.misses++;note(s,p.blocked?'弩光被锁盾挡住：先拆前排两枚核心':'弩光出了战场；观察镜面的反弹方向');}s.pulse=null;}}
 const living=s.enemies.filter(e=>!e.dead);s.enemies=living;const stop=living.length?Math.min(...living.map(e=>e.z))-110:(s.wave+1)*1000;s.distance=Math.min(stop,s.distance+(s.advance>0?620:125)*dt);s.camera+=(s.distance-s.camera)*(1-Math.exp(-10*dt));
 s.fire-=dt;if(s.fire<=0){s.fire=.18;const e=living.filter(e=>Math.abs(e.x-s.x)<35).sort((a,b)=>a.z-b.z)[0];if(e)s.traces.push({x:s.x,z:s.distance+30,tx:e.x,tz:e.z,life:.16});}
 for(const e of living)e.phase+=dt;
 s.nextVolley-=dt;if(s.nextVolley<=0&&living.length){s.nextVolley=s.wave===0?6:Math.max(2.6,4-s.wave*.15);s.arrows.push({x:s.x,z:s.distance+15,age:0,hit:false});}
 for(const a of s.arrows){a.age+=dt;if(a.age>=1.1&&!a.hit){a.hit=true;if(Math.abs(s.x-a.x)<29){s.hull=Math.max(0,s.hull-(s.wave===0?6:10));note(s,'箭雨命中！调镜时也要避开地面红圈');}}}s.arrows=s.arrows.filter(a=>a.age<1.5);
 if(s.waveAge>(s.wave===0?60:34))s.hull=Math.max(0,s.hull-dt*2);
 if(s.hull<=0||s.time>=LIMIT){s.mode='lose';s.reason=s.hull<=0?'敌阵尚未击破。先看镜面方向，别浪费弩光。':'战役超时，下一次试试用一次弩光串起多个核心。';return;}
 if(waveClear(s)&&!s.pulse&&s.distance>=(s.wave+1)*1000-1){s.history.push({wave:s.wave,kills:s.kills,distance:s.distance,time:s.time});s.cleared++;if(s.cleared===WAVES){s.mode='win';s.distance=GOAL;s.reason='八波768名守军全部击破，弩车穿过最后一道防线';return;}s.wave++;s.arrows=[];makeWave(s,s.wave);note(s,'第'+(s.wave+1)+'波：重新观察镜面，前排核心保护着后排');}
}
