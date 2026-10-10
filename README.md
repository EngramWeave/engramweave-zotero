# EngramWeave Zotero

在 Zotero PDF 阅读时，将你选中的段落、高亮和批注保存为独立的 EngramWeave Source。正文保留选段，评论保留在 Annotation；论文和页面链接用于回看原材料。后续修改 Zotero 高亮不会同步改写已提交的 Source。

## 安装与连接

当前支持 Windows、本机 Zotero 10.0.x 和 PDF 阅读器。先启动 EngramWeave Core；Desktop 可以关闭。模型与 Analysis Profile 在 Desktop 配置，插件只选择已有 Profile。

开发构建需要相邻的 `engramweave` 仓库及 Node.js 24：

```powershell
cd ../engramweave
npm ci
npm run build
cd ../engramweave-zotero
npm ci
npm run build
```

在 Zotero 的 Tools → Plugins 中选择 Install Plugin From File，安装 `dist/engramweave-zotero.xpi`。这一版手动更新。Zotero 要求 manifest 提供更新地址；包中使用保留的 `.invalid` 地址，不提供在线自动更新。

打开 Tools → EngramWeave connection，或 Settings → EngramWeave。默认连接配置位于 `%LOCALAPPDATA%/EngramWeave/p1/config.json`；自定义配置填写其绝对路径并执行 Save and test。插件显示实际 Vault，仅保存配置路径，不保存 Core token 或模型密钥。

如果 Desktop 通过 `ENGRAMWEAVE_CONFIG` 使用自定义配置，Zotero 也须选择同一个 `config.json`；插件不会扫描历史测试配置或猜测 Vault。找不到配置时显示具体路径，修改设置后可回到当前 Capture 窗口点击 Retry connection，所选内容保留。已确认的冻结请求仍绑定原目标，设置切换不能将其重定向到另一个 Vault。

## 采集

1. 在 PDF 选中文字，点击弹层中的 Capture to EngramWeave；也可在阅读器选中多个高亮／批注后，通过右键菜单执行同名命令。
2. 查看所选内容和位置，填写标题、额外 Annotation，并选择 Analysis Profile 或 Desktop default。
3. 点击 Save Source，确认路径及保存回执。随后通过 Desktop Refresh workspace 登记，或由已有 Core processing round 登记和处理。采集动作自身不调用模型。

每次主动采集生成新的 `20_Sources/Paper/YYYY-MM/<UUID>.md`，同一论文的不同提交保持独立。只含评论的选择可以保存；没有文字和评论的图片／墨迹标注需明确从选择中移除，插件不会悄悄忽略。一次最多选择 100 项，总大小沿用 Core Source 限额；超限不截断。群组库保留 group 身份，页面链接使用物理页而显示原页码标签。

失败时保留当前窗口输入。首次确认后路径、时间、内容和 Profile 冻结，Retry same Source 复用同一请求，不重新读取高亮或创建第二份 Source。Core 切换 Vault 时拒绝重定向。若响应丢失，文件可能已经保存，重试或检查原路径；可以 Copy Source Markdown 导出，但复制不代表已投递。关闭窗口或退出 Zotero 后不提供自动恢复和后台投递。

EPUB、网页快照、整篇 PDF 提取、OCR 和跨论文合并不在本版范围。PDF 和书目仍由 Zotero 管理，插件不复制 PDF、不读取未选高亮、不修改 Zotero 原材料。源码边界见 [CONTEXT.md](CONTEXT.md)。

## 验证

```powershell
npm run typecheck
npm test
npm run build
```

测试保护选材范围、原字符、Annotation 分离、位置身份、目标 Vault 和冻结重试。Reader 菜单回调先取得选材快照，再由独立宿主任务打开窗口或提示，停用插件时取消尚未打开的任务。原生检查应使用独立 Zotero profile、数据目录和 Vault，关闭自动同步；检查文字选择与多选高亮两个入口、评论与 Profile、离线重试、重复采集产生独立文件、后续高亮编辑不改变 Source、Open in Obsidian 和 Desktop Open in Zotero。高亮入口必须覆盖 Reader 内容窗口自己的任务触发内部菜单命令，不能只从 privileged 测试脚本调用 handler 或原生菜单 doCommand，后者会漏掉窗口调用权限问题。真实模型验证由 Core 的显式 processing round 执行，模拟 Reader 输入与真实人工点击应分别记录。

实现依据：[Zotero 插件生命周期与 Reader events](https://www.zotero.org/support/dev/zotero_7_for_developers)、[官方 Reader 实现](https://github.com/zotero/zotero/blob/main/chrome/content/zotero/xpcom/reader.js)。
