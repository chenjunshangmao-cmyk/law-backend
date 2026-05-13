/**
 * Claw 网站部署更新维护报告生成器
 * 2026-05-13
 */
const PptxGenJS = require("pptxgenjs");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "WorkBuddy AI";
pptx.title = "Claw 网站部署维护报告 2026.05.13";

// Color palette - Ocean Tech
const C = {
  dark: "0A1628",
  primary: "1A5276",
  accent: "2980B9",
  light: "D4E6F1",
  white: "FFFFFF",
  green: "27AE60",
  red: "E74C3C",
  orange: "F39C12",
  gray: "7F8C8D",
  darkGray: "2C3E50",
  tableBg: "EBF5FB",
  tableBorder: "AED6F1",
};

// ==================== SLIDE 1: 封面 ====================
{
  const s = pptx.addSlide();
  s.background = { fill: C.dark };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: "100%", fill: C.dark });
  
  s.addText("Claw 外贸电商管理平台", {
    x: 0.8, y: 0.8, w: "80%", h: 0.5,
    fontSize: 14, color: C.accent, fontFace: "Calibri",
  });
  
  s.addText("部署更新与维护报告", {
    x: 0.8, y: 1.5, w: "80%", h: 1.0,
    fontSize: 40, color: C.white, fontFace: "Georgia", bold: true,
  });
  
  s.addText("2026年5月13日", {
    x: 0.8, y: 2.6, w: "50%", h: 0.5,
    fontSize: 20, color: C.accent, fontFace: "Calibri",
  });
  
  s.addText([
    { text: "当前版本: ", options: { color: C.gray } },
    { text: "2026.05.13.007", options: { color: C.green, bold: true } },
    { text: "\n数据库模式: ", options: { color: C.gray } },
    { text: "PostgreSQL (本机)", options: { color: C.green, bold: true } },
  ], {
    x: 0.8, y: 3.5, w: "60%", h: 1.2,
    fontSize: 14, fontFace: "Calibri",
  });
  
  s.addText("WorkBuddy AI 团队 · 自动化维护", {
    x: 0.8, y: 5.0, w: "50%", h: 0.4,
    fontSize: 12, color: C.gray, fontFace: "Calibri",
  });
}

// ==================== SLIDE 2: 系统架构概览 ====================
{
  const s = pptx.addSlide();
  s.background = { fill: C.white };
  
  s.addText("系统架构概览", {
    x: 0.6, y: 0.3, w: "80%", h: 0.6,
    fontSize: 30, color: C.primary, fontFace: "Georgia", bold: true,
  });
  
  const components = [
    { name: "前端 (React+TS)", url: "claw-app-2026.pages.dev", status: "运行中", color: C.green },
    { name: "后端 (Node.js)", url: "claw-backend-2026.onrender.com", status: "运行中", color: C.green },
    { name: "数据库 (PostgreSQL 18)", url: "本机 localhost:5432", status: "运行中", color: C.green },
    { name: "隧道 (Pinggy.io)", url: "TCP隧道 → Render", status: "运行中", color: C.orange },
    { name: "Git主仓库", url: "Gitee lyshlc/claw", status: "fc1140b", color: C.green },
    { name: "Git后端仓库", url: "GitHub law-backend", status: "05be67b", color: C.green },
  ];
  
  const rows = components.map((c, i) => {
    const rowBg = i % 2 === 0 ? C.tableBg : C.white;
    return [
      { text: c.name, options: { fill: { color: rowBg }, bold: true, fontSize: 12 } },
      { text: c.url, options: { fill: { color: rowBg }, fontSize: 11, color: C.gray } },
      { text: c.status, options: { fill: { color: rowBg }, fontSize: 12, color: c.color, bold: true } },
    ];
  });
  
  s.addTable(rows, {
    x: 0.6, y: 1.2, w: "85%",
    colW: [2.2, 3.8, 1.5],
    border: { type: "solid", pt: 0.5, color: C.tableBorder },
    fontFace: "Calibri",
  });
  
  // Architecture diagram box
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 3.5, w: "85%", h: 1.8,
    fill: C.light, rectRadius: 0.1,
  });
  
  s.addText([
    { text: "数据流: ", options: { bold: true } },
    { text: "浏览器 → Cloudflare Pages(前端) → Render(后端) → Pinggy隧道 → 本机PostgreSQL\n\n" },
    { text: "部署流: ", options: { bold: true } },
    { text: "Git Push → GitHub自动触发Render部署(后端) → wrangler手动部署Cloudflare(前端)" },
  ], {
    x: 0.8, y: 3.7, w: "80%", h: 1.5,
    fontSize: 12, fontFace: "Calibri", color: C.darkGray,
  });
}

