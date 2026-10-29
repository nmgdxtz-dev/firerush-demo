import test from'node:test';import assert from'node:assert/strict';import{RenderBudget}from'../src/v012/runtime.js';
test('high DPR is capped and sustained slow frames reduce pixel work',()=>{const b=new RenderBudget(3);assert.equal(b.scale,1.5);for(let i=0;i<31;i++)b.observe(1/30,true);assert.equal(b.scale,1.25);for(let i=0;i<90;i++)b.observe(1/30,true);assert.equal(b.scale,1);});
test('hidden or paused time never triggers quality loss',()=>{const b=new RenderBudget(3);for(let i=0;i<100;i++)b.observe(.1,false);assert.equal(b.scale,1.5);});
test('stable sixty-Hz play and isolated hitch retain quality',()=>{const b=new RenderBudget(3);b.observe(.1,true);for(let i=0;i<180;i++)b.observe(1/60,true);assert.equal(b.scale,1.5);});
