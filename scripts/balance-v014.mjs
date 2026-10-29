import{createGame,step,rush,chooseFormation,road,obstacleX,obstacleAhead,chooseCamp}from'../src/v014/game.js';
export function control(s,style='active'){
 if(s.mode==='camp'){chooseCamp(s,style==='drill'?1:0);return;}
 if(style==='idle')return;
 if(s.choice)chooseFormation(s,style==='wings'?1:0);
 if(style==='spam'){s.target=210;rush(s);return;}
 const f=s.fronts.find(f=>!f.breached&&f.z>s.distance&&f.z<s.distance+350);
 if(f)s.target=f.x;else {const enemy=s.enemies.filter(e=>!e.dead).sort((a,b)=>a.z-b.z)[0];s.target=enemy?enemy.x:road(s.distance+160).center;}
 const o=obstacleAhead(s,330);
 if(o&&(!f||o.z<f.z)){const r=road(o.z),margin=22*s.width+22,x=obstacleX(s,o);s.target=x<r.center?r.right-margin:r.left+margin;}
 const arrow=s.arrows.find(a=>!a.hit&&a.age>.3&&Math.abs(a.z-s.distance)<65&&Math.abs(a.x-s.target)<28);if(arrow)s.target=arrow.x<210?340:80;
 if(!s.dash&&s.tension>75&&(!o||o.z-s.distance>250)&&(!f||Math.abs(s.x-f.x)<40))rush(s);
}
export function simulate(seed,style='active'){const s=createGame(seed);let firstKill=null;for(let i=0;i<601*60&&(s.mode==='play'||s.mode==='camp');i++){control(s,style);step(s,1/60);if(firstKill===null&&s.kills)firstKill=s.time;}return{seed,style,mode:s.mode,time:+s.time.toFixed(1),distance:Math.round(s.distance),hull:+s.hull.toFixed(1),bossHealth:s.fronts.at(-1).hp,kills:s.kills,firstKill:+firstKill?.toFixed(2),camps:s.campHistory,arrowHits:s.arrowHits,shieldBlocks:s.shieldBlocks,hits:s.obstacleHits,walls:s.wallHits,dodged:s.dodged,upgrades:s.history,peak:s.peak};}
if(typeof process!=='undefined'&&process.argv[1]?.endsWith('balance-v014.mjs')){const report={idle:simulate(3,'idle'),spam:simulate(3,'spam'),active:[1,2,3,4,5,6].map(n=>simulate(n)),wings:simulate(3,'wings')};console.log(JSON.stringify(report,null,2));if(!report.active.some(r=>r.mode==='win')||report.idle.mode!=='lose')process.exitCode=1;}