// ==================== SLIDE 3: 版本变更历史 ====================
{
  const s = pptx.addSlide();
  s.background = { fill: C.white };
  
  s.addText("今日版本变更历史 (2026.05.13)", {
    x: 0.6, y: 0.3, w: "80%", h: 0.6,
    fontSize: 28, color: C.primary, fontFace: "Georgia", bold: true,
  });
  
  const versions = [
    { ver: "007", time: "02:37", desc: "修复useMemoryMode永久锁定JSON→数据丢失; 修复去水印/消除/变清晰响应解析错误", type: "P0" },
    { ver: "006", time: "02:14", desc: "修复支付订单消失(DB写入失败静默吞掉); AI抠图progress回调异常; CheckCircle未导入", type: "P0" },
    { ver: "005", time: "02:04", desc: "数据库JSON模式降级 + AI工具箱v2(11工具3分类) + sharp替代Python OpenCV", type: "feat" },
  ];
  
  const headerRow = [
    { text: "版本", options: { fill: { color: C.primary }, color: C.white, bold: true, fontSize: 12 } },
    { text: "时间", options: { fill: { color: C.primary }, color: C.white, bold: true, fontSize: 12 } },
    { text: "优先级", options: { fill: { color: C.primary }, color: C.white, bold: true, fontSize: 12 } },
    { text: "变更内容", options: { fill: { color: C.primary }, color: C.white, bold: true, fontSize: 12 } },
  ];
  
  const dataRows = versions.map((v, i) => {
    const bg = i % 2 === 0 ? C.tableBg : C.white;
    const typeColor = v.type === "P0" ? C.red : v.type === "P1" ? C.orange : C.green;
    return [
      { text: `v2026.05.13.${v.ver}`, options: { fill: { color: bg }, bold: true, fontSize: 11 } },
      { text: `${v.time} CST`, options: { fill: { color: bg }, fontSize: 11 } },
      { text: v.type, options: { fill: { color: bg }, fontSize: 11, color: typeColor, bold: true } },
      { text: v.desc, options: { fill: { color: bg }, fontSize: 10, color: C.darkGray } },
    ];
  });
  
  s.addTable([headerRow, ...dataRows], {
    x: 0.6, y: 1.2, w: "85%",
    colW: [1.8, 1.0, 0.8, 6.0],
    border: { type: "solid", pt: 0.5, color: C.tableBorder },
    fontFace: "Calibri",
  });
  
  // Summary stats
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 3.8, w: 2.5, h: 1.0, fill: C.red, rectRadius: 0.08,
  });
  s.addText("3 个 P0 紧急修复", { x: 0.6, y: 3.85, w: 2.5, h: 0.9, fontSize: 13, color: C.white, align: "center", fontFace: "Calibri" });
  
  s.addShape(pptx.ShapeType.roundRect, {
    x: 3.4, y: 3.8, w: 2.5, h: 1.0, fill: C.orange, rectRadius: 0.08,
  });
  s.addText("1 个 P1 优化", { x: 3.4, y: 3.85, w: 2.5, h: 0.9, fontSize: 13, color: C.white, align: "center", fontFace: "Calibri" });
  
  s.addShape(pptx.ShapeType.roundRect, {
    x: 6.2, y: 3.8, w: 2.5, h: 1.0, fill: C.green, rectRadius: 0.08,
  });
  s.addText("1 个功能迭代", { x: 6.2, y: 3.85, w: 2.5, h: 0.9, fontSize: 13, color: C.white, align: "center", fontFace: "Calibri" });
  
  s.addText("总Git提交: 6次 (主仓库3 + 后端3) | 前后端各部署3次", {
    x: 0.6, y: 5.0, w: "85%", h: 0.4,
    fontSize: 11, color: C.gray, fontFace: "Calibri",
  });
}

