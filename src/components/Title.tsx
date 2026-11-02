import { Text, View } from 'react-native'

/** 레퍼런스의 화면 제목(h2)과 한 줄 설명 */
export default function Title({ title, sub }: { title: string; sub?: string }) {
  return (
    <View>
      <Text className="text-ink" style={{ fontSize: 26, fontWeight: '700', letterSpacing: -1.1, lineHeight: 36 }}>
        {title}
      </Text>
      {sub ? <Text className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{sub}</Text> : null}
    </View>
  )
}
