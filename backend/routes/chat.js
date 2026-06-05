const router = require('express').Router();
const db = require('../config/db');
const { OpenAI } = require('openai');

// 懒加载：等 dotenv 在 app.js 中先执行后，路由触发时再创建 client
let _client = null;
function getClient() {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    });
  }
  return _client;
}

router.post('/', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: '请输入问题' });

  try {
    const [artifacts] = await db.query(
      `SELECT a.name, a.era, a.origin, a.material, a.description, a.story,
              a.condition_status, a.acquisition_date,
              c.name AS category_name, d.name AS donor_name, h.name AS hall_name
       FROM artifacts a
       LEFT JOIN categories c ON a.category_id = c.category_id
       LEFT JOIN donors d ON a.donor_id = d.donor_id
       LEFT JOIN halls h ON a.current_hall_id = h.hall_id
       WHERE a.is_on_display = 1
       ORDER BY a.name
       LIMIT 80`
    );

    const artifactLines = artifacts.map(a => {
      const story = a.story ? a.story.replace(/<[^>]*>/g, '').slice(0, 150) : '';
      return [
        `【${a.name}】`,
        a.category_name && `分类：${a.category_name}`,
        a.era          && `年代：${a.era}`,
        a.origin       && `产地：${a.origin}`,
        a.material     && `材质：${a.material}`,
        a.hall_name    && `展馆：${a.hall_name}`,
        a.condition_status && `状态：${a.condition_status}`,
        a.donor_name   && `捐赠人：${a.donor_name}`,
        a.description  && `简介：${a.description}`,
        story          && `故事：${story}`,
      ].filter(Boolean).join('，');
    });

    const systemPrompt =
      `你是非遗博物馆的 AI 导览助手"小馆"。请根据以下展出藏品信息，用亲切、生动的中文回答访客问题。` +
      `若问题超出馆藏范围，礼貌说明并引导访客了解馆内藏品。回答简洁，不超过 300 字。\n\n` +
      `当前展出藏品（共 ${artifacts.length} 件）：\n` +
      artifactLines.join('\n');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const stream = await getClient().chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-8).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message.trim() },
      ],
      stream: true,
      max_tokens: 600,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[chat] DeepSeek API error:', err?.message || err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'AI 服务暂时不可用，请稍后再试' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'AI 服务出错' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

module.exports = router;
