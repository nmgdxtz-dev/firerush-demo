import {createGame,step,pulse,canRoute,routeValue,tier} from '../src/game.js';
function play(seed,bot){let s=createGame(seed);for(let i=0;i<210*60&&s.mode==='play';i++){
 if(bot){
 let target=s.boss?s.boss.x:210;
 const urgent=s.enemies.filter(e=>!e.dead&&e.y>220).sort((a,b)=>b.y-a.y)[0];if(urgent)target=urgent.x;
 if(s.gate){const [a,b]=s.gate.options;let side=s.hull<65&&b.heal&&canRoute(s,b)?1:0;if(a.kind==='divide'&&s.hull>50)side=1;if(a.heal&&s.hull<70&&canRoute(s,a))side=0;target=side===0?95:325;}
 let best=Infinity,bx=target;for(let x=30;x<=390;x+=15){let cost=Math.abs(x-target)*.12;for(const h of s.hazards)if(h.y>400&&h.y<595&&x>h.x-23&&x<h.x+h.w+23)cost+=250;for(const b of s.shots)if(b.y>430&&b.y<590)cost+=Math.max(0,38-Math.abs(b.x-x))*3;if(s.boss?.warning>0&&x>s.boss.lane*126+1&&x<s.boss.lane*126+167)cost+=200;if(cost<best){best=cost;bx=x;}}s.target=bx;
 if((s.enemies.filter(e=>e.y>270).length>9||s.shots.some(b=>Math.hypot(b.x-s.x,b.y-550)<65))&&s.charge>=18)pulse(s);
 }
 step(s,1/60);
 }return {seed,mode:s.mode,time:Math.round(s.time),hull:Math.round(s.hull),kills:s.kills,leaked:s.leaked,charge:s.charge,boss:s.boss?.hp,peak:s.peak,reason:s.reason};}
const idle=play(12,false),active=Array.from({length:10},(_,i)=>play(i+1,true));
console.log(JSON.stringify({idle,active},null,2));
if(idle.mode!=='lose'||active.some(s=>s.mode!=='win'))process.exitCode=1;
