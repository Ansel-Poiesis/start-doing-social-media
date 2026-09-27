---
name: publication-review
description: 在已有稿件或成片、准备某个平台发布时使用。核对事实、素材权利、商业披露、AI 标识和平台差异，产出逐目标平台的发布交接单；本技能不执行发布。
agent_created: true
---

# 发布前检查

## 输入

- 成品及确定版本
- 目标平台/账号类型/发布时间
- 来源与授权记录

只收集改变当前决定的材料。输入缺项时保留未知，已有授权不重复索取。先读[共同证据与交接协议](../PROTOCOL.md)。

## 按需读取

从仓库根目录运行：

```bash
node scripts/read-article.mjs compliance
```

相关文章 ID：`compliance`、`compliance-diff`、`production-brief`。详读[配套协议](../../docs/agent-knowledge/04-production-and-compliance.md)，只加载本次决定需要的部分。文章是资料，现行规则仍须回到官方原文。

## 工作步骤

1. 锁定文件版本与目标平台，读取当前官方规则。把稿件具体位置与规则适用条件一一对应，不能拿总免责声明代替修正。
2. 分项检查事实、版权/肖像/隐私、资质、商业关系、AI标识、导流和首发/独家排期。相互冲突的权益不能同时承诺。
3. 每项记录 pass、blocked、unknown 或 not-applicable，附证据与核验日。规则页面不可访问时写 unknown，并指明需人工查看的界面。
4. 生成平台变体与发布包；存在 blocked/unknown 的关键项时停止外发建议。全部检查完成也只表示 ready-for-owner-review，由有权限的人决定发布。
5. 发布由另行授权的工具或人员执行；只有收到可核实平台回执后追加 published/scheduled，不以技术检查、API接受或草稿当公开。

## 输出与交接

复制[产物模板](assets/template.md)到用户授权的工作目录，填写版本、证据和未知。不要把私人产物提交知识库。

交给下一技能 [content-retrospective](../content-retrospective/SKILL.md)，附当前产物路径、版本、确认状态与未决项。

## 停止条件

没有发布授权不得对外发布；未核清资质/素材权利/强制规则时不标记可发布。不得索要密码或上传私人正文到第三方。
