# Clawdbot Dashboard

🤖 Telegram Mini App для моніторингу та управління Clawdbot інстансом.

## Можливості

- 📊 Статус бота в реальному часі
- 📝 Логи по задачам
- 🪙 Usage токенів
- 🖥️ Метрики сервера (CPU, RAM, диск)
- 🔐 WireGuard toggle
- ⚙️ Налаштування конфігу

## Швидкий старт

```bash
# Клонуй репо
git clone https://github.com/Drunyako/clawdbot-dashboard.git
cd clawdbot-dashboard

# Скопіюй конфіг
cp config.example.json config.json

# Відредагуй config.json своїми даними

# Запусти
npm install
npm start
```

## Docker

```bash
docker-compose up -d
```

## Конфігурація

Створи `config.json` на основі `config.example.json`:

```json
{
  "telegram_bot_token": "YOUR_BOT_TOKEN",
  "clawdbot": {
    "gateway_url": "http://localhost:4440",
    "gateway_token": "YOUR_GATEWAY_TOKEN"
  },
  "server": {
    "port": 3000,
    "host": "0.0.0.0"
  },
  "wireguard": {
    "interface": "wg0",
    "enabled": true
  }
}
```

## Структура проекту

```
clawdbot-dashboard/
├── config.example.json    # Приклад конфігу
├── config.json            # Твій конфіг (в .gitignore)
├── backend/               # API сервер
│   ├── index.js           # Точка входу
│   ├── routes/            # API роути
│   └── services/          # Сервіси (clawdbot, system, wireguard)
├── frontend/              # Telegram Mini App
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── docker-compose.yml
└── README.md
```

## Ліцензія

MIT
