require('./setting/settings');
const TelegramBot = require("node-telegram-bot-api");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const yts = require("yt-search");
const axios = require("axios");
const { Client } = require("ssh2");
const crypto = require("crypto");
const os = require('os');
const speed = require('performance-now');
const nou = require("node-os-utils");

const { smsg, sendGmail, formatSize, isUrl, generateMessageTag, getBuffer, getSizeMedia, runtime, fetchJson, sleep } = require('./myfunction');

// Karena kamu pakai node-telegram-bot-api, Markup gak ada → kita buat manual
const Markup = {
  inlineKeyboard: (buttons) => ({ inline_keyboard: buttons }),
  button: {
    url: (text, url) => ({ text, url }),
    callback: (text, data) => ({ text, callback_data: data }),
  },
};

const USERS_FILE = path.join(__dirname, "./lib/database/telegram_users.json");

if (!fs.existsSync(path.dirname(USERS_FILE))) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

function startTelegramBot(WA) {
  if (!TELEGRAM_TOKEN || TELEGRAM_TOKEN === "ISI_TOKEN_BOT_TELEGRAM_KAMU") {
    console.log(chalk.red("❌ Token Telegram belum diatur di settings.js"));
    return;
  }

  const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
  console.log(chalk.green("🤖 Bot Telegram aktif dan berjalan."));

  const loadUsers = () => {
    try {
      return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    } catch {
      return [];
    }
  };

  const saveUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  };

  const addUser = (id, username) => {
    const users = loadUsers();
    if (!users.find((u) => u.id === id)) {
      users.push({ id, username });
      saveUsers(users);
      console.log(chalk.cyan(`📩 User baru: ${username || id}`));
    }
  };

  const randomImages = [
    "https://img1.pixhost.to/images/9147/647147914_encore.jpg",
    "https://img1.pixhost.to/images/9147/647147914_encore.jpg",
    "https://img1.pixhost.to/images/9147/647147914_encore.jpg",
  ];

  const getRandomImage = () =>
    randomImages[Math.floor(Math.random() * randomImages.length)];

  async function editMenu(botMsg, caption, buttons) {
    try {
      await bot.editMessageMedia(
        {
          type: "photo",
          media: getRandomImage(),
          caption,
          parse_mode: "Markdown",
        },
        {
          chat_id: botMsg.chat.id,
          message_id: botMsg.message_id,
          reply_markup: buttons.reply_markup,
        }
      );
    } catch (error) {
      console.error("Error editing menu:", error);
      await bot.sendMessage(
        botMsg.chat.id,
        "Maaf, terjadi kesalahan saat mengedit pesan."
      );
    }
  }
  
  const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// Fungsi download file dari Telegram
async function downloadFile(fileId, filename) {
  const file = await bot.getFile(fileId);
  const url = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  const filePath = path.join(TMP_DIR, filename);
  fs.writeFileSync(filePath, res.data);
  return filePath;
}

function example(text) {
  return `📘 Contoh penggunaan:\n${text}`;
}

// Fungsi untuk membuat password acak
function getRandom(length = 5) {
  return Math.random().toString(36).substring(2, 2 + length);
}

// Fungsi animasi progress (digunakan saat proses panjang)
async function sendAnimatedProgress(chatId, textHeader, duration = 15) {
  const frames = ["⏳", "🔧", "🛠", "⚙️", "🚀"];
  let msg = await bot.sendMessage(chatId, `${frames[0]} ${textHeader}`);
  for (let i = 1; i <= duration; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    await bot.editMessageText(`${frames[i % frames.length]} ${textHeader} (${i}s)`, {
      chat_id: chatId,
      message_id: msg.message_id,
    });
  }
  return msg;
}

// Fungsi bantu
function toRupiah(number) {
  return "Rp" + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function countProfit(jumlahAwal) {
    jumlahAwal = parseInt(jumlahAwal)
    let keuntungan = jumlahAwal * 1
    if (keuntungan > 1000) {
        keuntungan = 1000
    }
    return (jumlahAwal + keuntungan).toFixed(0)
}

async function progressBar(chatId, text, duration = 6000) {
  const totalSteps = 20;
  const stepTime = duration / totalSteps;
  let progress = 0;

  let msg = await bot.sendMessage(chatId, `${text}\n[░░░░░░░░░░░░░░░░░░░░] 0%`);

  const interval = setInterval(async () => {
    progress += 5; // setiap 5%
    const filled = Math.floor(progress / 5);
    const bar = "█".repeat(filled) + "░".repeat(20 - filled);
    await bot.editMessageText(`${text}\n[${bar}] ${progress}%`, {
      chat_id: chatId,
      message_id: msg.message_id,
    });
  }, stepTime);

  // Setelah selesai
  setTimeout(async () => {
    clearInterval(interval);
    await bot.editMessageText(`✅ ${text} selesai!\n[████████████████████] 100%`, {
      chat_id: chatId,
      message_id: msg.message_id,
    });
  }, duration);
}

const userAgents = [
  // Chrome Desktop (Windows) - banyak variasi
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  // Chrome Mac
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
  // Firefox Desktop
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_6; rv:129.0) Gecko/20100101 Firefox/129.0",
  // Edge
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edg/130.0.0.0 Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edg/129.0.0.0 Chrome/129.0.0.0 Safari/537.36",
  // Old IE-ish (rare)
  "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)",
  // Mobile Chrome (Android) many variants
  "Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 13; SM-G996B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 12; Redmi Note 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; Redmi Note 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
  // Mobile Safari (iPhone)
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  // Tablet
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  // Opera
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) OPR/86.0.0.0 Chrome/130.0.0.0 Safari/537.36",
  // Samsung Browser
  "Mozilla/5.0 (Linux; Android 12; SAMSUNG SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/21.0 Chrome/129.0.0.0 Mobile Safari/537.36",
  // UC Browser-like
  "Mozilla/5.0 (Linux; U; Android 10; en-US; SM-A107F) AppleWebKit/537.36 (KHTML, like Gecko) UCBrowser/13.4.0.1302 Mobile Safari/537.36",
  // Plenty of historical/variant strings to rotate through
  "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
  "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:123.0) Gecko/20100101 Firefox/123.0",
  // Android older / different
  "Mozilla/5.0 (Linux; Android 9; SM-J415FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 8.1.0; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
  // More iPhone / iPad variants
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPod touch; CPU iPhone OS 12_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
  // Bots disguised as normal - some legit crawler UA
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  // Desktop "mobile compatibility modes"
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/70.0",
  // Random additional entries
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-A205F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Safari/605.1.15",
  "Mozilla/5.0 (Linux; Android 8.0.0; Pixel C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 7.1.1; Nexus 6P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 6.0; Nexus 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPad; CPU OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 5.1; SM-G900F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; FreeBSD amd64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 12; SM-S906B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36"
];