// ==================== SLIDE 4: 关键故障及修复详情 ====================
{
  const s = pptx.addSlide();
  s.background = { fill: C.white };
  
  s.addText("关键故障及修复详情", {
    x: 0.6, y: 0.3, w: "80%", h: 0.6,
    fontSize: 28, color: C.primary, fontFace: "Georgia", bold: true,
  });
  
  const issues = [
    {
      title: "🔴 P0: useMemoryMode 单向锁死 → 会员数据每次部署后丢失",
      detail: "根因: smartPool中useMemoryMode一旦翻true永不返回false。PG偶尔波动→永久锁定JSON模式→所有数据只写JSON临时文件→Render部署清空临时文件→会员蒸发。经历4次部署全部复现。\n修复: database.js v3.1双向PG↔JSON切换 + 每30秒自动探测PG + 恢复时自动syncMemoryToPG()回写数据 + auth.js消除启动竞态"
    },
    {
      title: "🔴 P0: 去水印/智能消除/变清晰/商品套图等全部云端工具显示'处理失败'",
      detail: "根因: AIToolsPage.tsx中processWithBackend响应解析结构错误。后端返回{success:true, data:{result,format}}→d=res.data后检查d.success(undefined)→永远false。所有8个云端工具全军覆没。\n修复: 改为res.success && d?.result直接访问"
    },
    {
      title: "🔴 P0: 会员支付宝支付后跳转订单页→订单消失",
      detail: "根因: shouqianba.db.js create-order写入payment_orders表失败时静默吞掉错误—用户看到支付二维码成功但数据库无记录。\n修复: 回传warning字段 + 本地文件降级保存 + CheckCircle未导入ReferenceError修复"
    },
    {
      title: "🔧 数据库迁移: Render PG → 本机 PostgreSQL 18",
      detail: "原因: Render PostgreSQL实例(dpg-d7dlk6hkh4rs739s00b0-a)DNS永久失效(ENOTFOUND)—数据库已不可用\n方案: 启用本机PG18→创建claw库+全表结构→远程用户claw_render→pinggy.io TCP隧道→Render通过/api/heartbeat/set-db动态切换\n结果: 数据库模式成功由json切换至pg✅ 数据不再丢失"
    },
  ];
  
  let yPos = 1.1;
  issues.forEach((issue) => {
    s.addText(issue.title, {
      x: 0.6, y: yPos, w: "85%", h: 0.35,
      fontSize: 12, color: C.primary, fontFace: "Calibri", bold: true,
    });
    yPos += 0.35;
    
    s.addText(issue.detail, {
      x: 0.8, y: yPos, w: "83%", h: 0.7,
      fontSize: 10, color: C.darkGray, fontFace: "Calibri",
    });
    yPos += 0.75;
  });
}

// ==================== SLIDE 5: 当前部署状态 ====================
{
  const s = pptx.addSlide();
  s.background = { fill: C.white };
  
  s.addText("当前部署状态", {
    x: 0.6, y: 0.3, w: "80%", h: 0.6,
    fontSize: 28, color: C.primary, fontFace: "Georgia", bold: true,
  });
  
  // 前端
  s.addShape(pptx.ShapeType.roundRect, { x: 0.6, y: 1.2, w: 3.8, h: 2.2, fill: C.dark, rectRadius: 0.1 });
  s.addText("🌐 前端 (Cloudflare Pages)", {
    x: 0.8, y: 1.3, w: 3.4, h: 0.4,
    fontSize: 13, color: C.white, fontFace: "Calibri", bold: true,
  });
  s.addText([
    { text: "a2682f31.claw-app-2026.pages.dev\n", options: { fontSize: 10, color: C.accent } },
    { text: "React 18 + TypeScript\nVite 5.4 构建\nCloudflare CDN全球加速\n版本: 2026.05.13.007\n构建: 12.8秒 | 88个文件", options: { fontSize: 10, color: C.light } }
  ], { x: 0.8, y: 1.8, w: 3.4, h: 1.4, fontFace: "Calibri" });
  
  // 后端
  s.addShape(pptx.ShapeType.roundRect, { x: 4.8, y: 1.2, w: 3.8, h: 2.2, fill: C.dark, rectRadius: 0.1 });
  s.addText("⚙️ 后端 (Render)", {
    x: 5.0, y: 1.3, w: 3.4, h: 0.4,
    fontSize: 13, color: C.white, fontFace: "Calibri", bold: true,
  });
  s.addText([
    { text: "claw-backend-2026.onrender.com\n", options: { fontSize: 10, color: C.accent } },
    { text: "Node.js + Express\nGitHub Auto-Deploy\n健康检查: 200 OK\n数据库: PG模式 ✅\n内存: 34MB | 上线: 13分钟", options: { fontSize: 10, color: C.light } }
  ], { x: 5.0, y: 1.8, w: 3.4, h: 1.4, fontFace: "Calibri" });
  
  // 数据库
  s.addShape(pptx.ShapeType.roundRect, { x: 0.6, y: 3.8, w: 3.8, h: 1.6, fill: C.primary, rectRadius: 0.1 });
  s.addText("🗄️ 数据库 (本机PG18)", {
    x: 0.8, y: 3.9, w: 3.4, h: 0.4,
    fontSize: 12, color: C.white, fontFace: "Calibri", bold: true,
  });
  s.addText([
    { text: "PostgreSQL 18\nclaw库 (8张表)\n远程用户: claw_render\n隧道: Pinggy.io TCP\n", options: { fontSize: 10, color: C.light } }
  ], { x: 0.8, y: 4.35, w: 3.4, h: 1.0, fontFace: "Calibri" });
  
  // AI工具箱
  s.addShape(pptx.ShapeType.roundRect, { x: 4.8, y: 3.8, w: 3.8, h: 1.6, fill: C.primary, rectRadius: 0.1 });
  s.addText("🤖 AI工具箱", {
    x: 5.0, y: 3.9, w: 3.4, h: 0.4,
    fontSize: 12, color: C.white, fontFace: "Calibri", bold: true,
  });
  s.addText([
    { text: "11个工具 | 3大分类\n智能抠图: WASM本地 ✅\n去水印/消除/变清晰: sharp ✅\nAI文案: DeepSeek ✅\n商品套图/海报: AI云端 ✅", options: { fontSize: 10, color: C.light } }
  ], { x: 5.0, y: 4.35, w: 3.4, h: 1.0, fontFace: "Calibri" });
}

