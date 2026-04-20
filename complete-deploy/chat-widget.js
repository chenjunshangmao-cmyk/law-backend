/**
 * Claw 网站客服窗口组件
 * 悬浮在页面右下角，提供AI客服对话功能
 */

(function() {
  'use strict';

  // 配置
  const CONFIG = {
    apiEndpoint: '/api/customer-service/chat',
    primaryColor: '#4f46e5',
    position: 'right',
    welcomeMessage: '你好！我是小芸👋 有什么可以帮你的吗？',
    placeholder: '输入消息...',
    title: 'AI客服助手',
    subtitle: '小芸 · 在线'
  };

  // 状态
  let state = {
    isOpen: false,
    sessionId: null,
    messages: [],
    isTyping: false
  };

  // 创建样式
  function createStyles() {
    const styles = document.createElement('style');
    styles.textContent = `
      /* 客服窗口容器 */
      .claw-chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }

      /* 悬浮按钮 */
      .claw-chat-button {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${CONFIG.primaryColor}, #7c3aed);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        transition: all 0.3s ease;
        position: relative;
      }

      .claw-chat-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
      }

      .claw-chat-button svg {
        width: 28px;
        height: 28px;
        color: white;
      }

      .claw-chat-button .close-icon {
        display: none;
      }

      .claw-chat-button.open .chat-icon {
        display: none;
      }

      .claw-chat-button.open .close-icon {
        display: block;
      }

      /* 未读消息徽章 */
      .claw-chat-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 18px;
        height: 18px;
        background: #ef4444;
        border-radius: 50%;
        display: none;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: bold;
      }

      .claw-chat-badge.show {
        display: flex;
      }

      /* 聊天窗口 */
      .claw-chat-window {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 360px;
        height: 500px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        transform: scale(0.9) translateY(10px);
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .claw-chat-window.open {
        opacity: 1;
        transform: scale(1) translateY(0);
        pointer-events: all;
      }

      /* 头部 */
      .claw-chat-header {
        background: linear-gradient(135deg, ${CONFIG.primaryColor}, #7c3aed);
        padding: 16px 20px;
        color: white;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .claw-chat-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .claw-chat-info {
        flex: 1;
      }

      .claw-chat-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }

      .claw-chat-subtitle {
        font-size: 12px;
        opacity: 0.9;
        margin: 2px 0 0;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .claw-chat-status {
        width: 8px;
        height: 8px;
        background: #22c55e;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .claw-chat-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        opacity: 0.8;
        transition: opacity 0.2s;
      }

      .claw-chat-close:hover {
        opacity: 1;
      }

      /* 消息区域 */
      .claw-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f8fafc;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .claw-chat-messages::-webkit-scrollbar {
        width: 6px;
      }

      .claw-chat-messages::-webkit-scrollbar-track {
        background: transparent;
      }

      .claw-chat-messages::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }

      /* 消息气泡 */
      .claw-chat-message {
        display: flex;
        gap: 8px;
        max-width: 85%;
      }

      .claw-chat-message.user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }

      .claw-chat-message.assistant {
        align-self: flex-start;
      }

      .claw-chat-message-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
      }

      .claw-chat-message.assistant .claw-chat-message-avatar {
        background: linear-gradient(135deg, ${CONFIG.primaryColor}, #7c3aed);
      }

      .claw-chat-message.user .claw-chat-message-avatar {
        background: #e2e8f0;
      }

      .claw-chat-message-content {
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.5;
        word-break: break-word;
      }

      .claw-chat-message.assistant .claw-chat-message-content {
        background: white;
        color: #1e293b;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }

      .claw-chat-message.user .claw-chat-message-content {
        background: linear-gradient(135deg, ${CONFIG.primaryColor}, #7c3aed);
        color: white;
        border-bottom-right-radius: 4px;
      }

      .claw-chat-message-time {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 4px;
        text-align: right;
      }

      /* 输入区域 */
      .claw-chat-input-area {
        padding: 12px 16px;
        background: white;
        border-top: 1px solid #e2e8f0;
        display: flex;
        gap: 8px;
        align-items: flex-end;
      }

      .claw-chat-input {
        flex: 1;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: 10px 16px;
        font-size: 14px;
        resize: none;
        outline: none;
        min-height: 40px;
        max-height: 100px;
        font-family: inherit;
        transition: border-color 0.2s;
      }

      .claw-chat-input:focus {
        border-color: ${CONFIG.primaryColor};
      }

      .claw-chat-send {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${CONFIG.primaryColor};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .claw-chat-send:hover {
        background: #4338ca;
      }

      .claw-chat-send:disabled {
        background: #cbd5e1;
        cursor: not-allowed;
      }

      .claw-chat-send svg {
        width: 20px;
        height: 20px;
        color: white;
      }

      /* 打字指示器 */
      .claw-chat-typing {
        display: flex;
        gap: 4px;
        padding: 12px 16px;
        align-self: flex-start;
      }

      .claw-chat-typing-dot {
        width: 8px;
        height: 8px;
        background: #cbd5e1;
        border-radius: 50%;
        animation: typing 1.4s infinite;
      }

      .claw-chat-typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .claw-chat-typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes typing {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-10px); }
      }

      /* 欢迎消息 */
      .claw-chat-welcome {
        text-align: center;
        padding: 20px;
        color: #64748b;
        font-size: 13px;
      }

      /* 移动端适配 */
      @media (max-width: 480px) {
        .claw-chat-widget {
          bottom: 16px;
          right: 16px;
        }

        .claw-chat-window {
          width: calc(100vw - 32px);
          height: 70vh;
          right: 0;
          bottom: 70px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  // 创建DOM
  function createWidget() {
    const widget = document.createElement('div');
    widget.className = 'claw-chat-widget';
    widget.innerHTML = `
      <button class="claw-chat-button" aria-label="打开客服">
        <svg class="chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        <span class="claw-chat-badge">1</span>
      </button>
      
      <div class="claw-chat-window">
        <div class="claw-chat-header">
          <div class="claw-chat-avatar">🤖</div>
          <div class="claw-chat-info">
            <h3 class="claw-chat-title">${CONFIG.title}</h3>
            <p class="claw-chat-subtitle">
              <span class="claw-chat-status"></span>
              ${CONFIG.subtitle}
            </p>
          </div>
          <button class="claw-chat-close" aria-label="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="claw-chat-messages">
          <div class="claw-chat-welcome">${CONFIG.welcomeMessage}</div>
        </div>
        
        <div class="claw-chat-input-area">
          <textarea class="claw-chat-input" placeholder="${CONFIG.placeholder}" rows="1"></textarea>
          <button class="claw-chat-send" aria-label="发送">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
    return widget;
  }

  // 添加消息
  function addMessage(role, content) {
    const messagesContainer = document.querySelector('.claw-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `claw-chat-message ${role}`;
    
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const avatar = role === 'assistant' ? '🤖' : '👤';
    
    messageDiv.innerHTML = `
      <div class="claw-chat-message-avatar">${avatar}</div>
      <div>
        <div class="claw-chat-message-content">${escapeHtml(content)}</div>
        <div class="claw-chat-message-time">${time}</div>
      </div>
    `;
    
    // 移除欢迎消息
    const welcome = messagesContainer.querySelector('.claw-chat-welcome');
    if (welcome) welcome.remove();
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    state.messages.push({ role, content, time });
  }

  // 显示打字指示器
  function showTyping() {
    const messagesContainer = document.querySelector('.claw-chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'claw-chat-message assistant claw-chat-typing';
    typingDiv.innerHTML = `
      <div class="claw-chat-message-avatar">🤖</div>
      <div class="claw-chat-typing-indicator">
        <span class="claw-chat-typing-dot"></span>
        <span class="claw-chat-typing-dot"></span>
        <span class="claw-chat-typing-dot"></span>
      </div>
    `;
    typingDiv.id = 'typing-indicator';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // 隐藏打字指示器
  function hideTyping() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
  }

  // 转义HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  // 发送消息
  async function sendMessage(content) {
    if (!content.trim()) return;
    
    // 添加用户消息
    addMessage('user', content);
    
    // 清空输入框
    const input = document.querySelector('.claw-chat-input');
    input.value = '';
    input.style.height = 'auto';
    
    // 显示打字指示器
    showTyping();
    state.isTyping = true;
    
    try {
      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId: state.sessionId,
          context: {
            page: window.location.pathname,
            userAgent: navigator.userAgent
          }
        })
      });
      
      const data = await response.json();
      
      hideTyping();
      state.isTyping = false;
      
      if (data.success) {
        state.sessionId = data.sessionId;
        addMessage('assistant', data.response);
      } else {
        addMessage('assistant', '抱歉，服务暂时不可用，请稍后再试。');
      }
    } catch (error) {
      hideTyping();
      state.isTyping = false;
      addMessage('assistant', '网络连接失败，请检查网络后重试。');
      console.error('客服请求失败:', error);
    }
  }

  // 切换窗口
  function toggleWindow() {
    state.isOpen = !state.isOpen;
    const button = document.querySelector('.claw-chat-button');
    const window = document.querySelector('.claw-chat-window');
    
    button.classList.toggle('open', state.isOpen);
    window.classList.toggle('open', state.isOpen);
    
    // 隐藏徽章
    if (state.isOpen) {
      document.querySelector('.claw-chat-badge').classList.remove('show');
    }
  }

  // 初始化
  function init() {
    if (document.querySelector('.claw-chat-widget')) return;
    
    createStyles();
    const widget = createWidget();
    
    // 事件绑定
    const button = widget.querySelector('.claw-chat-button');
    const closeBtn = widget.querySelector('.claw-chat-close');
    const sendBtn = widget.querySelector('.claw-chat-send');
    const input = widget.querySelector('.claw-chat-input');
    
    button.addEventListener('click', toggleWindow);
    closeBtn.addEventListener('click', toggleWindow);
    
    sendBtn.addEventListener('click', () => {
      sendMessage(input.value);
    });
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input.value);
      }
    });
    
    // 自动调整输入框高度
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });
    
    console.log('✅ Claw客服窗口已加载');
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