// Fungsi koneksi SSH & eksekusi perintah
function execSSH(chatId, ipvps, passwd, command, onStream) {
  const conn = new Client();
  conn
    .on("ready", async () => {
      await bot.sendMessage(chatId, "🟢 Koneksi SSH berhasil! Menjalankan perintah di VPS...");
      conn.exec(command, (err, stream) => {
        if (err) throw err;
        onStream(stream, conn);
      });
    })
    .on("error", async (err) => {
      console.error("SSH Error:", err);
      await bot.sendMessage(chatId, "❌ Gagal konek ke VPS! IP atau password salah.");
    })
    .connect({
      host: ipvps,
      port: 22,
      username: "root",
      password: passwd,
    });
}

function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatp(bytes) {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

const menus = [
  {
    title: "📜 *All Menu :*",
    content: `
• Download Menu :
\`/play <judul lagu>\`
\`/ytmp3 <url>\`
\`/ytmp4 <url>\`

• Sticker Menu :
\`/brat <query>\`
\`/bratvid <query>\`

• Ai Menu :
\`/ai <query>\`

• Installer Menu :
\`/installpanel ipvps|pwvps|panel.com|node.com|ramserver\`
\`/startwings ipvps|pwvps|token_node\`
\`/configurewings ipvps|pwvps|token_node\`
\`/subdo namadomain|ipvps\`
\`/installdepend ipvps|pwvps\`
\`/installnebula ipvps|pwvps\`

*Developer* : @ikydevbot
    `
  },
  {
    title: "📜 *Download Menu :*",
    content: `
\`/play <judul lagu>\`
\`/ytmp3 <url>\`
\`/ytmp4 <url>\`

*Developer* : @ikydevbot
    `
  },
  {
    title: "📜 *Sticker Menu :*",
    content: `
\`/brat <query>\`
\`/bratvid <query>\`

*Developer* : @ikydevbot
    `
  },
  {
    title: "📜 *Ai Menu :*",
    content: `
\`/ai <query>\`

*Developer* : @ikydevbot
    `
  },
  {
    title: "📜 *Search Menu :*",
    content: `
\`/sfile <query>\`
\`/gimage <query>\`
\`/npmsearch <query>\`
\`/pinterest <query>\`
\`/bstationsearch <query>\`

*Developer* : @ikydevbot
    `
  },
  {
    title: "📜 *Stalk Menu :*",
    content: `
\`/ffstalk <id>\`

*Developer* : @ikydevbot
    `
  },
  {
    title: "📜 *Installer Menu :*",
    content: `
\`/installpanel ipvps|pwvps|panel.com|node.com|ramserver\`
\`/startwings ipvps|pwvps|token_node\`
\`/configurewings ipvps|pwvps|token_node\`
\`/subdo namadomain|ipvps\`
\`/installdepend ipvps|pwvps\`
\`/installnebula ipvps|pwvps\`

*Developer* : @ikydevbot
    `
  }
];

  // ======== Command Start ========
// Command /start
bot.onText(/^\/start$/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name || "User";
  addUser(chatId, username);

  const Image = "https://img1.pixhost.to/images/9147/647147914_encore.jpg";
  const caption = `<blockquote><strong>
👋 Halo ${username}!

🤖 Script ini dikembangkan oleh 𝗜𝗸𝘆, dengan tujuan utama menyediakan antarmuka menu interaktif untuk menjalankan berbagai fitur bot, termasuk fitur utama yaitu 𝗠𝘂𝗹𝘁𝗶 𝗗𝗲𝘃𝗶𝗰𝗲 𝗧𝗲𝗹𝗲𝗴𝗿𝗮𝗺.

🔍 𝗙𝘂𝗻𝗴𝘀𝗶 𝘂𝘁𝗮𝗺𝗮:
Script ini menampilkan menu interaktif berbasis tombol. Menu ini memudahkan pengguna memilih fitur yang tersedia tanpa mengetik manual satu per satu.

📲 𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗱𝗮𝘁𝗮𝗻𝗴!
Pilih menu di bawah untuk menjelajahi fitur-fitur bot.</strong></blockquote>`;

  const options = {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Semua Menu", callback_data: "listmenu" }
        ],
        [
          { text: "Rest Api (key : freeuser)", url: "https://restwebikyfree.vercel.app/" }
        ],
        [
          { text: "Owner Telegram", url: "https://t.me/ikydevbot" },
          { text: "Owner Whatsapp", url: "https://wa.me/6283877644860" }
        ]
      ]
    }
  };

  await bot.sendPhoto(chatId, Image, { caption, ...options });
});

//main menu
bot.onText(/\/ping/i, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendChatAction(chatId, 'typing');

let timestamp = speed();
let latensi = speed() - timestamp;
let tio = await nou.os.oos();
var tot = await nou.drive.info();

  const teks = `
*🔴 INFORMATION SERVER*

*• Platform :* ${nou.os.type()}
*• Total Ram :* ${formatp(os.totalmem())}
*• Total Disk :* ${tot.totalGb} GB
*• Runtime Vps :* ${runtime(os.uptime())}

*🔵 INFORMATION BOTZ*

*• Respon Speed :* ${latensi.toFixed(4)} detik
*• Runtime Bot :* ${runtime(process.uptime())}
`;

  await bot.sendMessage(chatId, teks, { parse_mode: 'Markdown' });
});

