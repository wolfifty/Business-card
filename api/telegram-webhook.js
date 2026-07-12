module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const WEBAPP_URL = process.env.WEBAPP_URL || 'https://business-card-seven-inky.vercel.app/';

  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'server_not_configured' });
  }

  try {
    const update = req.body;
    const message = update.message;

    if (!message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text || '';

    // Приветствие показываем на любое первое сообщение — не только на /start,
    // на случай если человек напишет что-то своё вместо команды.
    const welcomeText =
      'Привет!✋\n\n' +
      'Это моя визитка, которая демонстрирует возможности telegram mini app.\n\n' +
      'В ней ты также найдешь информацию обо мне и полезные материалы по автоворонкам, чат ботам и приложениям в телеграмме\n\n' +
      'Жми на кнопку ниже и все увидишь';

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: welcomeText,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Открыть визитку',
                web_app: { url: WEBAPP_URL }
              }
            ]
          ]
        }
      })
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.log('webhook error:', e.message);
    return res.status(200).json({ ok: true });
  }
};
