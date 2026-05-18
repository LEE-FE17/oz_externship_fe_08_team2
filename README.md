# 📚 OZ Externship — 커뮤니티 게시판 (Team 2)

## 📖 프로젝트 소개

> OZ 코딩스쿨 외부 실습 과정의 팀 프로젝트입니다.  
> 수강생들이 자유롭게 게시글을 작성·수정·삭제하고, 댓글과 좋아요로 소통할 수 있는 커뮤니티 플랫폼 프론트엔드를 구현했습니다.

---

## 🔗 배포 링크

> ### [🌐 커뮤니티 바로가기](https://community.ozcodingschool.site/community)

---

## 🗓️ 프로젝트 기간

> **2026.04.17 – 2026.05.18**

---

## 🖥️ 서비스 소개

|    게시글 목록     |  게시글 상세 조회  |    게시글 수정     |
| :----------------: | :----------------: | :----------------: |
| <img width="1512" height="862" alt="스크린샷 2026-05-18 오전 11 20 58" src="https://github.com/user-attachments/assets/3efd804d-d0e7-4b94-a63b-799e0ab0ffc9" />
 | <img width="1512" height="863" alt="스크린샷 2026-05-18 오전 11 21 24" src="https://github.com/user-attachments/assets/ffb46ad5-2869-4fa4-aadb-fa02c78bf78d" />
 | <img width="1512" height="863" alt="스크린샷 2026-05-18 오전 11 23 44" src="https://github.com/user-attachments/assets/7c76d71e-6135-4aab-ad5a-4641485d7424" />
 |

---

## 🧰 기술 스택

### FE

<div align=center>

  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/React 19-00A8E1?style=for-the-badge&logo=react&logoColor=black">
  <img src="https://img.shields.io/badge/Vite 8-646CFF?style=for-the-badge&logo=vite&logoColor=white">
  <br>

  <img src="https://img.shields.io/badge/Tailwind CSS v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
  <img src="https://img.shields.io/badge/React Router v7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white">
  <img src="https://img.shields.io/badge/TanStack Query v5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white">
  <br>

  <img src="https://img.shields.io/badge/Zustand v5-433E38?style=for-the-badge&logo=zustand&logoColor=white">
  <img src="https://img.shields.io/badge/Axios-6935D3?style=for-the-badge&logo=axios&logoColor=white">
  <img src="https://img.shields.io/badge/MSW v2-FF6A33?style=for-the-badge&logo=mockserviceworker&logoColor=white">
  <br>

  <img src="https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white">
  <img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white">
  <img src="https://img.shields.io/badge/Prettier-FF4F8B?style=for-the-badge&logo=prettier&logoColor=white">
  <img src="https://img.shields.io/badge/Figma-EF2D5E?style=for-the-badge&logo=figma&logoColor=white">

</div>

---

## 👥 팀원

### FE

| <a href="https://github.com/LEE-FE17"><img src="https://github.com/LEE-FE17.png" width=100px/><br/><sub><b>@LEE-FE17</b></sub></a> | <a href="https://github.com/eueuehshsj"><img src="https://github.com/eueuehshsj.png" width=100px/><br/><sub><b>@eueuehshsj</b></sub></a> | <a href="https://github.com/SunMyunC"><img src="https://github.com/SunMyunC.png" width=100px/><br/><sub><b>@SunMyunC</b></sub></a> | <a href="https://github.com/springwind0818"><img src="https://github.com/springwind0818.png" width=100px/><br/><sub><b>@springwind0818</b></sub></a> |
| :--------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                               이문희                                                               |                                                                  이용기                                                                  |                                                               정선영                                                               |                                                                        최민제                                                                        |

---

## 📑 프로젝트 규칙

### Branch Strategy

> - `main` / `dev` 브랜치 기본 생성
> - `main` 과 `dev` 로 직접 push 제한
> - PR 전 최소 1인 이상 승인 필수
> - 기능 개발은 `feat/`, 버그 수정은 `fix/`, 문서는 `docs/` 접두사 브랜치에서 진행