// Search Menu
bot.onText(/\/sfile\s+(.+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1].trim();

  await bot.sendChatAction(chatId, 'typing');
  await bot.sendMessage(chatId, `🔍 Mencari file di Sfile untuk: <b>${escapeHtml(query)}</b>`, { parse_mode: 'HTML' });

  sendSfilePage(chatId, query, 0);
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const [action, q, pageStr] = query.data.split('|');
  const page = parseInt(pageStr);

  if (action === 'next') sendSfilePage(chatId, q, page + 1, query.message.message_id);
  else if (action === 'prev') sendSfilePage(chatId, q, page - 1, query.message.message_id);

  bot.answerCallbackQuery(query.id);
});

async function sendSfilePage(chatId, q, page = 0, editMsgId = null) {
  try {
    const res = await axios.get(`https://ikywebrest.vercel.app/search/sfile?apikey=IkyPrem&q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !Array.isArray(data.result) || data.result.length === 0)
      return bot.sendMessage(chatId, '❌ Tidak ada hasil ditemukan.', { parse_mode: 'HTML' });

    const perPage = 3;
    const total = Math.ceil(data.result.length / perPage);
    const start = page * perPage;
    const end = start + perPage;
    const items = data.result.slice(start, end);

    let teks = `📁 <b>Hasil Pencarian:</b> <code>${escapeHtml(q)}</code>\n📄 Halaman ${page + 1}/${total}\n\n`;

    for (const item of items) {
      teks += `📄 <b>${escapeHtml(item.title)}</b>\n📦 ${escapeHtml(item.size)}\n🔗 <a href="${item.link}">Download</a>\n\n`;
    }

    const buttons = [];
    if (page > 0) buttons.push({ text: '⬅️ Prev', callback_data: `prev|${q}|${page}` });
    if (page < total - 1) buttons.push({ text: '➡️ Next', callback_data: `next|${q}|${page}` });

    const opts = {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: [buttons] }
    };

    if (editMsgId)
      await bot.editMessageText(teks, { chat_id: chatId, message_id: editMsgId, ...opts });
    else
      await bot.sendMessage(chatId, teks, opts);

  } catch (err) {
    console.error('Error API:', err?.response?.data || err.message);
    await bot.sendMessage(chatId, '⚠️ Terjadi kesalahan saat mengambil data. Coba lagi nanti.', { parse_mode: 'HTML' });
  }
}

bot.onText(/\/pinterest\s+(.+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1].trim();

  await bot.sendChatAction(chatId, 'upload_photo');
  await bot.sendMessage(chatId, `🔍 Mencari gambar Pinterest untuk: <b>${escapeHtml(query)}</b>`, { parse_mode: 'HTML' });

  try {
    const url = `https://ikywebrest.vercel.app/search/pinterest?apikey=IkyPrem&q=${encodeURIComponent(query)}`;
    const res = await axios.get(url, { timeout: 15000 });
    const data = res.data;

    if (!data.status || !data.result || data.result.length === 0) {
      return bot.sendMessage(chatId, '❌ Tidak ada hasil ditemukan.', { parse_mode: 'HTML' });
    }

    // Ambil maksimal 5 gambar pertama agar tidak overload
    const images = data.result.slice(0, 5);

    for (const img of images) {
      await bot.sendPhoto(chatId, img, {
        caption: `📌 <b>Hasil dari:</b> <code>${escapeHtml(query)}</code>\n🌐 <a href="${img}">Link Asli</a>`,
        parse_mode: 'HTML'
      });
    }

  } catch (err) {
    console.error('Error API:', err?.response?.data || err.message);
    await bot.sendMessage(chatId, '⚠️ Terjadi kesalahan saat mengambil data. Coba lagi nanti.', { parse_mode: 'HTML' });
  }
});

bot.onText(/\/npmsearch\s+(.+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1].trim();

  await bot.sendChatAction(chatId, 'typing');
  await bot.sendMessage(chatId, `🔍 Mencari package npm untuk: <code>${escapeHtml(query)}</code>`, { parse_mode: 'HTML' });

  sendNpmPage(chatId, query, 0);
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const [action, q, pageStr] = query.data.split('|');
  const page = parseInt(pageStr);

  if (action === 'next') sendNpmPage(chatId, q, page + 1, query.message.message_id);
  else if (action === 'prev') sendNpmPage(chatId, q, page - 1, query.message.message_id);

  bot.answerCallbackQuery(query.id);
});

async function sendNpmPage(chatId, q, page = 0, editMsgId = null) {
  try {
    const res = await axios.get(`https://ikywebrest.vercel.app/search/npm?apikey=IkyPrem&q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !data.result || data.result.length === 0)
      return bot.sendMessage(chatId, '❌ Tidak ada hasil ditemukan.', { parse_mode: 'HTML' });

    const perPage = 2;
    const total = Math.ceil(data.result.length / perPage);
    const start = page * perPage;
    const end = start + perPage;
    const items = data.result.slice(start, end);

    let text = `📦 <b>Hasil Pencarian NPM:</b> <code>${escapeHtml(q)}</code>\n`;
    text += `📄 Halaman ${page + 1}/${total}\n\n`;

    items.forEach((item, i) => {
      text += `<b>${start + i + 1}. ${escapeHtml(item.title)}</b>\n`;
      text += `👤 <code>${escapeHtml(item.author)}</code>\n`;
      text += `🕒 <code>${new Date(item.update).toLocaleString('id-ID')}</code>\n`;
      text += `<a href="${item.links.npm}">🟢 NPM</a> | <a href="${item.links.repository}">📂 Repo</a> | <a href="${item.links.homepage}">🏠 Homepage</a>\n\n`;
    });

    const buttons = [];
    if (page > 0) buttons.push({ text: '⏮️ Prev', callback_data: `prev|${q}|${page}` });
    if (page < total - 1) buttons.push({ text: '⏭️ Next', callback_data: `next|${q}|${page}` });

    const opts = {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: [buttons] }
    };

    if (editMsgId)
      await bot.editMessageText(text, { chat_id: chatId, message_id: editMsgId, ...opts });
    else
      await bot.sendMessage(chatId, text, opts);

  } catch (err) {
    console.error('Error API:', err?.response?.data || err.message);
    await bot.sendMessage(chatId, '⚠️ Terjadi kesalahan saat mengambil data.', { parse_mode: 'HTML' });
  }
}

bot.onText(/\/gimage\s+(.+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];

  try {
    await bot.sendMessage(chatId, `🔍 Mencari gambar untuk: *${query}*...`, { parse_mode: 'Markdown' });

    const res = await axios.get(`https://ikywebrest.vercel.app/search/gimage?apikey=IkyPrem&q=${encodeURIComponent(query)}`);
    const data = res.data;

    if (!data.status || !data.result || data.result.images.length === 0) {
      return bot.sendMessage(chatId, `❌ Tidak ditemukan gambar untuk *${query}*`, { parse_mode: 'Markdown' });
    }

    // Ambil 5 gambar teratas
    const images = data.result.images.slice(0, 5);

    for (const img of images) {
      await bot.sendPhoto(chatId, img.imageUrl, {
        caption: `🖼️ *${query}*`,
        parse_mode: 'Markdown'
      });
    }

  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, '⚠️ Terjadi kesalahan saat mencari gambar.');
  }
});

