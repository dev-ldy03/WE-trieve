import type { ItemKind } from '../types'

/** 찾기 화면의 시연용 예시 데이터 (게시물·연락처는 모두 가상) */

export const KIND_NOUN: Record<ItemKind, string> = {
  wallet: '갈색 가죽 지갑',
  buds: '흰색 무선 이어폰 케이스',
  keys: '열쇠 꾸러미',
  charger: '흰색 충전기',
}

export interface DemoPost {
  source: string
  title: (noun: string) => string
  place: string
  time: string
  features: string
  why: string
  /** "비슷해요"를 누르면 문의할 장소 (동선에 있으면 그 문의처로 이동) */
  contactPlace: string | null
}

export const POST_CHANNELS = ['전체', 'LOST112', '지하철', '버스', '당근', '중고나라']

export const demoPosts: DemoPost[] = [
  { source: 'LOST112', title: (n) => `${n} 습득`, place: '신촌역 2번 출구', time: '15:10', features: '색상·특징이 비슷해요', why: '물건 종류·색상·특징이 비슷하고, 지나간 시간과 습득 시간이 가까워요.', contactPlace: null },
  { source: '지하철', title: (n) => `대합실에서 습득한 ${n}`, place: '신촌역 대합실', time: '15:25', features: '특징 확인 불가', why: '지나간 곳 근처에서 습득됐어요. 고유 특징은 추가 확인이 필요해요.', contactPlace: null },
  { source: '버스', title: () => '7016번 차량 내 물품 보관', place: '7016번 종점', time: '15:40', features: '보호 커버가 달라요', why: '같은 동네 노선이지만 특징이 달라요. 사진을 비교해보세요.', contactPlace: null },
  { source: '당근', title: (n) => `카페 앞에서 ${n} 주웠어요`, place: '카페 온기 앞', time: '14:50', features: '특징이 비슷해요', why: '방문한 카페 근처이고 특징이 비슷해요.', contactPlace: '카페 온기' },
  { source: '중고나라', title: (n) => `${n} 판매 게시물`, place: '신촌 직거래', time: '16:00', features: '외관 정보 부족', why: '지역과 종류만 비슷해요. 내 물건이라는 근거는 부족하고 도난 여부도 알 수 없어요.', contactPlace: null },
]

export interface DemoContact {
  name: string
  hours: string
  phone: string
  where: string
}

export const demoContacts: Record<string, DemoContact> = {
  연세대학교: { name: '연세대 중앙도서관 안내 데스크', hours: '09:00–21:00', phone: '02-0000-0001', where: '각 층 안내 데스크·분실물 보관함' },
  '카페 온기': { name: '카페 온기 분실물 담당', hours: '08:00–22:00', phone: '02-0000-0002', where: '카운터 보관함' },
  '카페 달빛': { name: '카페 달빛 분실물 담당', hours: '09:00–22:00', phone: '02-0000-0003', where: '카운터 보관함' },
  '신촌 도서관': { name: '신촌 도서관 안내 데스크', hours: '09:00–22:00', phone: '02-0000-0004', where: '1층 안내 데스크' },
  '튼튼 헬스장': { name: '튼튼 헬스장 프런트', hours: '06:00–23:00', phone: '02-0000-0005', where: '프런트·탈의실 분실물함' },
  '밥심 식당': { name: '밥심 식당', hours: '11:00–21:00', phone: '02-0000-0006', where: '계산대' },
}

export const CONTACT_RESULTS = ['아직 문의 전', '부재중 · 다시 문의', '접수된 물건 없음', '비슷한 물건 있음']
export const REPORT_CHANNELS = ['LOST112', '지하철 분실 신고']
