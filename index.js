const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ BOT_TOKEN not set in environment variables");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🎉 Welcome to Bingo Bot!\nType /play to join a game.");
});

bot.onText(/\/play/, (msg) => {
  bot.sendMessage(msg.chat.id, "✅ You joined the game! (Bingo system coming soon).");
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, "Commands:\n/start - Start bot\n/play - Join a game\n/help - Show help");
});

console.log("✅ Bingo bot started...");