bot.onText(/\/bstationsearch\s+(.+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1].trim();
  
  await bot.sendChatAction(chatId, 'typing');
  await bot.sendMessage(chatId, `🔍 Mencari hasil untuk: <code>${esc(query)}</code>`, { parse_mode: 'HTML' });

  try {
    const url = `https://ikywebrest.vercel.app/search/bstation?apikey=IkyPrem&q=${encodeURIComponent(query)}`;
    const res = await axios.get(url, { timeout: 10000 });
    const data = res.data;

    if (!data.status || !data.result || data.result.length === 0) {
      return bot.sendMessage(chatId, '❌ Tidak ada hasil ditemukan.');
    }

    const hasil = data.result.slice(0, 5); // Kirim 5 hasil teratas
    for (const item of hasil) {
      const caption = `
🎬 <b>${esc(item.title)}</b>
⏱️ Durasi: <code>${esc(item.duration)}</code>
👤 <a href="${item.uploaderUrl}">${esc(item.uploader)}</a>
👁️ ${esc(item.views)}

🔗 <a href="${item.url}">Tonton di Bstation</a>
`;
      if (item.thumbnail) {
        await bot.sendPhoto(chatId, item.thumbnail, { caption, parse_mode: 'HTML' });
      } else {
        await bot.sendMessage(chatId, caption, { parse_mode: 'HTML' });
      }
    }

  } catch (err) {
    console.error('Error API:', err?.response?.data || err.message);
    await bot.sendMessage(chatId, '⚠️ Terjadi kesalahan saat mengambil data. Coba lagi nanti.');
  }
});

//stalk menu
bot.onText(/\/ffstalk\s+(.+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const queryId = match[1].trim();
  
  if (!queryId)
      return bot.sendMessage(
        chatId,
        "❌ Masukkan teks!\n\nContoh: `/ffstalk 12345678`",
        { parse_mode: "Markdown" }
      );

  await bot.sendChatAction(chatId, 'typing');
  try {
    await bot.sendMessage(chatId, `🔎 Mencari data untuk: <code>${escapeHtml(queryId)}</code>`, { parse_mode: 'HTML' });

    const url = `https://ikywebrest.vercel.app/stalk/ff?apikey=IkyPrem&id=${encodeURIComponent(queryId)}`;
    const res = await axios.get(url, { timeout: 10000 });
    const body = res.data;

    if (!body || body.status !== true || !body.result) {
      return bot.sendMessage(chatId, '❌ Data tidak ditemukan atau API mengembalikan status false.');
    }

    const r = body.result;
    const caption = [
      `<b>Nickname:</b> ${escapeHtml(r.nickname || '-')}`,
      `<b>Region:</b> ${escapeHtml(r.region || '-')}`,
      `<b>Open ID:</b> ${escapeHtml(r.open_id || '-')}`,
      `<b>Creator:</b> ${escapeHtml(body.creator || '-')}`
    ].join('\n');

    if (r.img_url) {
      // kirim photo + caption (HTML)
      await bot.sendPhoto(chatId, r.img_url, { caption, parse_mode: 'HTML' });
    } else {
      await bot.sendMessage(chatId, caption, { parse_mode: 'HTML' });
    }
  } catch (err) {
    console.error('Error ffstalk:', err?.response?.data || err.message || err);
    await bot.sendMessage(chatId, '⚠️ Terjadi kesalahan saat menghubungi API. Coba lagi nanti.');
  }
});
 
// Orkut Menu 
bot.onText(/\/listmlbb/i, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Ambil random user-agent
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

    const { data } = await axios.get(
      "https://www.okeconnect.com/harga/json?id=905ccd028329b0a",
      {
        headers: {
          "User-Agent": randomUA,
          "Accept": "application/json, text/plain, */*",
          "Referer": "https://www.okeconnect.com/",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "Connection": "keep-alive",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
        },
        timeout: 15000,
      }
    );

    const mlbb = data
      .filter(item => /TPG Diamond Mobile Legends/i.test(item.produk) && item.harga > 0)
      .sort((a, b) => a.harga - b.harga);

    const perPage = 5;
    const totalPages = Math.ceil(mlbb.length / perPage);
    const page = 1;

    sendMLBBPage(chatId, mlbb, page, totalPages, perPage);
  } catch (err) {
    console.error("❌ Error:", err.message);
    bot.sendMessage(chatId, "❌ Gagal mengambil data MLBB (kemungkinan diblokir server).");
  }
});

