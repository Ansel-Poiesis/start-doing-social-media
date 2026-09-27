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

## TASK-49：M29、C2、D17 与 AC-16 的更正传播

日期：2026-09-27。对应任务：TASK-49。与 TASK-10.17 的裁决一致，修订消费者正文并在 registry 中补充逐篇标记：

| 裁决 | 关键消费者 | 处理 |
| --- | --- | --- |
| M29/L14 | cross-mech.searchfeed/types、xhs.position/papers、douyin.position/searchfeed/seo、wechat.position、platform-contract.howto、hyp-m.m3、hyp-l.l2 | 不作跨平台画像或排序推断；搜索与推荐分别记录，并链接到假设裁决。 |
| C2 | vertical.demand、vertical-methods.m-comments、hyp-c.c1 | 评论、重复表达、搜索热度均为带偏差的候选线索；移除固定评论样本数和结论门槛。 |
| AC-16 | wechat.typology、cross-mech.types、lib-academic.china，及平台导读 | 保留“等待直接来源”的状态，撤回关系链二级传播因果背书和固定平台分型。 |
| D17 | cross-mech.types、wechat.typology、topic-gate.q1 | 不把点赞/收藏/评论/分享映射为唯一意图，不预设主指标，也不由审美风格推断下沉。 |
| 百家号 | baijiahao.change | 标题不再写未证实迁移日期；2026-05-26 仅是官方公告日期，App 改名仍标为待核二手报道。 |

`check-claims.mjs` 现检查代表性消费者不重新出现已撤回措辞，检查 C2 评论方法没有固定数量门槛，并校验百家号公告日期、二手报道状态和必要消费者映射。它能阻止本次遗漏形态回流，不代替后续来源复核或人工全文审读。

## 本批覆盖边界

截至 2026-09-27 TASK-49 更新，登记包含 21 条优先主张，并覆盖正文、卡片、协议和 skills 的 142 个消费者声明。范围来自首批 P0 修订与本次 M29/C2/D17/AC-16 传播修正；registry.coverage.complete 仍为 false，尚未逐条迁入 49 篇全部平台数字、98 条假设及 95 张研究卡。npm 检查证明登记路径和声明消费者没有断链，不证明来源判断已经独立验证，也不证明内容方法有效。
