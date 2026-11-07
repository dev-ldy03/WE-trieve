import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import DealView from '@/components/community/DealView'
import LendView from '@/components/community/LendView'
import TalkView from '@/components/community/TalkView'
import Screen from '@/components/Screen'
import Title from '@/components/Title'

type CommunityTab = 'lend' | 'talk' | 'deal'
const TABS: [CommunityTab, string][] = [
  ['lend', '빌려 쓰기'],
  ['talk', '이야기'],
  ['deal', '알뜰 재구매'],
]

export default function Community() {
  const [tab, setTab] = useState<CommunityTab>('lend')

  return (
    <Screen>
      <Title title="커뮤니티" sub="깜빡한 날엔 서로 빌려주고, 속상한 날엔 같이 이야기해요." />

      <View className="mb-5 mt-3 flex-row gap-[21px] border-b border-[#edf0f4]">
        {TABS.map(([id, label]) => (
          <Pressable
            key={id}
            onPress={() => setTab(id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === id }}
            className={`-mb-px border-b-2 pb-2.5 pt-3 ${tab === id ? 'border-[#252e3a]' : 'border-transparent'}`}
          >
            <Text style={{ fontSize: 13, color: tab === id ? '#252e3a' : '#9299a4', fontWeight: tab === id ? '700' : '400' }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* 세 화면을 모두 띄워 두고 보이는 것만 바꿔, 탭을 오가도 올린 글·반응이 남게 한다 */}
      <View style={{ display: tab === 'lend' ? 'flex' : 'none' }}>
        <LendView />
      </View>
      <View style={{ display: tab === 'talk' ? 'flex' : 'none' }}>
        <TalkView />
      </View>
      <View style={{ display: tab === 'deal' ? 'flex' : 'none' }}>
        <DealView />
      </View>
    </Screen>
  )
}
