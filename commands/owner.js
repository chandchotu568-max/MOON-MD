module.exports = {
  name: "group",
  run: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "👥 Group tools coming soon..."
    });
  }
};