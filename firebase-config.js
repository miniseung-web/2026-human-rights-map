export const firebaseConfig = {
  apiKey: "AIzaSyBRs8-5WO_Km5HxDysCGr_FkySfTatxLks",
  authDomain: "human-rights-map-f9a20.firebaseapp.com",
  projectId: "human-rights-map-f9a20",
  storageBucket: "human-rights-map-f9a20.firebasestorage.app",
  messagingSenderId: "594183436362",
  appId: "1:594183436362:web:acf5a0f7654f000df40eb3",
  measurementId: "G-SWG6765ZVY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Firebase Authentication에서 아래 이메일 계정을 1개 만들고,
// 비밀번호를 교사가 사용할 관리자 번호(6자리 이상 숫자 권장)로 설정하세요.
export const ADMIN_EMAIL = "teacher@rights-map.local";
