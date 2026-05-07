# Claw AI 三大核心系统 — 统一开发计划 v3.0

> 制定日期: 2026-05-08 | 总指挥: WorkBuddy AI
> 目标: 一次上线三个实打实功能，客户付款立马觉得值

---

## 三大系统总览

| 系统 | 一句话 | 难度 | 工时 |
|------|------|:--:|:--:|
| 🎬 AI短视频工厂 | 文字/图片→带配音字幕的MP4 | 中 | 14h |
| 🤖 AI数字人直播 | VRM虚拟人实时推流OBS | 高 | 11h |
| ✍️ AI文案工厂 | 小说/脚本/营销文案生成 | 低 | 4h |

---

## 系统三：AI文案工厂（新增）

### 三种生成模式

| 模式 | 输入 | 输出 |
|------|------|------|
| 📖 小说生成 | "写一个霸总爱上灰姑娘的故事，10章" | 10章×3000字小说+章节目录 |
| 📝 脚本生成 | "翡翠手镯直播脚本，90秒" | 分镜脚本+话术+互动设计 |
| 📢 营销文案 | "翡翠手镯，卖点是冰种飘花" | 5版文案（朋友圈/抖音/小红书/详情页/广告） |

### 技术方案（纯LLM API，最简单）
- DeepSeek API：小说长篇生成（支持16K+上下文）
- 前端：类似ChatGPT的交互式UI，支持编辑、续写、导出
- 后端：一个路由 + LLM调用服务

### 文件清单

| 文件 | 说明 | 工时 |
|------|------|:--:|
| `src/services/writer/NovelGenerator.js` | 小说生成（分章、续写、大纲） | 1h |
| `src/services/writer/ScriptGenerator.js` | 脚本生成（直播/短视频/短剧） | 1h |
| `src/services/writer/CopyGenerator.js` | 营销文案多版本生成 | 0.5h |
| `src/routes/writer.js` | API路由 | 0.5h |
| `frontend/src/pages/WriterPage.tsx` | 前端页面 | 1h |

---

## 更新后的开发Phase

```
Phase 0: 环境准备 (30min)
  ├── pip install edge-tts
  ├── 下载 Rhubarb 二进制
  ├── npm install @pixiv/three-vrm three
  ├── nginx-rtmp 环境
  └── API keys: Kling / DALL-E / DeepSeek

Phase 1: 共享基础设施 (2h)
  ├── ScriptGenerator（三系统共用）✅
  ├── TTSEngine（数字人+短视频共用）
  └── VideoCompositor（数字人+短视频共用FFmpeg）

Phase 2: 系统三 - 文案工厂（最简单，先做）(2h)
  ├── NovelGenerator + ScriptGenerator + CopyGenerator
  ├── API路由 writer.js
  └── 前端 WriterPage.tsx

Phase 3: 系统一 - 数字人直播 (4h)
  ├── LipSyncEngine + VRMRenderer
  ├── RTMPPusher + RealtimeChat + LiveStreamEngine
  └── 直播控制面板UI

Phase 4: 系统二 - 短视频工厂 (5h)
  ├── ImageGenerator + VideoGenerator(Kling API)
  ├── VoiceoverEngine + SeriesEngine
  └── VideoFactoryPage前端

Phase 5: 集成联调 + 部署 (1.5h)
  ├── 三系统端到端测试
  ├── 构建前端 → Cloudflare Pages
  └── GitHub推送 → Render部署
```

---

## 会员套餐 v3（三大系统齐全）

| 版本 | 价格 | 短视频 | 数字人 | 文案工厂 | WhatsApp |
|------|:--:|------|------|------|------|
| 免费 | ¥0 | 3条 | 无 | 3篇试用 | 5条 |
| 基础 | ¥199 | 30条 | 无 | 50篇 | 50条 |
| 专业 | ¥499 | 100条 | 1频道 | 200篇+脚本 | 200条 |
| 企业 | ¥1,599 | 300条+连续剧 | 3频道实时 | 500篇+小说 | 500条 |
| 旗舰 | ¥5,888 | 无限制 | 5频道+定制 | 无限制+小说 | 无限制 |

---

## 验收标准

- 文案生成：输入"翡翠手镯"→输出可直接使用的5版营销文案
- 小说生成：输入大纲→10章完整小说，章节连贯
- 短视频：输入文字→3分钟出带配音字幕MP4
- 数字人：启动→OBS收到RTMP流，延迟<3秒
- 三系统同时在线，互不影响

---

*计划就绪，执行中...*
