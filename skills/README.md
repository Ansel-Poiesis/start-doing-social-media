# 内置 skills

这是项目自带的六份工作流协议。克隆完整仓库后，让支持文件读取的协作工具读取指定 SKILL.md 即可；不需要 API Key，也不自动安装到个人技能根。保留整个仓库路径，单独复制一个文件会丢失知识引用。

| 当前任务 | Skill | 交付物 |
| --- | --- | --- |
| 梳理自己能持续提供什么 | [creator-profile](creator-profile/SKILL.md) | 经本人核对的档案草案 |
| 比较平台、调查垂域 | [platform-research](platform-research/SKILL.md) | 来源账本、研究简报、候选与代价 |
| 选择下一条做什么 | [topic-planning](topic-planning/SKILL.md) | 选题卡、事前预测 |
| 交接图文或视频制作 | [production-brief](production-brief/SKILL.md) | 制作单、素材和事实清单 |
| 成品准备发布 | [publication-review](publication-review/SKILL.md) | 逐平台审核和发布交接单 |
| 复盘并更新下一条 | [content-retrospective](content-retrospective/SKILL.md) | 观察记录、归因边界、改动提案 |

使用示例：“读取 skills/topic-planning/SKILL.md，依据我提供的研究简报生成三个选题候选；缺少的事实写未知。”

每个目录包含 SKILL.md 和 assets/template.md。清单由 [manifest.json](manifest.json) 管理，共同约定见 [PROTOCOL.md](PROTOCOL.md)。内容依据仍在文章与配套协议中；skill 不复制过期的平台门槛。

可以从任意阶段进入。缺少上游材料时先缩小判断，不能强迫每次完成六阶段。运行 `node scripts/read-article.mjs --list` 查文章 ID，或 `node scripts/read-article.mjs profile` 导出正文供阅读。完整交接演示见 [synthetic-workflow.md](examples/synthetic-workflow.md)。
