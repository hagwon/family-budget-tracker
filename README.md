# 👨‍👩‍👧‍👦 가족 가계부

React + TypeScript + Firebase로 만든 실시간 가족 가계부 앱입니다.

## ✨ 주요 기능

- 💰 실시간 수입/지출 관리
- 📊 자동 잔액 계산
- 🔥 Firebase를 통한 실시간 데이터 동기화
- 💱 천 단위 구분자로 금액 입력
- 📱 반응형 디자인 (모바일/데스크톱)
- 👥 가족 구성원 간 데이터 공유

## 🚀 기술 스택

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Database**: Firebase Firestore
- **Deployment**: GitHub Pages
- **Styling**: CSS3

## 📦 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/YOUR_USERNAME/family-budget-tracker.git

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 🔧 Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Firestore Database 활성화
3. `src/firebase.ts`에 Firebase 설정 추가

```typescript
const firebaseConfig = {
  // Firebase 콘솔에서 복사한 설정
};
```

## 📝 사용법

1. **거래 추가**: 수입/지출 선택 후 금액, 카테고리, 설명 입력
2. **실시간 업데이트**: 다른 기기에서도 즉시 변경사항 확인 가능
3. **잔액 확인**: 상단에서 총 잔액, 수입, 지출 요약 확인

## 🌐 데모

[GitHub Pages에서 확인하기](https://YOUR_USERNAME.github.io/family-budget-tracker/)

## 📸 스크린샷

![가계부 메인 화면](https://via.placeholder.com/600x400?text=가계부+메인+화면)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 🙏 감사 인사

- [Firebase](https://firebase.google.com/) - 실시간 데이터베이스
- [React](https://reactjs.org/) - UI 라이브러리
- [Vite](https://vitejs.dev/) - 빌드 도구

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!