import { Pressable, Text, View } from 'react-native'
import { groupByPlace, type MapViewProps } from './mapTypes'

/** 웹 미리보기용: react-native-maps는 웹을 지원하지 않아 장소 목록으로 대신한다 */
export default function MapView({
  stays = [],
  frequentPlaces = [],
  movingRoute,
  movingProgress = 0,
  lostMarks = [],
  selectedPlace,
  onSelectPlace,
  height = 340,
}: MapViewProps) {
  const names = [...groupByPlace(stays).map((p) => p.placeName), ...frequentPlaces.map((p) => p.placeName)]
  return (
    <View style={{ height }} className="items-center justify-center gap-3 rounded-3xl border border-peach bg-white p-4">
      <Text className="text-3xl">🗺️</Text>
      <Text className="text-sm text-ink-soft">지도는 휴대폰 앱에서 보여드려요</Text>
      {movingRoute && <Text className="text-xs text-rose-deep">🚶 이동 중 {Math.round(movingProgress * 100)}%</Text>}
      {lostMarks.length > 0 && (
        <Text testID="lost-marks" className="text-xs text-rose-deep">
          🧸 두고 온 곳: {lostMarks.map((m) => m.label).join(', ')}
        </Text>
      )}
      <View className="flex-row flex-wrap justify-center gap-2">
        {names.map((name) => (
          <Pressable
            key={name}
            testID={`place-${name}`}
            onPress={() => onSelectPlace?.(name)}
            className={`rounded-full px-3 py-1 ${selectedPlace === name ? 'bg-coral-deep' : 'bg-peach'}`}
          >
            <Text className={`text-xs ${selectedPlace === name ? 'text-white' : 'text-ink'}`}>{name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}
