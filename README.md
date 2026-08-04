# Squad Terminal

Sabit görüşme linki + Steam durumu + admin panelinden yönetilen bağlantılar. Tek `index.html`, GitHub Pages üzerinde çalışır.

## 1. Kurulum

1. Bu klasördeki her şeyi yeni (veya var olan) bir GitHub reposuna at.
2. Repo **Settings > Pages** kısmından `main` branch'i seç, kaydet. 1-2 dakika içinde site `https://kullaniciadin.github.io/repo-adin/` adresinde yayında olur.

## 2. `index.html` içindeki `CONFIG` bloğunu doldur

```js
const CONFIG = {
  meetLink: "https://meet.jit.si/senin-oda-adin-buraya",
  ghOwner: "KULLANICI_ADIN",
  ghRepo:  "REPO_ADIN",
  ...
};
```

- **meetLink**: Jitsi Meet kalıcı oda linkin. `https://meet.jit.si/` sonuna sadece sizin bileceğiniz benzersiz bir isim ekle (örn. `meet.jit.si/afyon-ekip-4471`). Bu link asla süresi dolmaz, giriş/onay istemez.
- **ghOwner / ghRepo**: reponun GitHub kullanıcı adı ve adı — admin panelinin bağlantıları kaydedebilmesi için gerekli.

## 3. Steam durumu için (opsiyonel ama istediğin özellik bu)

Steam'in tarayıcıdan doğrudan çağrılmasına izin vermemesi (CORS) ve API anahtarının tarayıcıda görünür kalmasının güvenli olmaması nedeniyle, Steam verisini bir **GitHub Action** çekip `data/steam-status.json` dosyasına yazıyor; site de bu dosyayı okuyor. Yani "anlık" değil ama 10 dakikada bir tazeleniyor (istersen workflow dosyasındaki cron değerini değiştirip sıklığı artırabilirsin — GitHub'ın izin verdiği pratik alt sınır ~5 dakika).

Kurulum:

1. https://steamcommunity.com/dev/apikey adresinden bir Steam Web API anahtarı al (Steam hesabınla giriş yapman yeterli).
2. Kendi SteamID64 numaranı öğren (örn. https://steamid.io üzerinden profil linkini yapıştırarak).
3. Repo **Settings > Secrets and variables > Actions** kısmına iki secret ekle:
   - `STEAM_API_KEY` → aldığın anahtar
   - `STEAM_ID` → SteamID64 numaran
4. Actions sekmesinden "Steam Status Güncelle" workflow'unu bir kere manuel çalıştır (`workflow_dispatch`), `data/steam-status.json` dolacaktır.

**Önemli sınırlama**: Bir arkadaşının "şu an ne oynadığı" bilgisinin görünmesi için o arkadaşın Steam gizlilik ayarlarında oyun bilgisinin herkese açık olması gerekiyor; profili tamamen gizliyse sadece "çevrimiçi" görünür, oyun adı görünmez. Ayrıca kendi arkadaş listenin de gizlilik ayarında en azından API'ye kapalı olmaması lazım.

## 4. Admin panelini kullanma (bağlantı ekleme/silme)

Panel, `data/links.json` dosyasını doğrudan GitHub üzerinden güncelliyor — yani sen bir bağlantı eklediğinde bunu **herkes** (arkadaşların da) görür, sadece kendi tarayıcında kalmaz.

1. Sağ üstteki dişli ikonuna tıkla.
2. Bir GitHub **Fine-grained Personal Access Token** oluştur (Settings > Developer settings > Personal access tokens > Fine-grained tokens): sadece bu repo için, **Contents: Read and write** izniyle.
3. Token'ı panele yapıştır ve "Bağlan" de. Token sadece senin tarayıcında (localStorage) tutulur, kimseyle paylaşılmaz, istersen "Bağlantıyı Kes" ile silebilirsin.
4. Artık başlık + URL girip "Bağlantı Ekle" diyebilir, listedeki "sil" ile kaldırabilirsin — her işlem doğrudan repoya commit atar ve site birkaç saniye içinde güncellenir.

Arkadaşların siteyi ziyaret ettiğinde sadece görüntüler; admin paneli onlara görünmez çünkü token'ları yok.

## 5. Duyuru + Bildirim (opsiyonel)

Admin panelden yazdığın duyuru hem sitede bir bant olarak görünür hem de bildirimlere izin veren herkese anlık push bildirimi olarak gider (metin + istersen bir bağlantı ile).

Kurulum:

1. https://onesignal.com adresinde ücretsiz hesap aç, **New App/Website** de, platform olarak **Web Push** seç.
2. Site URL'i olarak GitHub Pages adresini gir (`https://kullaniciadin.github.io/repo-adin/`).
3. Kurulum sihirbazı bittiğinde **Settings > Keys & IDs** kısmına git, iki değeri not al:
   - **OneSignal App ID**
   - **REST API Key**
4. `index.html` içindeki `CONFIG.oneSignalAppId` satırına App ID'yi yaz (bu gizli değil, tarayıcıda görünmesi normal).
5. Repo **Settings > Secrets and variables > Actions** kısmına iki secret ekle:
   - `ONESIGNAL_APP_ID` → App ID
   - `ONESIGNAL_REST_API_KEY` → REST API Key (bu **gizli**, asla koda yazma — sadece secret olarak kalsın)
6. Siteyi ziyaret eden biri sağ üstteki 🔔 ikonuna basıp tarayıcı izni verirse bildirimlere abone olur.
7. Admin panelinden bir duyuru gönderdiğinde, bu `data/announcement.json`'ı günceller → bu da otomatik olarak "Duyuru Bildirimi Gönder" GitHub Action'ını tetikler → OneSignal üzerinden abone olan herkese birkaç saniye içinde bildirim gider.

Not: Bildirimler tarayıcı/işletim sistemi seviyesinde çalışır (Web Push), telefon veya bilgisayarda siteyi ziyaret edip izin vermiş olman yeterli — site açık olmasa bile bildirim gelir.
