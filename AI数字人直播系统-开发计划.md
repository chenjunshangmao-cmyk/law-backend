# AI数字人直播系统 — 开发计划 v1.0

> 制定日期: 2026-05-08
> 总指挥: WorkBuddy AI
> 执行模式: 三模块并行 → 集成联调 → 上线

---

## 一、现状盘点

| 模块 | 完成度 | 说明 |
|------|:--:|------|
| 前端AvatarPage | ✅ 100% | 脚本生成UI、视频生成UI、视频列表、发布Modal |
| 后端API路由 | ✅ 100% | CRUD、generate、generate-script、upload（mock） |
| 数据库模型 | ✅ 100% | videos表、scripts表，PostgreSQL |
| AI脚本生成 | ⚠️ 20% | 硬编码模板，未接LLM API |
| 视频渲染引擎 | ❌ 5% | 只创建1KB占位文件 |
| 实时直播推流 | ❌ 0% | Canvas→FFmpeg→RTMP整条链路不存在 |

---

## 二、模块1：真实视频渲染引擎

### 目标
输入：脚本文字 + 参数 → 输出：带数字人说话的视频MP4文件

### 数据流
```
脚本文字 → TTS引擎(Edge TTS) → 音频文件(.wav) + 音素时间戳
                                        ↓
VRM模型(Three.js) ← 口型数据(Rhubarb) ← 音素时间戳
        ↓
   WebGL渲染帧 → FFmpeg合成 → MP4视频文件
                                       ↓
                                背景+音乐混入
                                        ↓
                              保存到 generated-videos/
```

### 技术选型

| 组件 | 方案 | 原因 |
|------|------|------|
| TTS | edge-tts (Python) | 免费、中文质量好、微软引擎 |
| 口型同步 | Rhubarb Lip Sync | MIT开源、输出JSON音素数据 |
| 3D模型 | VRM格式 | vtuber行业标准、BlendShape完备 |
| 3D渲染 | Three.js + @pixiv/three-vrm | 成熟方案、支持VRM 1.0/0.x |
| 视频编码 | FFmpeg (libx264) | 行业标准、GPU加速可选 |
| 背景合成 | FFmpeg overlay/colorkey | 直接叠加无需额外工具 |

### 需要新建的文件

| 文件 | 说明 |
|------|------|
| `src/services/avatar/TTSEngine.js` | 调用edge-tts生成音频 |
| `src/services/avatar/LipSyncEngine.js` | 调用Rhubarb计算口型 |
| `src/services/avatar/VRMRenderer.js` | Three.js渲染VRM到帧 |
| `src/services/avatar/VideoCompositor.js` | FFmpeg合成视频+音频+背景+音乐 |

### 需要修改的文件

| 文件 | 改动 |
|------|------|
| `src/routes/avatar.db.js` | `/generate` 从创建假文件 → 调用真实渲染引擎 |
| `src/routes/avatar.js` | 同步更新 |
| `src/services/dbService.js` | 视频状态新增rendering/compositing |
| `frontend/src/pages/AvatarPage.tsx` | 新增渲染进度显示 |

### 依赖安装
```bash
pip install edge-tts          # TTS引擎
npm install @pixiv/three-vrm   # VRM加载
npm install three               # 3D渲染
# Rhubarb用CLI二进制，放到 tools/ 目录
```

---

## 三、模块2：AI脚本生成（接LLM API）

### 目标
替换硬编码模板 → 接入真实LLM API → 根据产品信息生成直播脚本

### 技术选型

| 方案 | 单价 | 优势 |
|------|:--:|------|
| DeepSeek API | ¥1/百万token | 国产便宜、中文最佳 |
| GPT-4o-mini | $0.15/百万token | 质量稳定 |
| 本地Ollama | ¥0 | 免费但需要GPU |

**推荐**: DeepSeek API（中文直播脚本质量最好且便宜）

### 需要新建的文件

| 文件 | 说明 |
|------|------|
| `src/services/avatar/ScriptGenerator.js` | LLM API调用 + Prompt工程 |

### 需要修改的文件

| 文件 | 改动 |
|------|------|
| `src/routes/avatar.db.js` | `/generate-script` 调用 ScriptGenerator |
| `src/routes/avatar.js` | 同步更新 |

### Prompt模板设计
```
你是珠宝翡翠直播带货的专业主播。
产品: {productName}
卖点: {productDesc}
场景: {scene} (产品介绍/限时秒杀/知识科普)
平台: {platform} (抖音/TikTok/YouTube)

要求:
1. 开场3秒内吸引注意力
2. 自然口语化，带互动（"家人们""扣1"等）
3. 突出云南瑞丽产地优势
4. 2-3轮逼单话术
5. 生成3-5个#标签
6. 时长60-90秒
```

---

## 四、模块3：实时直播推流

### 目标
Canvas渲染VRM数字人 → 实时视频流 → RTMP推送 → OBS接收 → 多平台分发

