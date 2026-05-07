module.exports = {
  name: "ai",
  run: async (sock, msg, args) => {
    const q = args.join(" ");
    if (!q) return;

    await sock.sendMessage(msg.key.remoteJid, {
      text: "🤖 AI: " + q
    });
  }
};