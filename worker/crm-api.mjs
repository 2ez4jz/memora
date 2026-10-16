import {crmState,duplicateGroups,customerTimeline,runWorkflows,dailyDigest,validISODate,validateCustomValue,businessDate} from './crm-core.mjs';
const canonical=v=>JSON.stringify(v,(_k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const fail=(error,status=400)=>({status,body:{error}});
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(v);
const crmStages=['New lead','Contacted','Appointment','Test drive','Negotiation','Sold'];
export function applyCRMCommand(data,action,payload,{today=businessDate()}={}) {
  const next=structuredClone(data),p=payload||{};next.crm=crmState(next);
  let before=null,after=null;
  if(action==='update_customer'){
    const c=next.customers.find(c=>c.id===p.customerId);if(!c)throw Error('客户不存在 / Customer not found');
    if(!Number.isInteger(p.version)||p.version!==(c.crmVersion||0))throw Error('客户版本已变化 / Customer version changed');
    if(!p.patch||Object.keys(p.patch).some(k=>!['stage','followUp','email','phone','notes','budget','custom'].includes(k)))throw Error('不支持的客户字段 / Unsupported customer field');
    before=structuredClone(c);
    for(const [key,value] of Object.entries(p.patch)){
      if(key==='stage'&&(!crmStages.includes(value)||(value==='Sold'&&!next.sales.some(s=>s.customerId===c.id))||(c.stage==='Sold'&&value!=='Sold')))throw Error('成交阶段须与成交记录一致 / Sale record required');
      if(key==='followUp'&&value!==null&&!validISODate(value))throw Error('跟进日期无效 / Invalid follow-up date');
      if(key==='budget'&&value!==null&&(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1000000))throw Error('预算无效 / Invalid budget');
      if(key==='email'&&value&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())))throw Error('邮箱格式无效 / Invalid email');
      if(['email','phone','notes'].includes(key)&&(typeof value!=='string'||value.length>(key==='notes'?3000:200)))throw Error('文字字段过长 / Text is too long');
      if(key==='custom'){
        if(!value||Array.isArray(value)||typeof value!=='object')throw Error('自定义字段无效 / Invalid custom fields');
        c.custom={...(c.custom||{})};
        for(const [field,v] of Object.entries(value)){const def=next.crm.fields.find(f=>f.key===field);c.custom[field]=validateCustomValue(def,v);}
      }else c[key]=value;
    }
    if(c.stage==='Sold')c.followUp=null;c.crmVersion=(c.crmVersion||0)+1;after=c;
  } else if(action==='create_task'){
    if(!next.customers.some(c=>c.id===p.customerId)||typeof p.title!=='string'||!p.title.trim()||p.title.length>300||p.dueDate!==null&&!validISODate(p.dueDate))throw Error('请检查客户、任务和日期 / Check customer, title and date');
    after={id:crypto.randomUUID(),customerId:p.customerId,title:p.title.trim(),dueDate:p.dueDate,status:'open',source:'confirmed',version:1,createdAt:new Date().toISOString()};next.crm.tasks.push(after);
  } else if(action==='update_task'){
    const t=next.crm.tasks.find(t=>t.id===p.id);if(!t||t.version!==p.version)throw Error('任务版本已变化 / Task version changed');
    if(!['open','done','dismissed'].includes(p.status))throw Error('任务状态无效 / Invalid task status');before=structuredClone(t);t.status=p.status;t.version++;after=t;
  } else if(action==='run_workflows'){
    const result=runWorkflows(next,{today});next.crm=result.crm;after={created:result.created,candidates:result.candidates};
  } else if(action==='define_field'){
    if(next.crm.fields.length>=30||next.crm.fields.some(f=>f.key===p.key)||typeof p.label!=='string'||!p.label.trim()||p.label.length>80)throw Error('字段已存在或达到上限 / Field exists or limit reached');
    validateCustomValue(p,null);
    if(p.type==='select'&&(!Array.isArray(p.options)||!p.options.length||p.options.length>30||p.options.some(o=>typeof o!=='string'||!o||o.length>100)||new Set(p.options).size!==p.options.length))throw Error('选项无效 / Invalid options');
    after={key:p.key,label:p.label.trim(),type:p.type,...(p.type==='select'?{options:p.options}:{})};next.crm.fields.push(after);
  } else if(action==='import_customers'){
    const preview=previewImport(next,p.rows);if(preview.errors.length)throw Error('导入有错误，请先修正 / Fix import errors before confirming');
    const items=preview.rows.map(r=>({...r,id:crypto.randomUUID(),created:today,lastContact:null,followUp:null,payment:null,tradeIn:null,tradeValue:null,crmVersion:1}));
    next.customers.push(...items);after={imported:items.length,ids:items.map(c=>c.id)};
  } else throw Error('操作不受支持 / Unsupported action');
  if(next.crm.tasks.length>2000||next.crm.runs.length>4000)throw Error('任务容量已满 / Task capacity reached');
  return {data:next,before,after};
}
export function previewImport(data,rows){
  if(!Array.isArray(rows)||!rows.length||rows.length>300||data.customers.length+rows.length>1000)throw Error('一次导入 1–300 位客户 / Import 1–300 customers at a time');
  const errors=[],valid=[];
  for(const [i,r] of rows.entries()){
    const row={name:String(r.name||'').trim(),email:String(r.email||'').trim(),phone:String(r.phone||'').trim(),vehicleId:String(r.vehicleId||'').trim(),stage:r.stage||'New lead',source:r.source||'Import',owner:r.owner||'Unassigned',budget:r.budget===''||r.budget==null?null:Number(r.budget),notes:String(r.notes||'')};
    if(!row.name||row.name.length>200||row.email.length>200||row.phone.length>200||row.notes.length>3000||!data.vehicles.some(v=>v.id===row.vehicleId)||!crmStages.includes(row.stage)||row.stage==='Sold'||row.budget!==null&&(!Number.isFinite(row.budget)||row.budget<0||row.budget>1000000))errors.push({row:i+2,error:'姓名、车辆、阶段或预算无效 / Invalid name, vehicle, stage or budget'});
    valid.push({...row,id:'import:'+i});
  }
  const duplicates=duplicateGroups([...data.customers,...valid]).filter(g=>g.ids.some(id=>id.startsWith('import:')));
  for(const g of duplicates)errors.push({row:null,error:'疑似重复客户，请先核对 / Review duplicate '+g.field,ids:g.ids});
  return {rows:valid.map(({id,...r})=>r),errors,duplicates};
}
export async function crmAPI(request,env,body={}){
  const owner=request.headers.get('oai-authenticated-user-id');if(!owner)return fail('请登录后使用 CRM / Sign in to use CRM',401);
  if(!env.DB)return fail('云端存储不可用 / Storage unavailable',503);
  const row=await env.DB.prepare('SELECT payload,revision FROM memora_workspace WHERE owner=?').bind(owner).first();
  if(!row)return fail('请先保存演示工作区 / Save the demo workspace first',409);
  const payload=JSON.parse(row.payload),data=payload.data,today=businessDate();
  if(request.method==='GET'){
    const id=new URL(request.url).searchParams.get('customerId');
    if(id&&!data.customers.some(c=>c.id===id))return fail('客户不存在 / Customer not found',404);
    const audit=await env.DB.prepare("SELECT id,action,snapshot,created FROM memora_audit WHERE owner=? AND action LIKE 'crm.%' ORDER BY created DESC LIMIT 100").bind(owner).all();
    return {body:{revision:row.revision,crm:crmState(data),digest:dailyDigest(data,today),duplicates:duplicateGroups(data.customers),timeline:id?customerTimeline(data,id):[],audit:audit.results.map(a=>({...a,snapshot:JSON.parse(a.snapshot)})),scope:'owner_private_demo',today}};
  }
  if(body.action==='preview_import'){try{return {body:previewImport(data,body.payload?.rows)}}catch(e){return fail(e.message)}}
  if(!uuid(body.requestId)||body.confirmed!==true)return fail('需要明确确认和请求编号 / Explicit confirmation and request ID required');
  const command={action:body.action,payload:body.payload},encoded=canonical(command);
  const replay=await env.DB.prepare('SELECT owner,snapshot FROM memora_audit WHERE id=?').bind(body.requestId).first();
  if(replay){const s=JSON.parse(replay.snapshot);if(replay.owner!==owner||s.command!==encoded)return fail('请求编号已用于其他修改 / Request ID conflict',409);return {body:{...s.result,replayed:true}};}
  if(!Number.isInteger(body.revision)||row.revision!==body.revision)return fail('其他窗口已更新，请重新读取 / Workspace revision changed',409);
  let result;try{result=applyCRMCommand(data,body.action,body.payload,{today})}catch(e){return fail(e.message,/version changed/.test(e.message)?409:400)}
  const next={...payload,data:result.data},value=JSON.stringify(next);if(value.length>1500000)return fail('工作区容量已满 / Workspace capacity reached',413);
  const now=new Date().toISOString(),response={revision:row.revision+1,after:result.after,replayed:false};
  const snapshot=JSON.stringify({command:encoded,before:result.before,after:result.after,result:response});
  const update=env.DB.prepare('UPDATE memora_workspace SET payload=?,revision=revision+1,updated=? WHERE owner=? AND revision=?').bind(value,now,owner,row.revision);
  const audit=env.DB.prepare('INSERT INTO memora_audit(id,owner,memory_id,action,snapshot,created) SELECT ?,?,?,?,?,? WHERE changes()=1').bind(body.requestId,owner,String(body.payload?.customerId||body.payload?.id||'workspace'),'crm.'+body.action,snapshot,now);
  const results=await env.DB.batch([update,audit]);if(!results[0].meta.changes)return fail('版本冲突，请重新读取 / Revision conflict',409);
  return {body:response};
}
