import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import AddItemSheet from '@/components/AddItemSheet'
import Icon from '@/components/Icon'
import ItemArt from '@/components/ItemArt'
import Screen from '@/components/Screen'
import { useApp } from '@/context/AppContext'
import { josa, timeAgo } from '@/lib/format'
import colors from '@/theme/colors.json'

const STATE_LABEL = { 챙김: '챙겼어요', 두고옴: '두고 왔어요', '확인 전': '확인 전' } as const

export default function Home() {
  const { items, alerts, now, statusOf } = useApp()
  const [adding, setAdding] = useState(false)
  const statuses = items.map((item) => ({ item, status: statusOf(item.id) }))
  const checkedCount = statuses.filter((s) => s.status.state === '챙김').length
  const lost = statuses.find((s) => s.status.state === '두고옴')
  const waiting = alerts.filter((a) => now - a.createdAt < 86400000 && a.responses.some((r) => r.status === '미응답')).length

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <Text className="text-ink" style={{ fontSize: 28, fontWeight: '700', letterSpacing: -1.2 }}>
          내 물건
        </Text>
        <Pressable onPress={() => setAdding(true)} accessibilityLabel="물건 추가" hitSlop={8} className="p-1">
          <Icon name="plus" size={20} color="#636b76" />
        </Pressable>
      </View>
      <Text className="mb-6 mt-1 text-muted" style={{ fontSize: 13 }}>
        {items.length}개 등록 <Text style={{ color: '#c2c5cc' }}> · </Text> {checkedCount}개 챙김 확인
      </Text>

      {lost ? (
        <Attention
          title={`${josa(lost.item.name, '을/를')} 두고 온 것 같아요`}
          sub={`${lost.status.place ?? '알 수 없는 장소'} · ${lost.status.at ? timeAgo(lost.status.at, now) : ''}`}
          onPress={() => router.push({ pathname: '/item/[id]', params: { id: lost.item.id } })}
        />
      ) : waiting > 0 ? (
        <Attention title={`챙김 확인 ${waiting}건이 기다려요`} sub="알림을 눌러 다 챙겼는지 확인해 주세요" onPress={() => router.push('/alerts')} />
      ) : null}

      <View className="flex-row justify-between pb-1">
        <Text className="text-ink" style={{ fontSize: 12, fontWeight: '600' }}>
          전체 물건
        </Text>
        <Text className="text-muted" style={{ fontSize: 11 }}>
          최근 챙김 기준
        </Text>
      </View>

      {statuses.map(({ item, status }) => (
        <View key={item.id} className="flex-row items-center gap-2 border-b border-line-soft py-[19px]">
          <Pressable
            onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
            className="min-w-0 flex-1 flex-row items-center gap-3.5 active:opacity-70"
          >
            <View className="h-[72px] w-[66px] items-center justify-center rounded-[14px] bg-[#f6f7f8]">
              <ItemArt kind={item.kind} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-ink" style={{ fontSize: 16, fontWeight: '600', letterSpacing: -0.4 }}>
                {item.name}
              </Text>
              <Text className="mb-1.5 mt-1 text-[#89909a]" style={{ fontSize: 12 }} numberOfLines={1}>
                {status.place ? `${status.place} · ${status.at ? timeAgo(status.at, now) : ''}` : '아직 챙김 기록이 없어요'}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <View className={`h-[5px] w-[5px] rounded-full ${status.state === '챙김' ? 'bg-ok' : 'bg-warn'}`} />
                <Text className={status.state === '챙김' ? 'text-ok' : 'text-warn'} style={{ fontSize: 11 }}>
                  {STATE_LABEL[status.state]}
                </Text>
              </View>
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: '/find', params: { item: item.id } })}
            accessibilityLabel={`${item.name} 찾기`}
            className="rounded-[7px] bg-[#f0f3f9] px-3 py-[7px]"
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#52678d' }}>찾기</Text>
          </Pressable>
        </View>
      ))}

      <Pressable onPress={() => setAdding(true)} className="flex-row items-center justify-center gap-1.5 py-[19px]">
        <Icon name="plus" size={18} color="#737c89" />
        <Text style={{ fontSize: 13, color: '#737c89' }}>새 물건 등록</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/support')} className="mt-4 flex-row items-center justify-between rounded-[12px] bg-surface p-[17px]">
        <View>
          <Text className="font-semibold text-ink" style={{ fontSize: 13 }}>
            재구매 지원
          </Text>
          <Text className="mt-1 text-[#89909a]" style={{ fontSize: 11 }}>
            {items.filter((i) => i.protected).length}개 물건의 지원 내용을 확인하세요
          </Text>
        </View>
        <Icon name="arrow" size={19} color={colors.ink} />
      </Pressable>
      <Text className="mt-5 text-center text-faint" style={{ fontSize: 10 }}>
        프로토타입 · 위치와 챙김 기록은 예시입니다
      </Text>

      <AddItemSheet open={adding} onClose={() => setAdding(false)} />
    </Screen>
  )
}

function Attention({ title, sub, onPress }: { title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mb-[30px] flex-row items-center gap-3 rounded-[12px] bg-accent-tint p-4 active:opacity-80">
      <Icon name="pin" size={19} color="#5270d2" />
      <View className="flex-1">
        <Text className="text-ink" style={{ fontSize: 13, fontWeight: '600' }}>
          {title}
        </Text>
        <Text className="mt-0.5 text-[#7f8794]" style={{ fontSize: 12 }}>
          {sub}
        </Text>
      </View>
      <Icon name="arrow" size={16} color="#9ca5b5" />
    </Pressable>
  )
}
