// Các hàm giúp app chạy ổn định lâu dài, dùng chung cho app người dân (app/) và bảng điều hành xã (xa/).
//  1. Nạp thư viện từ thư mục lib (không phụ thuộc máy chủ CDN). Lỗi mới tải dự phòng từ mạng.
//  2. Kết nối thiết bị qua 2 máy chủ MQTT cùng lúc: một máy chủ ngừng hoạt động thì vẫn nhận được dữ liệu từ máy chủ còn lại.
//  3. Đăng nhập bằng Google, Facebook, Apple, Microsoft qua Firebase (cửa sổ bật lên, hoặc chuyển hướng khi app đã cài).
(function () {
  'use strict';
  const BAN_FIREBASE = '10.12.2';

  // ---------------- 1. Nạp thư viện ----------------
  // import('./...') trong file này luôn tính từ thư mục lib, dù trang nào gọi.
  let fb = null;
  window.napFirebase = async function () {
    if (fb) return fb;
    // Ba module phải cùng một nguồn, nếu trộn bản trong máy với bản trên mạng Firebase sẽ không chạy.
    const nap = goc => Promise.all(['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map(t => import(goc + t)));
    let m;
    try { m = await nap('./'); }
    catch (e) { m = await nap('https://www.gstatic.com/firebasejs/' + BAN_FIREBASE + '/'); }
    fb = { a: m[0], au: m[1], fs: m[2] };
    return fb;
  };

  // ---------------- 2. Kết nối MQTT qua 2 máy chủ ----------------
  // Thiết bị gửi lên máy chủ đầu tiên, máy chủ này hỏng thì tự chuyển sang máy chủ thứ hai (xem code ESP32).
  // App nghe cả hai nên luôn nhận được dữ liệu, và gửi lệnh tới cả hai.
  const MAY_CHU = ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt'];
  const HAN_LENH_MS = 120000;  // lệnh chưa gửi được sau 2 phút thì bỏ, tránh thiết bị nhận lệnh ngắt điện quá muộn
  window.MAY_CHU_MQTT_DS = MAY_CHU;

  // ---------------- 3. Đăng nhập bằng Google, Facebook, Apple, Microsoft (qua Firebase) ----------------
  const BIEU_TUONG = {
    google: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3.1V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/><path fill="#fff" d="m16.7 15.5.5-3.5h-3.4V9.8c0-1 .5-1.9 2-1.9h1.5v-3s-1.4-.2-2.7-.2c-2.7 0-4.5 1.7-4.5 4.7V12H7.1v3.5h3.1v8.4a12.4 12.4 0 0 0 3.7 0v-8.4z"/></svg>',
    apple: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z"/></svg>',
    microsoft: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#F25022" d="M2 2h9.5v9.5H2z"/><path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z"/><path fill="#00A4EF" d="M2 12.5h9.5V22H2z"/><path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z"/></svg>',
  };
  const TEN_NCC = { google: 'Google', facebook: 'Facebook', apple: 'Apple', microsoft: 'Microsoft' };
  window.TEN_NHA_CUNG_CAP = { 'google.com': 'Google', 'facebook.com': 'Facebook', 'apple.com': 'Apple', 'microsoft.com': 'Microsoft' };

  window.veNutMXH = function (khung, ds) {
    if (!khung) return;
    khung.innerHTML = (ds || []).filter(t => BIEU_TUONG[t]).map(t =>
      '<button type="button" class="nut-mxh" data-mxh="' + t + '">' + BIEU_TUONG[t] + '<span>Tiếp tục với ' + TEN_NCC[t] + '</span></button>').join('');
  };

  // Trả về người dùng Firebase, hoặc null nếu phải chuyển hướng cả trang (kết quả lấy bằng getRedirectResult khi trang tải lại).
  // Ưu tiên cửa sổ bật lên: app nằm ở github.io còn trang đăng nhập ở firebaseapp.com, kiểu chuyển hướng cả trang
  // hay hỏng trên trình duyệt mới (chặn lưu dữ liệu giữa hai tên miền). Chỉ chuyển hướng khi cửa sổ bật lên bị chặn.
  window.dangNhapMXH = async function (au, auth, ten) {
    let p;
    if (ten === 'google') { p = new au.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' }); }
    else if (ten === 'facebook') p = new au.FacebookAuthProvider();
    else if (ten === 'apple') { p = new au.OAuthProvider('apple.com'); p.addScope('email'); p.addScope('name'); p.setCustomParameters({ locale: 'vi_VN' }); }
    else if (ten === 'microsoft') { p = new au.OAuthProvider('microsoft.com'); p.setCustomParameters({ prompt: 'select_account' }); }
    else throw { code: 'auth/operation-not-allowed' };
    try { return (await au.signInWithPopup(auth, p)).user; }
    catch (e) {
      if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) {
        await au.signInWithRedirect(auth, p);
        return null;
      }
      throw e;
    }
  };

  window.taoKetNoiMQTT = function (tuyChon) {
    if (!window.mqtt) return null;
    const kn = { clients: [], hangDoi: [] };
    kn.coKetNoi = () => kn.clients.some(c => c.connected);
    kn.gui = function (chuDe, noiDung, giu) {
      const daGui = new Set();
      kn.clients.forEach((c, i) => { if (c.connected) { c.publish(chuDe, noiDung, { retain: !!giu }); daGui.add(i); } });
      if (daGui.size < MAY_CHU.length) kn.hangDoi.push({ chuDe, noiDung, giu: !!giu, daGui, luc: Date.now() });
      return daGui.size > 0;
    };
    MAY_CHU.forEach((url, i) => {
      const c = mqtt.connect(url, { clientId: tuyChon.tienTo + '-' + Math.random().toString(16).slice(2, 10), reconnectPeriod: 5000, connectTimeout: 15000 });
      c.on('connect', () => {
        c.subscribe(tuyChon.chuDe);
        kn.hangDoi = kn.hangDoi.filter(x => {
          if (!x.giu && Date.now() - x.luc > HAN_LENH_MS) return false;
          if (!x.daGui.has(i)) { c.publish(x.chuDe, x.noiDung, { retain: x.giu }); x.daGui.add(i); }
          return x.daGui.size < MAY_CHU.length;
        });
        if (tuyChon.khiKetNoi) tuyChon.khiKetNoi(i);
      });
      c.on('message', (chuDe, buf) => tuyChon.khiNhan(chuDe, buf, i));
      c.on('offline', () => { if (tuyChon.khiMat && !kn.coKetNoi()) tuyChon.khiMat(); });
      c.on('error', () => {});
      kn.clients.push(c);
    });
    return kn;
  };
})();