### Git Convention

> | 접두사     | 설명                           |
> | ---------- | ------------------------------ |
> | `feat`     | 새로운 기능 구현               |
> | `fix`      | 버그 수정                      |
> | `refactor` | 코드 리팩토링 (동작 변경 없음) |
> | `style`    | 스타일링 작업                  |
> | `docs`     | 문서 추가 및 수정              |
> | `test`     | 테스트 추가 및 수정            |
> | `chore`    | 기타 작업                      |
> | `build`    | 빌드 관련                      |
> | `ci`       | CI/CD 관련                     |
> | `perf`     | 성능 개선                      |
>
> **커밋 메시지 형식:** `<type>: <설명>` (예: `feat: 게시글 좋아요 기능 구현`)

### Pull Request

> **제목 형식:** `[feat] 게시글 상세 페이지 구현` 과 같이 작성합니다.
>
> | 항목       | 내용                                       |
> | ---------- | ------------------------------------------ |
> | 관련 이슈  | `closes #이슈번호` 형식으로 연결           |
> | 작업 내용  | 구체적인 작업 내용 목록                    |
> | 변경 사항  | 이전 대비 달라진 점                        |
> | 스크린샷   | 선택 사항 (UI 변경 시 첨부 권장)           |
> | 체크리스트 | 동작 확인 / console.log 제거 / 컨벤션 준수 |

### Code Convention

> - 경로 별칭 `@/` → `src/` 사용
> - 화살표 함수 사용
> - Named export 방식 (`export default` 지양)
> - Event handler 네이밍: `handle~` (예: `handleSubmit`)
> - Feature 모듈 패턴: `types.ts / queries.ts / handler.ts / index.ts`
> - 컴포넌트: `컴포넌트명/컴포넌트명.tsx` + `index.ts` 구조

### Communication Rules

> - **Discord** — 실시간 소통 및 화상 회의
> - **Notion** — 문서화 및 회의록
> - **Zep** — 팀 가상 오피스
> - **데일리 스크럼** — 매일 오전 10시

---

## 📂 주요 기능

### 게시글

| 기능      | 설명                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------- |
| 목록 조회 | 카테고리 탭 필터, 제목·내용·작성자·제목+내용 복합 검색, 최신순·조회순·좋아요순·댓글순 정렬, 페이지네이션 |
| 상세 조회 | 제목·본문·작성자·조회수·좋아요 수 표시, 마크다운+HTML 렌더링                                             |
| 작성      | 마크다운 에디터, 카테고리 선택, 이미지 업로드 (presigned URL)                                            |
| 수정      | 기존 내용 불러와 수정, 작성자 본인만 접근                                                                |
| 삭제      | 확인 모달 후 삭제, 성공 시 토스트 표시 → 목록 페이지로 이동                                              |

### 댓글

| 기능             | 설명                                                                    |
| ---------------- | ----------------------------------------------------------------------- |
| 무한 스크롤 조회 | 10개씩 페이지 로드, 하단 도달 시 자동 다음 페이지 요청                  |
| 작성             | 로그인 사용자만 입력창 노출, 빈 문자열 유효성 검사                      |
| 삭제             | 본인 댓글 삭제, 확인 모달                                               |
| 정렬             | 최신순 / 오래된순 전환                                                  |
| @멘션 파싱       | `@닉네임` 패턴을 `tagged_users` 와 매칭하여 보라색 볼드 하이라이트 표시 |

### 좋아요

- 토글 방식 (POST / DELETE)
- **낙관적 업데이트**: 서버 응답 전 UI 즉시 갱신, 실패 시 자동 롤백

---

## ⚙️ 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build
```

### 환경 변수

프로젝트 루트에 `.env` 파일을 생성합니다.

```env
VITE_API_BASE_URL=https://api.ozcodingschool.site
```

---

## 📋 Documents

> [📜 화면 정의서](https://docs.google.com/spreadsheets/d/1IxPe0Y_62yXaOgu2WccoPYBoJbyQ0BlIEiEo1mzIlHM/edit?usp=sharing)
