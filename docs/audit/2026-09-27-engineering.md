# 阅读器工程核验：2026-09-27

本轮按当前静态阅读器定位修复检查入口和两处运行问题。自动检查通过，实际浏览器验证全部 49 篇导航文章可读取。文章事实、论证质量与真实案例有效性另行评审；本记录不表示这些内容已经完成验收。

## 初始问题与处理依据

| 问题 | 核验依据 | 本轮处理 |
| --- | --- | --- |
| `npm run check` 在 `Unexpected status for profile` 处失败 | 检查要求旧状态“长期档案版本管理施工中”；正文已改为档案框架与二十问说明、真实试答待校准。`creative-type` 也保留了旧状态文本断言。 | 改为验证文章必备字段、二十道题的标题/理由/示例和实际生成结果，避免把编辑状态文案当作接口契约。 |
| 检查依赖预先启动的固定端口服务器 | 原检查向固定地址请求，干净克隆不能直接执行；检查还加载已退役的访谈、Agent 与匹配原型。 | 默认检查只依赖公开阅读器及纯题库。HTTP 测试自行启动随机本地端口并在结束时关闭；历史原型没有接回产品。 |
| 全 CSS 字号至少 16px 的旧检查与当前阅读设计冲突 | 当前正文为 17px，导航、说明文字和图标有意使用 12–15px。 | 保留正文与表格至少 16px、辅助字号至少 12px 的检查；未为通过检查修改当前视觉设计。 |
| “跳转到正文”被解析成不存在的文章 | 链接原来写入 `#main`，hash 路由器会把 `main` 作为文章 ID。 | 拦截该链接的默认跳转，保持文章 URL，直接把键盘焦点和滚动位置移到正文。 |
| 首页和未知文章页面的目录状态清理不完整 | 首页仅隐藏旧目录，未知文章页未设置目录空状态。 | 离开文章时清空目录内容并统一设置空状态。 |
| 畸形 HTTP request target 可在解析阶段抛异常 | `new URL(req.url, ...)` 位于原异常处理范围之外。 | 将 URL 与百分号解码放入同一错误处理范围，返回 400；HTTP 回归验证异常请求后服务仍然响应。 |

## 可复现自动检查

环境：Windows，Node.js `v24.18.0`；检查使用 Node.js 内置模块，无额外运行依赖。

```sh
npm run check
node --check app.js
node --check server.mjs
```

也可分别运行：

```sh
node scripts/check-reader.mjs
node scripts/test-server.mjs
```

结果：

```text
PASS reader: 49 articles, 6 themes, 20 profile questions, internal routes/anchors, reading layout contracts and pure module graph.
PASS server: 74 HTTP requests; 17 public files, GET/HEAD, MIME, methods, private files, traversal and malformed paths.
```

阅读器检查覆盖重复 ID、导航全覆盖、中文主题序号、必需文章、平台长文结构、二十问渲染、内部链接与锚点、来源 URL 格式、正文最低体量、UTF-8、主题与导航结构、字体约束和公开模块依赖图。纯阅读器模块不得引入退役工作台或发送访客数据的接口调用。

HTTP 检查逐一比对 17 个公开文件的实际响应内容，验证 MIME、`nosniff`、缓存策略、GET/HEAD 内容长度与空响应体。项目记录、配置、源码检查脚本、历史执行原型、隐藏文件和参考资料不在静态文件白名单中；POST/PUT/DELETE/OPTIONS 返回 405；路径穿越、无效编码和畸形 URL 均有负向用例。静态服务器的白名单用于网站资源隔离，并不限制 GitHub 仓库中明确公开的文档访问。

## 实际浏览器回归

使用独立临时本地服务和浏览器执行，本轮未依赖已有服务状态。

- 从实际导航读取并打开全部 49 个文章路由；每页存在标题及正文小节，恰有一个当前导航链接，目录链接均指向实际存在的锚点；失败数为 0。
- 在创作者档案页用键盘 Enter 激活“跳转到正文”；URL 保持 `#/profile`，焦点为 `main`，二十个问题仍存在。
- 从文章返回首页后，右侧目录链接数为 0，并处于空状态。
- 打开不存在的路由，显示“没有找到这篇内容”，目录链接数为 0，并处于空状态。
- 本轮捕获的浏览器 warning/error 记录为空。

这次浏览器回归验证路由、目录和键盘跳转。没有重复执行全部宽度、全部主题的逐页面视觉审查，也没有对外部参考链接的可用性、平台规则时效或文章效果作出结论。

## 后续工程事项

- 为浏览器回归建立可复用的自动化入口，覆盖窄屏目录、主题切换、表格滚动和键盘导航；本轮记录不替代持续集成中的真实浏览器测试。
- 当前 `styles.css` 仍有历史工作台样式与多轮覆盖规则，可在保留视觉对照后单独清理。
- 对来源有效性和内容质量采用独立检查与人工评审；文章长度检查只防止正文意外丢失，不能证明质量。

## TASK-10.16 贯穿样例与资源入口复核

2026-09-27，基于 TASK-10.17 的 `17e4bf6`。此处结果是本次复核的新增证据，前文 17 个公开文件/74 个请求是先前版本的历史快照，未覆盖本次扩展。

- 在 profile、platform、direction、decide、topic、production、compliance、iteration 文章增加阶段输入、对应 skill、空白模板、交接物与下一步链接。方向、选题、制作、复盘页增加合成教学产物和反例。
- 六阶段样例统一为“同一扇窗的光线观察”，明确档案未经本人确认、平台与受众未调查、照片缺失导致制作阻断、发布前检查阻断，以及没有回执/数据时复盘为未知。另以隔离的虚构输入演示有计数而无分母时不算比例。
- 将 `direction` 的 skill 归属从 `creator-profile` 更正为 `platform-research`，同步 manifest 和两个 skill 说明。
- HTTP 白名单由 17 项扩至 31 项，新增精确 14 个 Markdown 资源：六个 skill、六份模板、贯穿样例和指标/假设/卡库复核报告。测试仍拒绝其他审计文档、协议、manifest、私人路径和不存在文件；Markdown 响应按 `text/markdown; charset=utf-8` 提供。

