# YouTube 实时翻译 Web 应用

一个简洁美观的 YouTube 实时字幕翻译工具。输入视频链接后会获取字幕（手动或自动），同步显示原文与翻译结果。

## 功能
- 输入 YouTube 视频 URL
- 获取手动字幕或自动字幕
- 同步显示原文字幕与翻译字幕
- 支持多种目标语言
- 现代化 UI

## 技术栈
- 前端：React + Vite + TailwindCSS
- 后端：Node.js + Express
- 字幕获取：youtube-captions-scraper
- 翻译：LibreTranslate（默认使用公共实例）

## 运行方式

### 1) 安装依赖
```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 2) 启动开发环境
```bash
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:5174

## 环境变量（可选）
在 `server` 目录下创建 `.env`：

```
PORT=5174
CORS_ORIGIN=http://localhost:5173
LIBRETRANSLATE_URL=https://libretranslate.de/translate
LIBRETRANSLATE_API_KEY=
```

## 使用提示
- 并非所有视频都有字幕；若没有字幕，请尝试其他语言或其他视频。
- 自动字幕依赖 YouTube 生成，准确率可能不同。

## 项目结构
```
.
├── client   # React 前端
└── server   # Express 后端
```