function sendMLBBPage(chatId, data, page, totalPages, perPage) {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const list = data.slice(start, end);

  let text = `📜 *Daftar Harga Topup Mobile Legends*\nHalaman ${page}/${totalPages}\n\n`;
  list.forEach((item, i) => {
    const harga = countProfit(item.harga);
    const status = item.status === "1" ? "✅ Aktif" : "❌ Nonaktif";
    text += `*${i + 1 + start}. ${item.keterangan}*\n💰 Harga: ${toRupiah(harga)}\n📦 Status: ${status}\n🔖 Kode: \`${item.kode}\`\n\n`;
  });

  const keyboard = [];
  const row = [];
  if (page > 1) row.push({ text: "⏪ Prev", callback_data: `mlbb_prev_${page - 1}` });
  if (page < totalPages) row.push({ text: "Next ⏩", callback_data: `mlbb_next_${page + 1}` });
  if (row.length) keyboard.push(row);

  bot.sendMessage(chatId, text, {
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: keyboard }
  });
}

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith("mlbb_next_") || data.startsWith("mlbb_prev_")) {
    const page = parseInt(data.split("_")[2]);

    try {
      const { data: all } = await axios.get("https://www.okeconnect.com/harga/json?id=905ccd028329b0a");
      const mlbb = all
        .filter(item => /TPG Diamond Mobile Legends/i.test(item.produk) && item.harga > 0)
        .sort((a, b) => a.harga - b.harga);

      const perPage = 5;
      const totalPages = Math.ceil(mlbb.length / perPage);
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const list = mlbb.slice(start, end);

      let text = `📜 *Daftar Harga Topup Mobile Legends*\nHalaman ${page}/${totalPages}\n\n`;
      list.forEach((item, i) => {
        const harga = countProfit(item.harga);
        const status = item.status === "1" ? "✅ Aktif" : "❌ Nonaktif";
        text += `*${i + 1 + start}. ${item.keterangan}*\n💰 Harga: ${toRupiah(harga)}\n📦 Status: ${status}\n🔖 Kode: \`${item.kode}\`\n\n`;
      });

      const keyboard = [];
      const row = [];
      if (page > 1) row.push({ text: "⏪ Prev", callback_data: `mlbb_prev_${page - 1}` });
      if (page < totalPages) row.push({ text: "Next ⏩", callback_data: `mlbb_next_${page + 1}` });
      if (row.length) keyboard.push(row);

      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard }
      });

      bot.answerCallbackQuery(query.id);
    } catch (err) {
      console.error(err);
      bot.answerCallbackQuery(query.id, { text: "⚠️ Gagal memuat halaman." });
    }
  }
});

  // ======== Callback allmenu ========
  // Command /menu awal
bot.on("callback_query", async (callbackQuery) => {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;

  if (data === "listmenu") {
    const page = 0;
    await sendMenuPage(chatId, page);
  }
});

// Fungsi kirim menu sesuai halaman
async function sendMenuPage(chatId, page, editMsgId = null) {
  const total = menus.length;
  const menu = menus[page];

  const teks = `${menu.title}\n${menu.content}\n\n📄 *Halaman ${page + 1} dari ${total}*`;

  const buttons = [];
  if (page > 0) buttons.push(Markup.button.callback('⬅️ Prev', `menu_prev_${page}`));
  if (page < total - 1) buttons.push(Markup.button.callback('➡️ Next', `menu_next_${page}`));

  const opts = {
    parse_mode: 'Markdown',
    reply_markup: Markup.inlineKeyboard([buttons])
  };

  if (editMsgId)
    await bot.editMessageText(teks, { chat_id: chatId, message_id: editMsgId, ...opts });
  else
    await bot.sendMessage(chatId, teks, opts);
}

// Handler tombol next/prev
bot.on('callback_query', async (query) => {
  const data = query.data;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  if (data.startsWith('menu_next_')) {
    const page = parseInt(data.split('_')[2]);
    await sendMenuPage(chatId, page + 1, messageId);
  } else if (data.startsWith('menu_prev_')) {
    const page = parseInt(data.split('_')[2]);
    await sendMenuPage(chatId, page - 1, messageId);
  }

  await bot.answerCallbackQuery(query.id);
});
  
  bot.onText(/^\/installdepend (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!OWNER_ID.includes(String(userId)))
    return bot.sendMessage(chatId, "❌ Hanya pemilik yang dapat menjalankan perintah ini!");

  const args = match[1].split("|");
  if (args.length < 2)
    return bot.sendMessage(chatId, "⚠️ Contoh: `/installdepend 1.2.3.4|password`", {
      parse_mode: "Markdown",
    });

  const ipvps = args[0];
  const passwd = args[1];
  const command = "bash <(curl -s https://raw.githubusercontent.com/KiwamiXq1031/installer-premium/refs/heads/main/zero.sh)";

  await bot.sendMessage(chatId, `🔧 Memulai instalasi *Depend Pterodactyl* pada VPS: \`${ipvps}\``, {
    parse_mode: "Markdown",
  });

  // tampilkan progress bar
  progressBar(chatId, "Menginstall Depend Pterodactyl...", 25000);

  execSSH(chatId, ipvps, passwd, command, (stream, conn) => {
    stream
      .on("data", (data) => {
        console.log("STDOUT:", data.toString());
        // input otomatis
        stream.write("11\n");
        stream.write("A\n");
        stream.write("Y\n");
        stream.write("Y\n");
      })
      .on("close", async () => {
        await bot.sendMessage(chatId, "✅ Instalasi *Depend* selesai!\nLanjutkan dengan `/installnebula <ip>|<pw>` 🚀", {
          parse_mode: "Markdown",
        });
        conn.end();
      })
      .stderr.on("data", (data) => console.error("STDERR:", data.toString()));
  });
});