自动核验结果：

```text
PASS reader: 49 articles, 6 themes, 20 profile questions, internal routes/anchors, reading layout contracts and pure module graph.
PASS server: 108 HTTP requests; 31 public files, GET/HEAD, MIME, methods, private files, traversal and malformed paths.
Knowledge checks passed: 6 skills, 49 paired articles, readable full-text export.
Claim checks passed: 17 registered claims, 125 declared consumers; missing article/card/protocol/skill propagation is rejected.
PASS release scanner: 17 isolated fixtures; text formats, secret headers, private paths, literal filenames and staged/working differences.
Release scan passed: 83 tracked files; working and index content checked.
git diff --check: passed.
```

文章锚点与页面链接检查覆盖文章模块；逐个 HTTP GET/HEAD 核对 31 个文件的内容、MIME 和响应头。仓库 README、skills README、六阶段示例及 skill 内部相对链接经文件系统解析检查。此处确认的是资源可达和结构交接，不是创作者试用、平台规则核验或内容效果验证；示例中的虚构数值不属于项目观察。

## TASK-10.20 浏览器回归与历史样式清理

在 Node.js v24.18.0、Playwright 1.63.0、Chromium headless 环境中加入可重复的浏览器测试，并在 GitHub Actions 新增独立 Ubuntu job。Playwright 配置自启仓库静态服务器（127.0.0.1:4173），不读取已有服务状态；依赖版本由 `package-lock.json` 固定。现有 Ubuntu/Windows 结构及发布扫描 job 保持不变。

`npm run test:browser` 的 6 个用例全部通过：

- 逐篇直达全部 49 篇文章，标题、当前导航和每页目录锚点匹配正文。
- 首次加载后按 Tab 首先聚焦“跳转到正文”，按 Enter 后正文获得焦点，文章路由不变。此前路由初始化提前把焦点移至正文，实测会跳过此链接；现仅在后续路由变化时移动焦点。
- 首页和未知路由清空本页目录；主题按钮状态、配色变化及本地保存值在重载后保持。
- 390 × 844 视口下，用 `#/map` 的三列表格（4 行）检查浅色和深色主题。滚动容器有可访问名称、Tab 顺序位置和可见焦点；焦点在容器上时按 ArrowRight 可滚到末列，页面本身没有横向溢出。该用例对应键盘可操作及焦点可见的定向检查，不代表整个产品完成 WCAG 审计。依据：[WCAG 2.1.1 Keyboard](https://www.w3.org/WAI/WCAG21/Understanding/keyboard)、[WCAG 2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)、[W3C scrollable content focus rule](https://www.w3.org/WAI/standards-guidelines/act/rules/0ssw9k)。

### 截图对照

使用同一版本 Chromium、主题、本地存储值、视口和路由，在清理前后捕获首页（1440 × 1000，全页）与 `#/map` 长表格（390 × 844，视口）。四组 PNG 的前后 SHA-256 完全相同，说明本次无障碍属性及 CSS 删除没有改变这些阅读画面。图像保留在 `docs/audit/evidence/task-10.20/`：

| 场景 | 清理前 | 清理后 | SHA-256（前后相同） |
| --- | --- | --- | --- |
| 首页浅色 | [PNG](evidence/task-10.20/before-home-light.png) | [PNG](evidence/task-10.20/after-home-light.png) | `ABBBBC0976B92A5405ED82A5D92641CBE8EE204AEADFD97B04FF5C0E74126B95` |
| 首页深色 | [PNG](evidence/task-10.20/before-home-dark.png) | [PNG](evidence/task-10.20/after-home-dark.png) | `08B28C6B6B90D51ADC8093BAE94A57D67E2530216485D9A595716E11E484598C` |
| `#/map` 表格浅色 | [PNG](evidence/task-10.20/before-table-mobile-light.png) | [PNG](evidence/task-10.20/after-table-mobile-light.png) | `C7CB083B2DCF94607CD5D4DF3DC6D4A2C2D7202B5CEB79BEDE8F4559DE1CA04C` |
| `#/map` 表格深色 | [PNG](evidence/task-10.20/before-table-mobile-dark.png) | [PNG](evidence/task-10.20/after-table-mobile-dark.png) | `156BAB1475A03B9CE40CBAAC44AE1E52C077D9047E41E2840E477C7C1CFEF290` |

运行时入口中没有命中的旧样式类已从 `styles.css` 删除：失效面包屑和导航标记、旧访谈/表单、对话、匹配与垂域工作台、输出简报及孤立阅读条目。后续覆盖层中仍服务当前阅读器的设计规则保留。清理基于 `index.html`、`app.js`、`content*.js` 与题库的类名交叉检查；`.question-help`、`.question-example`、`.text-link` 等当前仍用样式保留，最终没有未匹配的类选择器。

本地验证：`npm ci`、`npm run test:browser`（6 passed）、`npm run check`、`npm run check:release`。PR #11 的代码提交 `94cf035` 远端 Actions run [36323714438](https://github.com/Ansel-Poiesis/start-doing-social-media/actions/runs/36323714438) 中 Chromium、Ubuntu 与 Windows 三项均通过。PR 仍开放且未合并；本记录不表示维护者已批准，也不升级 0.11.0 或打 tag。
