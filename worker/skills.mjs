// Adapted from SCULPY's reviewed business / finance / growth guidance.
export function selectSkills(question,history=[]){
 const text=question+' '+(history.at(-1)?.text||'');
 const skills={
 business:['经营|分析|库存|滞销|比较|建议|定价|预算|business|analy|inventory|compare|pricing|budget', '先查记录，再区分事实、可能解释和建议。客户预算、询问次数和销售阶段只是信号，不是购买力证明或成交概率。比较必须同口径、同期间；未记录的工时和供给不能推断利用率。'],
 finance:['财务|收入|利润|成本|现金|成交额|refund|revenue|profit|cost|finance', '成交收入按成交日期；车辆毛利=成交价减该笔车辆购入成本，不含整备、工资、佣金、租金、税费。没有收付款与退款流水，不能称到账、净收入或净利润。平均值用有效金额样本数，不合计平均数，不把空值当零。'],
 growth:['获客|渠道|投放|转化|广告|ROI|CAC|channel|marketing|conversion|acquisition', '区分线索、阶段分布和真正转化率；后者需同一批线索和观察窗口。没有渠道花费不能算CAC/ROI。提出可执行的小实验及衡量方法，不编造外部广告价格，不发送消息或启动广告。']};
 return Object.entries(skills).filter(([,s])=>new RegExp(s[0],'i').test(text)).map(([name,s])=>({name,content:s[1]}));
}
