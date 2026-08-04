// data/announcement.json değiştiğinde GitHub Action tarafından çalıştırılır,
// duyuruyu OneSignal üzerinden bildirimlere izin veren herkese gönderir.
//
// Gerekli ortam değişkenleri (repo Settings > Secrets and variables > Actions):
//   ONESIGNAL_APP_ID        -> OneSignal Dashboard > Settings > Keys & IDs
//   ONESIGNAL_REST_API_KEY  -> aynı sayfadaki REST API Key (gizli tutulmalı!)

const https = require("https");
const fs = require("fs");
const path = require("path");

const APP_ID = process.env.ONESIGNAL_APP_ID;
const API_KEY = process.env.ONESIGNAL_REST_API_KEY;

if (!APP_ID || !API_KEY) {
  console.error("ONESIGNAL_APP_ID veya ONESIGNAL_REST_API_KEY eksik. Repo secrets'larını kontrol et.");
  process.exit(1);
}

const dataPath = path.join(__dirname, "..", "data", "announcement.json");
const announcement = JSON.parse(fs.readFileSync(dataPath, "utf8"));

if (!announcement.text) {
  console.log("Boş duyuru, bildirim gönderilmiyor.");
  process.exit(0);
}

const payload = JSON.stringify({
  app_id: APP_ID,
  included_segments: ["Subscribed Users"],
  headings: { en: "squad", tr: "squad" },
  contents: { en: announcement.text, tr: announcement.text },
  ...(announcement.url ? { url: announcement.url } : {})
});

const options = {
  hostname: "api.onesignal.com",
  path: "/notifications",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Key ${API_KEY}`,
    "Content-Length": Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  let data = "";
  res.on("data", (c) => (data += c));
  res.on("end", () => {
    console.log("OneSignal cevabı:", res.statusCode, data);
    if (res.statusCode >= 400) process.exit(1);
  });
});
req.on("error", (e) => {
  console.error(e);
  process.exit(1);
});
req.write(payload);
req.end();
