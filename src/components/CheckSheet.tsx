import { Pressable, Text, View } from 'react-native'
import { useApp } from '@/context/AppContext'
import { formatDateTime, formatTime, josa } from '@/lib/format'
import { placeKey } from '@/lib/predict'
import { alertMessage } from '@/lib/stay'
import type { CheckStatus } from '@/types'
import BottomSheet from './BottomSheet'

const choices: { status: CheckStatus; label: string; active: string; activeText: string }[] = [
  { status: '챙김', label: '챙겼어요', active: 'bg-mint border-mint-deep/40', activeText: 'text-mint-deep' },
  { status: '두고옴', label: '두고 왔어요', active: 'bg-rose border-rose-deep/40', activeText: 'text-rose-deep' },
]

/** 챙김 확인 시트 — 배너나 알림 기록에서 연다 */
export default function CheckSheet() {
  const { alerts, items, nearLosses, openAlertId, closeSheet, respond, markRecovered, endpointsOf } = useApp()
  const alert = alerts.find((a) => a.id === openAlertId)
  const ends = alert && endpointsOf(alert)
  if (!alert || !ends) return null

  const itemById = new Map(items.map((item) => [item.id, item]))
  const rows = alert.responses.flatMap((r) => {
    const item = itemById.get(r.itemId)
    return item ? [{ item, status: r.status }] : []
  })
  const leftPlace = placeKey(ends.fromStay.placeName, ends.fromSpot?.name ?? null)
  const arrival =
    alert.trigger === '자리이동' ? `${josa(ends.toLabel, '으로/로')} 자리를 옮김` : `${ends.toLabel}에 도착`

  return (
    <BottomSheet open title={alertMessage(alert.trigger, ends.fromLabel)} onClose={closeSheet}>
      <Text className="mb-4 text-xs text-ink-soft">
        {formatDateTime(alert.createdAt)} · {arrival}
      </Text>

      <View className="gap-3">
        {rows.map(({ item, status }) => {
          const nearLoss = nearLosses.find(
            (nl) =>
              nl.itemId === item.id &&
              nl.stayId === ends.fromStay.id &&
              nl.spotId === (ends.fromSpot?.id ?? null),
          )
          return (
            <View key={item.id} className="rounded-2xl bg-white p-3">
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-1 flex-row items-center gap-2">
                  <Text className="text-2xl">{item.emoji}</Text>
                  <Text className="font-semibold text-ink" numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <View className="flex-row gap-1.5">
                  {choices.map((choice) => {
                    const selected = status === choice.status
                    return (
                      <Pressable
                        key={choice.status}
                        onPress={() => respond(alert.id, item.id, choice.status)}
                        accessibilityState={{ selected }}
                        className={`rounded-full border px-3 py-1.5 ${selected ? choice.active : 'border-transparent bg-cream'}`}
                      >
                        <Text className={`text-xs font-semibold ${selected ? choice.activeText : 'text-ink-soft'}`}>
                          {choice.label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>

              {status === '두고옴' && nearLoss && (
                <View
                  className={`mt-2 flex-row items-center justify-between gap-2 rounded-xl px-3 py-2 ${
                    nearLoss.recoveredAt === null ? 'bg-rose/40' : 'bg-mint/40'
                  }`}
                >
                  {nearLoss.recoveredAt === null ? (
                    <>
                      <Text className="flex-1 text-xs text-rose-deep">
                        괜찮아요, 지도에 {josa(leftPlace, '을/를')} 표시해 뒀어요.
                      </Text>
                      <Pressable
                        onPress={() => markRecovered(nearLoss.id)}
                        className="rounded-full bg-mint px-2.5 py-1"
                      >
                        <Text className="text-xs font-semibold text-mint-deep">찾았어요</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Text className="text-xs text-mint-deep">
                      {formatTime(nearLoss.recoveredAt)}에 다시 찾았어요. 다행이에요! 💚
                    </Text>
                  )}
                </View>
              )}
            </View>
          )
        })}
      </View>

      <Pressable onPress={closeSheet} className="mt-5 items-center rounded-full bg-coral-deep py-3.5 active:opacity-80">
        <Text className="font-semibold text-white">확인했어요</Text>
      </Pressable>
    </BottomSheet>
  )
}
