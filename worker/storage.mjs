export async function storageAPI(request,env,body){
 const owner=request.headers.get('oai-authenticated-user-id');
 if(!owner)return {status:401,body:{error:'请登录后使用云端保存。'}};
 if(!env.DB)return {status:503,body:{error:'云端存储尚不可用。'}};
 const path=new URL(request.url).pathname,now=new Date().toISOString();
 if(path==='/api/workspace'){
  if(request.method==='GET'){
   const row=await env.DB.prepare('SELECT payload, revision FROM memora_workspace WHERE owner=?').bind(owner).first();
   return {body:{payload:row?JSON.parse(row.payload):null,revision:row?.revision||0}};
  }
  const payload=body?.payload;
  if(!payload||!Array.isArray(payload.chat)||payload.chat.length>120||!payload.data||JSON.stringify(payload).length>1500000)return {status:400,body:{error:'工作区数据无效或过大。'}};
  const old=await env.DB.prepare('SELECT payload, revision FROM memora_workspace WHERE owner=?').bind(owner).first();
  const expected=Number(body.revision);
  if((old?.revision||0)!==expected)return {status:409,body:{error:'其他设备已更新数据，请刷新后重试。'}};
  const previous=old?JSON.parse(old.payload):null;
  // CRM workflow/field state has one command path; whole-workspace saves cannot reset it.
  const guarded=structuredClone(payload),prior=previous?.data;
  guarded.data.crm=prior?.crm||{tasks:[],runs:[],fields:[]};
  const changes=[];
  for(const c of guarded.data.customers){const p=prior?.customers?.find(x=>x.id===c.id);if(p){for(const key of ['email','phone','custom']){if(p[key]===undefined)delete c[key];else c[key]=p[key];}c.crmVersion=p.crmVersion||0;const keys=['name','stage','vehicleId','budget','followUp','lastContact','notes'];if(keys.some(k=>JSON.stringify(c[k])!==JSON.stringify(p[k]))){changes.push({id:c.id,before:Object.fromEntries(keys.map(k=>[k,p[k]])),after:Object.fromEntries(keys.map(k=>[k,c[k]]))});c.crmVersion++;}}else{c.crmVersion=0;changes.push({id:c.id,type:'created'});}}
  const value=JSON.stringify(guarded);let r;
  if(old)r=env.DB.prepare('UPDATE memora_workspace SET payload=?, revision=revision+1, updated=? WHERE owner=? AND revision=?').bind(value,now,owner,expected);
  else r=env.DB.prepare('INSERT OR IGNORE INTO memora_workspace(owner,payload,revision,updated) VALUES(?,?,1,?)').bind(owner,value,now);
  const log=env.DB.prepare('INSERT INTO memora_audit(id,owner,memory_id,action,snapshot,created) SELECT ?,?,?,?,?,? WHERE changes()=1').bind(crypto.randomUUID(),owner,'workspace','crm.workspace_save',JSON.stringify({changes:changes.slice(0,100),changedCount:changes.length,beforeRevision:expected,afterRevision:expected+1}),now);
  r=(await env.DB.batch([r,log]))[0];
  if(!r.meta.changes)return {status:409,body:{error:'数据版本冲突，请刷新。'}};
  return {body:{revision:expected+1,updated:now,customerVersions:Object.fromEntries(guarded.data.customers.map(c=>[c.id,c.crmVersion||0]))}};
 }
 if(path==='/api/memories'){
  if(request.method==='GET'){
   const result=await env.DB.prepare('SELECT id,content,status,version,updated FROM memora_memory WHERE owner=? ORDER BY updated DESC LIMIT 100').bind(owner).all();return {body:{memories:result.results}};
  }
  const action=body?.action,id=typeof body?.id==='string'?body.id:crypto.randomUUID();
  if(!['propose','confirm','revoke'].includes(action))return {status:400,body:{error:'未知记忆操作。'}};
  const old=await env.DB.prepare('SELECT * FROM memora_memory WHERE owner=? AND id=?').bind(owner,id).first();
  const content=String(body.content||'').trim().slice(0,2000);
  if(action==='propose'&&!content)return {status:400,body:{error:'请输入记忆内容。'}};
  if(action!=='propose'&&!old)return {status:404,body:{error:'找不到这条记忆。'}};
  if(old&&Number(body.version)!==old.version)return {status:409,body:{error:'记忆已更新，请刷新。'}};
  const next={id,content:action==='propose'?content:old.content,status:action==='propose'?'pending':action==='confirm'?'active':'revoked',version:(old?.version||0)+1,updated:now};
  // Optimistic update and audit are atomic; a stale write cannot approve a different revision.
  const auditId=crypto.randomUUID();
  const write=old?env.DB.prepare('UPDATE memora_memory SET content=?,status=?,version=?,updated=? WHERE owner=? AND id=? AND version=?').bind(next.content,next.status,next.version,now,owner,id,old.version):env.DB.prepare('INSERT OR IGNORE INTO memora_memory(owner,id,content,status,version,updated) VALUES(?,?,?,?,?,?)').bind(owner,id,next.content,next.status,next.version,now);
  const audit=env.DB.prepare('INSERT INTO memora_audit(id,owner,memory_id,action,snapshot,created) SELECT ?,?,?,?,?,? WHERE changes()=1').bind(auditId,owner,id,action,JSON.stringify(next),now);
  const results=await env.DB.batch([write,audit]);
  if(!results[0].meta.changes)return {status:409,body:{error:'记忆版本冲突，请刷新。'}};
  return {body:{memory:next}};
 }
 return {status:404,body:{error:'未知存储接口。'}};
}
export async function activeMemories(request,env){
 const owner=request.headers.get('oai-authenticated-user-id');if(!owner||!env.DB)return [];
 const result=await env.DB.prepare("SELECT id,content,version FROM memora_memory WHERE owner=? AND status='active' ORDER BY updated DESC LIMIT 20").bind(owner).all();return result.results;
}
