import React, { useState, useEffect } from 'react';
import api from '../services/api';
import xhsMcpApi from '../services/xhsMcpApi';

// AI 文案风格选项
const COPY_STYLES = [
  { value: '种草', label: '✨ 种草推荐', desc: '像闺蜜分享好物' },
  { value: '测评', label: '🔍 真实测评', desc: '多维度专业分析' },
  { value: '日常', label: '🌸 日常分享', desc: '自然融入生活感' },
  { value: '带货', label: '🛒 好物带货', desc: '突出性价比&购买理由' },
];

// 图生图风格选项（电商实用风格）
const IMG_STYLES = [
  { value: 'product', label: '📷 产品白底' },
  { value: 'lifestyle', label: '🏠 生活场景' },
  { value: 'flatlay', label: '📊 平铺摆拍' },
  { value: 'model', label: '👩 模特上身' },
  { value: 'detail', label: '🔍 细节特写' },
  { value: 'comparison', label: '⚖️ 对比展示' },
  { value: 'unboxing', label: '📦 开箱展示' },
  { value: 'aesthetic', label: '✨ 氛围感' },
];

export default function XiaohongshuPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [slotInfo, setSlotInfo] = useState<{ slots: any[]; total: number; free: number } | null>(null);
  const [tab, setTab] = useState<'accounts' | 'publish'>('publish');
  const [publishType, setPublishType] = useState<'note' | 'video' | 'product'>('note');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // 发布任务队列状态
  const [publishTaskId, setPublishTaskId] = useState<number | null>(null);
  const [publishTaskStatus, setPublishTaskStatus] = useState<string>('');
  const [publishPollTimer, setPublishPollTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  // 实时监控状态
  const [monitorVisible, setMonitorVisible] = useState(false);
  const [monitorScreenshot, setMonitorScreenshot] = useState<string>('');
  const [monitorStep, setMonitorStep] = useState<number>(0);
  const [monitorStepName, setMonitorStepName] = useState<string>('');
  const [monitorLogs, setMonitorLogs] = useState<string[]>([]);
  const [sseConnection, setSseConnection] = useState<{ close: () => void } | null>(null);

  // 图文笔记字段
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);         // 原始上传图
  const [aiImages, setAiImages] = useState<string[]>([]);     // AI生成图（URL）
  const [tags, setTags] = useState<string>('');

  // 视频笔记字段
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');

  // 产品链接字段
  const [productUrl, setProductUrl] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');

  // ===== AI 商品搬运（产品链接模式增强） =====
  const [fetchedProduct, setFetchedProduct] = useState<any>(null);       // 抓取到的产品
  const [competitiveResult, setCompetitiveResult] = useState<any>(null); // 竞品分析结果
  const [selectedPlan, setSelectedPlan] = useState<'A' | 'B'>('A');     // 选择方案A/B
  const [autoPublish, setAutoPublish] = useState(false);                // 自动发布开关
  const [semiAuto, setSemiAuto] = useState(false);                   // ✅ 半自动：后端填表后不点发布

  // 商品搬运流程步骤
  // 0=未开始, 1=抓取中, 2=抓取完成待分析, 3=分析中, 4=分析完成待选方案
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineBusy, setPipelineBusy] = useState(false);

  // 账号
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loginStatus, setLoginStatus] = useState<{ hasSession: boolean; loggedIn: boolean } | null>(null);

  // 扫码登录状态
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);   // base64 二维码截图
  const [qrLoading, setQrLoading] = useState(false);                      // 获取二维码中
  const [qrWaiting, setQrWaiting] = useState(false);                      // 等待扫码中
  const [qrExpired, setQrExpired] = useState(false);                      // 二维码过期
  const [newAccountId, setNewAccountId] = useState('');                    // 新账号ID

  // AI 状态
  const [aiAnalyzing, setAiAnalyzing] = useState(false);       // 识别图片中
  const [aiGeneratingCopy, setAiGeneratingCopy] = useState(false); // 生成文案中
  const [aiGeneratingImg, setAiGeneratingImg] = useState(false);   // 图生图中
  const [imageAnalysis, setImageAnalysis] = useState<any>(null);   // 识别结果
  const [copyStyle, setCopyStyle] = useState<string>('种草');
  const [imgStyle, setImgStyle] = useState<string>('product');
  const [showAiPanel, setShowAiPanel] = useState(false);        // 展开AI面板

  // ===== 多文案选择 =====
  const [aiCopyPlans, setAiCopyPlans] = useState<any[]>([]);     // 4种风格文案
  const [selectedCopyIdx, setSelectedCopyIdx] = useState<number>(-1); // 选中的文案索引

  // ===== 多图片选择 =====
  const [aiGeneratedImages, setAiGeneratedImages] = useState<{ url: string; base64?: string; selected: boolean }[]>([]);
  const [aiImgCount, setAiImgCount] = useState(3); // 生成图片数量（默认3张）

  // 文件转 base64
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 处理图片上传
  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    try {
      const base64Images = await Promise.all(Array.from(files).map(f => fileToBase64(f)));
      setImages(prev => [...prev, ...base64Images].slice(0, 9));
      setMessage({ type: 'success', text: `已添加 ${files.length} 张图片` });
    } catch (err: any) {
      setMessage({ type: 'error', text: `图片上传失败：${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  // 处理视频上传
  async function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const base64Video = await fileToBase64(file);
      setVideoFile(base64Video);
      setMessage({ type: 'success', text: `视频已加载：${file.name}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: `视频上传失败：${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  function removeAiImage(index: number) {
    setAiImages(prev => prev.filter((_, i) => i !== index));
  }

  // =============================================
  // AI 功能：Step 1 — 识别图片
  // =============================================
  async function handleAnalyzeImage() {
    if (images.length === 0) {
      setMessage({ type: 'error', text: '请先上传图片' });
      return;
    }
    setAiAnalyzing(true);
    setMessage({ type: 'info', text: '🤖 AI 正在识别图片...' });
    try {
      const result = await api.xiaohongshu.ai.analyzeImage(images[0]);
      if (result?.success && result?.data) {
        setImageAnalysis(result.data);
        setMessage({ type: 'success', text: `✅ 识别完成：${result.data.productName || '商品'}` });
      } else {
        throw new Error(result?.error || '识别失败');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `AI识别失败：${err.message}` });
    } finally {
      setAiAnalyzing(false);
    }
  }

  // =============================================
  // AI 功能：Step 2 — 生成文案
  // =============================================
  async function handleGenerateCopy() {
    const desc = imageAnalysis?.description || imageAnalysis?.productName || title || '商品';
    setAiGeneratingCopy(true);
    setMessage({ type: 'info', text: '✍️ AI 正在生成文案...' });
    try {
      const result = await api.xiaohongshu.ai.generateContent({
        imageDescription: imageAnalysis?.description || desc,
        productName: imageAnalysis?.productName || title,
        style: copyStyle as any,
        extraInfo: imageAnalysis?.features?.join('、'),
      });
      if (result?.success && result?.data) {
        const { title: t, content: c, tags: tgs } = result.data;
        if (t) setTitle(t.slice(0, 20));
        if (c) setContent(c);
        if (tgs && Array.isArray(tgs)) setTags(tgs.join(' '));
        setMessage({ type: 'success', text: '✅ AI 文案已生成，可手动修改后发布' });
      } else {
        throw new Error(result?.error || '生成失败');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `文案生成失败：${err.message}` });
    } finally {
      setAiGeneratingCopy(false);
    }
  }

  // =============================================
  // AI 功能：Step 3 — 图生图
  // =============================================
  async function handleImageToImage() {
    if (images.length === 0) {
      setMessage({ type: 'error', text: '请先上传原始图片' });
      return;
    }
    setAiGeneratingImg(true);
    setMessage({ type: 'info', text: `🎨 AI 图生图中（${imgStyle}风格），约需 15-40 秒...` });
    try {
      const result = await api.xiaohongshu.ai.imageToImage({
        imageBase64: images[0],
        style: imgStyle as any,
      });
      if (result?.success && result?.data?.url) {
        // 尝试转base64用于发布
        let base64: string | undefined;
        try {
          const imgResp = await fetch(result.data.url);
          const imgBlob = await imgResp.blob();
          base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(imgBlob);
          });
        } catch { /* URL转base64失败 */ }
        
        // 添加到新的 aiGeneratedImages 选择网格
        setAiGeneratedImages(prev => [...prev, { url: result.data.url, base64, selected: true }]);
        // 同时保留旧的 aiImages 兼容
        setAiImages(prev => [...prev, result.data.url]);
        
        // 自动将选中的base64图添加到发布列表
        if (base64) {
          setImages(prev => [...prev, base64].slice(0, 9));
        }
        setMessage({ type: 'success', text: '✅ AI 图生图完成！已添加到图片选择区' });
      } else {
        throw new Error(result?.error || '图生图失败');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `图生图失败：${err.message}` });
    } finally {
      setAiGeneratingImg(false);
    }
  }

  // =============================================
  // 一键 AI 全流程（识别→批量文案→批量图生图）
  // =============================================
  async function handleAiAutoFill() {
    if (images.length === 0) {
      setMessage({ type: 'error', text: '请先上传图片' });
      return;
    }
    // Step 1: 识别
    setAiAnalyzing(true);
    setMessage({ type: 'info', text: '🤖 Step 1/3：AI 识别图片...' });
    let analysis: any = null;
    try {
      const res = await api.xiaohongshu.ai.analyzeImage(images[0]);
      if (res?.success) {
        analysis = res.data;
        setImageAnalysis(analysis);
      }
    } catch { /* 识别失败也继续 */ }
    finally { setAiAnalyzing(false); }

    // Step 2: 批量生成4种风格文案
    setAiGeneratingCopy(true);
    setMessage({ type: 'info', text: '✍️ Step 2/3：AI 生成4种风格文案...' });
    try {
      // 识别失败时用用户已输入的标题/内容兜底，再不行用通用描述
      const fallbackDesc = title || content || '精选商品，品质优良';
      const res = await api.xiaohongshu.ai.generateMultiContent({
        imageDescription: analysis?.description || analysis?.productName || fallbackDesc,
        productName: analysis?.productName || title || '商品',
        extraInfo: analysis?.features?.join('、'),
      });
      if (res?.success && res?.data?.plans?.length > 0) {
        setAiCopyPlans(res.data.plans);
        // 自动选中第一种文案填入表单
        const first = res.data.plans[0];
        if (first.title) setTitle(first.title.slice(0, 20));
        if (first.content) setContent(first.content);
        if (first.tags?.length) setTags(first.tags.join(' '));
        setSelectedCopyIdx(0);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `AI文案生成失败：${err.message}` });
      setAiGeneratingCopy(false);
      return;
    } finally {
      setAiGeneratingCopy(false);
    }

    // Step 3: 批量图生图
    setAiGeneratingImg(true);
    setMessage({ type: 'info', text: `🎨 Step 3/3：AI 批量生成 ${aiImgCount} 张配图（${imgStyle}风格），约需 1-3 分钟...` });
    const newImages: { url: string; base64?: string; selected: boolean }[] = [];
    
    for (let i = 0; i < aiImgCount; i++) {
      setMessage({ type: 'info', text: `🎨 Step 3/3：生成第 ${i + 1}/${aiImgCount} 张图片...` });
      try {
        const imgRes = await api.xiaohongshu.ai.imageToImage({
          imageBase64: images[0],
          style: imgStyle as any,
        });
        if (imgRes?.success && imgRes?.data?.url) {
          // 尝试转base64
          let base64: string | undefined;
          try {
            const imgResp = await fetch(imgRes.data.url);
            const imgBlob = await imgResp.blob();
            base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(imgBlob);
            });
          } catch { /* URL转base64失败 */ }
          newImages.push({ url: imgRes.data.url, base64, selected: true });
        }
      } catch {
        // 单张失败不影响后续
      }
    }

    if (newImages.length > 0) {
      setAiGeneratedImages(prev => [...prev, ...newImages]);
      // 自动将选中的base64图添加到发布列表
      const selectedB64 = newImages.filter(img => img.selected && img.base64).map(img => img.base64!);
      if (selectedB64.length > 0) {
        setImages(prev => [...prev.filter(img => img.startsWith('data:')), ...selectedB64].slice(0, 9));
      }
      setMessage({ type: 'success', text: `🎉 AI 全部完成！已生成 ${aiCopyPlans.length} 种文案 + ${newImages.length} 张配图，可直接发布` });
    } else {
      setMessage({ type: 'success', text: `🎉 文案已生成！图片生成失败，可手动上传后发布` });
    }
    setAiGeneratingImg(false);
  }

  function clearForm() {
    setTitle(''); setContent(''); setImages([]); setAiImages([]); setTags('');
    setImageAnalysis(null); setShowAiPanel(false);
    setVideoFile(null); setVideoTitle(''); setVideoDesc('');
    setProductUrl(''); setProductTitle(''); setProductDesc(''); setProductPrice('');
    setFetchedProduct(null); setCompetitiveResult(null); setSelectedPlan('A');
    setPipelineStep(0); setPipelineBusy(false);
    setAiCopyPlans([]); setSelectedCopyIdx(-1);
    setAiGeneratedImages([]);
  }

  // =============================================
  // AI 商品搬运：一键全流程
  // =============================================
  async function handlePipelineFetch() {
    if (!productUrl.trim()) {
      setMessage({ type: 'error', text: '请先粘贴产品链接' });
      return;
    }
    setPipelineBusy(true);
    setPipelineStep(1);
    setMessage({ type: 'info', text: '🔍 Step 1/3：正在抓取产品信息...' });

    try {
      const res = await api.xiaohongshu.ai.fetchProduct({ url: productUrl.trim() });
      if (!res?.success) throw new Error(res?.error || '抓取失败');

      setFetchedProduct(res.data);
      setPipelineStep(2);
      setMessage({ type: 'info', text: `✅ 抓取成功：${res.data.title?.slice(0, 20) || '产品'}，开始竞品分析...` });

      // Step 2: 竞品分析
      setPipelineStep(3);
      setMessage({ type: 'info', text: '🧠 Step 2/3：AI 竞品分析 + 生成发布资料...' });

      const analysisRes = await api.xiaohongshu.ai.competitiveAnalysis({ productData: res.data });
      if (!analysisRes?.success) throw new Error(analysisRes?.error || '竞品分析失败');

      setCompetitiveResult(analysisRes.data);
      setPipelineStep(4);
      setMessage({ type: 'success', text: '🎉 分析完成！请选择发布方案 → 自动填表' });
    } catch (err: any) {
      setPipelineStep(fetchedProduct ? 2 : 0);
      setMessage({ type: 'error', text: `流程中断：${err.message}` });
    } finally {
      setPipelineBusy(false);
    }
  }

  // 选择方案并自动填表 + 生成图片
  async function applyPlan(planKey: 'A' | 'B') {
    const plan = planKey === 'A' ? competitiveResult?.planA : competitiveResult?.planB;
    if (!plan) return;
    setSelectedPlan(planKey);
    if (plan.title) setTitle(plan.title.slice(0, 20));
    if (plan.content) setContent(plan.content);
    if (plan.tags && Array.isArray(plan.tags)) setTags(plan.tags.join(' '));
    
    // 用抓取到的产品图片填入 images
    if (fetchedProduct?.images?.length) {
      setImages(fetchedProduct.images.slice(0, 9));
      setMessage({ type: 'success', text: `✅ 已应用方案${planKey}，标题/正文/标签/图片已自动填写` });
    } else {
      // 没有抓取到图片时，用 AI 文生图生成至少一张
      setMessage({ type: 'info', text: `✅ 已应用方案${planKey}，正在用 AI 生成产品图片...` });
      try {
        const imgPrompt = `${plan.title || '产品'} ${plan.sellingPoints?.join(' ') || ''} product photo high quality`;
        const imgRes = await api.xiaohongshu.ai.textToImage({
          prompt: imgPrompt,
          style: 'product',
        });
        if (imgRes?.success && imgRes?.data?.url) {
          // 将URL转为base64添加到图片列表
          try {
            const imgResp = await fetch(imgRes.data.url);
            const imgBlob = await imgResp.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(imgBlob);
            });
            setImages([base64]);
            setAiImages([imgRes.data.url]);
            setMessage({ type: 'success', text: `✅ 已应用方案${planKey}，AI 已生成产品图片，可手动修改后发布` });
          } catch {
            setAiImages([imgRes.data.url]);
            setMessage({ type: 'success', text: `✅ 已应用方案${planKey}，AI图片已生成（预览中），请手动上传图片后发布` });
          }
        }
      } catch {
        setMessage({ type: 'success', text: `✅ 已应用方案${planKey}，标题/正文/标签已填写，请手动上传产品图片后发布` });
      }
    }
  }

  async function checkLoginStatus() {
    if (!selectedAccount) return;
    try {
      const res = await xhsMcpApi.loginStatus(selectedAccount);
      setLoginStatus(res?.data || null);
    } catch {
      setLoginStatus(null);
    }
  }

  useEffect(() => { loadAccounts(); }, []);
  useEffect(() => { if (selectedAccount) checkLoginStatus(); }, [selectedAccount]);

  async function loadAccounts() {
    setLoading(true);
    try {
      const allAccounts: any[] = [];
      // MCP 桥接管理账号：默认账号 + 用户手动添加的账号
      allAccounts.push({ accountId: 'default', displayName: '默认账号', source: 'mcp' });
      
      // 从 localStorage 加载自定义账号列表
      try {
        const saved = localStorage.getItem('xhs_mcp_accounts');
        if (saved) {
          const customIds: string[] = JSON.parse(saved);
          for (const id of customIds) {
            if (id !== 'default') {
              allAccounts.push({ accountId: id, displayName: id, source: 'mcp' });
            }
          }
        }
      } catch {}

      // 从 Slot Pool 获取账号的 slot 分配
      try {
        const slotRes = await xhsMcpApi.getSlots();
        if (slotRes?.success && slotRes.data) {
          setSlotInfo(slotRes.data);
          // 给每个账号标记 slotId
          const slotMap: Record<string, number> = {};
          slotRes.data.slots.forEach((s: any) => {
            if (s.accountId) slotMap[s.accountId] = s.slotId;
          });
          allAccounts.forEach(acc => {
            if (slotMap[acc.accountId] !== undefined) {
              acc.slotId = slotMap[acc.accountId];
            }
          });
        }
      } catch {}
      
      setAccounts(allAccounts);
      if (allAccounts.length > 0 && !selectedAccount) {
        setSelectedAccount(allAccounts[0].accountId);
      }
    } catch {}
    finally { setLoading(false); }
  }

  // =============================================
  // 扫码登录流程
  // =============================================

  /** 获取登录二维码 */
  async function handleGetQrCode() {
    setQrLoading(true);
    setQrExpired(false);
    setQrCodeImage(null);
    setMessage(null);
    try {
      const accountId = newAccountId.trim() || 'default';
      const res = await xhsMcpApi.getQrCode(accountId);
      if (res?.success && res?.data?.qrImage) {
        // 提取纯 base64（去掉 data:image/png;base64, 前缀）
        const rawB64 = res.data.qrImage.replace(/^data:image\/\w+;base64,/, '');
        setQrCodeImage(rawB64);
        const tip = res.data.switched ? '已登出旧账号，请扫码登录新账号' : (res.data.tip || '请用小红书App扫描二维码登录');
        setMessage({ type: 'info', text: `📱 ${tip}` });
        // 自动开始轮询登录状态
        pollLoginStatus(accountId);
      } else if (res?.data?.alreadyLoggedIn) {
        // 当前已有登录态，询问是否切换到新账号
        const switchMsg = accountId === 'default'
          ? '当前已有账号登录中（默认账号），如需重新扫码请手动登出'
          : `当前已有账号登录中！要将浏览器切换到「${accountId}」并重新扫码吗？（会登出当前账号）`;
        if (accountId !== 'default' && confirm(switchMsg)) {
          // 用户确认切换 → 强制登出后重新获取二维码
          setQrLoading(true);
          const res2 = await xhsMcpApi.getQrCode(accountId, true);
          if (res2?.success && res2?.data?.qrImage) {
            const rawB64 = res2.data.qrImage.replace(/^data:image\/\w+;base64,/, '');
            setQrCodeImage(rawB64);
            setMessage({ type: 'info', text: '📱 已登出旧账号，请用小红书App扫描二维码登录新账号' });
            pollLoginStatus(accountId);
          } else {
            throw new Error(res2?.error || '获取二维码失败');
          }
        } else {
          setMessage({ type: 'info', text: '💡 提示：如需切换账号，请先在账号列表中选择已有账号，然后点「重新扫码」' });
        }
      } else if (res?.data?.tip?.includes('已登录') || res?.data?.tip?.includes('已处于登录状态')) {
        // 已经是登录状态（default 账号）
        setMessage({ type: 'success', text: '✅ 默认账号已处于登录状态！' });
        setSelectedAccount(accountId);
        setNewAccountId('');
      } else {
        throw new Error(res?.error || '获取二维码失败');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `获取二维码失败：${err.message}` });
    } finally {
      setQrLoading(false);
    }
  }

  /** 轮询桥接登录状态 */
  async function pollLoginStatus(accountId: string) {
    setQrWaiting(true);
    const maxPolls = 48; // 最多轮询 4 分钟 (48 * 5s)
    let polls = 0;
    let captchaNotified = false;
    
    const poll = setInterval(async () => {
      polls++;
      try {
        const res = await xhsMcpApi.loginStatus(accountId);
        if (res?.data?.loggedIn) {
          clearInterval(poll);
          setMessage({ type: 'success', text: '✅ 登录成功！' });
          setQrCodeImage(null);
          setQrWaiting(false);
          setSelectedAccount(accountId);
          setNewAccountId('');
          if (accountId !== 'default') {
            try {
              const saved = localStorage.getItem('xhs_mcp_accounts');
              const ids: string[] = saved ? JSON.parse(saved) : [];
              if (!ids.includes(accountId)) {
                ids.push(accountId);
                localStorage.setItem('xhs_mcp_accounts', JSON.stringify(ids));
              }
            } catch {}
          }
          await loadAccounts();
        } else if (res?.data?.captchaNeeded && !captchaNotified) {
          captchaNotified = true;
          setMessage({ type: 'info', text: '🔐 需要验证码，AI 正在自动处理中，请稍候...' });
        }
      } catch {}
      
      if (polls >= maxPolls) {
        clearInterval(poll);
        setQrExpired(true);
        setQrWaiting(false);
        setMessage({ type: 'error', text: '⏰ 二维码已过期，请重新获取' });
      }
    }, 5000);
  }

  /** 解绑账号 */
  async function handleDeleteAccount(accountId: string) {
    if (accountId === 'default') {
      setMessage({ type: 'error', text: '默认账号不能删除' });
      return;
    }
    if (!confirm(`确定要移除账号 "${accountId}" 吗？`)) return;
    try {
      // 从 localStorage 移除
      const saved = localStorage.getItem('xhs_mcp_accounts');
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        const updated = ids.filter(id => id !== accountId);
        localStorage.setItem('xhs_mcp_accounts', JSON.stringify(updated));
      }
      setMessage({ type: 'success', text: `✅ 账号 ${accountId} 已移除` });
      if (selectedAccount === accountId) setSelectedAccount('default');
      await loadAccounts();
    } catch (err: any) {
      setMessage({ type: 'error', text: `移除失败：${err.message}` });
    }
  }

  async function handleCheckStatus(accountId: string) {
    try {
      const res = await xhsMcpApi.loginStatus(accountId);
      if (res?.success) {
        setLoginStatus({ hasSession: true, loggedIn: res.data.loggedIn });
        if (res.data.loggedIn) {
          setMessage({ type: 'success', text: `✅ 账号 ${accountId} 登录状态正常` });
        } else {
          setMessage({ type: 'error', text: `⚠️ 账号 ${accountId} 未登录，请重新扫码` });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `状态检查失败：${err.message}` });
    }
  }

  /** 登出并重新扫码（切换账号） */
  async function handleReLogin(accountId: string) {
    if (!confirm(`确定要登出并重新扫码登录「${accountId}」吗？当前活跃账号会被登出。`)) return;
    setQrLoading(true);
    setQrExpired(false);
    setQrCodeImage(null);
    try {
      // 先登出（清除所有 session）
      await xhsMcpApi.logout();
      // 然后强制获取新二维码
      const res = await xhsMcpApi.getQrCode(accountId, true);
      if (res?.success && res?.data?.qrImage) {
        const rawB64 = res.data.qrImage.replace(/^data:image\/\w+;base64,/, '');
        setQrCodeImage(rawB64);
        setSelectedAccount(accountId);
        setNewAccountId('');
        setMessage({ type: 'info', text: `📱 已登出，请用小红书App扫描二维码登录「${accountId}」` });
        pollLoginStatus(accountId);
      } else {
        throw new Error(res?.error || '获取二维码失败');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `重新扫码失败：${err.message}` });
    } finally {
      setQrLoading(false);
    }
  }

  // 选择文案方案（点击卡片切换）
  function handleSelectCopyPlan(idx: number) {
    const plan = aiCopyPlans[idx];
    if (!plan) return;
    setSelectedCopyIdx(idx);
    if (plan.title) setTitle(plan.title.slice(0, 20));
    if (plan.content) setContent(plan.content);
    if (plan.tags?.length) setTags(plan.tags.join(' '));
    setMessage({ type: 'success', text: `✅ 已选择「${plan.style}」风格文案` });
  }

  // 切换AI图片选中状态
  function toggleAiImage(idx: number) {
    setAiGeneratedImages(prev => prev.map((img, i) => {
      if (i !== idx) return img;
      return { ...img, selected: !img.selected };
    }));
  }

  // 将选中的AI图片同步到发布列表
  function syncSelectedAiImages() {
    const selectedB64 = aiGeneratedImages
      .filter(img => img.selected && img.base64)
      .map(img => img.base64!);
    // 保留用户手动上传的图 + 选中的AI图
    setImages([...images.filter(img => !img.startsWith('data:')), ...selectedB64].slice(0, 9));
    setMessage({ type: 'success', text: `✅ 已将 ${selectedB64.length} 张选中的AI图片加入发布列表` });
  }

  // 合并发布图片（过滤出纯base64格式，后端只接受 data:xxx;base64, 格式）
  function getPublishImages(): string[] {
    // 用户上传图 + 选中且有base64的AI图
    const userImages = images.filter(img => img.startsWith('data:'));
    const aiSelected = aiGeneratedImages.filter(img => img.selected && img.base64).map(img => img.base64!);
    const all = [...userImages, ...aiSelected];
    // 去重
    return [...new Set(all)].slice(0, 9);
  }

  async function handlePublishNote() {
    if (!selectedAccount) { setMessage({ type: 'error', text: '请先选择账号' }); return; }
    if (!title.trim() || !content.trim()) { setMessage({ type: 'error', text: '请填写标题和正文' }); return; }
    const publishImages = getPublishImages();
    if (publishImages.length === 0) { setMessage({ type: 'error', text: '请至少上传一张图片' }); return; }

    const tagList = tags.split(/[,，\s]+/).filter(t => t.trim());

    // 合规预检
    try {
      const check = await xhsMcpApi.checkCompliance({
        title: title.trim(),
        content: content.trim(),
        tags: tagList,
      });
      if (check?.data && !check.data.safe) {
        const risk = check.data.risk;
        const warns = check.data.warnings?.join('\n') || '';
        if (risk === 'high') {
          setMessage({ type: 'error', text: `⚠️ 内容违规，无法发布：\n${warns}` });
          return;
        }
        // medium risk: 弹窗确认
        const ok = window.confirm(`⚠️ 检测到以下风险词：\n\n${warns}\n\n仍要发布吗？`);
        if (!ok) return;
      }
    } catch (_) { /* 检测失败不阻塞发布 */ }

    setPublishing(true);
    setMessage({ type: 'info', text: '📤 通过 MCP 桥接发布中...' });

    try {
      const res = await xhsMcpApi.publishNote({
        accountId: selectedAccount,
        title: title.trim(),
        content: content.trim(),
        images: publishImages,
        tags: tagList,
        semiAuto: !!semiAuto,   // ✅ 传半自动标志
      });
      if (res?.success) {
        // 半自动模式：不清理表单，提示用户手动点发布
        if (res.data?.semiAuto) {
          setMessage({ type: 'success', text: '✅ 内容已自动填充！请在弹出的浏览器窗口中手动点击【发布】按钮' });
        } else {
          setMessage({ type: 'success', text: '✅ 小红书发布成功！' });
          setTitle('');
          setContent('');
          setImages([]);
          setTags('');
        }
      } else {
        throw new Error(res?.error || '发布失败');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `发布失败：${err.message}` });
    } finally {
      setPublishing(false);
    }
  }

  // 开始 SSE 实时监控（替代轮询）
  function startMonitoring(taskId: number) {
    setMonitorVisible(true);
    setMonitorScreenshot('');
    setMonitorStep(0);
    setMonitorStepName('等待本地引擎领取...');
    setMonitorLogs(['📋 任务已提交，等待本地 Playwright 引擎自动领取...']);

    // 关闭旧连接
    if (sseConnection) sseConnection.close();

    // 建立 SSE 连接
    const conn = api.publishQueue.stream(taskId, (event: any) => {
      if (event.type === 'connected') {
        setMonitorLogs(prev => [...prev, '🔌 监控已连接，等待本地引擎操作...']);
        return;
      }

      if (event.type === 'progress') {
        setMonitorStep(event.step || 0);
        setMonitorStepName(event.stepName || '');
        if (event.screenshot) {
          setMonitorScreenshot(event.screenshot);
        }
        if (event.log) {
          setMonitorLogs(prev => [...prev.slice(-50), event.log]);
        }
        setPublishTaskStatus('processing');
        setMessage({ type: 'info', text: `🤖 本地引擎: ${event.stepName || '执行中'}...（任务 #${taskId}）` });
      }
    });

    setSseConnection(conn);

    // 同时保留轻量轮询检测最终状态（SSE 可能不稳定）
    if (publishPollTimer) clearInterval(publishPollTimer);
    const timer = setInterval(async () => {
      try {
        const result = await api.publishQueue.getStatus(taskId);
        if (result?.success && result?.data) {
          const { status, error } = result.data;
          setPublishTaskStatus(status);

          if (status === 'completed') {
            clearInterval(timer);
            setPublishPollTimer(null);
            setPublishTaskId(null);
            conn.close();
            setSseConnection(null);
            setMonitorStepName('发布成功！');
            setMonitorLogs(prev => [...prev, '✅ 发布成功！']);
            setMessage({ type: 'success', text: '✅ 图文笔记发布成功！本地引擎已完成自动填表' });
            clearForm();
            // 5秒后自动关闭监控
            setTimeout(() => setMonitorVisible(false), 5000);
          } else if (status === 'failed') {
            clearInterval(timer);
            setPublishPollTimer(null);
            setPublishTaskId(null);
            conn.close();
            setSseConnection(null);
            setMonitorStepName('发布失败');
            setMonitorLogs(prev => [...prev, `❌ 发布失败: ${error || '引擎执行异常'}`]);
            setMessage({ type: 'error', text: `❌ 发布失败：${error || '引擎执行异常'}` });
          }
        }
      } catch (e) {
        // 轮询失败不中断
      }
    }, 5000);
    setPublishPollTimer(timer);

    // 最多监控 5 分钟
    setTimeout(() => {
      clearInterval(timer);
      setPublishPollTimer(null);
      conn.close();
      if (publishTaskId === taskId) {
        setPublishTaskId(null);
        setMessage({ type: 'error', text: '⏰ 发布超时，请稍后在任务列表查看结果' });
      }
    }, 300000);
  }

  // 通过Chrome扩展在本地浏览器发布
  async function publishViaExtension(publishData: any) {
    try {
      const extResult = await api.accounts.extensionRequest('publish', {
        platform: 'xiaohongshu',
        publishData,
      });
      if (extResult?.success) {
        setMessage({ type: 'success', text: '✅ 已打开小红书创作者中心！表单已自动填写，请确认后点击发布按钮' });
      } else {
        setMessage({ type: 'error', text: `扩展发布失败：${extResult?.error || '请确保已安装 Claw Chrome 扩展'}` });
      }
    } catch (extErr: any) {
      setMessage({ type: 'error', text: `扩展通信失败：${extErr.message || '请确保已安装 Claw Chrome 扩展并刷新页面'}` });
    }
  }

  async function handlePublishVideo() {
    if (!selectedAccount) { setMessage({ type: 'error', text: '请先选择账号' }); return; }
    if (!videoFile) { setMessage({ type: 'error', text: '请上传视频文件' }); return; }
    if (!videoTitle.trim()) { setMessage({ type: 'error', text: '请填写标题' }); return; }

    // 合规预检
    try {
      const check = await xhsMcpApi.checkCompliance({ title: videoTitle, content: videoDesc });
      if (check?.data && !check.data.safe && check.data.risk === 'high') {
        setMessage({ type: 'error', text: `⚠️ 内容违规：${check.data.warnings?.join('; ')}` });
        return;
      }
    } catch (_) {}

    setPublishing(true);
    setMessage(null);
    try {
      const result = await api.xiaohongshu?.publishVideo?.({
        accountId: selectedAccount,
        title: videoTitle.trim(),
        content: videoDesc.trim(),
        videoBase64: videoFile,
        semiAuto: !!semiAuto,   // ✅ 传半自动标志
      });
      if (result?.success) {
        // 半自动模式：不清理表单，提示用户手动点发布
        if (result.data?.semiAuto) {
          setMessage({ type: 'success', text: '✅ 内容已自动填充！请在弹出的浏览器窗口中手动点击【发布】按钮' });
        } else {
          setMessage({ type: 'success', text: '✅ 视频笔记发布成功！' });
          clearForm();
        }
      } else {
        setMessage({ type: 'error', text: result?.error || '发布失败' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '发布失败，请稍后重试' });
    } finally {
      setPublishing(false);
    }
  }

  async function handlePublishProduct() {
    if (!selectedAccount) { setMessage({ type: 'error', text: '请先选择账号' }); return; }
    if (!title.trim() && !content.trim()) {
      setMessage({ type: 'error', text: '请先选择发布方案并填入发布资料' });
      return;
    }

    // 合规预检
    try {
      const tagList = tags.split(/[,，\s]+/).filter(t => t.trim());
      const check = await xhsMcpApi.checkCompliance({ title, content, tags: tagList });
      if (check?.data && !check.data.safe && check.data.risk === 'high') {
        setMessage({ type: 'error', text: `⚠️ 内容违规：${check.data.warnings?.join('; ')}` });
        return;
      }
    } catch (_) {}

    setPublishing(true);
    setMessage(null);
    try {
      const publishImages = images.filter(img => img.startsWith('data:')); // 只发base64图片
      if (publishImages.length === 0) {
        setMessage({ type: 'error', text: '请确保有可发布的图片（AI URL图片需转换后才能发布）' });
        setPublishing(false);
        return;
      }
      const tagList = tags.split(/[,，\s]+/).filter(t => t.trim());
      const result = await api.xiaohongshu?.publishNote?.({
        accountId: selectedAccount,
        title: title.trim() || '好物推荐',
        content: content.trim() || `推荐好物：${productUrl}`,
        images: publishImages,
        tags: tagList.length > 0 ? tagList : ['好物推荐', '产品分享'],
        semiAuto: !!semiAuto,
      });
      if (result?.success) {
        if (result.data?.semiAuto) {
          setMessage({ type: 'success', text: '✅ 内容已自动填充！请在弹出的浏览器窗口中手动点击【发布】按钮' });
        } else {
          setMessage({ type: 'success', text: '✅ 商品发布成功！' });
          clearForm();
        }
      } else {
        setMessage({ type: 'error', text: result?.error || '发布失败' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '发布失败，请稍后重试' });
    } finally {
      setPublishing(false);
    }
  }

  async function handlePublish() {
    if (publishType === 'note') await handlePublishNote();
    else if (publishType === 'video') await handlePublishVideo();
    else await handlePublishProduct();
  }

  const isAiBusy = aiAnalyzing || aiGeneratingCopy || aiGeneratingImg;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📕</span>
        <h1 className="text-xl font-bold text-gray-900">小红书</h1>
      </div>

      {/* 一级 Tab */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('accounts')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'accounts' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
        >
          📕 账号管理
        </button>
        <button
          onClick={() => setTab('publish')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'publish' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
        >
          ✍️ 发布内容
        </button>
      </div>

      {/* 发布类型切换 */}
      {tab === 'publish' && (
        <div className="flex gap-2 mb-6">
          {[
            { key: 'note', icon: '📝', label: '发布图文' },
            { key: 'video', icon: '🎬', label: '发布视频' },
            { key: 'product', icon: '🚀', label: 'AI商品搬运' },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setPublishType(key as any)}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                publishType === key
                  ? 'bg-red-50 border-red-500 text-red-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="text-lg">{icon}</span>
              <p>{label}</p>
            </button>
          ))}
        </div>
      )}

      {/* 消息提示 */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-start gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200'
          : message.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200'
          : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'info' && (
            <span className="animate-spin text-base">⚙️</span>
          )}
          <span>{message.text}</span>
          {/* 监控中时显示打开监控面板按钮 */}
          {publishTaskId && !monitorVisible && (
            <button
              onClick={() => setMonitorVisible(true)}
              className="ml-auto px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              📺 打开监控
            </button>
          )}
        </div>
      )}

      {/* 实时监控面板 */}
      {monitorVisible && publishTaskId && (
        <div className="mb-4 bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          {/* 监控头部 */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-sm text-green-400 font-medium">实时监控</span>
              <span className="text-xs text-gray-400">任务 #{publishTaskId}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                Step {monitorStep}: <span className="text-gray-300">{monitorStepName}</span>
              </span>
              <button
                onClick={() => { setMonitorVisible(false); }}
                className="text-gray-400 hover:text-gray-200 transition-colors text-sm"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="flex">
            {/* 左侧：实时截图 */}
            <div className="w-1/2 p-3 border-r border-gray-700">
              <div className="text-xs text-gray-400 mb-2">📸 浏览器操作画面</div>
              {monitorScreenshot ? (
                <img
                  src={monitorScreenshot}
                  alt="浏览器操作截图"
                  className="w-full rounded-lg border border-gray-600"
                />
              ) : (
                <div className="w-full aspect-[4/3] bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🤖</div>
                    <div className="text-gray-500 text-sm">等待本地引擎操作...</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 右侧：操作日志 */}
            <div className="w-1/2 p-3">
              <div className="text-xs text-gray-400 mb-2">📋 操作日志</div>
              <div className="h-64 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                {monitorLogs.map((logLine, i) => (
                  <div
                    key={i}
                    className={`text-xs font-mono leading-relaxed ${
                      logLine.includes('✅') || logLine.includes('成功') ? 'text-green-400' :
                      logLine.includes('❌') || logLine.includes('失败') ? 'text-red-400' :
                      logLine.includes('⚠️') ? 'text-yellow-400' :
                      'text-gray-300'
                    }`}
                  >
                    {logLine}
                  </div>
                ))}
                {/* 自动滚动到最新 */}
                <div id="monitor-log-end" />
              </div>
            </div>
          </div>
          
          {/* 底部进度条 */}
          <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((monitorStep / 10) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">{monitorStep}/10</span>
            </div>
          </div>
        </div>
      )}

      {/* 账号管理 */}
      {tab === 'accounts' && (
        <div className="space-y-6">
          {/* 扫码登录区域 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📱</span>
              <h2 className="text-lg font-semibold">扫码登录</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">小红书App</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              用小红书App扫描二维码即可登录，登录状态自动保存，无需重复扫码
            </p>

            {/* Slot 状态栏 */}
            {slotInfo && (
              <div className={`mb-4 p-3 rounded-lg text-xs ${slotInfo.free === 0 ? 'bg-red-50 border border-red-200' : 'bg-indigo-50 border border-indigo-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">🖥️ Slot 池状态</span>
                  <span className="font-mono">
                    {slotInfo.free}/{slotInfo.total} 空闲
                  </span>
                </div>
                <div className="flex gap-1 mt-2">
                  {slotInfo.slots.map((s: any) => (
                    <div
                      key={s.slotId}
                      title={`Slot ${s.slotId} (${s.port})${s.accountId ? ': ' + s.accountId : ': 空闲'}${s.loggedIn ? ' [已登录]' : ''}`}
                      className={`flex-1 h-2 rounded ${s.free ? 'bg-green-400' : s.loggedIn ? 'bg-indigo-500' : 'bg-yellow-400'}`}
                    />
                  ))}
                </div>
                {slotInfo.free === 0 && (
                  <p className="mt-2 text-red-600 font-medium">⚠️ 所有席位已满（5/5），请先登出其他账号再添加新账号</p>
                )}
              </div>
            )}

            {/* 新账号ID输入 */}
            <div className="flex gap-2 mb-4">
              <input
                value={newAccountId}
                onChange={e => setNewAccountId(e.target.value)}
                placeholder="账号标识（可选，默认为 default）"
                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                disabled={qrLoading || qrWaiting}
              />
              <button
                onClick={handleGetQrCode}
                disabled={qrLoading || qrWaiting}
                className="px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
              >
                {qrLoading ? '⏳ 生成中...' : '获取二维码'}
              </button>
            </div>

            {/* 二维码展示 */}
            {qrCodeImage && (
              <div className="flex flex-col items-center py-4">
                <div className={`relative p-3 bg-white rounded-xl border-2 ${qrExpired ? 'border-red-300' : 'border-gray-200'} ${qrWaiting ? 'animate-pulse' : ''}`}>
                  <img
                    src={`data:image/png;base64,${qrCodeImage}`}
                    alt="小红书登录二维码"
                    className="w-48 h-48 object-contain"
                  />
                  {qrWaiting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 rounded-xl">
                      <div className="text-center">
                        <div className="text-2xl mb-1">📱</div>
                        <p className="text-xs text-gray-600">等待扫码...</p>
                      </div>
                    </div>
                  )}
                  {qrExpired && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-xl">
                      <div className="text-center">
                        <div className="text-2xl mb-1">⏰</div>
                        <p className="text-xs text-red-500">已过期</p>
                        <button
                          onClick={handleGetQrCode}
                          className="mt-1 text-xs text-red-500 underline hover:text-red-700"
                        >
                          点击刷新
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  {qrWaiting && '⏳ 请在小红书App中扫描二维码...'}
                  {!qrWaiting && !qrExpired && '📱 打开小红书App → 扫一扫'}
                  {qrExpired && '⏰ 二维码已过期，请重新获取'}
                </p>
              </div>
            )}
          </div>

          {/* 已绑定账号列表 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">📕 已绑定账号</h2>
              <button
                onClick={loadAccounts}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                刷新
              </button>
            </div>
            {loading ? (
              <p className="text-gray-400 text-sm py-4 text-center">加载中...</p>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-3">📕</div>
                <p className="text-lg mb-1">暂无绑定账号</p>
                <p className="text-sm">点击上方「获取二维码」开始扫码登录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((acc: any) => {
                  const accId = acc.accountId || acc.id;
                  const isActive = selectedAccount === accId;
                  return (
                    <div
                      key={acc.id || acc.accountId}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() => { setSelectedAccount(accId); }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          isActive ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          📕
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {acc.displayName || accId}
                          </p>
                          <p className="text-xs text-gray-400">
                            绑定时间：{acc.boundAt ? new Date(acc.boundAt).toLocaleString('zh-CN') : '未知'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {acc.slotId !== undefined && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono">
                            Slot #{acc.slotId}
                          </span>
                        )}
                        {isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">当前选中</span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReLogin(accId); }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                          title="登出并重新扫码"
                        >
                          重新扫码
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCheckStatus(accId); }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          检查状态
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteAccount(accId); }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        >
                          解绑
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 登录状态提示 */}
          {loginStatus && selectedAccount && (
            <div className={`p-4 rounded-xl border ${
              loginStatus.loggedIn
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{loginStatus.loggedIn ? '✅' : '⚠️'}</span>
                <div>
                  <p className={`font-medium text-sm ${loginStatus.loggedIn ? 'text-green-800' : 'text-yellow-800'}`}>
                    {loginStatus.loggedIn
                      ? `账号 "${selectedAccount}" 登录状态正常`
                      : `账号 "${selectedAccount}" 登录已过期`}
                  </p>
                  {!loginStatus.loggedIn && (
                    <p className="text-xs text-yellow-600 mt-1">
                      请重新获取二维码并扫码登录以刷新 session
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 使用说明 */}
          <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
            <p className="text-sm font-medium text-red-800 mb-2">💡 使用说明</p>
            <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
              <li>点击「获取二维码」→ 用小红书App扫码 → 自动保存登录状态</li>
              <li>登录状态保存在服务器端，长期有效（除非小红书强制过期）</li>
              <li>支持多账号：输入不同的「账号标识」即可绑定多个小红书账号</li>
              <li>发布内容时选择对应账号即可，无需重复登录</li>
              <li>如提示「登录已过期」，请重新扫码刷新</li>
            </ul>
          </div>
        </div>
      )}

      {/* 发布内容区域 */}
      {tab === 'publish' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">
            {publishType === 'note' && '📝 发布图文'}
            {publishType === 'video' && '🎬 发布视频'}
            {publishType === 'product' && '🚀 AI 商品搬运'}
          </h2>

          <div className="space-y-4">
            {/* 选择账号 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择账号</label>
              <select
                value={selectedAccount}
                onChange={e => setSelectedAccount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">请先选择账号</option>
                {accounts.map((acc: any) => (
                  <option key={acc.accountId || acc.id} value={acc.accountId || acc.id}>
                    {acc.displayName || acc.name || acc.account_data?.nickname || acc.accountId || acc.id}
                    {acc.source === 'file' ? ' 📕' : ' ☁️'}
                  </option>
                ))}
              </select>
              {loginStatus && (
                <p className={`text-xs mt-1 ${loginStatus.loggedIn ? 'text-green-600' : 'text-red-500'}`}>
                  {loginStatus.loggedIn ? '✅ 已登录' : '⚠️ 未登录，请先扫码登录'}
                </p>
              )}
            </div>

            {/* ====================== 图文发布表单 ====================== */}
            {publishType === 'note' && (
              <>
                {/* 图片上传区域 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    上传图片
                    <span className="ml-2 text-xs text-gray-400">{images.length}/9 张</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors">
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" id="image-upload" />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-red-500 text-2xl">📷</span>
                      <p className="text-sm text-gray-500 mt-1">点击选择图片或拖拽到此处</p>
                      <p className="text-xs text-gray-400">支持 JPG/PNG，最多 9 张</p>
                    </label>
                  </div>

                  {/* 原始图 + AI选中图 统一预览 */}
                  {images.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">📷 发布图片预览（{getPublishImages().length}/9 张）</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {images.filter(img => img.startsWith('data:')).map((img, idx) => (
                          <div key={`user-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <img src={img} alt={`上传${idx + 1}`} className="w-full h-full object-cover" />
                            <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center">×</button>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500/50 to-transparent text-white text-xs text-center py-0.5">
                              {idx < images.length - aiGeneratedImages.filter(i => i.base64).length ? '手动上传' : 'AI生成'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ===== AI 工具面板 ===== */}
                {images.length > 0 && (
                  <div className="border border-purple-200 rounded-xl overflow-hidden">
                    {/* 面板 Header */}
                    <button
                      onClick={() => setShowAiPanel(!showAiPanel)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 font-medium text-sm hover:from-purple-100 hover:to-pink-100 transition-colors"
                    >
                      <span>🤖 AI 智能助手（多文案 + AI配图）</span>
                      <span>{showAiPanel ? '▲' : '▼'}</span>
                    </button>

                    {showAiPanel && (
                      <div className="p-4 space-y-4 bg-white">

                        {/* 一键AI全流程 */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                          <p className="text-sm font-semibold text-purple-800 mb-2">⚡ 一键 AI 全流程</p>
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-purple-600">配图风格：</span>
                              {IMG_STYLES.map(s => (
                                <button
                                  key={s.value}
                                  onClick={() => setImgStyle(s.value)}
                                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${imgStyle === s.value ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-600 border-orange-200 hover:border-orange-400'}`}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-purple-600">生成图片数：</span>
                              {[1, 2, 3, 5, 8].map(n => (
                                <button
                                  key={n}
                                  onClick={() => setAiImgCount(n)}
                                  className={`w-7 h-7 text-xs rounded-full border transition-colors ${aiImgCount === n ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400'}`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={handleAiAutoFill}
                            disabled={isAiBusy}
                            className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {isAiBusy ? '⚙️ AI 处理中...' : '🚀 一键：识别图片 → 生成4种文案 + AI配图'}
                          </button>
                          <p className="text-xs text-purple-500 mt-1">自动识别图片→生成4种风格文案→批量AI配图→一键填入</p>
                        </div>

                        {/* ===== 4种文案选择卡片 ===== */}
                        {aiCopyPlans.length > 0 && (
                          <div className="border border-green-200 rounded-lg p-3 bg-green-50/30">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-semibold text-green-800">✍️ 选择文案风格（点击选中填入表单）</p>
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{aiCopyPlans.length} 种可选</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {aiCopyPlans.map((plan: any, idx: number) => (
                                <div
                                  key={idx}
                                  onClick={() => handleSelectCopyPlan(idx)}
                                  className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                                    selectedCopyIdx === idx
                                      ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-200'
                                      : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                        selectedCopyIdx === idx ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                      }`}>
                                        {selectedCopyIdx === idx ? '✓' : idx + 1}
                                      </span>
                                      <span className={`text-sm font-medium ${selectedCopyIdx === idx ? 'text-green-800' : 'text-gray-700'}`}>
                                        {plan.style || `风格${idx + 1}`}
                                      </span>
                                    </div>
                                    {selectedCopyIdx === idx && (
                                      <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✅ 已选中</span>
                                    )}
                                  </div>
                                  {plan.title && (
                                    <p className="text-xs font-semibold text-gray-800 ml-8 mb-1">{plan.title}</p>
                                  )}
                                  {plan.content && (
                                    <p className="text-xs text-gray-500 ml-8 line-clamp-2">{plan.content.slice(0, 100)}...</p>
                                  )}
                                  {plan.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1 ml-8">
                                      {plan.tags.slice(0, 5).map((tag: string, i: number) => (
                                        <span key={i} className="text-xs text-red-400">#{tag}</span>
                                      ))}
                                      {plan.tags.length > 5 && <span className="text-xs text-gray-400">+{plan.tags.length - 5}</span>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ===== AI 生成图片选择网格 ===== */}
                        {aiGeneratedImages.length > 0 && (
                          <div className="border border-orange-200 rounded-lg p-3 bg-orange-50/30">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-semibold text-orange-800">🎨 AI 生成配图（勾选要发布的图片）</p>
                              <button
                                onClick={syncSelectedAiImages}
                                className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full hover:bg-orange-200 transition-colors"
                              >
                                🔄 同步到发布列表
                              </button>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {aiGeneratedImages.map((img, idx) => (
                                <div
                                  key={idx}
                                  className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                                    img.selected
                                      ? 'border-orange-500 shadow-md ring-2 ring-orange-200'
                                      : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300'
                                  }`}
                                  onClick={() => toggleAiImage(idx)}
                                >
                                  <img
                                    src={img.url}
                                    alt={`AI配图${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  {/* 勾选框 */}
                                  <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs transition-colors ${
                                    img.selected
                                      ? 'bg-orange-500 border-orange-500 text-white'
                                      : 'bg-white border-gray-300'
                                  }`}>
                                    {img.selected ? '✓' : ''}
                                  </div>
                                  {/* AI 标记 */}
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent text-white text-xs text-center py-0.5">
                                    AI生成
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-orange-600 mt-2">
                              💡 已选 {aiGeneratedImages.filter(i => i.selected).length}/{aiGeneratedImages.length} 张，点击图片切换选中状态
                            </p>
                          </div>
                        )}

                        <div className="border-t border-gray-100 pt-3">
                          <p className="text-xs font-semibold text-gray-500 mb-3">— 或分步执行 —</p>

                          {/* Step 1: 识别 */}
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Step 1 · 识别图片</p>
                            <button
                              onClick={handleAnalyzeImage}
                              disabled={isAiBusy}
                              className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {aiAnalyzing ? '🔍 识别中...' : '🔍 AI 识别图片内容'}
                            </button>
                            {imageAnalysis && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                                <p>📦 {imageAnalysis.productName || '未知商品'} · {imageAnalysis.category || ''}</p>
                                {imageAnalysis.features?.length > 0 && (
                                  <p>✨ {imageAnalysis.features.join(' · ')}</p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Step 2: 单独文案 */}
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Step 2 · 生成文案</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {COPY_STYLES.map(s => (
                                <button
                                  key={s.value}
                                  onClick={() => setCopyStyle(s.value)}
                                  title={s.desc}
                                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${copyStyle === s.value ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'}`}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={handleGenerateCopy}
                              disabled={isAiBusy}
                              className="w-full py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {aiGeneratingCopy ? '✍️ 生成中...' : '✍️ AI 生成标题/正文/标签'}
                            </button>
                          </div>

                          {/* Step 3: 单独图生图 */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Step 3 · AI 图生图 <span className="text-xs font-normal text-gray-400">（风格迁移，约15-40秒）</span></p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {IMG_STYLES.map(s => (
                                <button
                                  key={s.value}
                                  onClick={() => setImgStyle(s.value)}
                                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${imgStyle === s.value ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={handleImageToImage}
                              disabled={isAiBusy}
                              className="w-full py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {aiGeneratingImg ? '🎨 生成中...' : `🎨 图生图（${imgStyle}风格）`}
                            </button>
                            <p className="text-xs text-gray-400 mt-1">AI 生成的图片将显示在下方选择区供勾选</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* AI 快捷按钮（未上传图片时隐藏面板但显示提示） */}
                {images.length === 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-3">
                    <p className="text-sm text-purple-600">💡 上传图片后，可使用 AI 自动识别商品并生成文案</p>
                  </div>
                )}

                {/* 标题 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">标题 <span className="text-gray-400">（最多 20 字）</span></label>
                    {aiGeneratingCopy && <span className="text-xs text-purple-500 animate-pulse">AI 生成中...</span>}
                  </div>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value.slice(0, 20))}
                    placeholder="输入笔记标题，或点击 AI 自动生成..."
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/20</p>
                </div>

                {/* 正文 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">正文</label>
                    {content && (
                      <span className="text-xs text-gray-400">{content.length} 字</span>
                    )}
                  </div>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="输入笔记内容，或点击 AI 自动生成..."
                    rows={8}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-vertical"
                  />
                </div>

                {/* 标签 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                  <input
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="例如：穿搭分享 日常穿搭 显瘦穿搭（用空格或逗号分隔）"
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  />
                  {tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tags.split(/[,，\s]+/).filter(t => t.trim()).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full border border-red-100">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">添加话题标签可增加曝光</p>
                </div>
              </>
            )}

            {/* ====================== 视频笔记表单 ====================== */}
            {publishType === 'video' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">上传视频</label>
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors">
                    <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" id="video-upload" />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <span className="text-purple-500 text-2xl">🎬</span>
                      <p className="text-sm text-gray-500 mt-1">点击选择视频文件</p>
                      <p className="text-xs text-gray-400">支持 MP4/MOV，最大 500MB</p>
                    </label>
                  </div>
                  {videoFile && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-700">✅ 视频已加载</p>
                      <button onClick={() => setVideoFile(null)} className="text-xs text-purple-500 hover:text-purple-700 mt-1">移除视频</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                  <input value={videoTitle} onChange={e => setVideoTitle(e.target.value.slice(0, 20))} placeholder="输入视频标题..." className="w-full p-2 border border-gray-300 rounded-lg text-sm" maxLength={20} />
                  <p className="text-xs text-gray-400 mt-1 text-right">{videoTitle.length}/20</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea value={videoDesc} onChange={e => setVideoDesc(e.target.value)} placeholder="输入视频描述..." rows={4} className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-vertical" />
                </div>
              </>
            )}

            {/* ====================== AI 商品搬运 ====================== */}
            {publishType === 'product' && (
              <>
                {/* Step 0: 输入链接 */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🚀</span>
                    <h3 className="font-semibold text-orange-800">AI 商品搬运</h3>
                    <span className="text-xs text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">一键全流程</span>
                  </div>
                  <p className="text-xs text-orange-600 mb-3">
                    粘贴产品链接 → 自动抓取 → AI竞品分析 → 生成高竞争力文案+图片 → 自动填表 → 发布
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={productUrl}
                      onChange={e => setProductUrl(e.target.value)}
                      placeholder="粘贴产品链接（1688/淘宝/京东/拼多多/亚马逊等）"
                      className="flex-1 p-2.5 border border-orange-300 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none"
                      disabled={pipelineBusy}
                    />
                    <button
                      onClick={handlePipelineFetch}
                      disabled={pipelineBusy || !productUrl.trim()}
                      className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-all"
                    >
                      {pipelineBusy ? '⏳ 处理中...' : '🔍 一键抓取+分析'}
                    </button>
                  </div>

                  {/* 流程进度指示 */}
                  {pipelineStep > 0 && (
                    <div className="mt-3 flex items-center gap-1 text-xs">
                      {[
                        { s: 1, label: '抓取产品' },
                        { s: 2, label: '抓取完成' },
                        { s: 3, label: 'AI分析' },
                        { s: 4, label: '选择方案' },
                      ].map(({ s, label }, idx) => (
                        <React.Fragment key={s}>
                          {idx > 0 && <span className="text-gray-300">→</span>}
                          <span className={`px-2 py-0.5 rounded-full ${
                            pipelineStep >= s
                              ? pipelineStep === s && pipelineBusy
                                ? 'bg-orange-100 text-orange-600 animate-pulse'
                                : 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {pipelineStep > s ? '✅' : pipelineStep === s && pipelineBusy ? '⏳' : `${s}.`}{label}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>

                {/* 抓取到的产品预览 */}
                {fetchedProduct && (
                  <div className="border border-blue-200 rounded-xl overflow-hidden">
                    <div className="bg-blue-50 px-4 py-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800">📦 抓取到的产品</span>
                      <span className="text-xs text-blue-500">{fetchedProduct.platform || 'unknown'}</span>
                    </div>
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 text-sm mb-2">{fetchedProduct.title}</h4>
                      {fetchedProduct.price && (
                        <p className="text-lg font-bold text-red-600 mb-2">¥{fetchedProduct.price}</p>
                      )}
                      {fetchedProduct.description && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-3">{fetchedProduct.description}</p>
                      )}
                      {/* 产品图片预览 */}
                      {(fetchedProduct.images?.length > 0 || fetchedProduct.imageUrls?.length > 0) && (
                        <div className="grid grid-cols-4 gap-2">
                          {(fetchedProduct.imageUrls || fetchedProduct.images)?.slice(0, 8).map((img: string, idx: number) => (
                            <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                              <img
                                src={img.startsWith('data:') ? img : img}
                                alt={`产品图${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 竞品分析结果 + 方案选择 */}
                {competitiveResult && (
                  <div className="border border-purple-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3">
                      <span className="text-sm font-semibold text-purple-800">🧠 AI 竞品分析结果</span>
                    </div>

                    {/* 分析摘要 */}
                    {competitiveResult.analysis && (
                      <div className="p-4 bg-white border-b border-purple-100">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-orange-50 p-2 rounded-lg">
                            <p className="text-xs text-orange-600 mb-1">💰 建议定价</p>
                            <p className="text-sm font-bold text-orange-800">
                              {competitiveResult.analysis.priceSuggestion || '待分析'}
                            </p>
                          </div>
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <p className="text-xs text-blue-600 mb-1">📊 市场洞察</p>
                            <p className="text-xs text-blue-800">
                              {competitiveResult.analysis.marketInsight || '待分析'}
                            </p>
                          </div>
                        </div>
                        {competitiveResult.analysis.topSellingPoints?.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">🔥 核心卖点</p>
                            <div className="flex flex-wrap gap-1">
                              {competitiveResult.analysis.topSellingPoints.map((sp: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full border border-red-100">
                                  {sp}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 方案A / 方案B 选择 */}
                    <div className="p-4 space-y-3">
                      <p className="text-sm font-medium text-gray-700">选择发布方案（点击方案卡片选中并填入表单）：</p>
                      {[{ key: 'A', plan: competitiveResult.planA }, { key: 'B', plan: competitiveResult.planB }].map(({ key, plan }) => (
                        plan && (
                          <div
                            key={key}
                            className={`border-2 rounded-xl overflow-hidden transition-all ${
                              selectedPlan === key
                                ? 'border-purple-500 shadow-md ring-2 ring-purple-200'
                                : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                            }`}
                          >
                            {/* 方案头部 — 点击选中 */}
                            <div
                              onClick={() => applyPlan(key as 'A' | 'B')}
                              className={`cursor-pointer p-4 transition-colors ${
                                selectedPlan === key ? 'bg-purple-50' : 'bg-white hover:bg-purple-50/50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                    selectedPlan === key ? 'bg-purple-500 text-white shadow-sm' : 'bg-gray-200 text-gray-500'
                                  }`}>
                                    {selectedPlan === key ? '✓' : key}
                                  </span>
                                  <span className="font-medium text-sm">{plan.style || `方案${key}`}</span>
                                </div>
                                {selectedPlan === key ? (
                                  <span className="text-xs text-purple-600 bg-purple-100 px-3 py-1 rounded-full font-medium">✅ 已选中</span>
                                ) : (
                                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">点击选择</span>
                                )}
                              </div>
                              <h5 className="font-semibold text-gray-900 text-sm mb-1">{plan.title}</h5>
                              <p className="text-xs text-gray-500 line-clamp-3 mb-2">{plan.content?.slice(0, 150)}...</p>
                              {plan.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {plan.tags.slice(0, 6).map((tag: string, i: number) => (
                                    <span key={i} className="text-xs text-red-500">#{tag}</span>
                                  ))}
                                  {plan.tags.length > 6 && <span className="text-xs text-gray-400">+{plan.tags.length - 6}</span>}
                                </div>
                              )}
                            </div>
                            {/* 应用按钮 — 选中后出现 */}
                            {selectedPlan === key && (
                              <div className="px-4 pb-3">
                                <button
                                  onClick={() => applyPlan(key as 'A' | 'B')}
                                  className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                                >
                                  ✅ 已应用方案{key}到发布表单
                                </button>
                              </div>
                            )}
                            {plan.sellingPoints?.length > 0 && (
                              <div className="px-4 pb-3 flex flex-wrap gap-1">
                                {plan.sellingPoints.map((sp: string, i: number) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-100">
                                    {sp}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* 已填写的表单预览（方案选择后显示） */}
                {(title || content) && publishType === 'product' && (
                  <div className="space-y-3 border-t border-gray-100 pt-4">
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      ✍️ 发布资料预览
                      <span className="text-xs text-gray-400">（可手动修改）</span>
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                      <input value={title} onChange={e => setTitle(e.target.value.slice(0, 20))} className="w-full p-2 border border-gray-300 rounded-lg text-sm" maxLength={20} />
                      <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/20</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">正文</label>
                      <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-vertical" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                      <input value={tags} onChange={e => setTags(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                      {tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tags.split(/[,，\s]+/).filter(t => t.trim()).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full border border-red-100">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* 产品图片（从抓取得到的） */}
                    {images.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">📷 产品图片（{images.length}张）</p>
                        <div className="grid grid-cols-4 gap-2">
                          {images.slice(0, 9).map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                              <img src={img} alt={`产品${idx + 1}`} className="w-full h-full object-cover" />
                              <button onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* 定价建议 */}
                    {competitiveResult?.analysis?.priceSuggestion && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                        <span className="text-sm">💰</span>
                        <span className="text-sm text-yellow-800">AI 建议定价：<strong>{competitiveResult.analysis.priceSuggestion}</strong></span>
                      </div>
                    )}
                  </div>
                )}

                {/* 自动/手动发布切换 */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🤖</span>
                    <span className="text-sm text-gray-700">自动发布</span>
                  </div>
                  <button
                    onClick={() => setAutoPublish(!autoPublish)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoPublish ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoPublish ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-xs text-gray-400">{autoPublish ? '✅ 自动发布：填表后自动提交到小红书' : '✋ 手动发布：填表后需手动点击发布按钮'}</p>
              </>
            )}

            {/* 半自动模式开关 */}
            {tab === 'publish' && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-sm">🖱️ 半自动模式</span>
                <button
                  onClick={() => setSemiAuto(!semiAuto)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${semiAuto ? 'bg-orange-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${semiAuto ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-xs text-orange-700">{semiAuto ? '✅ 开启：后端填表后留给你手动点发布（降低检测风险）' : '🤖 关闭：后端自动填表+自动点发布'}</span>
              </div>
            )}

            {/* 发布按钮 */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handlePublish}
                disabled={publishing || loading || isAiBusy}
                className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                  publishing || loading || isAiBusy
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : publishType === 'note'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : publishType === 'video'
                    ? 'bg-purple-500 hover:bg-purple-600 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {publishing
                  ? '⏳ 发布中...'
                  : publishType === 'note'
                  ? '📝 发布图文笔记'
                  : publishType === 'video'
                  ? '🎬 发布视频笔记'
                  : '🚀 发布到小红书'}
              </button>
              <button
                onClick={clearForm}
                className="px-4 py-3 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                清空
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部说明 */}
      {tab === 'publish' && (
        <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
          <p className="text-sm text-red-700">
            {publishType === 'note' && '📝 图文笔记：上传图片后可用 AI 一键识别+生成文案，支持图生图风格转换'}
            {publishType === 'video' && '🎬 视频笔记：上传视频文件 + 标题 + 描述，适合动态展示'}
            {publishType === 'product' && '🚀 AI商品搬运：粘贴产品链接→自动抓取→竞品分析→生成高竞争力文案→一键发布'}
          </p>
          <p className="text-xs text-red-500 mt-1">💡 提示：发布前请确认账号已登录，内容符合社区规范</p>
        </div>
      )}
    </div>
  );
}
