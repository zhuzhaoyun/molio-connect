# Molio Web Clipper

> **中文** | [English](README.en.md)

Molio Web Clipper 是 [Molio](https://molio.cn/) 的官方浏览器扩展，用于把网页内容一键保存到 Molio 知识库。

## 安装

👉 [Chrome Web Store 安装](https://chromewebstore.google.com/detail/molio/pjdacbbkjpegfkogoieejajljplngbik?hl=zh-CN&utm_source=ext_sidebar)

## 主要功能

- **一键保存网页**：在任意网页使用快捷键或点击图标，即可把页面内容保存为 Markdown 进入 Molio 知识库
- **高亮标注**：选中文字即可高亮，保存后自动同步到 Molio
- **自定义模板**：支持模板、变量与过滤器，灵活控制保存内容与格式
- **阅读器**：自动提取文章正文，获得干净阅读体验
- **零配置**：扩展启动后自动连接本地 Molio daemon，默认保存到当前打开的知识库；无需手动设置 vault

## 工作原理

扩展通过本地 daemon（默认 `http://localhost:3100`）与 Molio 桌面端通信。当你点击保存时，内容会直接写入 Molio 当前激活的知识库中，同时触发 Molio 桌面端打开该文件。

需要确保 Molio 桌面端正在运行。

## 致谢

本项目基于 [obsidian-clipper](https://github.com/obsidianmd/obsidian-clipper) 开发。感谢 Obsidian 团队开放这套优秀的网页采集方案，并在 MIT 协议下共享源码。

我们重用了 defuddle 内容提取引擎、模板系统、高亮功能与多语言翻译等成熟组件，在其基础上将保存目标适配为 Molio 知识库。

## 开发

```bash
npm install
npm run build        # 构建三个浏览器版本（Chrome / Firefox / Safari）
npm run build:chrome # 仅构建 Chrome 版本
npm test             # 运行测试
```

构建产物：
- `dist/` — Chrome 版本
- `dist_firefox/` — Firefox 版本
- `dist_safari/` — Safari 版本

### 本地安装

**Chromium 系浏览器**（Chrome、Brave、Edge、Arc）：
1. 浏览器打开 `chrome://extensions`
2. 开启 **开发者模式**
3. 点击 **加载已解压的扩展程序**，选择 `dist` 目录

**Firefox**：
1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击 **临时加载附加组件**
3. 选择 `dist_firefox` 目录下的 `manifest.json`

## 第三方依赖

- [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) — 跨浏览器 API 兼容
- [defuddle](https://github.com/kepano/defuddle) — 内容提取与 Markdown 转换
- [dayjs](https://github.com/iamkun/dayjs) — 日期处理
- [lz-string](https://github.com/pieroxy/lz-string) — 模板压缩
- [lucide](https://github.com/lucide-icons/lucide) — 图标
- [dompurify](https://github.com/cure53/DOMPurify) — HTML 清洗

## 许可证

源代码基于 [obsidian-clipper](https://github.com/obsidianmd/obsidian-clipper) 在 MIT 协议下开放。所有 Obsidian 相关的商标、图标、营销素材仍归 Obsidian 所有。
