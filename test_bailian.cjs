// 测试百炼 API 连通性
const axios = require('axios');
(async () => {
  try {
    const resp = await axios.post('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      model: 'qwen3.5-plus',
      messages: [{role:'user', content:'你好'}],
      temperature: 0.7,
      max_tokens: 100
    }, {
      headers: {
        'Authorization': 'Bearer sk-8a07c75081df49ac877d6950a95b06ec',
        'Content-Type': 'application/json'
      },
      timeout: 15000,
      proxy: false
    });
    console.log('OK:', resp.data.choices[0].message.content);
  } catch(e) {
    console.log('ERROR:', e.message);
    if (e.response) console.log('STATUS:', e.response.status);
    if (e.code) console.log('CODE:', e.code);
  }
})();
