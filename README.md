# MEMORA V3.0

通用小团队业务工作区：客户、活动、任务、报价、发票、人工收款、服务、经营记忆和附件。中文优先，保留英文功能。演示与真实业务工作区独立保存。

发布和验收说明见 [V3 最终报告](docs/V3_FINAL_REPORT_ZH.md)，[工作日志](docs/V3_WORKLOG.md)，[50 组多轮测试](docs/evaluations/v3-team/README.md)。


现有演示站：https://memora-dealer-demo.museycyk.chatgpt.site/?lang=zh#assistant

公司官网：https://trymemora.ca 。公司首页的 CRM 按钮进入已连接 AI 的演示站；`demo.html` 保留独立离线演示。

默认中文，可切换 English。近12个月300条虚构客户记录、18辆当前库存、历史成交与沟通记录关联。旧浏览器修改保留，重置演示数据后使用新版种子。

## 本轮移植

自然聊天及多轮查询、商业/财务/获客按需提示、按代码计算的金额与图表；独立 Dashboard 日期范围与三图；手机聊天布局；语音转写后编辑再提交；六位客户编号及成交CSV导出。

通过 Sites 部署的 Worker 使用服务器 `OPENAI_API_KEY`，默认 `gpt-6-sol`，可用 `OPENAI_MODEL` 调整。已有线上密钥复用，代码不含密钥。音频转写模型为 `gpt-4o-mini-transcribe`。

D1 通过 `DB` 绑定保存工作区和对话，按 Sites 用户隔离。经营记忆提出后待确认，确认才用于后续回答；修改须重新确认，撤销不再检索，审计保留。没有团队共享角色系统。

GitHub Pages 不运行服务器 API，离线页面明确标注，并提供已连接演示入口；保持现有域名和邮件配置。

## 开发

`npm run build` 生成单文件 Worker；`npm test` 执行计算、SQL权限隔离、记忆生命周期、录音格式和界面脚本测试。

- `web/index.html`：原有 CRM 页面和种子。
- `web/upgrade.js` / `web/upgrade.css`：移植后的交互与手机界面。
- `worker/api.mjs`：Responses API、只读查询、结构化录入和语音转写。
- `worker/storage.mjs`：用户隔离、版本冲突和记忆审计。
- `drizzle/`：D1 schema-only 迁移；运行时不建表。
- [移植工作日志](docs/MEMORA_SCULP_PORT_2026-10-16.md)。

成交收入不等于到账；车辆毛利只扣购入成本，不是净利润。虚构演示不提供市场估值或可靠成交预测。

## V3 release candidate

New source surfaces: `#pipeline`, `#tasks`, `#workflows`, `#quality` and enhanced customer timeline. AI can propose customer updates and internal tasks; the separate confirm button performs a canonical, version-checked server command. Workflows currently run on explicit confirmation and create internal tasks only. The application is still a fictional, owner-private demo; team roles and unattended scheduling are not implemented. See [benchmark and status](docs/V3_BENCHMARK.md).
