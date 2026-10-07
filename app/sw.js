// Service worker: lưu sẵn giao diện app để mở được cả khi mất mạng.
// Đổi PHIEN_BAN mỗi khi sửa app để máy người dùng tải bản mới.
// Sửa lib/ben_vung.js hoặc firebase-config.js thì tăng thêm số ?v=... ở thẻ <script> trong app/index.html và xa/index.html.
const PHIEN_BAN = 'nln-v17';

const VO_APP = [
  './', './index.html', './manifest.webmanifest', './firebase-config.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon.png',
  // Thư viện để sẵn trong máy (app/lib), không phụ thuộc máy chủ CDN
  './lib/ben_vung.js',
  './lib/chart.umd.min.js',
  './lib/firebase-app.js',
  './lib/firebase-auth.js',
  './lib/firebase-firestore.js',
  './lib/leaflet.min.css',
  './lib/leaflet.min.js',
  './lib/mqtt.min.js',
];
const THU_VIEN = [];  // thư viện đã nằm trong VO_APP
// Không lưu đệm dữ liệu trực tiếp: dự báo mưa, kết nối thiết bị, đăng nhập.
const KHONG_LUU = ['api.open-meteo.com', 'hivemq.com', 'emqx.io', 'identitytoolkit.googleapis.com', 'securetoken.googleapis.com', 'firestore.googleapis.com',
  // trang đăng nhập Google, Facebook, Apple, Microsoft
  'apis.google.com', 'accounts.google.com', 'firebaseapp.com', 'facebook.com', 'appleid.apple.com', 'login.microsoftonline.com'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(PHIEN_BAN);
    await c.addAll(VO_APP.map(u => new Request(u, { cache: 'reload' })));  // lấy bản mới nhất, không lấy từ bộ nhớ đệm trình duyệt
    await Promise.all(THU_VIEN.map(async url => {
      try { const r = await fetch(url, { mode: 'cors' }); if (r.ok) await c.put(url, r); } catch {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== PHIEN_BAN) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || KHONG_LUU.some(h => req.url.includes(h))) return;

  // Trang app: ưu tiên bản mới trên mạng, mất mạng thì dùng bản đã lưu.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        // no-cache: luôn hỏi máy chủ có bản mới không, tránh hiện bản cũ sau khi cập nhật app
        const r = await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' });
        if (r.ok) (await caches.open(PHIEN_BAN)).put('./index.html', r.clone());
        return r;
      } catch {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // File của chính app (cấu hình, thư viện trong lib/): luôn hỏi máy chủ trước để nhận bản cập nhật ngay
  // (file không đổi thì máy chủ chỉ trả lời "không đổi", rất nhẹ); mất mạng mới dùng bản đã lưu.
  if (new URL(req.url).origin === self.location.origin) {
    e.respondWith((async () => {
      const c = await caches.open(PHIEN_BAN);
      try {
        const r = await fetch(req, { cache: 'no-cache' });
        if (r.ok) c.put(req, r.clone());
        return r;
      } catch {
        return (await c.match(req, { ignoreSearch: true })) || Response.error();  // ben_vung.js?v=... vẫn khớp file đã lưu
      }
    })());
    return;
  }

  // Font, ảnh bản đồ (máy chủ ngoài): dùng bản đã lưu cho nhanh, đồng thời cập nhật ngầm.
  e.respondWith((async () => {
    const c = await caches.open(PHIEN_BAN);
    const daLuu = await c.match(req);
    const moi = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone());
      return r;
    }).catch(() => daLuu);
    return daLuu || moi;
  })());
});
