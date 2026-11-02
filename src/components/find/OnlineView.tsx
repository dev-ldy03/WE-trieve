import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import Badge from '@/components/Badge'
import BottomSheet from '@/components/BottomSheet'
import Button from '@/components/Button'
import Icon from '@/components/Icon'
import ItemArt from '@/components/ItemArt'
import { useApp } from '@/context/AppContext'
import { demoPosts, KIND_NOUN, POST_CHANNELS } from '@/data/demo'
import { formatDate } from '@/lib/format'
import type { Item } from '@/types'
import Chip from './Chip'
import type { SearchCase } from './types'

interface OnlineViewProps {
  item: Item
  searchCase: SearchCase
  /** 게시물 장소로 문의처를 연다 (동선에 없으면 false) */
  onContactPlace: (placeName: string) => boolean
  onContact: () => void
}

/** 찾기 › 온라인 탐색: 예시 습득물 게시물을 채널별로 보고 비교·후보 저장·제외 */
export default function OnlineView({ item, searchCase, onContactPlace, onContact }: OnlineViewProps) {
  const { showToast } = useApp()
  const [channel, setChannel] = useState('전체')
  const [saved, setSaved] = useState<Set<string>>(() => new Set())
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set())
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [original, setOriginal] = useState(false)
  const noun = KIND_NOUN[item.kind]
  const key = (n: number) => `${item.id}-${n}`
  const list = demoPosts.map((p, n) => ({ ...p, n })).filter((p) => (channel === '전체' || channel === p.source) && !excluded.has(key(p.n)))
  const open = openIndex === null ? null : demoPosts[openIndex]

  const close = () => {
    setOpenIndex(null)
    setOriginal(false)
  }

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Text className="text-ink" style={{ fontSize: 17, fontWeight: '700' }}>비슷한 게시물 {list.length}건</Text>
        <Badge label="AI 탐색 결과 예시" />
      </View>
      <Text className="mt-1 text-muted" style={{ fontSize: 12 }}>{searchCase.feature} · 동선 주변</Text>
      <View className="mt-3 rounded-[9px] bg-[#f5f7fb] p-3">
        <Text style={{ fontSize: 11, color: '#8090a5', lineHeight: 20 }}>
          탐색 완료 <Text style={{ fontWeight: '700' }}>5개 채널</Text>
          {'\n'}LOST112 · 지하철 · 버스 · 당근 · 중고나라
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="my-3" contentContainerClassName="gap-[9px]">
        {POST_CHANNELS.map((c) => (
          <Chip key={c} label={c} active={channel === c} onPress={() => setChannel(c)} />
        ))}
      </ScrollView>

      {list.map((p) => (
        <Pressable key={p.n} onPress={() => setOpenIndex(p.n)} className="border-b border-[#e8ecf1] py-5">
          <View className="flex-row justify-between">
            <Text className="text-muted" style={{ fontSize: 12 }}>{p.source} · {formatDate(searchCase.day).split(' (')[0]} {p.time}</Text>
            {saved.has(key(p.n)) && <Badge label="확인 후보" />}
          </View>
          <View className="mt-3 flex-row items-center gap-3">
            <View className="h-[50px] w-[50px] items-center justify-center rounded-[14px] bg-[#f5f6f0]">
              <ItemArt kind={item.kind} width={44} height={38} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-ink" style={{ fontSize: 14 }}>{p.title(noun)}</Text>
              <Text className="text-muted" style={{ fontSize: 12 }}>{p.place}</Text>
            </View>
          </View>
          <View className="mt-3 flex-row gap-1.5 rounded-[7px] bg-[#f6f8fc] p-2.5">
            <Icon name="spark" size={13} color="#62779a" />
            <Text className="flex-1" style={{ fontSize: 11, color: '#62779a' }}>{p.why}</Text>
          </View>
        </Pressable>
      ))}
      {list.length === 0 && <Text className="py-9 text-center text-muted">남은 후보가 없어요.</Text>}
      <Pressable onPress={() => setExcluded(new Set())} className="pt-3">
        <Text style={{ fontSize: 12, color: '#6279bd' }}>제외한 게시물 다시 보기</Text>
      </Pressable>

      <View className="mt-3 rounded-[13px] border border-line p-[18px]">
        <Text className="font-semibold text-ink">검색하는 동안 신고·문의도 진행해요</Text>
        <Text className="text-muted" style={{ fontSize: 12 }}>게시물이 아직 올라오지 않았을 수 있어요.</Text>
        <Button full variant="secondary" label="동선 주변 문의처 확인" onPress={onContact} />
      </View>
      <Text className="my-4 text-[#9299a2]" style={{ fontSize: 11, lineHeight: 18 }}>
        사진·게시물·일치 근거는 모두 가상 예시입니다. 실제 검색 결과나 소유권 판정이 아닙니다.
      </Text>

      <BottomSheet open={open !== null} onClose={close}>
        {open && !original && (
          <View>
            <Badge label={`${open.source} · 가상 게시물`} />
            <Text className="mt-3 text-ink" style={{ fontSize: 21, fontWeight: '700' }}>{open.title(noun)}</Text>
            <View className="mt-[18px] flex-row gap-3">
              {[
                ['내 물건', searchCase.feature],
                ['게시물 속 물건', open.features],
              ].map(([t, d]) => (
                <View key={t} className="flex-1 rounded-[10px] bg-[#f7f8fb] p-3.5">
                  <ItemArt kind={item.kind} width={46} height={40} />
                  <Text className="mt-2.5 font-semibold text-ink" style={{ fontSize: 12 }}>{t}</Text>
                  <Text style={{ fontSize: 11, color: '#8894a3' }}>{d}</Text>
                </View>
              ))}
            </View>
            <View className="mt-3 rounded-[13px] border border-line p-[18px]">
              <Text className="font-semibold text-ink">왜 비슷하다고 봤나요?</Text>
              <Text className="mt-1 text-muted" style={{ fontSize: 12 }}>{open.why}</Text>
              <Text className="mt-1 text-ink" style={{ fontSize: 12 }}>습득·게시 시간 {open.time}{'\n'}장소 {open.place}</Text>
            </View>
            <Button
              full
              label={open.contactPlace ? '비슷해요 · 보관처 문의' : '비슷해요 · 후보로 저장'}
              onPress={() => {
                setSaved((prev) => new Set(prev).add(key(openIndex!)))
                close()
                showToast('확인할 후보로 저장했어요.')
                if (open.contactPlace && !onContactPlace(open.contactPlace)) onContact()
              }}
            />
            <Button
              full
              variant="ghost"
              label="내 물건이 아니에요"
              onPress={() => {
                setExcluded((prev) => new Set(prev).add(key(openIndex!)))
                close()
              }}
            />
            <Pressable onPress={() => setOriginal(true)} className="flex-row items-center gap-1 pt-3">
              <Text style={{ fontSize: 12, color: '#6279bd' }}>원문 내용 보기</Text>
              <Icon name="arrow" size={14} color="#6279bd" />
            </Pressable>
          </View>
        )}
        {open && original && (
          <View>
            <Badge label="원문 미리보기 · 가상" />
            <Text className="mt-3 text-ink" style={{ fontSize: 21, fontWeight: '700' }}>{open.title(noun)}</Text>
            <Text className="mt-4 text-ink">{formatDate(searchCase.day)} {open.time}, {open.place}에 등록된 게시물입니다.</Text>
            <Text className="text-ink">특징: {open.features}</Text>
            <Text className="my-4 text-[#9299a2]" style={{ fontSize: 11 }}>실제 서비스에서는 출처 사이트의 원문으로 이동해요. 이 화면은 외부 사이트를 열지 않아요.</Text>
            <Button full label="비교 화면으로 돌아가기" onPress={() => setOriginal(false)} />
          </View>
        )}
      </BottomSheet>
    </View>
  )
}
