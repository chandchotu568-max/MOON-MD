module.exports = {
  name: "menu",
  run: async (sock, msg, args, config) => {
    const text = `
🌙 MOON-MD MENU

/ai - Chat AI
/ping - Bot Status
/owner - Owner Info
/menu - Show Menu
/group - Group Tools
`;

    await sock.sendMessage(msg.key.remoteJid, { text });
  }
};