# 开始做自媒体吧

从创作者档案、平台理解、方向与选题，到制作、发布准备、持续运营和复盘的中文知识库。包含 **52 篇阅读文章、配套证据与工作协议、9 个内置 skills**。

当前版本 **0.11.0**：首个公开维护版本。知识链路已有六阶段入口；平台事实、方法效果和真实贯穿案例仍有缺口，具体见 [逐篇审计](docs/audit/README.md) 与 [开发任务索引](TODO.md)。文章数量和工程检查通过不代表全库事实已验证。

## 开始阅读

需要 Node.js 22 或更高版本，无需安装第三方运行依赖：

```bash
git clone https://github.com/Ansel-Poiesis/start-doing-social-media.git
cd start-doing-social-media
npm start
```

打开 [本地阅读器](http://127.0.0.1:8784/)。阅读器支持主题切换、章节目录、文章锚点和窄屏表格；不接收账号、访谈答案或模型密钥。浏览器可读取文章直接链接的九个 skill、九份空白模板、合成案例和指标审计报告；其余仓库文件不由阅读服务提供。

```bash
npm run check
node scripts/read-article.mjs --list
node scripts/read-article.mjs profile
```

`check` 检查文章/导航、二十问题库、HTTP 白名单与错误处理、技能依赖和全文导出；它不访问平台后台，也不证明文章中的运营方法有效。

## 六个阶段

| 要解决的问题 | 阅读入口 ID | 内置 skill | 产物 |
| --- | --- | --- | --- |
| 我能持续提供什么 | profile、creative-type | [creator-profile](skills/creator-profile/SKILL.md) | 工作档案与关键未知 |
| 观众在哪里、候选方向是否有依据 | platform、match、direction、vertical | [platform-research](skills/platform-research/SKILL.md) | 来源账本、研究简报、方向候选与代价 |
| 下一条做什么 | decide、topic、topic-gate | [topic-planning](skills/topic-planning/SKILL.md) | 选题卡与事前预测 |
| 怎样把承诺做出来 | production、production-brief | [production-brief](skills/production-brief/SKILL.md) | 制作单、素材/事实清单 |
| 成品能否进入发布审核 | compliance、compliance-diff | [publication-review](skills/publication-review/SKILL.md) | 按平台分开的检查与交接 |
| 结果支持改什么 | iteration、competition、decision-record | [content-retrospective](skills/content-retrospective/SKILL.md) | 复盘与下一轮改动 |
| 运营与跨平台合作 | operations、distribution、commercial | [account-operations](skills/account-operations/SKILL.md)、[cross-platform-adaptation](skills/cross-platform-adaptation/SKILL.md)、[commercial-cooperation](skills/commercial-cooperation/SKILL.md) | 可暂停的计划、逐平台版本矩阵、可选合作记录 |

每个 skill 提供触发条件、输入、步骤、模板、停止条件和下一阶段入口。六阶段入口文章会链接对应 skill、空白模板、输入、产物和下一步；方向页、选题页、制作页与复盘页各有合成教学产物及反例。克隆完整仓库后，要求协作工具读取相应 SKILL.md；不需要安装到个人技能目录。运营、跨平台与商业分支的拒绝/暂停示例见[合成案例](skills/examples/operations-distribution-commercial.md)，六阶段贯穿示例见 [synthetic-workflow.md](skills/examples/synthetic-workflow.md)。详细方法见 [skills 说明](skills/README.md)。

## 当前完成度

- **阅读与结构：**六主题、52 篇正文、52 个 article_id 配套协议；运行检查和浏览器核验见 [工程报告](docs/audit/2026-09-27-engineering.md)。
- **可执行方法：**九技能与九模板已建立；教学干跑用于检查交接，不计入真实案例。
- **文章质量：**已逐篇阅读全文并记录五维评价；发现旧来源勘误未同步到消费文章、操作模板缺失与过度确定结论。首发修订和剩余问题单独记录，不能把修订前评分当修订后复审。
- **证据：**G02 的 95 张卡有来源目录，部分仍只到书目/媒体线索；来源定位与主张核验分开记录。平台门槛、费用和 UI 使用前需核当前原文。
- **真实验证：**尚未完成创作者试答与真实作品贯穿链路。没有真实反馈、后台数据或发布回执的环节保持未验证。

## 目录与事实源

- `content*.js`：正文与导航的事实源；`creator-interview.js`：二十问题库。
- `app.js`、`styles.css`、`server.mjs`：静态阅读器。
- `docs/agent-knowledge/`：按 article_id 配套的工作协议。
- `docs/g02-source-*.md`：来源线索与复核记录；`docs/card-registry-mapping.md`：历史研究卡映射。
- `docs/claims/registry.json`：优先高风险主张、来源状态及正文/卡片/协议/skill消费者索引；`npm run check` 会阻断漏传播。当前登记仅覆盖首批P0修订，未宣称全库来源已核实。
- `skills/`：可读取工作流、模板、清单与教学示例。
- `docs/audit/`：逐篇质量、修订证据、工程/技能验证。
- `TODO.md`：维护任务映射与版本路线快照；活跃状态由维护者的 Player Todo 管理。

旧实验引擎、账户配置、私人台账、原始截图和本地运行日志不属于公开项目依赖。外部历史研究的边界见 [UPSTREAM.md](docs/UPSTREAM.md)。

## 参与和版本

通过 GitHub Issue 提出可复查问题，PR 说明影响的文章/技能和来源。协作分工、版本与验收见 [CONTRIBUTING.md](CONTRIBUTING.md)，Agent 入口见 [AGENTS.md](AGENTS.md)。修改一条规则时必须复查所有引用它的正文、卡库、协议和 skill。

发布前运行 `npm run check:release` 扫描 Git 跟踪文件与暂存内容；由维护者复核后发布 tag。版本变化见 [CHANGELOG.md](CHANGELOG.md)。公开仓库不自动等于网站已部署。

## 许可

代码采用 [MIT](LICENSE)；原创文章、题库文字、技能和知识文档采用 [CC BY 4.0](LICENSE-CONTENT.md)。第三方引用保留原权利，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