### 数据流
```
OpenClaw Agent(总控)
    ↓ 启动会话
VRM Renderer(Node.js/headless)  ← 实时TTS(收到用户消息→生成音频)
    │                                    ↑
    │ Canvas帧(30fps)              LLM API(实时对话回复)
    ↓                                    ↑
FFmpeg(PNG pipe → h264)          Whisper STT(用户语音→文字)
    ↓
RTMP Server(nginx-rtmp)
    ↓
OBS(接收RTMP流 → 叠加画面 → 推各平台)
    ↓
YouTube Live / TikTok Live / Facebook Live
```

### 技术选型

| 组件 | 方案 | 说明 |
|------|------|------|
| RTMP服务器 | nginx + nginx-rtmp-module | 开源、成熟 |
| 帧管道 | Node.js spawn FFmpeg stdin | PNG管道免写临时文件 |
| OBS对接 | RTMP Source输入 | OBS原生支持 |
| 实时STT | whisper.cpp 或 Web Speech API | 本地运行 |
| 实时LLM | DeepSeek API / GPT-4o-mini | 低延迟 |

### 需要新建的文件

| 文件 | 说明 |
|------|------|
| `src/services/avatar/LiveStreamEngine.js` | 实时推流主控 |
| `src/services/avatar/RTMPPusher.js` | FFmpeg RTMP推流 |
| `src/services/avatar/RealtimeChat.js` | 实时对话(STT→LLM→TTS) |
| `nginx-rtmp.conf` | nginx RTMP配置 |

### 需要修改的文件

| 文件 | 改动 |
|------|------|
| `src/routes/avatar.db.js` | 新增`/live/start` `/live/stop` `/live/status` API |
| `src/index.db.js` | 注册新路由 |
| `frontend/src/pages/AvatarPage.tsx` | 新增"直播控制"面板(开播/下播/实时弹幕) |

---

## 五、开发顺序

```
Phase 0: 环境准备 (30分钟)
  ├── 安装edge-tts、Rhubarb二进制
  ├── 准备测试VRM模型
  └── 搭建nginx-rtmp测试环境

Phase 1: 模块1 - 视频渲染引擎 (2-3小时)
  ├── 1.1 TTSEngine.js → 文字→音频
  ├── 1.2 LipSyncEngine.js → 音频→音素JSON
  ├── 1.3 VRMRenderer.js → VRM+音频→Canvas帧
  ├── 1.4 VideoCompositor.js → 帧+音频→MP4
  └── 1.5 接入 avatar.db.js → 替换假文件逻辑

Phase 2: 模块2 - AI脚本生成 (1小时)
  ├── 2.1 ScriptGenerator.js → LLM API + Prompt
  └── 2.2 接入 avatar.db.js → 替换硬编码模板

Phase 3: 模块3 - 实时推流 (2-3小时)
  ├── 3.1 nginx-rtmp 配置 → RTMP服务器就绪
  ├── 3.2 RTMPPusher.js → Canvas→FFmpeg→RTMP
  ├── 3.3 RealtimeChat.js → STT→LLM→TTS 实时对话
  ├── 3.4 LiveStreamEngine.js → 整合调度
  └── 3.5 前端直播控制面板

Phase 4: 集成联调 (1小时)
  ├── 脚本生成 → 视频渲染 → 推流 → 端到端测试
  ├── OBS接收测试
  └── YouTube/TikTok推流验证

Phase 5: 部署上线 (30分钟)
  ├── 构建前端
  ├── 部署 Cloudflare Pages
  └── 推送 GitHub → Render自动部署后端
```

---

## 六、AI团队分工

| 角色 | 负责 | 产出 |
|------|------|------|
| **Backend-AI** | TTSEngine + LipSyncEngine + ScriptGenerator | 4个服务文件 |
| **Frontend-AI** | VRMRenderer + VideoCompositor + LiveStreamEngine | 4个服务文件 + 前端面板 |
| **QA-AI** | 三个模块独立测试 + 集成测试 | 3份测试报告 |
| **Final-AI** | 安全审核 + 部署风险评估 | 审核报告 |
| **WorkBuddy(总指挥)** | 计划制定 + 协调 + 代码审查 + 部署 | 最终上线 |

---

## 七、验收标准

1. **视频渲染**: 输入文字→输出带数字人说话的MP4，口型匹配，声音清晰
2. **AI脚本**: 输入"翡翠手镯"→输出60-90秒可用的直播带货脚本
3. **实时推流**: 启动直播→OBS收到RTMP流→画面流畅(≥25fps)，延迟<3秒

---

## 八、成本

| 阶段 | 费用 |
|------|:--:|
| 环境准备 | ¥0（全部开源） |
| 开发执行 | ¥0（AI团队自动执行） |
| 测试GPU服务器 | ¥0.5-2/小时（云GPU按需） |
| 上线后运营 | ¥1,300-2,850/月（已算过） |

---

*此计划已完成制定，等待执行指令。*
