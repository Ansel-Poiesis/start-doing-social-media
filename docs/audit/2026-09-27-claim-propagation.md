# 逐主张登记与传播回归记录

日期：2026-09-27。对应任务：TASK-10.14。主张事实源为 docs/claims/registry.json；本记录保存一条可复查的来源不足到多消费者修订路径。

## 示例：B站“48小时晋级 / 7天定型”

审计发现旧稿把社区流传的时间窗写成普遍推荐规则，但没有取得现行官方依据。处理结论是撤回数字门槛，不把“没找到依据”改写成“平台绝不使用该信号”。登记为 BILI-WINDOW-THRESHOLDS-001，状态为 withdrawn_unverified_thresholds，适用范围限定为 B站作品推荐、搜索与长尾观察。

传播清单：

- 阅读文章：bilibili.lifecycle / benchmarks / gov 删除固定晋级窗、7天定型与永久失去长尾资格的断言。
- 平台经验卡：lib-platform.ttblzh 中 BL-01 改为无现行官方依据；lib-monetize.blwx 中 BL-03 同步撤回固定7天和永久处罚推断。
- 配套协议：02-platform-reading 要求来源、时间和账号条件；05-observation-and-system-learning 要求观察窗按问题与数据设计。
- 内置 skills：platform-research 与 content-retrospective 将旧门槛标成不可执行的待证说法。
- 自动检查：上述文章对象、卡片锚点、协议和 skills 均登记同一 claim ID。移除任一消费者的 ID 标记会令 scripts/check-claims.mjs 失败。

来源记录说明：2026-09-27 修订核对没有找到足以支持固定窗口的现行官方来源。正文修订凭据见 docs/audit/2026-09-27-research-fixes.md 中 bilibili/lifecycle 与 TT/BL/ZH 卡片段；登记把来源缺失保留为显式状态，而不是把二手说法提升为事实。

## 本批覆盖边界

登记包含 14 条优先主张，并覆盖正文、卡片、协议和 skills 的 98 个消费者声明。范围来自本轮 P0 修订；registry.coverage.complete 为 false，尚未逐条迁入 49 篇全部平台数字、98 条假设及 95 张研究卡。npm 检查证明登记路径和声明消费者没有断链，不证明来源判断已经独立验证，也不证明内容方法有效。
