# WE:triever 프로토타입 (모바일 앱)

## 1. 개요
- 서비스: 사용자가 늘 들고 다니는 휴대폰으로 하루 동선을 기록한다. 장소나 자리를 옮길 때마다 등록한 소지품을 챙겼는지 알려 주고, 기간별 동선과 분실 위험을 분석해 준다.
- 핵심 가치: 물건을 "찾아주는" 것보다 "애초에 두고 오지 않게" 하는 것이 우선이다.
- 목적: 창업 공모전 시연용 프로토타입. 실제 휴대폰에서 실행되며, 기능 구성과 사용 흐름을 보여준다.
- 브랜드 톤: 자주 잃어버려 자책하는 사람에게 "괜찮아, 우리가 있어"라고 말하는 위로형 톤. 문구는 부드럽게, 색감은 따뜻한 파스텔 계열로 한다.

## 2. 범위
- 포함: 모바일 앱 UI, 지도, 더미 위치·활동 데이터, 시뮬레이션 버튼으로 재현하는 동작
- 제외(이번 단계): 실제 GPS·센서 수집, 백그라운드 추적, 서버/DB, 로그인, 결제, 실제 ML 모델
- 단, 나중에 실제 센서 데이터로 교체할 수 있도록 데이터 입력부(`src/data/`)와 로직(`src/lib/`)을 UI와 분리한다.

## 3. 기술 스택
- React Native + Expo (TypeScript), Expo Router (탭 내비게이션)
- 스타일: NativeWind (Tailwind 문법)
- 지도: react-native-maps
- 차트: react-native-gifted-charts (react-native-svg 사용)
- 상태 관리: React Context + useState
- Expo Go 앱으로 실제 휴대폰에서 실행할 수 있어야 한다. Expo Go에서 동작하지 않는 라이브러리는 쓰지 않는다.

## 4. 위치 개념: 장소와 자리
- 장소(Place): 건물 단위. 실외 GPS로 구분한다. 예: 학교, 집, 카페
- 자리(Spot): 장소 안의 실내 체류 구간. 걷기·정지 전환으로 구분한다. 예: 학교 > 도서관 3층 열람실, 학생식당
- GPS는 실내에서 정확하지 않으므로, 실내에서는 위치 대신 "한자리에 5분 이상 머물다 다시 걷기 시작한 순간"을 자리 이동으로 본다.

## 5. 데이터 모델 (더미)
- LocationPoint: lat, lng, timestamp
- ActivityEvent: type('걷기' | '정지'), timestamp
- Stay: id, placeName, lat, lng, startAt, endAt, durationMin, spots: Spot[]
- Spot: id, stayId, name, startAt, endAt, durationMin
- Item: id, name, emoji, createdAt
- CheckAlert: id, trigger('장소이동' | '자리이동'), fromId, toId, createdAt, responses: { itemId, status: '챙김' | '두고옴' | '미응답' }[]
- NearLoss: id, itemId, stayId, spotId(nullable), detectedAt, recoveredAt(nullable)

더미 데이터:
- 서울 신촌 일대 장소 6~8곳 (집, 학교, 카페 2곳, 도서관, 헬스장, 식당 등), 학교에는 자리 3~4곳
- 최근 30일 동선: "요일별 루틴 정의 → 하루 단위 LocationPoint, ActivityEvent 생성" 헬퍼로 만든다. 값은 결정적으로 생성하고 약간의 변동을 준다.
- 소지품 기본 등록 4개: 에어팟, 지갑, 가디건, 우산
- 잃어버릴 뻔한 기록 5~8건 (특정 장소·자리·요일에 몰리도록)

## 6. 핵심 로직 (`src/lib/`, UI와 분리한 순수 함수)
- `stay.ts`
  - detectStays(points): 반경 50m 안에서 5분 이상 머문 구간을 Stay로 묶는다.
  - detectSpots(stay, activityEvents): Stay 안에서 5분 이상 정지했다가 다시 걷기 시작한 구간을 Spot으로 나눈다.
