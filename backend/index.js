const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Load config
const configPath = path.join(__dirname, '..', 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ config.json not found! Copy config.example.json to config.json and fill in your values.');
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Import routes
const statusRoutes = require('./routes/status');
const systemRoutes = require('./routes/system');
const wireguardRoutes = require('./routes/wireguard');
const claudeRoutes = require('./routes/claude');
const parserRoutes = require('./routes/parser');
const botRoutes = require('./routes/bot');

// Initialize Express
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/status', statusRoutes(config));
app.use('/api/system', systemRoutes(config));
app.use('/api/wireguard', wireguardRoutes(config));
app.use('/api/claude', claudeRoutes(config));
app.use('/api/parser', parserRoutes(config));
app.use('/api/bot', botRoutes(config));

// Serve Mini App
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Initialize Telegram Bot
const bot = new TelegramBot(config.telegram_bot_token, { polling: true });

// Bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  // Build WebApp URL - use public_host without port for tunnel
  const webAppUrl = config.server.public_host 
    ? `https://${config.server.public_host}`
    : `http://localhost:${config.server.port}`;
  
  console.log('WebApp URL:', webAppUrl);
  
  bot.sendMessage(chatId, '🤖 Дуработ Dashboard\n\nНатисни кнопку нижче щоб відкрити панель управління:', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '📊 Відкрити Dashboard',
          web_app: { url: webAppUrl }
        }
      ]]
    }
  });
});

bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const statusService = require('./services/clawdbot');
    const status = await statusService.getStatus(config);
    bot.sendMessage(chatId, `📊 *Статус Clawdbot*\n\n${status}`, { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(chatId, `❌ Помилка: ${err.message}`);
  }
});

// Start server
const { port, host } = config.server;
app.listen(port, host, () => {
  console.log(`🚀 Dashboard running at http://${host}:${port}`);
  console.log(`🤖 Telegram bot started`);
});
