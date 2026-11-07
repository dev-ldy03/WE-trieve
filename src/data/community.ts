/** 커뮤니티 탭의 시연용 예시 데이터 (닉네임·게시물·가격은 모두 가상) */

/** 커뮤니티 게시물의 물건 그림(선 아이콘) */
export type GoodsIcon = 'calc' | 'iron' | 'umbrella' | 'battery' | 'plug' | 'buds' | 'wallet' | 'key' | 'pen' | 'tag'

export const GOODS_ICON_OPTIONS: { icon: GoodsIcon; label: string }[] = [
  { icon: 'plug', label: '충전기' },
  { icon: 'battery', label: '보조배터리' },
  { icon: 'calc', label: '계산기' },
  { icon: 'iron', label: '고데기' },
  { icon: 'umbrella', label: '우산' },
  { icon: 'pen', label: '필기구' },
]

/* ───────── 빌려 쓰기 ───────── */

export type LendType = '빌려요' | '빌려줄게요'

export interface LendPost {
  id: string
  type: LendType
  goods: string
  icon: GoodsIcon
  author: string
  place: string
  /** 내 위치에서의 거리(m) */
  distanceM: number
  /** 지금으로부터 몇 분 전 글인지 */
  minutesAgo: number
  /** 언제까지 필요한지 / 빌려줄 수 있는지 */
  until: string
  note: string
  mine?: boolean
}

export const LEND_FILTERS = ['전체', '빌려요', '빌려줄게요'] as const

export const demoLendPosts: LendPost[] = [
  { id: 'l1', type: '빌려요', goods: '공학용 계산기', icon: 'calc', author: '신촌 다람쥐', place: '연세대학교 · 공학관 1층', distanceM: 180, minutesAgo: 6, until: '오늘 15시 시험 끝날 때까지', note: '집에 두고 왔어요… 시험 끝나면 바로 돌려드릴게요. 음료 한 잔 사례할게요!' },
  { id: 'l2', type: '빌려줄게요', goods: '고데기 (미니)', icon: 'iron', author: '아침형 인간', place: '연세대학교 · 학생회관', distanceM: 240, minutesAgo: 14, until: '오늘 18시까지', note: '발표 있는 분 쓰세요. 학생회관 2층 라운지에 있어요.' },
  { id: 'l3', type: '빌려요', goods: 'C타입 충전기', icon: 'plug', author: '배터리 3%', place: '신촌 도서관 · 2층', distanceM: 520, minutesAgo: 22, until: '1시간만', note: '노트북 충전기 말고 휴대폰 충전기요. 자리로 가지러 갈게요.' },
  { id: 'l4', type: '빌려줄게요', goods: '우산 2개', icon: 'umbrella', author: '비 오는 날 우산', place: '카페 온기', distanceM: 610, minutesAgo: 35, until: '내일 오후까지', note: '카페 카운터에 맡겨 둘게요. 다음에 카페 오실 때 돌려주세요.' },
  { id: 'l5', type: '빌려줄게요', goods: '보조배터리', icon: 'battery', author: '챙김왕', place: '연세대학교 · 중앙도서관', distanceM: 90, minutesAgo: 48, until: '오늘 저녁까지', note: '완충돼 있어요. 열람실 앞 사물함 근처에서 드려요.' },
  { id: 'l6', type: '빌려요', goods: '컴퓨터용 사인펜', icon: 'pen', author: '시험기간 생존자', place: '연세대학교 · 백양관', distanceM: 310, minutesAgo: 70, until: '오늘 13시 시험', note: '필통을 통째로 두고 왔어요 ㅠㅠ 한 자루면 돼요.' },
]

/* ───────── 이야기 (하소연) ───────── */

export type TalkTag = '하소연' | '찾았어요' | '챙김 팁'

export interface TalkComment {
  author: string
  body: string
  mine?: boolean
}

export interface TalkPost {
  id: string
  tag: TalkTag
  author: string
  minutesAgo: number
  goods: string
  body: string
  comfort: number
  comments: TalkComment[]
  mine?: boolean
}

export const TALK_TAGS: TalkTag[] = ['하소연', '찾았어요', '챙김 팁']

