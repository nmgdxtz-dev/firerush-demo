import {readFile,writeFile,mkdir} from 'node:fs/promises';
const html=await readFile('index.html','utf8'),css=await readFile('style.css','utf8');
const game=(await readFile('src/game.js','utf8')).replace(/^export /gm,'');
const main=(await readFile('src/main.js','utf8')).replace(/^import .*;\n/,'');
await mkdir('dist',{recursive:true});
const result=html.replace('<link rel="stylesheet" href="style.css">',`<style>${css}</style>`).replace('<script type="module" src="src/main.js"></script>',`<script type="module">\n${game}\n${main}\n</script>`);
await writeFile('dist/index.html',result);console.log(`Standalone build: ${Buffer.byteLength(result)} bytes (no dependencies or network assets)`);
