---
title: "dsh Web UI 背景与透明度定制"
summary: "给 DeepSeek Harness (dsh) 网页端换背景图 + 实时透明度滑块 + 深色锁定 + 注入设置页。含可直接复用的 CSS 注入块与 index.html 注入脚本，覆盖 dsh 主题变量、深色持久化失效、minified 设置页无锚点等坑。"
agent_created: true
read_when:
  - 用户要改 dsh 网页端背景图
  - 用户要在 dsh 里加背景透明度 / 不透明度调节滑块
  - dsh Web UI 外观定制、背景图不显示、切深色自动跳浅色
---

# dsh Web UI 背景与透明度定制

## 适用场景

- 给 DeepSeek Harness (`dsh`) 本地网页端（`http://127.0.0.1:3080`）换自定义背景图
- 加一个实时调透明度的滑块（不透明度 0~92%）
- 锁定深色模式（preview 版深色调开关不持久，会被服务端重写回浅色）
- 把控制面板自动"塞进"原生设置页（Appearance/外观）

## 原理

dsh 的网页前端是标准打包产物，主题颜色**全部走 CSS 变量** `--dsw-alias-bg-*` / `--dsw-specific-*`，深色态由 `<body data-ds-dark-theme>` 决定。改这俩东西就能换肤。前端文件在：

```
node_modules/@deepseek-ai/dsh-web-frontend/dist/
├── index.html              # 注入控制面板 <script>
└── assets/
    ├── index-<hash>.css     # 追加 --star-alpha 驱动的规则（hash 名每次构建不同）
    └── star-bg.jpg          # 背景图（用 ASCII 文件名，规避中文/空格 URL 编码）
```

做法两步：① 往 `index-*.css` **追加**一段 CSS（背景图 + 用 `--star-alpha` 变量驱动半透明）；② 往 `index.html` 的 `</body>` 前**注入**一个内联 `<script>`（生成滑块面板、读 localStorage、MutationObserver 锁深色、设置页注入）。

## 前置条件

- dsh 已本地安装并能起 Web UI（见 `dsh-openai-compatible-provider` skill）
- 背景图一张（建议 JPG，文件名改成 ASCII，如 `star-bg.jpg`）
- 沙箱通常起不了 dsh，**最终验证需用户在本地双击启动器 + `Ctrl+Shift+R` 硬刷**

## 核心步骤

### 1. 放背景图

把图复制到 `dist/assets/star-bg.jpg`（覆盖 CSS 里 `url("/assets/star-bg.jpg")` 引用的路径）。**务必 ASCII 文件名**——中文/空格在 `url()` 里会被编码搞挂。

### 2. 追加 CSS

找到 `dist/assets/index-*.css`（哈希文件名，每次 `npm update` 会变），在**原文件末尾追加** `references/star-bg-inject.css` 的内容。备份原文件为 `index-*.css.bak` 以便还原/重做。

关键点：
- `:root { --star-alpha: 0.45; --star-rgb: 249,250,251; }` 默认浅色半透明 45%
- `body[data-ds-dark-theme] { --star-rgb: 27,27,28; }` 深色用深灰底
- 用 `rgba(var(--star-rgb), var(--star-alpha))` 覆盖所有 `--dsw-alias-bg-*` / `--dsw-specific-*` 变量（浅色块和深色块各一份）
- `body.star-off { background-image: none !important; }` 供"关闭背景图"开关用

### 3. 注入 index.html 脚本

在 `dist/index.html` 的 `</body>` 前注入 `references/star-bg-inject.js` 整段（先备份 `index.html.bak`）。脚本职责：
- 右下角浮动「背景设置」面板：range 滑块（控制 `--star-alpha`）+ 显示背景图开关 + 深色模式开关 + `×` 关闭键（收起留 `⚙` 浮钮）
- 全部偏好存 `localStorage`（`dshStarAlpha` / `dshStarOn` / `dshStarTheme` / `dshStarCollapse`）
- `MutationObserver` 监听 `body[data-ds-dark-theme]`，dsh 偷偷改回浅色时立即掰回用户选择（**解决 preview 版深色不持久**）
- `findSettingsAnchor()` 扫描设置页标题（Appearance/外观/设置/Preferences），打开设置时把面板**注入设置视图**；关闭设置退回右下角兜底

注入后务必校验 JS 合法：`node -e "new Function(require('fs').readFileSync('dist/index.html','utf8').match(/<script>([\s\S]*)<\/script>\s*<\/body>/)[1])"` 或抽脚本存 `.js` 用 `node --check`。

### 4. 本地验证

起 dsh Web UI → 浏览器 `Ctrl+Shift+R` 硬刷（必须，普通刷新会吃缓存）。看右下角是否出现「背景设置」面板，拖滑块背景是否实时变透，切深色是否被锁住。

## 常见坑（按踩坑顺序）

1. **背景图太实像纯白底**：第一版写死 `rgba(...,0.78)` 白雾盖死照片。正确做法是用 `--star-alpha` 变量驱动、默认 0.45、让用户拖。
2. **深色自动跳浅色**：dsh 默认主题偏好 `system`，preview 版深色 durable 持久化不牢，SPA 重挂载按默认值弹回浅色。**不是 CSS 问题**，用 `MutationObserver` 强制锁。
3. **设置页无稳定锚点**：设置页是 minified React SPA，class 是哈希生成（如 `_boot_9gj4p_6`），role 都被压成单字母。**别找稳定 DOM 节点**，改用"标题文本命中 → 向上爬 3 层父节点作容器 → 插到首位"的启发式。若落点偏高/不对，调 `findSettingsAnchor` 的 `heads` 列表或爬升层数。
4. **中文/空格文件名**：`url()` 里会编码失败，背景图一律 ASCII 名。
5. **升级即丢**：改的是 `node_modules` + `dist/index.html`，`npm update` 或直接重装会覆盖。每次升级后按上面步骤重做；还原用 `.bak`。
6. **沙箱起不了 dsh**：渲染验证只能用户本地做。
7. **桌面端 (anywhere-labs/deepseek-harness-desktop) 不推荐改**：它打包自己那份 dsh + 前端（可能在 Electron asar 里），配置目录也不读 `~/.dsh`，且自动更新会冲掉改动。轻量用户维持本地方案即可。

## 还原

```bash
cp dist/assets/index-*.css.bak dist/assets/index-*.css
cp dist/index.html.bak dist/index.html
# 删除 dist/assets/star-bg.jpg（可选）
```

## 文件清单（本 skill 附带）

- `references/star-bg-inject.css` — 追加到 `index-*.css` 的 CSS 块
- `references/star-bg-inject.js` — 注入 `index.html` 的脚本
