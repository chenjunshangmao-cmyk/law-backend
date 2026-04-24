import React, { useState, useRef, useEffect } from 'react';
import { publicFetch } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time: Date;
}

const INITIAL_MSG: Message = {
  role: 'assistant',
  content: '👋 你好！我是 Claw AI 客服。有什么可以帮你的？\n\n• 查询订单状态\n• 激活会员\n• 使用帮助\n• 其他问题',
  time: new Date()
};

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text, time: new Date() }]);
    setLoading(true);

    try {
      const res = await publicFetch('/api/customer-service/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          sessionId: sessionId || undefined,
          context: {}
        })
      });

      // publicFetch 返回 data.data || data
      const data = res.data || res;
      if (data.sessionId) setSessionId(data.sessionId);
      
      const reply = data.reply || data.message || '(无回复)';
      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: new Date() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${err.message || '请求失败'}`, time: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center"
        style={{ boxShadow: '0 4px 20px rgba(128, 90, 213, 0.4)' }}
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* 聊天窗口 */}
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          style={{ height: '480px', maxHeight: 'calc(100vh - 160px)' }}
        >
          {/* 头部 */}
          <div className="bg-purple-600 text-white px-4 py-3 flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              AI
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Claw AI 客服</div>
              <div className="text-xs text-white/70">在线 · 即时回复</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 消息区 */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50" style={{ scrollBehavior: 'smooth' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 shadow-sm rounded-bl-md border border-gray-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-500 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm shadow-sm border border-gray-100">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={msgEndRef} />
          </div>

          {/* 输入区 */}
          <div className="border-t border-gray-200 px-3 py-2.5 flex items-center gap-2 bg-white shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              disabled={loading}
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
