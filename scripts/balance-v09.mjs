import{createGame,step,rush,seam}from'../src/v09/game.js';
export function control(s,style='seam'){
 if(s.dash)return;
 if(style==='reckless'){s.target=210;rush(s);return;}
 if(style==='sweep'){s.target=210+Math.sin(s.time*.8)*140;return;}
 const front=s.fronts.find(f=>!f.breached&&f.z>s.distance&&f.z<s.distance+335);if(front){s.target=front.x;}
 const gap=seam(s);
 // Finish a promising cut instead of constantly abandoning it for a distant gap.
 if(!front&&gap.mass>17&&Math.floor(s.time*2)%3===0){let best=Infinity,bx=s.target;for(let x=50;x<=370;x+=40){const cost=seam(s,x).mass+Math.abs(x-s.x)*.06;if(cost<best){best=cost;bx=x;}}s.target=bx;}
 if(!front&&s.choice&&s.choice.remaining<.45)s.target=100;
 if(gap.ready)rush(s);
}
export function simulate(seed,style='seam'){const s=createGame(seed);for(let i=0;i<185*60&&s.mode==='play';i++){if(style!=='idle')control(s,style);step(s,1/60);}return{seed,style,mode:s.mode,time:+s.time.toFixed(1),distance:Math.round(s.distance),hull:+s.hull.toFixed(1),kills:s.kills,clean:s.cleanRushes,hard:s.hardRushes,peak:s.peak,rear:+s.rear.toFixed(1),power:s.power,width:+s.width.toFixed(2)};}
if(typeof process!=='undefined'&&process.argv[1]?.endsWith('balance-v09.mjs')){const report={idle:simulate(12,'idle'),reckless:simulate(12,'reckless'),sweep:simulate(12,'sweep'),active:Array.from({length:6},(_,i)=>simulate(i+1))};console.log(JSON.stringify(report,null,2));if(report.active[2].mode!=='win'||report.reckless.mode!=='lose'||report.sweep.mode!=='lose')process.exitCode=1;}
