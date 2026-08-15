# deepseek-harness-background

给 DeepSeek Harness（`dsh`）本地网页端换自定义背景图 + 实时透明度滑块 + 深色锁定 + 自动注入设置页。

> 直接改的是 dsh 网页前端（`node_modules/@deepseek-ai/dsh-web-frontend/dist/`），所以效果"丝滑"但**升级即丢**——本仓库就是用来在每次重装/更新后快速复现那套魔改的。

---

## 它能做什么

- 把任意图片铺成 dsh 网页端背景（侧边栏、面板、输入框等都半透明化，照片透出来）
- 右下角浮动「背景设置」面板：**不透明度滑块（0~92%）+ 显示背景图开关 + 深色模式开关 + 收起键**
- 偏好全部存 `localStorage`，刷新不丢
- `MutationObserver` 锁定深色模式（dsh preview 版深色调开关不持久，会被服务端偷偷弹回浅色）
- 打开设置页时，面板自动"塞进"原生设置视图（Appearance / 外观 / Preferences），关掉则退回右下角兜底

---

## 文件清单

| 文件 | 作用 |
| --- | --- |
| `SKILL.md` | WorkBuddy skill 主文档（何时加载、原理、步骤、踩坑） |
| `references/star-bg-inject.css` | 追加到 dsh 前端 `index-*.css` 末尾的 CSS 块 |
| `references/star-bg-inject.js` | 注入 dsh 前端 `index.html` 内联 `<script>` 的完整脚本 |

---

## 用法一：作为 WorkBuddy skill（推荐）

把整个仓库放进 WorkBuddy 的 skills 目录即可被自动识别：

```bash
# 用户级（全项目可用）
cp -r deepseek-harness-background ~/.workbuddy/skills/dsh-web-background
```

之后在 WorkBuddy 里说"给 dsh 换背景 / 加透明度滑块"，即可触发本 skill。

---

## 用法二：手动应用到 dsh

前置：dsh 已本地安装并能起 Web UI（`dsh web`，默认 `http://127.0.0.1:3080`）。

### 1. 放背景图

把你的图（建议 JPG）改名成 **ASCII 文件名**（中文/空格在 `url()` 里会被编码搞挂），复制到：

```
node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/star-bg.jpg
```

### 2. 追加 CSS

找到 `dist/assets/index-*.css`（哈希名，每次 `npm update` 会变），**先备份**再在末尾追加 `references/star-bg-inject.css` 的内容：

```bash
cp dist/assets/index-*.css dist/assets/index-*.css.bak
cat references/star-bg-inject.css >> dist/assets/index-*.css
```

### 3. 注入脚本

在 `dist/index.html` 的 `</body>` 前注入 `references/star-bg-inject.js` 整段（先备份 `index.html.bak`）。

注入后校验 JS 合法：

```bash
node -e "new Function(require('fs').readFileSync('dist/index.html','utf8').match(/<script>([\s\S]*)<\/script>\s*<\/body>/)[1])"
```

### 4. 本地验证

起 dsh Web UI → 浏览器 **`Ctrl+Shift+R` 硬刷**（必须，普通刷新吃缓存）。看右下角是否出现「背景设置」面板，拖滑块背景是否实时变透，切深色是否被锁住。

---

## 还原

```bash
cp dist/assets/index-*.css.bak dist/assets/index-*.css
cp dist/index.html.bak dist/index.html
# 删除 dist/assets/star-bg.jpg（可选）
```

---

## 已知坑

1. **背景图太实像纯白底**：别写死高不透明度，用 `--star-alpha` 变量驱动、默认 `0.45`。
2. **深色自动跳浅色**：不是 CSS 问题，是 dsh preview 版深色持久化不牢，用 `MutationObserver` 强制锁。
3. **设置页无稳定锚点**：设置页是 minified React SPA，class 哈希生成。别找固定 DOM 节点，改用"标题文本命中 → 向上爬 3 层父节点"的启发式（见脚本 `findSettingsAnchor`）。
4. **中文/空格文件名**：`url()` 里会编码失败，背景图一律 ASCII 名。
5. **升级即丢**：改的是 `node_modules` + `dist/index.html`，`npm update` / 重装会覆盖，需按上面步骤重做；还原用 `.bak`。
6. **桌面端不推荐改**：`anywhere-labs/deepseek-harness-desktop` 打包自己那份 dsh 前端（可能在 Electron asar 里），配置目录也不读 `~/.dsh`，且自动更新会冲掉改动。

---

## License

MIT
