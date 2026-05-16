/**
 * 钉钉「天枢AI通讯」路由
 * 功能：聊天界面托管、钉钉免登、消息转发
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ========== 聊天界面 ==========
router.get('/chat', (req, res) => {
    const chatPath = path.join(__dirname, '../../public/dingtalk-chat.html');
    if (fs.existsSync(chatPath)) {
        res.sendFile(chatPath);
    } else {
        res.status(404).send('聊天界面未部署');
    }
});

// ========== 钉钉免登接口 ==========
// 通过authCode获取钉钉用户信息
router.post('/auth', async (req, res) => {
    try {
        const { authCode } = req.body;
        if (!authCode) return res.status(400).json({ error: '缺少authCode' });

        // 用authCode换取用户信息
        const accessToken = await getAccessToken();
        const userInfo = await getUserInfo(accessToken, authCode);
        
        res.json({ success: true, user: userInfo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== 获取Access Token ==========
async function getAccessToken() {
    const { default: fetch } = await import('node-fetch');
    const appKey = 'dingbo0cq9arqxcqwaxy';
    const appSecret = ''; // 需要从安全配置获取完整值
    
    const resp = await fetch('https://oapi.dingtalk.com/gettoken', {
        params: { appkey: appKey, appsecret: appSecret }
    });
    const data = await resp.json();
    if (data.errcode !== 0) throw new Error('获取Token失败: ' + data.errmsg);
    return data.access_token;
}

// ========== 获取用户信息 ==========
async function getUserInfo(accessToken, authCode) {
    const { default: fetch } = await import('node-fetch');
    const resp = await fetch('https://oapi.dingtalk.com/topapi/v2/user/getuserinfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, code: authCode })
    });
    const data = await resp.json();
    if (data.errcode !== 0) throw new Error('获取用户信息失败: ' + data.errmsg);
    return data.result;
}

// ========== 发送机器人消息 ==========
router.post('/send', async (req, res) => {
    try {
        const { userId, content, agentId } = req.body;
        const accessToken = await getAccessToken();
        const { default: fetch } = await import('node-fetch');
        
        const resp = await fetch('https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                access_token: accessToken,
                agent_id: agentId || '4579775033',
                userid_list: userId,
                msg: {
                    msgtype: 'text',
                    text: { content }
                }
            })
        });
        const data = await resp.json();
        res.json({ success: data.errcode === 0, data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== Webhook回调（钉钉事件订阅） ==========
router.post('/callback', async (req, res) => {
    const { msgtype, text, senderId, conversationType } = req.body;
    
    // 转发消息到 ai-bridge
    try {
        const { default: fetch } = await import('node-fetch');
        await fetch('http://localhost:8080/api/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source: 'dingtalk',
                senderId,
                content: text?.content || '',
                msgtype
            })
        });
    } catch (e) {
        console.error('转发到ai-bridge失败:', e.message);
    }
    
    res.json({ success: true });
});

export default router;
