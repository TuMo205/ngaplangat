// Cấu hình Firebase cho tài khoản thật trên đám mây.
// Để trống (null) thì app chạy chế độ demo: tài khoản lưu trên trình duyệt của từng máy.
// Cách lấy cấu hình: xem HUONG_DAN_FIREBASE.txt, rồi dán vào đây, ví dụ:
//
// window.FIREBASE_CONFIG = {
//   apiKey: "AIza...",
//   authDomain: "ngaplangat.firebaseapp.com",
//   projectId: "ngaplangat",
//   storageBucket: "ngaplangat.appspot.com",
//   messagingSenderId: "1234567890",
//   appId: "1:1234567890:web:abcdef"
// };
// Dự án Firebase "ngaplangat" (tạo ngày 07/10/2026, gói miễn phí Spark).
// Các thông số này được phép công khai; dữ liệu được bảo vệ bằng luật trong firebase/firestore.rules.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyA_NYdGF-YZdOmEZTwirYeZPeVKuzbPgb8",
  authDomain: "ngaplangat.firebaseapp.com",
  projectId: "ngaplangat",
  storageBucket: "ngaplangat.firebasestorage.app",
  messagingSenderId: "458767696351",
  appId: "1:458767696351:web:8fbe4963e6f173a482846a"
};

// Nút "Tiếp tục với ..." trên màn hình đăng nhập. Mỗi cách phải được bật trong
// Firebase > Authentication > Sign-in method (xem HUONG_DAN_FIREBASE.txt). Bỏ tên nào ra thì nút đó ẩn.
// Miễn phí: 'google', 'facebook', 'microsoft'. Trả phí: 'apple' (cần tài khoản Apple Developer).
// Facebook chưa bật (cần tạo app trên developers.facebook.com), bật xong thì thêm 'facebook' vào danh sách app.
window.DANG_NHAP_MXH = {
  app: ['google'],                        // app người dân
  xa: ['google'],                         // bảng điều hành xã (cán bộ dùng Gmail)
};