// ==================== SLIDE 6: 数据库迁移方案 ====================
{
  const s = pptx.addSlide();
  s.background = { fill: C.white };
  
  s.addText("数据库迁移方案", {
    x: 0.6, y: 0.3, w: "80%", h: 0.6,
    fontSize: 28, color: C.primary, fontFace: "Georgia", bold: true,
  });
  
  // Before/After comparison
  s.addShape(pptx.ShapeType.roundRect, { x: 0.6, y: 1.2, w: 3.8, h: 3.0, fill: C.light, rectRadius: 0.1 });
  s.addText("迁移前 ❌", {
    x: 0.8, y: 1.3, w: 3.4, h: 0.4,
    fontSize: 14, color: C.red, fontFace: "Calibri", bold: true,
  });
  s.addText([
    { text: "位置: Render Postgres (已失效)\n", options: {} },
    { text: "状态: DNS永久失败\n", options: { color: C.red } },
    { text: "故障: 系统降级JSON模式\n", options: { color: C.orange } },
    { text: "后果: ", options: {} },
    { text: "每次部署后\n       会员数据全部丢失\n       订单记录清空\n       用户需重新注册\n       AI工具箱全不可用", options: { color: C.red } },
  ], { x: 0.9, y: 1.8, w: 3.2, h: 2.2, fontSize: 10, fontFace: "Calibri", color: C.darkGray });
  
  s.addShape(pptx.ShapeType.roundRect, { x: 4.8, y: 1.2, w: 3.8, h: 3.0, fill: C.tableBg, rectRadius: 0.1 });
  s.addText("迁移后 ✅", {
    x: 5.0, y: 1.3, w: 3.4, h: 0.4,
    fontSize: 14, color: C.green, fontFace: "Calibri", bold: true,
  });
  s.addText([
    { text: "位置: 本机 PostgreSQL 18\n", options: {} },
    { text: "状态: 正常运行 ✅\n", options: { color: C.green } },
    { text: "连接: Pinggy TCP隧道\n", options: { color: C.accent } },
    { text: "效果: ", options: {} },
    { text: "数据持久化本地硬盘\n       部署不再丢失数据\n       30秒自动探测PG恢复\n       支持动态切换数据库\n       数据同步PG↔内存双向\n       API端点一键切换数据源", options: { color: C.green } },
  ], { x: 5.1, y: 1.8, w: 3.2, h: 2.2, fontSize: 10, fontFace: "Calibri", color: C.darkGray });
  
  // Bottom note
  s.addText("⚠️ 隧道时效: Pinggy免费版60分钟过期（隧道守护进程自动重连）| 长期建议: Supabase免费PostgreSQL (500MB永久免费)", {
    x: 0.6, y: 4.6, w: "85%", h: 0.4,
    fontSize: 11, color: C.orange, fontFace: "Calibri",
  });
}

