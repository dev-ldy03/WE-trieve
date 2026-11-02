import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import BackLink from '@/components/BackLink'
import Badge from '@/components/Badge'
import BottomSheet from '@/components/BottomSheet'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Icon from '@/components/Icon'
import ItemArt from '@/components/ItemArt'
import MapView from '@/components/MapView'
import Screen from '@/components/Screen'
import Toggle from '@/components/Toggle'
import { useApp } from '@/context/AppContext'
import { initialItems } from '@/data/items'
import { formatDateTime, formatTime, josa, timeAgo } from '@/lib/format'
import { placeKey } from '@/lib/predict'
import colors from '@/theme/colors.json'

/** 웹 정적 빌드에서 기본 물건 상세 페이지를 미리 만든다 (앱에는 영향 없음) */
export function generateStaticParams(): { id: string }[] {
  return initialItems.map((item) => ({ id: item.id }))
}

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { items, nearLosses, stayById, spotById, now, notify, setNotify, statusOf, markRecovered, showToast } = useApp()
  const [ringing, setRinging] = useState(false)
  const item = items.find((i) => i.id === id)
  const status = item ? statusOf(item.id) : null
  const stay = status?.stayId ? stayById.get(status.stayId) : undefined
  const left = status?.state === '두고옴'

  const history = useMemo(
    () => nearLosses.filter((nl) => nl.itemId === id).sort((a, b) => b.detectedAt - a.detectedAt),
    [nearLosses, id],
  )

  if (!item || !status) {
    return (
      <Screen>
        <BackLink label="내 물건" />
        <Text className="text-muted">이 물건을 찾을 수 없어요.</Text>
      </Screen>
    )
  }

  const goFind = () => router.push({ pathname: '/find', params: { item: item.id } })

  return (
    <Screen>
      <BackLink label="내 물건" />
      <View className="flex-row items-center justify-between">
        <View className="gap-1.5">
          <Text className="text-ink" style={{ fontSize: 25, fontWeight: '700', letterSpacing: -1.1 }}>
            {item.name}
          </Text>
          <Badge tone={left ? 'warn' : 'ok'} label={left ? '잠시 멀어졌어요' : status.state === '챙김' ? '함께 있어요' : '챙김 확인 전'} />
        </View>
        <View className="h-[50px] w-[50px] items-center justify-center rounded-[14px] bg-[#f5f6f0]">
          <ItemArt kind={item.kind} width={46} height={40} />
        </View>
      </View>

      <View className="my-[18px]">
        <MapView
          height={210}
          stays={stay ? [stay] : []}
          lostMarks={left && stay ? [{ key: stay.id, label: status.place ?? '', placeName: stay.placeName, lat: stay.lat, lng: stay.lng }] : []}
          selectedPlace={stay?.placeName}
          pinLabels={stay ? { [stay.placeName]: '!' } : undefined}
        />
      </View>

      <Card>
        <Text className="mb-1.5 text-muted" style={{ fontSize: 12 }}>
          {left ? '두고 온 것 같은 곳' : '마지막으로 챙김을 확인한 곳'}
        </Text>
        <Text className="text-ink" style={{ fontSize: 17, fontWeight: '700', letterSpacing: -0.5 }}>
          {status.place ?? '아직 챙김 확인 기록이 없어요'}
        </Text>
        <Text className="mt-1 text-muted" style={{ fontSize: 12, lineHeight: 19 }}>
          {left
            ? `${status.at ? timeAgo(status.at, now) : ''} 이곳을 떠날 때 두고 왔다고 알려 주셨어요. 이곳부터 확인해볼까요?`
            : status.at
              ? `${formatDateTime(status.at)}, 이곳을 떠날 때 챙겼다고 알려 주셨어요.`
              : '장소를 옮기면 챙김 확인 알림을 보내 드릴게요.'}
        </Text>
        <View className="mt-[15px] flex-row gap-[9px]">
          <Button small variant={left ? 'secondary' : 'primary'} icon="sound" label="소리로 찾기" onPress={() => setRinging(true)} />
          <Button small icon="search" label="찾아볼 장소" onPress={goFind} />
        </View>
        {left && status.nearLossId && (
          <Button full variant="ghost" label="찾았어요" onPress={() => { markRecovered(status.nearLossId!); showToast('다행이에요. 물건을 찾았어요!') }} />
        )}
      </Card>

      <Card className="mt-3 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="font-semibold text-ink">두고 오면 알려주기</Text>
          <Text className="text-muted" style={{ fontSize: 12 }}>
            장소나 자리를 옮길 때 챙김 확인 알림을 받아요.
          </Text>
        </View>
        <Toggle value={notify} onChange={setNotify} label="두고 오면 알려주기" />
      </Card>

      <Pressable onPress={() => router.push('/support')} className="mt-[19px] flex-row items-center gap-[13px] rounded-[12px] border border-line bg-paper p-[17px]">
        <View className="h-[42px] w-[42px] items-center justify-center rounded-[14px] bg-[#edf1fb]">
          <Icon name="shield" color="#627cbd" />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-ink" style={{ fontSize: 13 }}>
            {item.protected ? '재구매 지원 대상이에요' : '이 물건도 지원받을 수 있어요'}
          </Text>
          <Text className="mt-0.5 text-muted" style={{ fontSize: 11 }}>
            지원 내용 확인하기
          </Text>
        </View>
        <Icon name="arrow" size={15} color={colors.muted} />
      </Pressable>

      <Text className="mb-2 mt-[26px] text-ink" style={{ fontSize: 17, fontWeight: '700' }}>
        잃어버릴 뻔한 기록
      </Text>
      {history.length === 0 ? (
        <Text className="text-muted" style={{ fontSize: 12 }}>
          한 번도 두고 온 적이 없어요. 정말 잘 챙기고 있어요!
        </Text>
      ) : (
        history.map((nl) => {
          const s = stayById.get(nl.stayId)
          const spot = nl.spotId ? (spotById.get(nl.spotId)?.name ?? null) : null
          return (
            <View key={nl.id} className="flex-row items-center justify-between border-b border-line py-[13px]">
              <View className="flex-1">
                <Text className="font-semibold text-ink" style={{ fontSize: 14 }}>
                  {s ? placeKey(s.placeName, spot) : '알 수 없는 장소'}
                </Text>
                <Text className="text-muted" style={{ fontSize: 11 }}>
                  {formatDateTime(nl.detectedAt)}
                </Text>
              </View>
              {nl.recoveredAt === null ? (
                <Pressable onPress={() => markRecovered(nl.id)} className="rounded-[7px] bg-ok-soft px-2.5 py-1.5">
                  <Text className="text-ok-text" style={{ fontSize: 12, fontWeight: '600' }}>찾았어요</Text>
                </Pressable>
              ) : (
                <Badge tone="ok" label={`${formatTime(nl.recoveredAt)}에 찾음`} />
              )}
            </View>
          )
        })
      )}
      {history.length > 0 && (
        <Text className="mt-3 text-center text-muted" style={{ fontSize: 11 }}>
          {josa(item.name, '을/를')} {history.length}번 두고 올 뻔했지만 괜찮아요. 우리가 같이 챙길게요.
        </Text>
      )}

      <BottomSheet open={ringing} onClose={() => setRinging(false)}>
        <View className="items-center">
          <View className="my-5 h-[65px] w-[65px] items-center justify-center rounded-full bg-accent-soft">
            <Icon name="sound" size={28} color={colors.accent} />
          </View>
          {left ? (
            <>
              <Text className="text-ink" style={{ fontSize: 19, fontWeight: '700' }}>지금은 멀리 있어요</Text>
              <Text className="mt-2.5 text-center text-muted" style={{ fontSize: 12, lineHeight: 19 }}>
                두고 온 곳 근처로 가면{'\n'}소리로 찾을 수 있어요.
              </Text>
              <Button full label="찾아볼 장소 확인" onPress={() => { setRinging(false); goFind() }} />
            </>
          ) : (
            <>
              <Text className="text-ink" style={{ fontSize: 19, fontWeight: '700' }}>{item.name}의 소리를 따라가요</Text>
              <Text className="mt-2.5 text-center text-muted" style={{ fontSize: 12, lineHeight: 19 }}>
                소리로 찾기 시연 화면이에요.{'\n'}실제 기기에서는 소리가 울리지 않아요.
              </Text>
              <Button full label="찾았어요" onPress={() => { setRinging(false); showToast('다행이에요. 물건을 찾았어요!') }} />
              <Button full variant="ghost" label="찾기 중지" onPress={() => setRinging(false)} />
            </>
          )}
        </View>
      </BottomSheet>
    </Screen>
  )
}