// ===============================
// 🌌 /installnebula Command
// ===============================
bot.onText(/^\/installnebula (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!OWNER_ID.includes(String(userId)))
    return bot.sendMessage(chatId, "❌ Hanya pemilik yang dapat menjalankan perintah ini!");

  const args = match[1].split("|");
  if (args.length < 2)
    return bot.sendMessage(chatId, "⚠️ Contoh: `/installnebula 1.2.3.4|password`", {
      parse_mode: "Markdown",
    });

  const ipvps = args[0];
  const passwd = args[1];
  const command = "bash <(curl -s https://raw.githubusercontent.com/KiwamiXq1031/installer-premium/refs/heads/main/zero.sh)";

  await bot.sendMessage(chatId, `🌌 Memulai instalasi *Tema Nebula* pada VPS: \`${ipvps}\``, {
    parse_mode: "Markdown",
  });

  progressBar(chatId, "Menginstall Tema Nebula...", 25000);

  execSSH(chatId, ipvps, passwd, command, (stream, conn) => {
    stream
      .on("data", (data) => {
        console.log("STDOUT:", data.toString());
        stream.write("2\n");
        stream.write("\n");
        stream.write("\n");
      })
      .on("close", async () => {
        await bot.sendMessage(chatId, "✅ Instalasi *Tema Nebula* selesai! 🌠", {
          parse_mode: "Markdown",
        });
        conn.end();
      })
      .stderr.on("data", (data) => console.error("STDERR:", data.toString()));
  });
});

  // ======== Command /brat ========
  bot.onText(/^\/brat(?:\s+(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[1];
    if (!text)
      return bot.sendMessage(
        chatId,
        "❌ Masukkan teks!\n\nContoh: `/brat aku brat banget`",
        { parse_mode: "Markdown" }
      );

    await bot.sendMessage(chatId, "🖌️ Membuat stiker brat... tunggu sebentar!");
    try {
      const apiURL = `https://ikywebrest.vercel.app/imagecreator/bratv?apikey=IkyPrem&text=${encodeURIComponent(
        text
      )}`;
      const res = await axios.get(apiURL, { responseType: "arraybuffer" });
      await bot.sendSticker(chatId, Buffer.from(res.data));
    } catch (e) {
      console.error("Error saat membuat stiker brat:", e.message);
      await bot.sendMessage(
        chatId,
        "❌ Gagal membuat stiker brat.\nPeriksa teks atau coba lagi nanti."
      );
    }
  });

  // ======== Command /bratvid ========
  bot.onText(/^\/bratvid(?:\s+(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[1];
    if (!text)
      return bot.sendMessage(
        chatId,
        "❌ Masukkan teks!\n\nContoh: `/bratvid aku brat banget`",
        { parse_mode: "Markdown" }
      );

    await bot.sendMessage(chatId, "🪄 Membuat brat stiker... tunggu sebentar!");
    try {
      const apiURL = `https://ikywebrest.vercel.app/imagecreator/bratvid?apikey=IkyPrem&text=${encodeURIComponent(
        text
      )}`;
      const res = await axios.get(apiURL, { responseType: "arraybuffer" });
      await bot.sendSticker(chatId, Buffer.from(res.data));
    } catch (e) {
      console.error("Error saat membuat brat stiker:", e.message);
      await bot.sendMessage(
        chatId,
        "❌ Gagal membuat brat stiker.\nPeriksa teks atau coba lagi nanti."
      );
    }
  });
  
  bot.onText(/^\/enc$/, async (msg) => {
  try {
    const chatId = msg.chat.id;

    // Pastikan user reply ke file
    if (!msg.reply_to_message || !msg.reply_to_message.document) {
      return bot.sendMessage(chatId, '⚠️ Harap reply ke file yang ingin dienkripsi.');
    }

    const file = msg.reply_to_message.document;
    const fileName = file.file_name || 'file.bin';

    bot.sendMessage(chatId, `🔐 Sedang mengenkripsi file *${fileName}*...`, { parse_mode: 'Markdown' });

    // Download file dari Telegram
    const downloaded = await downloadFile(file.file_id, fileName);

    // Baca isi file dan ubah ke base64
    const buffer = fs.readFileSync(downloaded);
    const encoded = buffer.toString('base64');

    // Simpan hasil enc ke file .txt
    const encFile = path.join(TMP_DIR, `${path.basename(fileName)}.enc.txt`);
    fs.writeFileSync(encFile, encoded);

    // Kirim hasil ke user
    await bot.sendDocument(chatId, encFile, {
      caption: `✅ File *${fileName}* berhasil dienkripsi.`,
      parse_mode: 'Markdown'
    });

    // Hapus file sementara
    fs.unlinkSync(downloaded);
    fs.unlinkSync(encFile);
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, '❌ Terjadi kesalahan saat mengenkripsi file.');
  }
});

bot.onText(/^\/ai$/, async (msg) => {
    const chatId = msg.chat.id;

    // Kirim pesan awal supaya user bisa reply
    bot.sendMessage(chatId, 'Silakan reply pesan ini dengan pertanyaanmu, dan aku akan menjawabnya.');
});

// Menangani semua pesan
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // Abaikan pesan tanpa teks
    if (!msg.text) return;

    // Jika pesan adalah reply ke pesan bot
    if (msg.reply_to_message && msg.reply_to_message.from.is_bot) {
        const text = msg.text.trim();
        if (!text) return;

        try {
            // Panggil API
            const response = await fetch(`https://api.siputzx.my.id/api/ai/metaai?query=${encodeURIComponent(text)}`);
            if (!response.ok) throw new Error('Gagal mengambil data dari API');

            const result = await response.json();
            const gpt = `${result.data}`;

            // Kirim balasan ke user, reply ke pesan mereka
            bot.sendMessage(chatId, gpt, { reply_to_message_id: msg.message_id });
        } catch (err) {
            console.error(err);
            bot.sendMessage(chatId, 'Terjadi kesalahan saat memproses pesan.', { reply_to_message_id: msg.message_id });
        }
    }
});

bot.onText(/^\/play (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1]?.trim();

  if (!query) {
    return bot.sendMessage(
      chatId,
      `❌ Masukkan judul atau kata kunci!\n\n*Contoh:* \n/play drunk text`,
      { parse_mode: "Markdown" }
    );
  }

  try {
    const search = await yts(query);
    const video = search.all[0];

    if (!video) return bot.sendMessage(chatId, "❌ Tidak ditemukan hasil untuk pencarian itu.");

    const link = video.url;
    const bodytext = `
🎬 *Judul:* ${video.title}
👁️ *Views:* ${video.views?.toLocaleString() || "N/A"}
⏱️ *Durasi:* ${video.timestamp}
📅 *Upload:* ${video.ago}
🔗 *URL:* [Tonton di YouTube](${link})
`;

    await bot.sendPhoto(chatId, video.thumbnail, {
      caption: bodytext,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🎬 Video", callback_data: `ytmp4 ${link}` },
            { text: "🎵 Audio", callback_data: `ytmp3 ${link}` },
          ],
        ],
      },
    });
  } catch (err) {
    console.error("Error /play:", err);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mencari video.");
  }
});