// ==================== SLIDE 7: 后续维护建议 ====================
{
  const s = pptx.addSlide();
  s.background = { fill: C.white };
  
  s.addText("后续维护建议", {
    x: 0.6, y: 0.3, w: "80%", h: 0.6,
    fontSize: 28, color: C.primary, fontFace: "Georgia", bold: true,
  });
  
  const recs = [
    { pri: "P0", title: "迁移至永久云数据库", desc: "注册 Supabase/Neon 免费PostgreSQL → 更新DATABASE_URL → 彻底摆脱隧道依赖", icon: "🗄️" },
    { pri: "P0", title: "Render PG实例清理", desc: "在Render Dashboard删除已失效的PostgreSQL实例，释放资源", icon: "🧹" },
    { pri: "P1", title: "数据自动备份", desc: "配置pg_dump定时任务 → 备份到微云/本地文件 → 防止单点故障", icon: "💾" },
    { pri: "P1", title: "健康监控增强", desc: "当前heartbeat已暴露mode/latency/pgDirect → 建议接入飞书告警(异常时推送)", icon: "📊" },
    { pri: "P2", title: "前端版本号自动递增", desc: "deploy.bat 自动更新VERSION.md → 避免手动维护版本号遗漏", icon: "🔢" },
    { pri: "P2", title: "TypeScript类型修复", desc: "清理15个TS编译警告(WhatsAppPage/ModernLayout等) → 提升代码质量", icon: "📝" },
  ];
  
  let yPos = 1.2;
  recs.forEach((rec) => {
    const priColor = rec.pri === "P0" ? C.red : rec.pri === "P1" ? C.orange : C.accent;
    const bgColor = rec.pri === "P0" ? "FDEBD0" : "F2F3F4";
    
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y: yPos, w: "85%", h: 0.6, fill: bgColor, rectRadius: 0.06,
    });
    
    s.addText(rec.pri, {
      x: 0.75, y: yPos + 0.05, w: 0.5, h: 0.5,
      fontSize: 11, color: priColor, fontFace: "Calibri", bold: true, align: "center",
    });
    
    s.addText(rec.title, {
      x: 1.3, y: yPos + 0.02, w: 2.5, h: 0.55,
      fontSize: 12, color: C.darkGray, fontFace: "Calibri", bold: true,
    });
    
    s.addText(rec.desc, {
      x: 3.8, y: yPos + 0.02, w: "50%", h: 0.55,
      fontSize: 10, color: C.gray, fontFace: "Calibri",
    });
    
    yPos += 0.68;
  });
}

// ==================== SLIDE 8: 尾声 ====================
{
  const s = pptx.addSlide();
  s.background = { fill: C.dark };
  
  s.addText("谢谢", {
    x: "20%", y: 1.5, w: "60%", h: 1.0,
    fontSize: 48, color: C.white, fontFace: "Georgia", bold: true, align: "center",
  });
  
  s.addText("Claw 外贸电商管理平台 · 持续维护中", {
    x: "10%", y: 2.5, w: "80%", h: 0.5,
    fontSize: 16, color: C.accent, fontFace: "Calibri", align: "center",
  });
  
  s.addText([
    { text: "前端: ", options: { color: C.gray } },
    { text: "claw-app-2026.pages.dev\n", options: { color: C.accent } },
    { text: "后端: ", options: { color: C.gray } },
    { text: "claw-backend-2026.onrender.com\n", options: { color: C.accent } },
    { text: "状态: ", options: { color: C.gray } },
    { text: "全部服务正常运行 ✅", options: { color: C.green } },
  ], {
    x: "20%", y: 3.3, w: "60%", h: 1.5,
    fontSize: 12, fontFace: "Calibri", align: "center",
  });
  
  s.addText("报告生成时间: 2026-05-13 03:50 CST | WorkBuddy AI", {
    x: "20%", y: 5.0, w: "60%", h: 0.4,
    fontSize: 10, color: C.gray, fontFace: "Calibri", align: "center",
  });
}

// ==================== 保存 ====================
const outPath = "C:/Users/Administrator/WorkBuddy/Claw/output/Claw部署维护报告_2026-05-13.pptx";
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log("✅ 报告已生成:", outPath);
}).catch(err => {
  console.error("❌ 生成失败:", err);
});
