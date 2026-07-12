const crypto = require('crypto');

// Проверяет подпись initData, чтобы убедиться, что данные реально пришли из Telegram,
// а не были подделаны на клиенте.
function verifyInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');

  const dataCheckArr = [];
  for (const [key, value] of params.entries()) {
    dataCheckArr.push(`${key}=${value}`);
  }
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return computedHash === hash;
}

module.exports = async (req, res) => {
  // CORS — разрешаем запросы с любого источника (GitHub Pages/Vercel и т.д.)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const CHANNEL_ID = process.env.CHANNEL_ID; // например: @your_channel или -1001234567890

  if (!BOT_TOKEN || !CHANNEL_ID) {
    return res.status(500).json({ error: 'server_not_configured' });
  }

  const { initData } = req.body || {};

  if (!initData) {
    return res.status(400).json({ error: 'no_init_data' });
  }

  const isValid = verifyInitData(initData, BOT_TOKEN);
  if (!isValid) {
    return res.status(401).json({ error: 'invalid_init_data' });
  }

  const params = new URLSearchParams(initData);
  const userJson = params.get('user');
  if (!userJson) {
    return res.status(400).json({ error: 'no_user' });
  }

  const user = JSON.parse(userJson);
  const userId = user.id;

  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(CHANNEL_ID)}&user_id=${userId}`
    );
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return res.status(200).json({ subscribed: false, reason: 'tg_error', detail: tgData.description });
    }

    const status = tgData.result.status;
    const subscribed = ['creator', 'administrator', 'member'].includes(status);

    return res.status(200).json({ subscribed });
  } catch (e) {
    return res.status(500).json({ error: 'request_failed' });
  }
};
