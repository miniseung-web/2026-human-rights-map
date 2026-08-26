인권지도 v2.3 변경사항

1. 20문제 완료 후 '고생 끝에 낙이 온다' 이미지 화면
2. 다음 화면에 🍀 행운의 뽑기
   - 학생별 1회만 가능
   - 당첨 확률 3/28 ≈ 10.7%
   - 28명 학급 기준 평균 약 3명 당첨
   - 결과는 Firebase 학생 progress에 저장되므로 새로고침해도 다시 뽑을 수 없음
   - 당첨: 간식 1개 / 고양이 발바닥 이미지
   - 꽝: 꽝 이미지
3. 뽑기 후 '인권지도 확인하기'를 눌러 기존 4분할 인권지도 표시
4. 문제 오답 시 정답을 자동 공개하지 않음
   - 틀린 선택지는 비활성화
   - 계속 힌트를 제공
   - 반드시 정답을 직접 선택해야 다음 단계로 넘어감
5. 4영역 분류도 맞힐 때까지 계속 시도
6. 관리자 학생 현황 / CSV에 뽑기 결과 표시

GitHub 교체 파일:
- index.html
- app.js
- styles.css
- questions.js
- assets/completion_meme.png
- assets/lose_meme.png
- assets/win_jelly.png

firebase-config.js는 절대 교체하지 마세요.
