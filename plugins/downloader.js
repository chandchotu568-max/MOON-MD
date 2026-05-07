module.exports = async (sock, msg, url) => {
  if (!url) return;

  await sock.sendMessage(msg.key.remoteJid, {
    text: "⬇️ Media detected!\nDownload manually:\n" + url
  });
};