// ======================
// === /ytmp3 COMMAND ===
// ======================
bot.onText(/^\/ytmp3 (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1]?.trim();
  await handleYtmp3(bot, chatId, url);
});

// ======================
// === /ytmp4 COMMAND ===
// ======================
bot.onText(/^\/ytmp4 (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1]?.trim();
  await handleYtmp4(bot, chatId, url);
});

// ===============================
// === CALLBACK TOMBOL INTERAKTIF ===
// ===============================
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;

  try {
    if (data.startsWith("ytmp3")) {
      const url = data.split(" ")[1];
      await bot.answerCallbackQuery(callbackQuery.id, { text: "🎧 Sedang memproses audio..." });
      await handleYtmp3(bot, msg.chat.id, url);
    } else if (data.startsWith("ytmp4")) {
      const url = data.split(" ")[1];
      await bot.answerCallbackQuery(callbackQuery.id, { text: "🎥 Sedang memproses video..." });
      await handleYtmp4(bot, msg.chat.id, url);
    }
  } catch (err) {
    console.error("Callback error:", err);
    bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Gagal memproses permintaan." });
  }
});

// ======================
// === HANDLER BANTUAN ===
// ======================
async function handleYtmp3(bot, chatId, url) {
  try {
    if (!url) return bot.sendMessage(chatId, "❌ Masukkan link YouTube yang valid!");
    await bot.sendMessage(chatId, "🎧 Memproses audio, mohon tunggu...");

    const apiUrl = `https://ikywebrest.vercel.app/download/ytmp3v2?apikey=IkyPrem&url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(apiUrl);

    if (!data.status || !data.result) {
      return bot.sendMessage(chatId, "❌ Gagal mendapatkan audio atau link tidak valid.");
    }

    await bot.sendAudio(chatId, data.result, {
      caption: `🎵 *Berhasil diunduh!*\n🔗 [YouTube Link](${url})`,
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("ytmp3 error:", err.message);
    bot.sendMessage(chatId, `❌ Terjadi kesalahan: ${err.message}`);
  }
}

async function handleYtmp4(bot, chatId, url) {
  try {
    if (!url) return bot.sendMessage(chatId, "❌ Masukkan link YouTube yang valid!");
    await bot.sendMessage(chatId, "🎥 Memproses video, mohon tunggu...");

    const apiUrl = `https://restapiikyjs.vercel.app/download/ytmp4?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(apiUrl);

    if (!data.status || !data.result) {
      return bot.sendMessage(chatId, "❌ Gagal mendapatkan video atau link tidak valid.");
    }

    await bot.sendVideo(chatId, data.result, {
      caption: `🎬 *Video berhasil diunduh!*\n📥 Creator: ${data.creator}\n🔗 [YouTube Link](${url})`,
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("ytmp4 error:", err.message);
    bot.sendMessage(chatId, `⚠️ Terjadi kesalahan: ${err.message}`);
  }
}

bot.onText(/^\/installpanel (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[1];

  // Hanya owner yang bisa pakai
  if (!OWNER_ID.includes(userId.toString()))
    return bot.sendMessage(chatId, "❌ Hanya owner yang dapat menggunakan perintah ini.");

  // Validasi input
  const vii = text.split("|");
  if (vii.length < 5) return bot.sendMessage(chatId, example("/installpanel ipvps|pwvps|panel.com|node.com|ramserver"));

  const ipvps = vii[0];
  const passwordVps = vii[1];
  const domainPanel = vii[2];
  const domainNode = vii[3];
  const ramServer = vii[4];

  const ress = new Client();

  // Pengaturan koneksi SSH
  const connSettings = {
    host: ipvps,
    port: 22,
    username: "root",
    password: passwordVps,
  };

  // Password panel acak
  const passwordPanel = "admin" + getRandom();

  // Perintah instalasi panel
  const commandInstallPanel = `bash <(curl -s https://pterodactyl-installer.se)`;

  // Pesan animasi loading
  const msgAnim = await bot.sendMessage(chatId, "⚙️ Menyiapkan proses instalasi panel...");
  let dots = 0;
  const loadingInterval = setInterval(async () => {
    dots = (dots + 1) % 4;
    await bot.editMessageText(`⚙️ Menginstal panel${".".repeat(dots)}`, {
      chat_id: chatId,
      message_id: msgAnim.message_id,
    });
  }, 1500);

  // Koneksi SSH ke VPS
  ress
    .on("ready", async () => {
      clearInterval(loadingInterval);
      await bot.editMessageText("🚀 Menjalankan skrip instalasi panel di server...", {
        chat_id: chatId,
        message_id: msgAnim.message_id,
      });

      // Eksekusi perintah instalasi
      ress.exec(commandInstallPanel, (err, stream) => {
        if (err) throw err;

        // Saat proses selesai
        stream
          .on("close", async () => {
            clearInterval(loadingInterval);

            // Tombol interaktif
            const keyboard = {
              inline_keyboard: [
                [
                  {
                    text: "🌐 Kunjungi Panel",
                    url: `https://${domainPanel}`,
                  },
                ],
                [
                  {
                    text: "📋 Copy Username",
                    switch_inline_query_current_chat: "admin",
                  },
                  {
                    text: "📋 Copy Password",
                    switch_inline_query_current_chat: passwordPanel,
                  },
                ],
              ],
            };

            // Kirim hasil ke Telegram
            await bot.sendMessage(
              chatId,
              `✅ *Instalasi Panel Selesai!*\n\n👤 Username: \`admin\`\n🔑 Password: \`${passwordPanel}\`\n🌍 Domain Panel: [${domainPanel}](https://${domainPanel})\n🖥 Node: ${domainNode}\n💾 RAM Server: ${ramServer}`,
              { parse_mode: "Markdown", reply_markup: keyboard }
            );
            ress.end();
          })

          // Output data ke console
          .on("data", (data) => {
            console.log("OUTPUT PANEL:", data.toString());
          })

          // Error dari SSH
          .stderr.on("data", (data) => {
            console.log("STDERR:", data.toString());
          });
      });
    })
    .on("error", async (err) => {
      clearInterval(loadingInterval);
      await bot.editMessageText(`❌ Gagal koneksi ke VPS.\n> ${err.message}`, {
        chat_id: chatId,
        message_id: msgAnim.message_id,
      });
    })
    .connect(connSettings);
});

// ===================================================================
// ======================= FITUR START WINGS =========================
// ===================================================================
bot.onText(/^\/(startwings|configurewings) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = match[2];
  const commandUsed = match[1];

  // Hanya owner yang bisa pakai
  if (!OWNER_ID.includes(userId.toString()))
    return bot.sendMessage(chatId, "❌ Hanya owner yang dapat menggunakan perintah ini.");

  // Validasi input
  if (!text) return bot.sendMessage(chatId, example("/startwings ipvps|pwvps|token_node"));
  
  const args = text.split("|");
  if (args.length < 3)
    return bot.sendMessage(chatId, example("/startwings ipvps|pwvps|token_node"));

  const ipvps = args[0];
  const passwd = args[1];
  const token = args[2];

  // Pengaturan koneksi
  const connSettings = {
    host: ipvps,
    port: 22,
    username: "root",
    password: passwd,
  };

  // Perintah untuk menjalankan wings
  const command = `${token} && systemctl start wings`;
  const ress = new Client();

  // Animasi loading
  const loading = await bot.sendMessage(chatId, "🛰 Menjalankan Wings Node...");
  let phase = 0;
  const anim = setInterval(async () => {
    const dots = [".", "..", "..."][phase % 3];
    await bot.editMessageText(`🌀 Menjalankan Wings${dots}`, {
      chat_id: chatId,
      message_id: loading.message_id,
    });
    phase++;
  }, 1200);

  // Eksekusi SSH
  ress
    .on("ready", () => {
      ress.exec(command, (err, stream) => {
        if (err) throw err;
        stream
          .on("close", async () => {
            clearInterval(anim);
            await bot.editMessageText(
              `✅ Wings berhasil dijalankan!\n💠 Status: *Aktif*\n\nPerintah: \`${commandUsed}\``,
              {
                chat_id: chatId,
                message_id: loading.message_id,
                parse_mode: "Markdown",
              }
            );
            ress.end();
          })
          .on("data", (data) => {
            console.log("WINGS LOG:", data.toString());
          })
          .stderr.on("data", async (data) => {
            console.log("WINGS STDERR:", data.toString());
            stream.write("y\n");
            stream.write("systemctl start wings\n");
            await bot.sendMessage(chatId, `⚠️ STDERR: ${data}`);
          });
      });
    })
    .on("error", async (err) => {
      clearInterval(anim);
      await bot.editMessageText(`❌ Gagal konek ke VPS:\n> ${err.message}`, {
        chat_id: chatId,
        message_id: loading.message_id,
      });
    })
    .connect(connSettings);
});

bot.onText(/^\/(subdomain|subdo)(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[2]?.trim();
  const userId = msg.from.id;

  // Batasi owner
  if (!OWNER_ID.includes(userId.toString())) {
    return bot.sendMessage(chatId, "❌ Hanya owner yang dapat menggunakan perintah ini!");
  }

  // Validasi input
  if (!text) return bot.sendMessage(chatId, "⚠️ Masukkan teks dengan format:\n/subdo namadomain|ipserver");
  if (!text.includes("|")) return bot.sendMessage(chatId, "⚠️ Format salah!\nContoh:\n/subdo ikyyou|1.1.1.1");

  const [host, ip] = text.split("|").map(x => x.trim());
  const domains = Object.keys(global.subdomain);

  if (!domains.length) return bot.sendMessage(chatId, "⚠️ Tidak ada domain yang terdaftar di global.subdomain");

  // Tombol inline
  // Saat membuat tombol inline
const buttons = domains.map((domain, i) => [
  {
    text: `${i + 1}. ${domain}`,
    // Kompres data: action|index|encodedHost|encodedIp
    callback_data: `create_subdo|${i}|${encodeURIComponent(host)}|${encodeURIComponent(ip)}`,
  },
]);

  await bot.sendMessage(chatId, "🌐 *Pilih Domain yang tersedia:*", {
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: buttons },
  });
});


