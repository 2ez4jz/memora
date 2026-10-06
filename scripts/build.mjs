import { readFile,writeFile,mkdir,rm } from 'node:fs/promises';
const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
const api=await readFile(new URL('../worker/api.mjs',import.meta.url),'utf8');
await rm(new URL('../dist',import.meta.url),{recursive:true,force:true});
await mkdir(new URL('../dist/server',import.meta.url),{recursive:true});
const entry=`const PAGE=${JSON.stringify(html)};\n${api}\nexport default {async fetch(request,env,ctx){const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return handleAPI(request,env);if(url.pathname!=='/'&&url.pathname!=='/index.html')return new Response('页面不存在',{status:404});if(!['GET','HEAD'].includes(request.method))return new Response('不支持的请求方法',{status:405});return new Response(request.method==='HEAD'?null:PAGE,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}})}};\n`;
await writeFile(new URL('../dist/server/index.js',import.meta.url),entry);
console.log('Built Memora Worker with embedded UI and server-only OpenAI API.');
