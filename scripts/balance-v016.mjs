import {createGame,step,rush,applyOrders,laneX,waveClear} from '../src/v016/game.js';
export function control(s,style='smart'){
 if(s.mode!=='play'||style==='idle')return;
 const f=s.fronts[s.layer];if(!f)return;
 const available=f.columns.filter(c=>!c.open);
 function plan(cards,army){if(!cards.length)return army;let best=-Infinity;for(const c of cards){const after=Math.min(180,applyOrders(army,c.orders));if(after<=0)continue;best=Math.max(best,plan(cards.filter(x=>x!==c),after));}return best;}
 let best=available[0]||f.columns[0],value=-Infinity;
 for(const c of available){const after=Math.min(180,applyOrders(s.army,c.orders)),rank=style==='multiply'?(c.orders[0].kind==='×'?1000:0):style==='left'?-c.lane:after<=0?-1e6:plan(available.filter(x=>x!==c),after)+after*.04-c.armor*.2;if(rank>value){value=rank;best=c;}}
 if(s.aiLayer!==s.layer||f.columns[s.aiLane]?.open){s.aiLayer=s.layer;s.aiLane=best.lane;}
 const c=f.columns[s.aiLane];s.target=laneX(c.lane);
 const danger=s.arrows.find(a=>!a.hit&&a.age>.6&&Math.abs(a.x-s.target)<28);if(danger&&!s.dash)s.target+=s.target>300?-35:35;
 if(!s.dash&&(waveClear(s)||s.tension>=45&&s.cooldown<=0)&&Math.abs(s.x-c.x)<30)rush(s);
}
export function simulate(seed,style='smart') {const s=createGame(seed);for(let i=0;i<661*60&&s.mode==='play';i++){control(s,style);step(s,1/60);}return {seed,style,mode:s.mode,time:+s.time.toFixed(1),distance:s.distance,army:s.army,hull:+s.hull.toFixed(1),crossed:s.crossed,kills:s.kills,retreated:s.retreated,maxEmptyTime:s.maxEmptyTime,peak:s.peak,history:s.history};}
if(typeof process!=='undefined'&&process.argv[1]?.endsWith('balance-v016.mjs')){const report={smart:[1,2,3,4,5,6].map(n=>simulate(n)),idle:simulate(3,'idle'),multiply:simulate(3,'multiply'),left:simulate(3,'left')};console.log(JSON.stringify(report,null,2));if(report.smart.some(r=>r.mode!=='win'||r.maxEmptyTime>2)||report.idle.mode!=='lose'||false)process.exitCode=1;}
