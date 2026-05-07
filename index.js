const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const P = require('pino')
const fs = require('fs')
const chalk = require('chalk')
const figlet = require('figlet')
const config = require('./config')

console.log(
  chalk.green(
    figlet.textSync('MOON-MD')
  )
)

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: 'silent' })
  })

  if (!sock.authState.creds.registered) {
    const phoneNumber = '923330975205'
    const code = await sock.requestPairingCode(phoneNumber)
    console.log(chalk.yellow(`PAIR CODE: ${code}`))
  }

  sock.ev.on('creds.update', saveCreds)

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