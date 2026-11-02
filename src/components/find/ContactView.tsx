import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import Badge from '@/components/Badge'
import BottomSheet from '@/components/BottomSheet'
import Button from '@/components/Button'
import Icon from '@/components/Icon'
import { CONTACT_RESULTS, demoContacts, REPORT_CHANNELS } from '@/data/demo'
import { formatDate, formatTime, josa } from '@/lib/format'
import colors from '@/theme/colors.json'
import type { Item } from '@/types'
import Chip from './Chip'
import type { SearchCase, Stop } from './types'

interface ContactViewProps {
  item: Item
  searchCase: SearchCase
  stops: Stop[]
  index: number
  setIndex: (i: number) => void
}

type SheetKind = 'call' | 'script' | 'report' | null

/** 찾기 › 신고·문의: 동선 위 장소별 문의처(예시), 문의 결과 기록, 온라인 분실 신고 안내 */
export default function ContactView({ item, searchCase, stops, index, setIndex }: ContactViewProps) {
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [channel, setChannel] = useState(REPORT_CHANNELS[0])
  const [step, setStep] = useState(0)
  const [reports, setReports] = useState<string[]>([])
  const stop = stops[index]
  const contact = stop ? demoContacts[stop.placeName] : undefined
  const note = stop ? (notes[stop.key] ?? CONTACT_RESULTS[0]) : CONTACT_RESULTS[0]
  const record = (result: string) => {
    if (stop) setNotes((prev) => ({ ...prev, [stop.key]: result }))
    setSheet(null)
  }

  return (
    <View>
      <Text className="text-ink" style={{ fontSize: 17, fontWeight: '700' }}>동선 위 문의처</Text>
      <Text className="mt-1 text-muted" style={{ fontSize: 12 }}>방문한 곳을 고르면 그곳의 문의처가 나와요.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="my-3" contentContainerClassName="gap-[9px]">
        {stops.map((s, i) => (
          <Chip key={s.key} label={`${i + 1}. ${s.label}`} active={i === index} onPress={() => setIndex(i)} />
        ))}
      </ScrollView>

      {!stop ? (
        <Text className="py-9 text-center text-muted">선택한 시간대에 방문한 곳이 없어요.</Text>
      ) : !contact ? (
        <View className="rounded-[12px] border border-[#e4e9f1] p-4">
          <Text className="font-semibold text-ink">{stop.label}</Text>
          <Text className="mt-2 text-muted" style={{ fontSize: 12 }}>집이에요. 가방 안, 현관, 자주 두는 곳을 한 번 더 둘러보세요.</Text>
        </View>
      ) : (
        <View className="rounded-[12px] border border-[#e4e9f1] p-4">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 font-semibold text-ink">{contact.name}</Text>
            <Badge label="연락처 예시" />
          </View>
          <Text className="my-2.5 text-[#87919c]" style={{ fontSize: 12 }}>{stop.spotName ? `${stop.spotName} 주변 · ${contact.where}` : contact.where}</Text>
          {[
            ['운영시간', contact.hours],
            ['전화번호', contact.phone],
          ].map(([k, v]) => (
            <View key={k} className="flex-row py-1">
              <Text className="w-[75px] text-[#8d98a4]" style={{ fontSize: 12 }}>{k}</Text>
              <Text className="text-ink" style={{ fontSize: 12 }}>{v}</Text>
            </View>
          ))}
          <View className="mt-2.5 flex-row gap-[9px]">
            <Button small label="전화 문의" onPress={() => setSheet('call')} />
            <Button small variant="secondary" label="문의 내용 보기" onPress={() => setSheet('script')} />
          </View>
          <Text className="mb-[7px] mt-[17px] font-semibold text-ink" style={{ fontSize: 12 }}>문의 결과</Text>
          <View className="flex-row flex-wrap gap-2">
            {CONTACT_RESULTS.map((r) => (
              <Chip key={r} label={r} active={note === r} onPress={() => stop && setNotes((prev) => ({ ...prev, [stop.key]: r }))} />
            ))}
          </View>
        </View>
      )}

      <Text className="mt-[26px] text-ink" style={{ fontSize: 17, fontWeight: '700' }}>온라인 분실 신고</Text>
      <Text className="mt-1 text-muted" style={{ fontSize: 12 }}>탐색과 별개로 신고를 남겨둘 수 있어요.</Text>
      {REPORT_CHANNELS.map((c) => (
        <Pressable
          key={c}
          onPress={() => {
            setChannel(c)
            setStep(0)
            setSheet('report')
          }}
          className="flex-row items-center justify-between border-b border-[#edf0f3] py-4"
        >
          <View>
            <Text className="font-semibold text-ink">{c}</Text>
            <Text className="mt-0.5 text-[#8b96a4]" style={{ fontSize: 11 }}>절차 확인 → 정보 준비 → 접수 기록</Text>
          </View>
          <Icon name="arrow" size={16} color={colors.muted} />
        </Pressable>
      ))}
      {reports.length > 0 && (
        <View className="mt-3 rounded-[13px] border border-line p-[18px]">
          <Text className="font-semibold text-ink">내 신고 기록</Text>
          {reports.map((r, i) => (
            <Text key={i} className="text-ink" style={{ fontSize: 12 }}>{r} · DEMO-{i + 1} · 시연 접수</Text>
          ))}
        </View>
      )}
      <Text className="my-4 text-[#9299a2]" style={{ fontSize: 11, lineHeight: 18 }}>
        기관명·운영시간·전화번호는 화면 구성을 위한 예시입니다. 실제 통화·신고는 하지 않습니다.
      </Text>
      <Pressable onPress={() => router.push('/support')} className="flex-row items-center gap-1 pb-4">
        <Text style={{ fontSize: 12, color: '#6279bd' }}>찾지 못했을 때 · 재구매 지원 확인</Text>
        <Icon name="arrow" size={14} color="#6279bd" />
      </Pressable>

      <BottomSheet open={sheet !== null} onClose={() => setSheet(null)}>
        {sheet === 'call' && contact && (
          <View>
            <Text className="text-ink" style={{ fontSize: 21, fontWeight: '700' }}>{contact.name}</Text>
            <Text className="mt-4 text-ink" style={{ fontSize: 24, fontWeight: '700' }}>{contact.phone}</Text>
            <Text className="text-muted" style={{ fontSize: 12 }}>운영시간 {contact.hours}</Text>
            <Text className="my-4 text-[#9299a2]" style={{ fontSize: 11 }}>가상 번호예요. 실제 전화는 걸지 않아요.</Text>
            <Button full label="부재중으로 기록" onPress={() => record('부재중 · 다시 문의')} />
            <Button full variant="secondary" label="물건 없음으로 기록" onPress={() => record('접수된 물건 없음')} />
            <Button full variant="ghost" label="비슷한 물건 있음" onPress={() => record('비슷한 물건 있음')} />
          </View>
        )}
        {sheet === 'script' && stop && (
          <View>
            <Text className="text-ink" style={{ fontSize: 21, fontWeight: '700' }}>문의할 내용</Text>
            <View className="mt-3 rounded-[13px] border border-line p-[18px]">
              <Text className="text-ink" style={{ lineHeight: 22 }}>
                안녕하세요. {formatDate(searchCase.day)} {formatTime(stop.startAt)}–{formatTime(stop.endAt)}에 {stop.label}에 있다가 {josa(item.name, '을/를')} 찾지 못하고 있습니다.
              </Text>
              <Text className="mt-2 text-ink" style={{ lineHeight: 22 }}>특징은 {searchCase.feature}입니다. 비슷한 물건이 접수됐는지 확인 부탁드립니다.</Text>
            </View>
            <Text className="my-4 text-[#9299a2]" style={{ fontSize: 11 }}>지금 고른 물건·시간·장소가 반영된 문구예요.</Text>
            <Button full label="확인했어요" onPress={() => setSheet(null)} />
          </View>
        )}
        {sheet === 'report' && (
          <View>
            <Badge label={`${step + 1} / 3 · ${['절차 안내', '신고 정보', '접수 기록'][step]}`} />
            {step === 0 && (
              <>
                <Text className="mt-3 text-ink" style={{ fontSize: 21, fontWeight: '700' }}>{channel}에 신고하기</Text>
                <Text className="mt-2 text-ink" style={{ fontSize: 13, lineHeight: 30 }}>
                  1. 신고 사이트에서 본인 확인{'\n'}2. 분실 물건·일시·장소 입력{'\n'}3. 특징과 사진 등록{'\n'}4. 접수번호 보관
                </Text>
                <Button full label="신고 정보 준비" onPress={() => setStep(1)} />
              </>
            )}
            {step === 1 && (
              <>
                <Text className="mt-3 text-ink" style={{ fontSize: 21, fontWeight: '700' }}>기억한 내용을 모았어요</Text>
                <View className="mt-3 rounded-[13px] border border-line p-[18px]">
                  <Text className="text-ink" style={{ lineHeight: 22 }}>
                    물건: {item.name}{'\n'}날짜: {formatDate(searchCase.day)}{'\n'}분실 추정 시간: {searchCase.from}–{searchCase.to ?? '지금'}
                    {'\n'}장소: {stop?.label ?? '-'}{'\n'}특징: {searchCase.feature}
                  </Text>
                </View>
                <Button full label="신고 사이트 이동 체험" onPress={() => setStep(2)} />
              </>
            )}
            {step === 2 && (
              <>
                <Text className="mt-3 text-ink" style={{ fontSize: 21, fontWeight: '700' }}>신고를 마쳤나요?</Text>
                <Text className="mt-3 text-ink">외부 신고 사이트에서 접수한 뒤 돌아와 접수번호를 기록해요.</Text>
                <Text className="my-4 text-[#9299a2]" style={{ fontSize: 11 }}>지금은 외부 전송 없이 예시 접수번호를 저장해요.</Text>
                <Button
                  full
                  label="시연 접수 기록 저장"
                  onPress={() => {
                    setReports((prev) => [...prev, channel])
                    setSheet(null)
                  }}
                />
              </>
            )}
          </View>
        )}
      </BottomSheet>
    </View>
  )
}
