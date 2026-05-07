const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const P = require("pino");
const config = require("./config");

async function startBot() {

  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

  const { version } =
    await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" })
  });

  // SAVE SESSION
  sock.ev.on("creds.update", saveCreds);

  // PAIR CODE SYSTEM
  if (!sock.authState.creds.registered) {

    const phoneNumber = "923330975205";

    const code = await sock.requestPairingCode(phoneNumber);

    console.log(`
╔══════════════════════╗
   🌙 MOON-MD PAIR CODE
╚══════════════════════╝

PAIR CODE: ${code}

LINK DEVICE:
WhatsApp > Linked Devices
> Link with phone number
`);
  }

  // CONNECTION UPDATE
  sock.ev.on("connection.update", (update) => {

    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("🌙 MOON-MD CONNECTED SUCCESSFULLY");
    }

    if (connection === "close") {

      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        startBot();
      }
    }
  });

  // LOAD COMMANDS
  const commands = new Map();

  const commandFiles =
    fs.readdirSync("./commands")
      .filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {

    const command = require(`./commands/${file}`);

    commands.set(command.name, command);
  }

  // MESSAGE HANDLER
  sock.ev.on("messages.upsert", async ({ messages }) => {

    const msg = messages[0];

    if (!msg.message) return;

    const from = msg.key.remoteJid;

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const prefix = config.prefix || "/";

    if (!body.startsWith(prefix)) return;

    const args =
      body.slice(prefix.length).trim().split(/ +/);

    const cmdName = args.shift().toLowerCase();

    const command = commands.get(cmdName);

    if (command) {
      try {
        await command.run(sock, msg, args, config);
      } catch (err) {
        console.log("COMMAND ERROR:", err);
      }
    }

  });

}

startBot();  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const from = msg.key.remoteJid
    const body = msg.message.conversation ||
      msg.message.extendedTextMessage?.text || ''

    if (!body.startsWith(config.prefix)) return

    const args = body.slice(config.prefix.length).trim().split(/ +/)
    const cmd = args.shift().toLowerCase()

    // MENU
    if (cmd === 'menu') {
      let menu = `
╔═══『 ${config.botName} 』═══╗
║ Owner : ${config.ownerName}
║ Prefix : ${config.prefix}
║ Mode : Public
╚══════════════════╝

⚡ MAIN COMMANDS
/menu
/ping
/owner
/ai
/sticker
/tagall
/groupinfo

🎵 MEDIA
/song
/tiktok
/play

👑 GROUP
/antilink on
/welcome on
/kick
/add
/promote
/demote

🧠 AI
/ai hello

🌙 CHANNEL
${config.channel}
`

      await sock.sendMessage(from, {
        text: menu
      })
    }

    // PING
    if (cmd === 'ping') {
      await sock.sendMessage(from, {
        text: 'MOON-MD ONLINE ⚡'
      })
    }

    // OWNER
    if (cmd === 'owner') {
      await sock.sendMessage(from, {
        text: `OWNER NUMBER: ${config.ownerNumber}`
      })
    }

    // AI
    if (cmd === 'ai') {
      const question = args.join(' ')
      if (!question) return sock.sendMessage(from, {
        text: 'Example: /ai hello'
      })

      await sock.sendMessage(from, {
        text: `AI RESPONSE: ${question}`
      })
    }

    // TAGALL
    if (cmd === 'tagall') {
      const metadata = await sock.groupMetadata(from)
      const participants = metadata.participants

      let text = '🌙 MOON-MD TAG ALL\n\n'
      let mentions = []

      for (let p of participants) {
        mentions.push(p.id)
        text += `@${p.id.split('@')[0]}\n`
      }

      await sock.sendMessage(from, {
        text,
        mentions
      })
    }

  })

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      if (shouldReconnect) {
        startBot()
      }
    } else if (connection === 'open') {
      console.log(chalk.cyan('MOON-MD CONNECTED'))
    }
  })
}

startBot()
