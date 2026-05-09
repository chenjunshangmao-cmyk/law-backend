/**
 * FacebookPage - Facebook 发布管理页面
 * - 个人主页：发布图片/视频
 * - 公共主页：发布图片/视频
 * 参考 XiaohongshuPage.tsx 和 YouTubePage.tsx 的 UI 模式
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LogIn, LogOut, RefreshCw, Image, Video, Send,
  User, Building2, AlertCircle, CheckCircle, XCircle,
  Loader2, Upload, FileVideo, Trash2, Eye
} from 'lucide-react';
import { authFetch } from '../services/api';

type TabType = 'profile' | 'page';
type MediaType = 'image' | 'video' | null;
type PublishStatus = 'idle' | 'publishing' | 'success' | 'error';

interface FacebookPage {
  id: string;
  name: string;
}

interface TwoFAState {
  visible: boolean;
  code: string;
  loading: boolean;
}

export default function FacebookPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  
  // 账号状态
  const [accountId] = useState('facebook_default');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [status, setStatus] = useState<'disconnected' | 'active' | 'expired' | 'error' | 'awaiting_2fa'>('disconnected');
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('');
  
  // 双重验证
  const [twoFA, setTwoFA] = useState<TwoFAState>({ visible: false, code: '', loading: false });
  
  // 发布表单
  const [text, setText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  
  // 发布状态
  const [publishStatus, setPublishStatus] = useState<PublishStatus>('idle');
  const [publishMsg, setPublishMsg] = useState('');
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // 检查登录状态
  const checkStatus = useCallback(async () => {
    try {
      const res = await authFetch(`/api/facebook/status?accountId=${accountId}`);
      setStatus(res.status || 'disconnected');
      if (res.pages) {
        setPages(res.pages);
        if (res.pages.length > 0 && !selectedPage) {
          setSelectedPage(res.pages[0].name);
        }
      }
    } catch {
      setStatus('disconnected');
    }
  }, [accountId, selectedPage]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // 登录
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError('请输入邮箱和密码');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    setTwoFA({ visible: false, code: '', loading: false });
    
    try {
      const res = await authFetch('/api/facebook/login', {
        method: 'POST',
        body: JSON.stringify({ accountId, email: loginEmail, password: loginPassword }),
      });
      
      if (res.success) {
        setStatus('active');
        await checkStatus();
      }
    } catch (err: any) {
      if (err.data?.require2fa) {
        setTwoFA({ visible: true, code: '', loading: false });
        setStatus('awaiting_2fa');
      } else {
        setLoginError(err.message || '登录失败');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // 提交双重验证
  const handle2FASubmit = async () => {
    if (!twoFA.code) return;
    setTwoFA(prev => ({ ...prev, loading: true }));
    
    try {
      const res = await authFetch('/api/facebook/2fa', {
        method: 'POST',
        body: JSON.stringify({ accountId, code: twoFA.code }),
      });
      if (res.success) {
        setStatus('active');
        setTwoFA({ visible: false, code: '', loading: false });
        await checkStatus();
      }
    } catch (err: any) {
      setLoginError(err.message || '验证失败');
    } finally {
      setTwoFA(prev => ({ ...prev, loading: false }));
    }
  };

  // 退出
  const handleLogout = async () => {
    try {
      await authFetch('/api/facebook/logout', {
        method: 'POST',
        body: JSON.stringify({ accountId }),
      });
    } catch {}
    setStatus('disconnected');
    setPages([]);
    setSelectedPage('');
  };

  // 图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const newImages = [...images, ...files].slice(0, 10); // 最多10张
    setImages(newImages);
    
    const newPreviews = newImages.map(f => URL.createObjectURL(f));
    // 清理旧的 URL
    imagePreviews.forEach(u => URL.revokeObjectURL(u));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 视频选择
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 清理旧的预览
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideo(null);
    setVideoPreview(null);
  };

  // 发布
  const handlePublish = async () => {
    if (!text && images.length === 0 && !video) {
      setPublishMsg('请填写内容或选择图片/视频');
      return;
    }

    setPublishStatus('publishing');
    setPublishMsg('');

    try {
      let endpoint: string;
      let body: any = { accountId, text };

      if (activeTab === 'profile') {
        // 个人主页发布
        if (video) {
          // 视频需要先上传到临时目录
          const formData = new FormData();
          formData.append('video', video);
          formData.append('accountId', accountId);
          formData.append('text', text);
          
          const uploadRes = await authFetch('/api/facebook/upload/temp', {
            method: 'POST',
            body: formData,
            headers: {}, // 让浏览器自动设置 multipart
          });
          
          if (!uploadRes.success) throw new Error(uploadRes.error || '上传失败');
          
          endpoint = '/api/facebook/publish/profile/video';
          body = { accountId, text, videoPath: uploadRes.filePath };
        } else {
          endpoint = '/api/facebook/publish/profile/image';
          if (images.length > 0) {
            // 上传图片到临时目录
            const formData = new FormData();
            formData.append('accountId', accountId);
            images.forEach(img => formData.append('images', img));
            
            const uploadRes = await authFetch('/api/facebook/upload/temp', {
              method: 'POST',
              body: formData,
              headers: {},
            });
            
            if (!uploadRes.success) throw new Error(uploadRes.error || '上传失败');
            body.imagePaths = uploadRes.filePaths;
          }
        }
      } else {
        // 公共主页发布
        const pageName = selectedPage || pages[0]?.name;
        if (!pageName) throw new Error('请选择公共主页');
        
        if (video) {
          const formData = new FormData();
          formData.append('video', video);
          formData.append('accountId', accountId);
          formData.append('text', text);
          formData.append('pageName', pageName);
          
          const uploadRes = await authFetch('/api/facebook/upload/temp', {
            method: 'POST',
            body: formData,
            headers: {},
          });
          
          if (!uploadRes.success) throw new Error(uploadRes.error || '上传失败');
          
          endpoint = '/api/facebook/publish/page/video';
          body = { accountId, pageName, text, videoPath: uploadRes.filePath };
        } else {
          endpoint = '/api/facebook/publish/page/image';
          body = { accountId, pageName, text };
          if (images.length > 0) {
            const formData = new FormData();
            formData.append('accountId', accountId);
            formData.append('pageName', pageName);
            images.forEach(img => formData.append('images', img));
            
            const uploadRes = await authFetch('/api/facebook/upload/temp', {
              method: 'POST',
              body: formData,
              headers: {},
            });
            
            if (!uploadRes.success) throw new Error(uploadRes.error || '上传失败');
            body.imagePaths = uploadRes.filePaths;
          }
        }
      }

      const result = await authFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (result.success) {
        setPublishStatus('success');
        setPublishMsg('✅ 发布成功！');
        // 清空表单
        setText('');
        setImages([]);
        setVideo(null);
        imagePreviews.forEach(u => URL.revokeObjectURL(u));
        setImagePreviews([]);
        if (videoPreview) URL.revokeObjectURL(videoPreview);
        setVideoPreview(null);
      } else {
        throw new Error(result.error || '发布失败');
      }
    } catch (err: any) {
      setPublishStatus('error');
      setPublishMsg(err.message || '发布失败');
    }
  };

  const getStatusBadge = () => {
    const map: Record<string, { icon: any; text: string; color: string }> = {
      active: { icon: CheckCircle, text: '已登录', color: 'text-green-600 bg-green-50 border-green-200' },
      disconnected: { icon: XCircle, text: '未登录', color: 'text-gray-400 bg-gray-50 border-gray-200' },
      expired: { icon: AlertCircle, text: '已过期', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
      error: { icon: AlertCircle, text: '异常', color: 'text-red-600 bg-red-50 border-red-200' },
      awaiting_2fa: { icon: AlertCircle, text: '等待验证', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    };
    const info = map[status] || map.disconnected;
    const Icon = info.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${info.color}`}>
        <Icon className="w-4 h-4" />
        {info.text}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="mr-2">📘</span>Facebook 发布
          </h1>
          <p className="text-gray-500 mt-1">发布图片/视频到个人主页和公共主页</p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          {status === 'active' && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              退出
            </button>
          )}
          <button
            onClick={checkStatus}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            刷新状态
          </button>
        </div>
      </div>

      {/* 登录区域 */}
      {status !== 'active' && status !== 'awaiting_2fa' && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-blue-600" />
            登录 Facebook
          </h2>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {loginError}
            </div>
          )}

          <div className="space-y-3 max-w-md">
            <input
              type="email"
              placeholder="Facebook 邮箱"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="密码"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loginLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 登录中...</>
              ) : (
                <><LogIn className="w-4 h-4" /> 登录</>
              )}
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            登录后系统会保存 Cookie，下次无需重复输入。
          </p>
        </div>
      )}

      {/* 双重验证 */}
      {twoFA.visible && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">🔐 双重验证</h2>
          <p className="text-sm text-blue-700 mb-3">
            请输入 Facebook 发送到您手机的双重验证码
          </p>
          <div className="flex gap-3 max-w-sm">
            <input
              type="text"
              placeholder="验证码"
              value={twoFA.code}
              onChange={e => setTwoFA(prev => ({ ...prev, code: e.target.value }))}
              className="flex-1 border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handle2FASubmit}
              disabled={twoFA.loading || !twoFA.code}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {twoFA.loading ? '验证中...' : '确认'}
            </button>
          </div>
        </div>
      )}

      {/* 已登录状态 */}
      {status === 'active' && (
        <>
          {/* Tab 切换 */}
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4" />
              个人主页
            </button>
            <button
              onClick={() => setActiveTab('page')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'page'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              公共主页
            </button>
          </div>

          {/* 公共主页选择 */}
          {activeTab === 'page' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择公共主页
              </label>
              {pages.length > 0 ? (
                <select
                  value={selectedPage}
                  onChange={e => setSelectedPage(e.target.value)}
                  className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {pages.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  未检测到公共主页。请确保您的 Facebook 账号已创建或管理公共主页。
                </div>
              )}
            </div>
          )}

          {/* 发布表单 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {activeTab === 'profile' ? '📝 发布到个人主页' : '📝 发布到公共主页'}
            </h2>

            {/* 文字输入 */}
            <textarea
              placeholder="写点什么..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
            />

            {/* 图片区 */}
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {imagePreviews.map((url, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      alt={`图片${i + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 视频预览 */}
            {videoPreview && (
              <div className="relative mb-4 inline-block">
                <video
                  src={videoPreview}
                  controls
                  className="max-h-48 rounded-lg border border-gray-200"
                />
                <button
                  onClick={removeVideo}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 媒体上传按钮 */}
            <div className="flex gap-3 mb-4">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={video !== null}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                title={video ? '已有视频，不能同时上传图片' : '选择图片'}
              >
                <Image className="w-4 h-4" />
                添加图片
              </button>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={images.length > 0}
                className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 disabled:opacity-50"
                title={images.length > 0 ? '已有图片，不能同时上传视频' : '选择视频'}
              >
                <Video className="w-4 h-4" />
                添加视频
              </button>
            </div>

            {/* 发布按钮 */}
            <div className="flex items-center gap-4">
              <button
                onClick={handlePublish}
                disabled={publishStatus === 'publishing' || (!text && images.length === 0 && !video)}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {publishStatus === 'publishing' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> 发布中...</>
                ) : (
                  <><Send className="w-4 h-4" /> 发布</>
                )}
              </button>

              {publishMsg && (
                <span className={`text-sm ${
                  publishStatus === 'success' ? 'text-green-600' :
                  publishStatus === 'error' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {publishMsg}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
