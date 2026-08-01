// Steam Web API'den arkadaş listesi ve anlık durumlarını çekip
// data/steam-status.json dosyasına yazar. GitHub Action tarafından
// belirli aralıklarla çalıştırılır (bkz. .github/workflows/steam-status.yml).
//
// Gerekli ortam değişkenleri (repo Settings > Secrets and variables > Actions):
//   STEAM_API_KEY  -> https://steamcommunity.com/dev/apikey adresinden alınır
//   STEAM_ID       -> kendi SteamID64 numaran (arkadaş listesi buradan okunur)
//
// Not: Bir arkadaşın "şu an oynadığı oyun" bilgisinin görünmesi için o kişinin
// Steam gizlilik ayarlarında "Oyun detayları"nın herkese açık olması gerekir.
// Arkadaş listesinin de herkese açık (veya en azından API'ye açık) olması şart.

const https = require("https");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = process.env.STEAM_ID;

if (!API_KEY || !STEAM_ID) {
  console.error("STEAM_API_KEY veya STEAM_ID eksik. Repo secrets'larını kontrol et.");
  process.exit(1);
}

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("JSON parse hatası: " + data.slice(0, 200)));
        }
      });
    }).on("error", reject);
  });
}

async function main() {
  const friendsUrl = `https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=${API_KEY}&steamid=${STEAM_ID}&relationship=friend`;
  let friendIds = [];
  try {
    const friendsRes = await get(friendsUrl);
    friendIds = (friendsRes.friendslist && friendsRes.friendslist.friends || []).map((f) => f.steamid);
  } catch (e) {
    console.warn("Arkadaş listesi alınamadı (profil gizli olabilir). Sadece kendi hesabın gösterilecek.");
  }

  const allIds = [STEAM_ID, ...friendIds];
  let players = [];

  for (let i = 0; i < allIds.length; i += 100) {
    const batch = allIds.slice(i, i + 100).join(",");
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${API_KEY}&steamids=${batch}`;
    const res = await get(url);
    players = players.concat((res.response && res.response.players) || []);
  }

  const output = {
    updated_at: new Date().toISOString(),
    players: players
      .map((p) => ({
        steamid: p.steamid,
        name: p.personaname,
        avatar: p.avatarmedium,
        state: p.personastate,
        game: p.gameextrainfo || null,
        profile_url: p.profileurl
      }))
      .sort((a, b) => b.state - a.state)
  };

  const outPath = path.join(__dirname, "..", "data", "steam-status.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Yazıldı: ${outPath} (${output.players.length} oyuncu)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
