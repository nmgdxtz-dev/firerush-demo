import{createGame,step,rush,seam,road,obstacleX,obstacleAhead,chooseFormation}from'../src/v011/game.js';
export function control(s,style='seam'){
 if(s.choice&&style==='seam')chooseFormation(s,s.width>.85?0:1);
 if(s.dash){if(style==='seam')steerRoad(s);return;}
 if(style==='reckless'){s.target=210;rush(s);return;}
 if(style==='sweep'){s.target=210+Math.sin(s.time*.8)*140;return;}
 const front=s.fronts.find(f=>!f.breached&&f.z>s.distance&&f.z<s.distance+335);if(front){s.target=front.x;}
 const gap=seam(s);
 // Finish a promising cut instead of constantly abandoning it for a distant gap.
 if(!front&&gap.mass>17&&Math.floor(s.time*2)%3===0){let best=Infinity,bx=s.target;for(let x=50;x<=370;x+=40){const cost=seam(s,x).mass+Math.abs(x-s.x)*.06;if(cost<best){best=cost;bx=x;}}s.target=bx;}
 if(!front&&s.choice&&s.choice.remaining<.45)s.target=100;
 if(style==='seam')steerRoad(s);
 if(gap.ready)rush(s);
}
function steerRoad(s){
 const o=obstacleAhead(s,300),front=s.fronts.find(f=>!f.breached&&f.z>s.distance);
 if(!o||(front&&front.z<o.z&&s.distance<front.z-20))return;
 const r=road(o.z),x=obstacleX(s,o),margin=22*s.width+16;
 const left=x-o.width/2-margin,right=x+o.width/2+margin;
 const low=r.left+margin,high=r.right-margin;
 s.target=left>=low&&right<=high?(Math.abs(s.x-left)<Math.abs(s.x-right)?left:right):left>=low?left:right;
 // Commit to the wider escape corridor; do not chase a moving crate back and forth.
 if(o.type==='cart')s.target=x<r.center?high:low;
}
export function simulate(seed,style='seam'){const s=createGame(seed);for(let i=0;i<185*60&&s.mode==='play';i++){if(style!=='idle')control(s,style);step(s,1/60);}return{seed,style,mode:s.mode,time:+s.time.toFixed(1),distance:Math.round(s.distance),hull:+s.hull.toFixed(1),kills:s.kills,clean:s.cleanRushes,hard:s.hardRushes,nearMisses:s.nearMisses,windRushes:s.windRushes,hits:s.obstacleHits,dodged:s.dodged,explosions:s.explosions,wakeKills:s.wakeKills,peak:s.peak,rear:+s.rear.toFixed(1),power:s.power,width:+s.width.toFixed(2)};}
if(typeof process!=='undefined'&&process.argv[1]?.endsWith('balance-v011.mjs')){const report={idle:simulate(12,'idle'),reckless:simulate(12,'reckless'),sweep:simulate(12,'sweep'),blind:simulate(5,'blind'),active:Array.from({length:6},(_,i)=>simulate(i+1))};console.log(JSON.stringify(report,null,2));if(!report.active.some(r=>r.mode==='win'&&r.hits===0)||report.reckless.mode!=='lose'||report.sweep.mode!=='lose')process.exitCode=1;}
