console.clear();
console.log('Starting Telegram Bot...');

// === Import module & config ===
require('./settings');
const chalk = require('chalk');
const fs = require('fs');

// === Function & Settings ===
const { smsg, sendGmail, formatSize, isUrl, generateMessageTag, getBuffer, getSizeMedia, runtime, fetchJson, sleep } = require('./myfunction');
const { TELEGRAM_TOKEN } = require('./settings');

// === Telegram Bot ===
const startTelegramBot = require("./telegram_bot");

// === Jalankan langsung bot Telegram ===
(async () => {
  try {
    console.log(chalk.green.bold('🚀 Menjalankan Bot Telegram...'));
    await startTelegramBot();
    console.log(chalk.green('✅ Bot Telegram berhasil dijalankan.'));
  } catch (err) {
    console.error(chalk.red('❌ Gagal menjalankan bot Telegram:'), err);
  }
})();

// === Auto Reload ===
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.greenBri
