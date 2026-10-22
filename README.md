# MEMORA V3.0

通用小团队业务工作区：客户、活动、任务、报价、发票、人工收款、服务、经营记忆和附件。中文优先，保留英文功能。演示与真实业务工作区独立保存。

发布和验收说明见 [V3 最终报告](docs/V3_FINAL_REPORT_ZH.md)，[工作日志](docs/V3_WORKLOG.md)，[50 组多轮测试](docs/evaluations/v3-team/README.md)。


现有演示站：https://memora-dealer-demo.museycyk.chatgpt.site/?lang=zh#assistant

公司官网：https://trymemora.ca 。公司首页的 CRM 按钮进入已连接 AI 的演示站；`demo.html` 保留独立离线演示。

默认中文，可切换 English。近12个月300条虚构客户记录、18辆当前库存、历史成交与沟通记录关联。旧浏览器修改保留，重置演示数据后使用新版种子。

## 当前功能与验收状态

核对日期：2026-10-22。当前 main 已包含 [V3 功能 PR #2](https://github.com/2ez4jz/memora/pull/2)；下方历史记录不代表当前功能缺失。功能实现、自动化验证和真人验收分别列示：

| 范围 | 已实现 | 已有自动化测试 / 发布证据 | 仍需真人验收或启用条件 |
|---|---|---|---|
| 团队权限 | 所有者、管理员（`manager`）、员工、只读成员；客户分配、成员停用与角色版本校验 | 合成身份的数据库权限矩阵与浏览器检查通过 | 真实同事首次登录、网站访问授权、加入审核及角色分配待验收；站点访问与工作区角色是两层权限，既有发布记录的站点仍仅所有者可访问 |
| 工作区隔离 | 演示与真实业务工作区独立；新业务工作区从空白开始 | 零演示客户 / 成交及跨工作区隔离测试通过 | 真实账户与不同设备使用待验收 |
| 内部后台任务 | 到期检查、每日摘要、防重复、持久队列、租约恢复、延迟重试及最终失败后手动重试 | 数据库与浏览器通过；受保护后台入口执行及持久回读通过 | 仅处理所有者明确启用自动化的工作区；真实跨天使用待验收，不自动对外发送 |
| 业务与财务 | 客户、活动、报价、发票、人工收款与服务记录关联；金额、版本和状态校验 | 业务与浏览器流程通过，包括 113.00 开票、30.00 人工收款、83.00 未结 | 人工收款记录不代表银行到账或对账 |
| 经营记忆与附件 | 个人 / 团队记忆确认与审计；私密图片、PDF、录音及权限校验 | 持久生命周期、存储适配与浏览器测试通过 | 真实跨天记忆、生产真实用户上传、实体手机麦克风授权与拍摄待验收 |

以上是既有测试记录，非本次重新执行：V3 发布时本地 56 项、浏览器 40 项扩展断言通过；[CI 运行 38970388624](https://github.com/2ez4jz/memora/actions/runs/38970388624) 成功。[50 组两轮模型测试](docs/evaluations/v3-team/README.md)最终通过 100/100 个定义检查项，使用固定虚构数据，不代表人工自然度评分或生产真人权限验收。后续 [CSV 更新](docs/CSV_IMPORT_UPDATE.md)记录本地 60 项通过、网站第 9 版发布，详见[发布证据](docs/evaluations/csv-import-release.json)；V3 最终报告中的第 8 版是当次发布记录。

[后台回读证据](docs/evaluations/v3-schedule-readback.json)记录于 2026-10-16：执行和持久回读成功，但当次 `checked: 0`，未处理任何已启用工作区；不能据此认定真实业务跨天验收已完成，也不代表 10 月 22 日的实时调度状态。运行边界见[后台运行说明](docs/AUTOMATION_RUNBOOK.md)。

**未启用或未完成：** 对外消息发送、银行扣款与退款未启用；每家客户的一键独立部署尚未完成。完整可视化流程编排、外部日历 / 通信集成、银行对账、附件病毒扫描和批量导入撤销不在当前已验证能力内。完整状态见 [V3 最终报告](docs/V3_FINAL_REPORT_ZH.md)。

## 历史记录：2026-10-16 初始移植（团队版之前）

本节记录初始个人工作区移植；后续团队权限、业务流程和后台队列已由 V3 功能 PR #2 扩展，当前能力以上表为准。

自然聊天及多轮查询、商业/财务/获客按需提示、按代码计算的金额与图表；独立 Dashboard 日期范围与三图；手机聊天布局；语音转写后编辑再提交；六位客户编号及成交CSV导出。

通过 Sites 部署的 Worker 使用服务器 `OPENAI_API_KEY`，默认 `gpt-6-sol`，可用 `OPENAI_MODEL` 调整。已有线上密钥复用，代码不含密钥。音频转写模型为 `gpt-4o-mini-transcribe`。

当时 D1 通过 `DB` 绑定保存个人工作区和对话，按 Sites 用户隔离。经营记忆提出后待确认，确认才用于后续回答；修改须重新确认，撤销不再检索，审计保留。该阶段尚无团队共享角色；当前团队版已实现，见上表。

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

## 历史记录：V3 release candidate（PR #1 / 网站第 7 版）

This paragraph records the earlier candidate before PR #2, not the current release. New source surfaces at that stage: `#pipeline`, `#tasks`, `#workflows`, `#quality` and enhanced customer timeline. AI can propose customer updates and internal tasks; the separate confirm button performs a canonical, version-checked server command. At that stage, workflows required explicit confirmation and created internal tasks only; the application was a fictional, owner-private demo without team roles or unattended scheduling. PR #2 subsequently added team roles, separate business workspaces and durable internal background jobs with explicit workspace opt-in. External messaging and bank operations remain disabled; real-user, physical-device and cross-day acceptance remain pending. See the current status above and [V3 final report](docs/V3_FINAL_REPORT_ZH.md); [benchmark notes](docs/V3_BENCHMARK.md) retain the development context.