- `distance.ts`: 두 좌표 간 거리(haversine), 하루 이동 거리 합계
- `analytics.ts`: 기간(일/주/월)별 총 이동 거리, 체류 장소 수, 장소·자리별 누적 체류 시간 Top 5, 요일·시간대별 활동, 물건별 잃어버릴 뻔한 횟수, 깜빡임이 잦은 장소·자리·요일
- `predict.ts` predictLostPlace(item, stays, nearLosses): 물건을 마지막으로 챙긴 뒤 머문 장소·자리 중 두고 왔을 가능성이 높은 곳 Top 3를 확률과 근거 문구로 반환한다.
  - 점수 = 체류 시간 × (과거에 그곳에서 잃어버릴 뻔한 이력이 있으면 가중치 2)

## 7. 화면 구성 (하단 탭 4개)

### 7-1. 지도 (탭 1, 홈)
- 오늘 이동 경로를 지도에 선(Polyline)으로 표시한다.
- 5분 이상 머문 장소에 마커를 찍는다. 마커를 누르면 장소명, 도착~출발 시각, 체류 시간과 그 안의 자리 타임라인이 보인다.
- 상단 요약 카드: 오늘 이동 거리, 머문 장소 수
- 날짜 선택: 지난 날짜의 경로를 다시 볼 수 있다.
- 시뮬레이션 버튼 2개:
  - "다른 장소로 이동": 경로를 애니메이션으로 재생한 뒤 챙김 확인 알림을 띄운다.
  - "자리에서 일어나기": 같은 장소 안에서 자리를 옮기고 챙김 확인 알림을 띄운다.

### 7-2. 챙김 확인 알림
- 화면 상단 인앱 배너 → 누르면 바텀시트가 열린다.
- 문구 예시: "열람실에서 일어나셨네요. 다 챙겼는지 한 번만 볼까요?"
- 등록 물건 체크리스트에서 물건마다 "챙겼어요" / "두고 왔어요"를 고른다.
- "두고 왔어요"를 고르면 NearLoss 기록을 만들고, 떠난 장소·자리를 강조한다. "찾았어요"를 누르면 recoveredAt을 기록한다.

### 7-3. 내 물건 (탭 2)
- 등록 물건 목록, 물건 추가 모달(이름, 이모지 선택)과 삭제
- 물건 상세: 마지막으로 챙김을 확인한 장소·자리와 시각, 잃어버릴 뻔한 이력
- "어디에 두고 왔을까?" 버튼 → predict.ts 결과 Top 3를 확률 막대와 근거와 함께 보여준다.

### 7-4. 알림 기록 (탭 3)
- 챙김 확인 알림 목록을 시간 역순으로 보여준다. 계기(장소 이동/자리 이동)와 응답 결과(전부 챙김/두고 옴 있음/미응답)를 배지로 표시한다.
- 항목을 누르면 해당 확인 시트를 다시 연다.

### 7-5. 마이페이지 (탭 4)
- 기간 토글: 하루 / 일주일 / 한 달
- 동선: 기간 내 경로와 체류 마커를 지도에 표시한다(한 달은 자주 간 장소 위주로).
- 이동 통계: 총 이동 거리, 일평균 거리, 체류 장소 수, 장소·자리별 누적 체류 시간 Top 5 (차트)
- 분실 위험 분석:
  - 물건별 잃어버릴 뻔한 횟수
  - 자주 깜빡하는 장소·자리 Top 3, 요일·시간대
  - 위로형 인사이트 문구 예시: "화요일 열람실에서 일어날 때 에어팟을 자주 두고 오셨어요. 화요일엔 저희가 한 번 더 챙길게요."
- 이번 기간 "끝까지 잘 챙긴 날" 수 같은 긍정적 지표를 함께 보여준다.

## 8. 폴더 구조
```
app/            Expo Router 화면 ((tabs)/index, items, alerts, my, items/[id])
src/
  components/   Card, Badge, Banner, BottomSheet, Modal, MapView, PeriodToggle
  data/         places, routine(동선 생성), items, alerts, nearLosses
  lib/          stay.ts, distance.ts, analytics.ts, predict.ts, format.ts
  context/      AppContext.tsx
```

## 9. 작업 규칙
- 단계별로 구현하고, 각 단계가 끝나면 `npx expo start`로 Expo Go에서 실행 가능한 상태를 유지한다.
- 단계가 끝날 때마다 "stepN: 내용" 형식으로 로컬 커밋하고, 변경 내용을 요약한 뒤 멈춰서 확인을 기다린다.
- UI 문구는 모두 한국어로 작성한다.
- 이 문서에 없는 기능은 임의로 추가하지 않는다. 필요하면 먼저 물어본다.
