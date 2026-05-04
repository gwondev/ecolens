AI 분리배출 도우미: 지역 규정 + 회수 거점 안내  
사용자가 텍스트/이미지로 폐기물을 판별하고, "어떻게 버릴지"와 "어디에 버릴지"를 한 흐름으로 안내하는 웹 서비스입니다.

## 1) 프로젝트 개요

- 서비스 목적
  - 분리배출 기준이 복잡해 헷갈리는 문제를 빠르게 해결
  - 정보 조회에서 끝나지 않고 실제 배출 행동까지 연결
  - 재활용 정확도 및 실천률 향상
- 플랫폼 구성
  - Frontend(React) + Backend(Spring Boot) + AI 분석(Gemini) 연동
  - 위치 기반 지도(거점 탐색) + 관리자 운영 화면(회원/장치/기록)

## 2) 제안 배경

- 지역/품목/오염도에 따라 분리배출 기준이 달라 사용자 혼선이 반복됨
- 잘못된 배출은 재활용 효율 저하와 처리 비용 증가로 이어짐
- 공공 데이터/정책 흐름과 민간 UX를 결합한 실행형 서비스가 필요함

## 3) 개발 목표

- 텍스트/이미지 기반 폐기물 판별 기능 제공
- 텍스트 분류 정확도 85%+, 이미지 분류 정확도 80%+ (1차 목표)
- 평균 응답시간 3초 이내 목표
- 지도에서 반경 2km 내 거점 우선 노출
- 계정당 일일 분석 10회 제한
- 장애 상황(5xx/네트워크/권한거부)에서도 사용자 안내 및 재시도 동선 제공

## 4) 핵심 기능

- 로그인/온보딩
  - Google OAuth 로그인
  - 신규 사용자 닉네임 설정 후 서비스 진입
- 사용자 기능
  - 텍스트 입력 기반 분리배출 가이드
  - 이미지 업로드 기반 AI 분석 + 가이드
  - 현재 위치 기반 회수 거점 탐색(Leaflet 지도)
- 관리자 기능
  - 회원/장치/인식기록/통계 조회
  - 회수 장치 CRUD

## 5) 차별적 우수성

- AI 분류 + 배출 방법 + 지도 거점 안내 + 운영 관리까지 통합한 End-to-End 흐름
- "판단 -> 안내 -> 실천" 전환을 서비스 내부에서 완결
- 공공 정보 기반 확장성과 민간 UX 중심 실행성을 동시에 고려

## 6) 기술 스택 / 개발 환경

- FN
  - React 19, Vite 8, MUI, React Router, Axios, React-Leaflet, Google OAuth
- BN
  - Spring Boot 4 (Java 21), Spring Web/WebFlux, Spring Security, JPA(Hibernate), JWT, Gemini API
- DB
  - MySQL(운영), H2(로컬 보조)
- INFRA
  - Docker Compose (`frontend:5173`, `backend:8080`)
  - Cloudflare 기반 도메인/HTTPS/리버스 프록시
  - 환경변수 기반 설정 관리
- Version Control
  - Git / GitHub
- Server 운영 메모
  - 팀장 온프레미스 서버(우분투) 기반 운영
  - 포트포워딩 대신 Cloudflare Tunnel 활용

## 7) 시스템/자료 흐름 (요약)

- Root(`/`)에서 로그인 -> `/api/auth/google`
- 신규면 `/nickname` -> `/api/auth/nickname` -> `/map`
- `/map` 진입 시 위치 정보 + `/api/modules` 로드
- 텍스트 입력 -> `/api/ai/disposal-guide`
- 이미지 업로드 -> `/api/ai/analyze` -> 결과 기반 `/api/ai/disposal-guide`
- `/manage`에서 `/api/admin/overview` 조회 + `/api/modules` CRUD

## 8) 실행 방법

### A. Frontend 로컬 실행

```bash
cd frontend
npm install
npm run dev
```

- 개발 시 기본 프록시: `/api -> 127.0.0.1:8080`
- 배포 API를 강제 사용하려면 `frontend/.env.development`에 `VITE_API_BASE_URL` 지정

### B. Docker Compose 실행

```bash
docker compose up --build
```

- `frontend` 5173, `backend` 8080 포트 사용

## 9) 개발 방법

- 요구사항 정의 -> API 계약 기반 프론트/백 병렬 개발
- 인증 -> 지도 -> 분류 안내 -> 관리자 기능 순의 단계적 구현
- 실제 입력 사례 기반 정확도/응답속도/예외처리 반복 점검
- Docker 기반 배포 검증 + Git 브랜치 협업

## 10) 추진 일정 (총 10주)

- 1주차: 범위 확정, 요구사항/기능 목록 정리
- 2주차: 구조 설계, DB 초안, API 명세, 환경 세팅
- 3주차: 로그인/권한, 공통 라우팅/UI
- 4주차: 지도/위치/거점 마커
- 5주차: 텍스트 분류 안내
- 6주차: 이미지 업로드/Gemini 분석
- 7주차: 관리자 화면 + CRUD
- 8주차: 통합 테스트, 예외처리, 성능/UX 개선
- 9주차: Docker/도메인/연동 검증
- 10주차: 최종 테스트, 문서화, 시연 안정화

## 11) 테스트 & 문제해결 (중간)

- `.env` 설정 이슈
  - `VITE_API_BASE_URL`이 배포 주소로 고정되어 Cloudflare 502 발생
  - 로컬 개발 시 프록시(`/api`) 사용하도록 분리하여 해결
- 외부 API 장애 대응
  - 5xx 시 원인 파악이 어려운 UI 문제
  - 에러 분기 및 재시도 유도 메시지 추가
- 위치 권한 거부 대응
  - 지도 초기 표시 불안정
  - 기본 좌표 폴백 + 안내 문구 적용

## 12) 기대 효과

- 분리배출 판단 시간 단축 및 실천률 향상
- 텍스트/이미지 + 지도 결합으로 행동 전환 가능성 강화
- 관리자 데이터 통합으로 운영 효율 및 품질 개선 기반 확보
- 향후 지자체/기업 협력(ESG/리워드) 확장 가능

## 13) 향후 계획

- 핵심 기능 안정화 및 예외 처리 고도화
- AI 정확도 개선(실사용 데이터 기반)
- 관리자 통계 시각화 강화
- 배포 안정성 및 장애 대응 절차 정교화
- 사용자 테스트 확대 및 최종 발표 품질 고도화

## 14) 팀 구성 및 역할

- 팀장: 이성권 (20233189)
  - Server 구축, 형상관리, 전체 스캐폴딩, Infra(Docker), Backend
- 팀원: 이건영 (20243048)
  - Frontend(React UI/UX), WebSocket 통신
- 팀원: 송윤지 (20243040)
  - 중간/기말 보고서, 중간/기말 발표자료(PPT), 자료조사, 팀원 보조
- 팀원: 안예린 (20233027)
  - Figma/UI, 프로젝트 이미지 생성(AI 도구), 와이어프레임

## 15) 참고 자료

- 연합뉴스: https://www.yna.co.kr/view/AKR20250904165600530
- 국가지표체계(국내): https://www.index.go.kr/unify/idx-info.do?idxCd=5096&pop=1
- 머니투데이(국내 사례): https://www.mt.co.kr/future/2026/04/13/2026040700324726232
- Eurostat(국외): https://ec.europa.eu/eurostat/cache/metadata/en/cei_wm011_esmsip2.htm
- OECD(국외): https://www.oecd.org/en/publications/waste-management-and-the-circular-economy-in-selected-oecd-countries_9789264309395-en.html
