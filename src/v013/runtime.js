// A one-way per-page pixel budget: avoid repeated quality oscillation on slow phones.
export class RenderBudget{
 constructor(dpr=1){this.scale=Math.max(1,Math.min(dpr,1.5));this.seconds=0;this.slow=0;}
 observe(elapsed,active){
  if(!active){this.seconds=0;this.slow=0;return false;}
  this.seconds+=Math.min(elapsed,.1);if(elapsed>.025)this.slow++;
  if(this.seconds<1)return false;
  const before=this.scale;if(this.slow>=9)this.scale=Math.max(1,this.scale-.25);
  this.seconds=0;this.slow=0;return this.scale!==before;
 }
}
