# 인권지도 만들기 웹앱 v2

이번 버전은 최종 20개 인권 분류(5-5-6-4)와 큐티뽀짝 오리지널 마스코트 UI를 반영했습니다.

## GitHub에서 기존 사이트를 수정하는 가장 쉬운 방법
기존 Firebase 연결을 유지하려면 아래 4개 파일만 교체하세요.

- `index.html`
- `styles.css`
- `app.js`
- `questions.js`

**`firebase-config.js`는 기존 GitHub에 연결해 둔 파일을 그대로 유지하세요.**

업로드 후 새 버전이 처음 실행될 때 Firestore의 예전 기본 문제 데이터를 v2 문제로 자동 교체하도록 구성했습니다.
(관리자에서 이후 직접 수정한 문제는 같은 v2 버전 안에서는 유지됩니다.)

## 최종 영역별 개수
- 자유롭게 살 권리: 5개
- 차별받지 않고 안전하게 살 권리: 5개
- 인간답게 생활할 권리: 6개
- 함께 살아가기 위한 권리: 4개

## UI
특정 상업 캐릭터를 복제하지 않고, 둥글고 말랑한 오리지널 마스코트를 CSS로 구현했습니다. 별도의 이미지 파일이 없어 GitHub에 추가 업로드할 파일도 없습니다.

# 인권지도 만들기 웹앱

중학교 1학년 도덕 수업용 웹앱입니다.

## 주요 기능
- 1~7반 / 1~28번 / 이름 입력
- 20개 상황카드
- STEP 1: 상황 → 관련 인권 선택
- STEP 2: 인권 → 4개 인권지도 영역 분류
- 첫 오답 격려 / 두 번째 오답 정답 안내
- 진행 상황 자동 저장 / 이어하기
- 관리자 게임 열기·마감·마감취소
- **다음 수업 예고 화면 ON/OFF**
- 반별 학생 진행 현황
- 문제 및 격려 문구 수정
- 가장 많이 헷갈린 권리 통계
- CSV 다운로드
- 전체 기록 초기화

---

## 1. Firebase 준비

Firebase Console에서 프로젝트를 만들고 다음 기능을 켜세요.

### Authentication
1. **Anonymous** 로그인 사용 설정
2. **Email/Password** 로그인 사용 설정

### 관리자 계정 1개 만들기
Authentication > 사용자 > 사용자 추가

- 이메일: `teacher@rights-map.local`
- 비밀번호: 교사가 사용할 **관리자 번호**
- Firebase 비밀번호 최소 길이 때문에 **6자리 이상 숫자**를 권장합니다.

학생 화면에는 이메일이 보이지 않고 관리자 번호만 입력합니다.

### Firestore Database
Firestore Database를 만든 뒤 `firestore.rules` 내용을
Firebase Console > Firestore Database > Rules에 붙여넣고 게시하세요.

---

## 2. Firebase 웹 앱 설정

Firebase Console > 프로젝트 설정 > 내 앱 > 웹 앱 추가

생성된 설정 값을 `firebase-config.js`에 붙여넣으세요.

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

---

## 3. GitHub Pages 배포

1. GitHub 새 저장소 생성
2. 이 폴더의 모든 파일 업로드
3. Settings > Pages
4. Deploy from a branch
5. `main` / `/root` 선택
6. 저장

잠시 뒤 사이트 주소가 생성됩니다.

---

## 4. 수업 전 교사 사용 순서

1. 첫 화면 좌측 상단 `관리자`
2. 관리자 번호 입력
3. `게임 관리`
4. 다음 수업 예고 ON/OFF 확인
5. `게임 열기`
6. 학생들에게 사이트 주소 또는 QR 코드 제공
7. 수업 중 `학생 현황`으로 완료 여부 확인
8. 수업 후 `결과 보기`에서 많이 헷갈린 권리 확인
9. 필요하면 `게임 마감`

---

## 5. 다음 수업 예고 ON/OFF

관리자 > 게임 관리 > `다음 수업 예고 화면`

- OFF: 인권지도 완성 후 바로 수업 완료 화면
- ON: `인권 생존게임` 예고 화면을 보여준 뒤 수업 완료 화면

기본값은 OFF입니다.

---

## 6. 파일 구성

- `index.html` 화면 구조
- `styles.css` 디자인
- `app.js` 게임 및 관리자 기능
- `questions.js` 기본 20개 문제
- `firebase-config.js` Firebase 설정
- `firestore.rules` Firestore 규칙
- `README.md` 설치 안내

---

## 보안 참고

관리자 번호는 소스 코드에 저장하지 않고 Firebase Authentication 비밀번호로 사용합니다.

현재 학생 데이터 구조는 초보 교사의 쉬운 사용을 우선해 간단하게 구성했습니다. 학생 UI에서는 타인의 정보가 보이지 않지만, Firestore 규칙 자체를 학생별로 매우 엄격하게 분리하려면 별도 서버 또는 Cloud Functions 구조가 필요합니다.
