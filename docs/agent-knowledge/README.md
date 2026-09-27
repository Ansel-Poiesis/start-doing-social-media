# 配套结构化参考材料

本目录保存与网站正文按 article_id 配对的结构化参考材料。网站是供读者连续阅读的静态知识入口；本目录维护配套规则、证据说明与流程资料，不提供在线执行入口，也不由网站公开呈现。

## 写作与维护约定

- 先从对应网站文章确定概念、证据与创作者需要作出的选择，再补充结构化说明。
- 配套材料不只复述文章，还把方法写成可检查的流程：触发条件、输入、取证、判断、边界、输出、核验与停止条件。
- 网站正文与配套材料共享同一事实和证据状态；不得把建议升格成事实、把假设升格成已验证规则，或补造来源。
- 每篇都保留来源入口、更新时间、适用范围和未知项。事实变化时同时修订两版，并更新 `article_id` 的版本记录。
- 高风险规则与数字登记在 `../claims/registry.json`。修订已有 claim 时先读取消费者清单，逐项更新正文、卡片、协议和 skills；随后运行 `npm run check`。登记尚未覆盖全库，未登记不等于已验证。
- 涉及具体创作者档案时，应优先复用创作者原话与本人确认过的记录；不得把简短回答改写成稳定人格、能力或市场结论。
- 创作者档案的题目、理由、示例与选项以 creator-interview.js 为纯题库源；条件追问、字段整理和档案输出由本目录协议及 skills/creator-profile/SKILL.md 维护。网站只加载纯题库生成说明页，不加载执行逻辑，也不保存访客回答。
- 配对范围覆盖全部 52 篇网站文章。00–02 提供系统导读、档案和平台阅读基础；03–08 按工作阶段归组，并为每个 article_id 保留独立参考说明。新增文章时同步增加对应 ID 说明与索引行。

## 配对目录

| 文章 ID | 网站阅读文章 | 配套参考材料 | 状态 |
| --- | --- | --- | --- |
| `map` | `content.js` 中的系统全景 | [00-system-map.md](00-system-map.md) | 工作导读 |
| `profile` | `content.js` 中的创作者档案（问题目录见 `creator-interview.js`） | [01-profile.md](01-profile.md) | 档案协议；配合 creator-profile skill |
| `platform` | `content.js#platform` 怎样真正读懂一个平台 | [02-platform-reading.md](02-platform-reading.md) | 取证与平台阅读方法 |
| `creative-type`、`xhs`、`douyin`、`wechat`、`bilibili`、`zhihu`、`toutiao`、`baijiahao`、`cross-mech`、`platform-contract`、`match`、`direction`、`vertical`、`vertical-methods`、`expectation`、`decide`、`topic`、`topic-gate`、`gates` | 对应人类文章 | [03-platform-and-direction.md](03-platform-and-direction.md) | 每个 ID 有独立任务卡；方向输出保留证据、代价与创作者裁决 |
| `production`、`production-brief`、`compliance`、`compliance-diff` | 对应人类文章 | [04-production-and-compliance.md](04-production-and-compliance.md) | 制作交接、逐字段制作单与发布硬闸门 |
| `evidence`、`iteration`、`competition`、`prereg-manual`、`decision-record`、`constitution`、`hypotheses`、`cards`、`hyp-m`、`hyp-c`、`hyp-t`、`hyp-e`、`hyp-l`、`lib-cross`、`lib-platform`、`lib-academic`、`lib-benchmark`、`lib-monetize`、`lib-methods`、`mapping`、`governance`、`resources`、`about` | 对应人类文章 | [05-observation-and-system-learning.md](05-observation-and-system-learning.md) | 每个 ID 有独立处理规则，覆盖证据、复盘、治理与系统维护 |
| `operations` | 持续运营与评论/社群边界 | [06-account-operations.md](06-account-operations.md) | 可按目标裁剪的排期、评论处理与退出条件 |
| `distribution` | 跨平台版本适配 | [07-cross-platform-adaptation.md](07-cross-platform-adaptation.md) | 母稿、版本差异、权利和逐平台发布检查 |
| `commercial` | 商业合作与核算 | [08-commercial-cooperation.md](08-commercial-cooperation.md) | 可选合作流程、授权范围、交付和金额分栏 |