// ====================== //
//  CALLBACK HANDLER FIX  //
// ====================== //

bot.on("callback_query", async (callbackQuery) => {
  const data = callbackQuery.data.split("|");
  const chatId = callbackQuery.message.chat.id;

  if (data[0] !== "create_subdo") return;

  const index = parseInt(data[1]);
  const host = decodeURIComponent(data[2]);
  const ip = decodeURIComponent(data[3]);

  const domains = Object.keys(global.subdomain);
  const selectedDomain = domains[index];

  if (!selectedDomain) {
    await bot.sendMessage(chatId, "❌ Domain tidak ditemukan!");
    return bot.answerCallbackQuery(callbackQuery.id);
  }

  await bot.answerCallbackQuery(callbackQuery.id, { text: `⏳ Membuat subdomain di ${selectedDomain}...` });

  try {
    const res = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${global.subdomain[selectedDomain].zone}/dns_records`,
      {
        type: "A",
        name: `${host}.${selectedDomain}`,
        content: ip,
        ttl: 3600,
        proxied: false,
      },
      {
        headers: {
          Authorization: `Bearer ${global.subdomain[selectedDomain].apitoken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = res.data;

    if (result.success) {
      await bot.sendMessage(
        chatId,
        `✅ *Subdomain berhasil dibuat!*\n\n🌐 Domain: ${selectedDomain}\n🔤 Nama: ${result.result.name}\n📡 IP: ${result.result.content}`,
        { parse_mode: "Markdown" }
      );
    } else {
      await bot.sendMessage(chatId, `❌ Gagal membuat subdomain.\n${JSON.stringify(result.errors, null, 2)}`);
    }
  } catch (err) {
    await bot.sendMessage(chatId, `⚠️ Error: ${err.response?.data?.errors?.[0]?.message || err.message}`);
  }
});
}

module.exports = startTelegramBot;