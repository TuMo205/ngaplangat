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
window.FIREBASE_CONFIG = null;

// Nút "Tiếp tục với ..." trên màn hình đăng nhập. Mỗi cách phải được bật trong
// Firebase > Authentication > Sign-in method (xem HUONG_DAN_FIREBASE.txt). Bỏ tên nào ra thì nút đó ẩn.
// Miễn phí: 'google', 'facebook', 'microsoft'. Trả phí: 'apple' (cần tài khoản Apple Developer).
window.DANG_NHAP_MXH = {
  app: ['google', 'facebook'],           // app người dân
  xa: ['google'],                         // bảng điều hành xã (cán bộ dùng Gmail)
};
