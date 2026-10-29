import{readFile,writeFile,mkdir}from'node:fs/promises';
const html=await readFile('v08/index.html','utf8'),css=await readFile('src/style.css','utf8');
let code='';for(const file of ['game','input','main'])code+=(await readFile(`src/${file}.js`,'utf8')).replace(/^import .*\n/gm,'').replace(/^export /gm,'')+'\n';
const result=html.replace('<link rel="stylesheet" href="../src/style.css">',`<style>${css}</style>`).replace('<script type="module" src="../src/main.js"></script>',`<script type="module">${code}</script>`);
await mkdir('preview/v0.8',{recursive:true});await mkdir('dist',{recursive:true});await writeFile('preview/v0.8/index.html',result);await writeFile('dist/index.html',result);console.log(`Standalone V0.8: ${Buffer.byteLength(result)} bytes. Phone preview: preview/v0.8/index.html`);
