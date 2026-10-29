import {createGame,step,pulse,LANES} from '../src/game.js';
export function control(s,style='siege'){
 if(style==='sweep'){s.target=210+Math.sin(s.time*1.2)*145;if(s.bond>=100)pulse(s);return;}
 let t=s.towers.find(t=>t.owner!=='ally'&&t.id!=='core');
 if(style==='right')t=s.towers.find(t=>t.id==='right'&&t.owner!=='ally')||s.towers.find(t=>t.id==='left'&&t.owner!=='ally');
 const allied=s.towers.filter(t=>t.owner==='ally');
 if(allied.length===2)t=s.towers.find(t=>t.id==='core');
 const dying=allied.find(t=>t.hp<55&&s.enemies.filter(e=>Math.hypot(e.x-t.x,e.y-t.y)<80).length>4);
 if(dying)t=dying;
 s.target=t?.x||210;
 if(s.impacts.some(a=>!a.done&&a.remaining<.6&&Math.abs(s.target-a.x)<a.r+12))s.target=s.target<210?s.target+85:s.target-85;
 if(s.supply){const [a,b]=s.supply.options;if(s.base<65&&b.heal&&s.power-b.v>=8)s.target=320;else if(s.supply.remaining<.6)s.target=90;}
 if(s.bond>=45&&(s.enemies.length>50||s.towers.some(t=>t.owner==='ruin'&&t.contested)||s.base<35||s.enemies.some(e=>e.y>500)))pulse(s);
}
export function simulate(seed,style='siege') {const s=createGame(seed);for(let i=0;i<205*60&&s.mode==='play';i++){if(style!=='idle')control(s,style);step(s,1/60);}return{seed,style,mode:s.mode,time:+s.time.toFixed(1),base:s.base,kills:s.kills,captures:s.captures,recaptures:s.recaptures,sector:s.sector,peak:s.peak,power:s.power,towers:s.towers.map(t=>[t.id,t.owner,Math.round(t.hp)])};}
if(typeof process!=='undefined'&&process.argv[1]?.endsWith('balance.mjs')){const idle=simulate(12,'idle'),sweep=simulate(12,'sweep'),active=Array.from({length:6},(_,i)=>simulate(i+1,i%2?'right':'siege'));console.log(JSON.stringify({idle,sweep,active},null,2));if(idle.mode!=='lose'||active[0].mode!=='win'||active[1].mode!=='win')process.exitCode=1;}
