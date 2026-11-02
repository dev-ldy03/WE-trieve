import { Pressable, Text, View } from 'react-native'
import { useApp } from '@/context/AppContext'
import { formatDateTime, formatTime, josa } from '@/lib/format'
import { placeKey } from '@/lib/predict'
import { alertMessage } from '@/lib/stay'
import type { CheckStatus } from '@/types'
import BottomSheet from './BottomSheet'
import Button from './Button'
import ItemArt from './ItemArt'

const choices: { status: CheckStatus; label: string; on: string; onText: string }[] = [
  { status: '챙김', label: '챙겼어요', on: 'bg-ok-soft border-ok/40', onText: 'text-ok-text' },
  { status: '두고옴', label: '두고 왔어요', on: 'bg-warn-soft border-warn/40', onText: 'text-warn-text' },
]

/** 챙김 확인 시트 — 배너나 알림 화면에서 연다 */
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
  const arrival = alert.trigger === '자리이동' ? `${josa(ends.toLabel, '으로/로')} 자리를 옮김` : `${ends.toLabel}에 도착`

  return (
    <BottomSheet open title={alertMessage(alert.trigger, ends.fromLabel)} onClose={closeSheet}>
      <Text className="mb-4 text-muted" style={{ fontSize: 12 }}>
        {formatDateTime(alert.createdAt)} · {arrival}
      </Text>

      {rows.map(({ item, status }) => {
        const nearLoss = nearLosses.find(
          (nl) => nl.itemId === item.id && nl.stayId === ends.fromStay.id && nl.spotId === (ends.fromSpot?.id ?? null),
        )
        return (
          <View key={item.id} className="border-b border-line-soft py-3">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-[12px] bg-[#f6f7f8]">
                <ItemArt kind={item.kind} width={40} height={34} />
              </View>
              <Text className="flex-1 font-semibold text-ink" numberOfLines={1} style={{ fontSize: 15 }}>
                {item.name}
              </Text>
              <View className="flex-row gap-1.5">
                {choices.map((c) => {
                  const selected = status === c.status
                  return (
                    <Pressable
                      key={c.status}
                      onPress={() => respond(alert.id, item.id, c.status)}
                      accessibilityState={{ selected }}
                      className={`rounded-[8px] border px-3 py-1.5 ${selected ? c.on : 'border-line bg-paper'}`}
                    >
                      <Text className={selected ? c.onText : 'text-muted'} style={{ fontSize: 12, fontWeight: '600' }}>
                        {c.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
            {status === '두고옴' && nearLoss && (
              <View className={`mt-2 flex-row items-center gap-2 rounded-[8px] px-3 py-2 ${nearLoss.recoveredAt === null ? 'bg-warn-soft' : 'bg-ok-soft'}`}>
                {nearLoss.recoveredAt === null ? (
                  <>
                    <Text className="flex-1 text-warn-text" style={{ fontSize: 12 }}>
                      괜찮아요, {josa(leftPlace, '을/를')} 표시해 뒀어요.
                    </Text>
                    <Pressable onPress={() => markRecovered(nearLoss.id)} className="rounded-[7px] bg-paper px-2.5 py-1">
                      <Text className="text-ok-text" style={{ fontSize: 12, fontWeight: '600' }}>
                        찾았어요
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Text className="text-ok-text" style={{ fontSize: 12 }}>
                    {formatTime(nearLoss.recoveredAt)}에 다시 찾았어요. 다행이에요!
                  </Text>
                )}
              </View>
            )}
          </View>
        )
      })}

      <Button label="확인했어요" onPress={closeSheet} full />
    </BottomSheet>
  )
}