export const demoTalkPosts: TalkPost[] = [
  {
    id: 't1', tag: '하소연', author: '또 잃어버림', minutesAgo: 25, goods: '에어팟 한쪽',
    body: '이번 달에만 두 번째예요. 버스에서 졸다가 내렸는데 귀에 한쪽이 없더라고요… 저만 이런가요?',
    comfort: 42,
    comments: [
      { author: '신촌 다람쥐', body: '저도 지난주에 똑같이 잃어버렸어요. 버스 회사 분실물센터에 꼭 문의해 보세요!' },
      { author: '챙김왕', body: '내리기 전에 귀 만져보기 습관 들이면 확실히 줄어요. 너무 자책하지 마세요 🙂' },
    ],
  },
  {
    id: 't2', tag: '찾았어요', author: '카페 단골', minutesAgo: 95, goods: '지갑',
    body: '카페 온기에 두고 나온 지갑, 카운터에 맡겨져 있었어요! 동선 복기에서 1순위로 뜬 곳이었는데 진짜 거기 있었네요.',
    comfort: 87,
    comments: [{ author: '아침형 인간', body: '다행이에요!! 친절한 분들 많아요.' }],
  },
  {
    id: 't3', tag: '하소연', author: '열쇠 수집가', minutesAgo: 60 * 5, goods: '집 열쇠',
    body: '헬스장 탈의실에 열쇠 두고 와서 밤 11시에 문 앞에서 30분 기다렸어요. 운동한 보람이 없네요 ㅎㅎ',
    comfort: 31,
    comments: [],
  },
  {
    id: 't4', tag: '챙김 팁', author: '챙김왕', minutesAgo: 60 * 26, goods: '충전기',
    body: '충전기는 콘센트에 꽂힌 채로 두고 오기 제일 쉬워요. 저는 충전기를 꽂으면 휴대폰 케이스에 포스트잇을 하나 붙여 둬요.',
    comfort: 56,
    comments: [{ author: '배터리 3%', body: '오 이거 좋네요. 내일부터 해봐야지' }],
  },
]

/* ───────── 알뜰 재구매 ───────── */

export type DealCategory = '이어폰' | '지갑' | '열쇠' | '충전기' | '기타'

export interface DealPost {
  id: string
  category: DealCategory
  icon: GoodsIcon
  goods: string
  /** 어떤 경로로 다시 샀는지 */
  route: string
  /** 새로 살 때 가격(예시, 원) */
  newPrice: number
  /** 이 경로로 산 가격(예시, 원) */
  routePrice: number
  body: string
  author: string
  minutesAgo: number
  helpful: number
  mine?: boolean
}

export const DEAL_CATEGORIES: ('전체' | DealCategory)[] = ['전체', '이어폰', '지갑', '열쇠', '충전기', '기타']

export const demoDealPosts: DealPost[] = [
  { id: 'd1', category: '이어폰', icon: 'buds', goods: '무선 이어폰 한쪽', route: '제조사 서비스센터 한쪽 교체', newPrice: 249000, routePrice: 119000, body: '한쪽만 잃어버렸으면 새로 사지 말고 한쪽만 교체할 수 있어요. 시리얼 번호가 필요하니 케이스를 챙겨 가세요.', author: '또 잃어버림', minutesAgo: 60 * 3, helpful: 64 },
  { id: 'd2', category: '이어폰', icon: 'buds', goods: '무선 이어폰 케이스', route: '중고 거래 · 케이스만 구매', newPrice: 249000, routePrice: 45000, body: '케이스만 잃어버린 경우 중고로 케이스만 파는 글이 꽤 있어요. 내 이어폰과 호환되는 모델인지 꼭 확인!', author: '중고 고수', minutesAgo: 60 * 20, helpful: 38 },
  { id: 'd3', category: '지갑', icon: 'wallet', goods: '학생증', route: '학교 학생지원팀 재발급', newPrice: 15000, routePrice: 5000, body: '모바일 학생증을 먼저 발급받으면 실물 재발급 기다리는 동안 도서관 출입이 돼요. 카드 분실 신고도 같이 하세요.', author: '신촌 다람쥐', minutesAgo: 60 * 30, helpful: 51 },
  { id: 'd4', category: '충전기', icon: 'plug', goods: '노트북 충전기', route: '정품 호환 충전기', newPrice: 99000, routePrice: 32000, body: '와트(W) 수만 맞으면 호환 충전기로도 충분해요. 인증 마크 있는 제품으로 고르세요.', author: '배터리 3%', minutesAgo: 60 * 50, helpful: 29 },
  { id: 'd5', category: '열쇠', icon: 'key', goods: '집 열쇠', route: '동네 열쇠집 복사', newPrice: 80000, routePrice: 5000, body: '도어락 교체 전에 여분 열쇠로 복사 먼저 해두세요. 복사본 하나는 가족이나 믿을 만한 친구에게!', author: '열쇠 수집가', minutesAgo: 60 * 72, helpful: 22 },
  { id: 'd6', category: '기타', icon: 'calc', goods: '공학용 계산기', route: '학과 중고 장터 · 졸업생 물건', newPrice: 32000, routePrice: 10000, body: '시험 시즌 전에 학과 단톡방 중고 장터에 졸업생들이 많이 내놔요. 시험 기간 직전엔 금방 없어지니 미리!', author: '시험기간 생존자', minutesAgo: 60 * 96, helpful: 17 },
]
