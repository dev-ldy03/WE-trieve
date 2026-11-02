import { useMemo, useState, type ReactNode } from 'react'
import { Text, useWindowDimensions, View } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'
import Card from '@/components/Card'
import MapView from '@/components/MapView'
import PeriodToggle from '@/components/PeriodToggle'
import Screen from '@/components/Screen'
import { useApp } from '@/context/AppContext'
import {
  analyzeLosses,
  frequentPlaces,
  goodDays,
  movementStats,
  periodRange,
  pointsIn,
  staysIn,
  topDwell,
  type Period,
} from '@/lib/analytics'
import { formatDistance, formatDuration } from '@/lib/format'
import colors from '@/theme/colors.json'

const PERIOD_LABEL: Record<Period, string> = { day: '오늘', week: '이번 주', month: '이번 달' }
const BAR_COLORS = [colors.coralDeep, colors.coral, '#f7b9a5', colors.peach, '#ffe4d1']

export default function MyPage() {
  const { points, stays, nearLosses, items, stayById, spotById, now } = useApp()
  const [period, setPeriod] = useState<Period>('week')
  const { width } = useWindowDimensions()
  const range = useMemo(() => periodRange(period, now), [period, now])

  const stats = useMemo(() => movementStats(points, stays, range), [points, stays, range])
  const dwell = useMemo(() => topDwell(stays, range), [stays, range])
  const losses = useMemo(
    () => analyzeLosses(nearLosses, items, stayById, spotById, range),
    [nearLosses, items, stayById, spotById, range],
  )
  const good = goodDays(nearLosses, range)

  // 한 달은 경로 대신 자주 간 장소만 크게 보여준다
  const mapPath = useMemo(() => (period === 'month' ? [] : pointsIn(points, range)), [period, points, range])
  const mapStays = useMemo(() => (period === 'month' ? [] : staysIn(stays, range)), [period, stays, range])
  const frequent = useMemo(() => (period === 'month' ? frequentPlaces(stays, range) : []), [period, stays, range])

  // 화면 좌우 여백(40) + 카드 안쪽 여백(32) + y축 눈금(30)을 뺀 그래프 폭에 막대 5개가 꼭 맞게
  const chartWidth = Math.min(width, 480) - 40 - 32 - 30
  const barWidth = 28
  const edge = 10
  const barSpacing = Math.max(8, Math.floor((chartWidth - edge * 2 - barWidth * 5) / 4))
  const maxHours = Math.max(...dwell.map((d) => d.minutes / 60), 1)
  // 가장 긴 막대 위 라벨이 잘리지 않도록 여유를 둔다
  const chartMax = Math.ceil((maxHours * 1.2) / 4) * 4
  const maxLoss = Math.max(1, ...losses.byItem.map((x) => x.count))

  return (
    <Screen>
      <View>
        <Text className="text-sm text-ink-soft">나의 동선과 깜빡 패턴을 함께 살펴봐요</Text>
        <Text className="text-xl font-bold text-ink">마이페이지</Text>
      </View>

      <PeriodToggle value={period} onChange={setPeriod} />

      <Card className="flex-row items-center gap-3" style={{ backgroundColor: colors.mint }}>
        <Text className="text-3xl">🌷</Text>
        <View className="flex-1">
          <Text className="text-xs text-mint-deep">{PERIOD_LABEL[period]} 끝까지 잘 챙긴 날</Text>
          <Text className="text-xl font-bold text-mint-deep">
            {good}일 <Text className="text-sm font-normal">/ {range.days}일</Text>
          </Text>
        </View>
      </Card>

      <Section title="동선" hint={period === 'month' ? '자주 간 장소일수록 크게 보여요' : undefined}>
        <MapView path={mapPath} stays={mapStays} frequentPlaces={frequent} height={280} />
      </Section>

      <Section title="이동 통계">
        <View className="flex-row gap-2">
          <Stat label="총 이동 거리" value={formatDistance(stats.totalDistance)} />
          <Stat label="일평균" value={formatDistance(stats.dailyAverage)} />
          <Stat label="머문 장소" value={`${stats.placeCount}곳`} />
        </View>
        <Card className="gap-3">
          <Text className="text-sm font-semibold text-ink">
            오래 머문 곳 Top 5 <Text className="text-xs font-normal text-ink-soft">(시간)</Text>
          </Text>
          {dwell.length === 0 ? (
            <Text className="text-xs text-ink-soft">아직 머문 기록이 없어요.</Text>
          ) : (
            <>
              <BarChart
                data={dwell.map((d, i) => ({
                  value: Math.round((d.minutes / 60) * 10) / 10,
                  label: `${i + 1}`,
                  frontColor: BAR_COLORS[i],
                  topLabelComponent: () => (
                    <Text style={{ fontSize: 10, color: colors.inkSoft, marginBottom: 2 }}>
                      {hoursLabel(d.minutes)}
                    </Text>
                  ),
                }))}
                width={chartWidth}
                height={150}
                barWidth={barWidth}
                spacing={barSpacing}
                initialSpacing={edge}
                endSpacing={edge}
                maxValue={chartMax}
                noOfSections={4}
                yAxisLabelWidth={30}
                xAxisLength={chartWidth}
                rulesLength={chartWidth}
                roundedTop
                isAnimated
                disableScroll
                hideRules
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor={colors.peach}
                yAxisTextStyle={{ color: colors.inkSoft, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.ink, fontSize: 11, fontWeight: '600' }}
              />
              <View className="gap-1">
                {dwell.map((d, i) => (
                  <View key={d.label} className="flex-row items-center gap-2">
                    <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BAR_COLORS[i] }} />
                    <Text className="flex-1 text-xs text-ink" numberOfLines={1}>
                      {i + 1}. {d.label}
                    </Text>
                    <Text className="text-xs text-ink-soft">{formatDuration(d.minutes)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>
      </Section>

      <Section title="분실 위험 분석">
        <Card className="flex-row gap-3" style={{ backgroundColor: colors.butter }}>
          <Text className="text-2xl">🧸</Text>
          <Text className="flex-1 text-sm leading-6 text-ink">{losses.insight}</Text>
        </Card>

        <Card className="gap-2.5">
          <Text className="text-sm font-semibold text-ink">물건별 잃어버릴 뻔한 횟수</Text>
          {losses.byItem.map(({ item, count }) => (
            <View key={item.id} className="flex-row items-center gap-2">
              <Text className="w-20 text-sm text-ink" numberOfLines={1}>
                {item.emoji} {item.name}
              </Text>
              <View className="h-2.5 flex-1 overflow-hidden rounded-full bg-cream">
                <View
                  className="h-full rounded-full bg-rose-deep"
                  style={{ width: `${(count / maxLoss) * 100}%`, opacity: count === 0 ? 0 : 0.7 }}
                />
              </View>
              <Text className="w-8 text-right text-xs text-ink-soft">{count}번</Text>
            </View>
          ))}
        </Card>

        <Card className="gap-2">
          <Text className="text-sm font-semibold text-ink">자주 깜빡하는 곳 Top 3</Text>
          {losses.topPlaces.length === 0 ? (
            <Text className="text-xs text-ink-soft">깜빡한 곳이 없어요. 아주 잘하고 있어요!</Text>
          ) : (
            losses.topPlaces.map((p, i) => (
              <View key={p.label} className="flex-row items-center justify-between">
                <Text className="flex-1 text-sm text-ink" numberOfLines={1}>
                  {i + 1}. {p.label}
                </Text>
                <Text className="text-xs font-semibold text-rose-deep">{p.count}번</Text>
              </View>
            ))
          )}
          {losses.topWeekday && losses.topTimeOfDay && (
            <View className="mt-1 flex-row flex-wrap gap-2">
              <Chip label={`📅 ${losses.topWeekday.name}에 ${losses.topWeekday.count}번`} />
              <Chip label={`🕐 ${losses.topTimeOfDay.name}에 ${losses.topTimeOfDay.count}번`} />
            </View>
          )}
        </Card>
      </Section>
    </Screen>
  )
}

/** 막대 위 숫자: 10시간 미만은 소수 한 자리 */
function hoursLabel(minutes: number) {
  const hours = minutes / 60
  return hours < 10 ? hours.toFixed(1) : String(Math.round(hours))
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <View className="flex-row items-baseline justify-between">
        <Text className="font-bold text-ink">{title}</Text>
        {hint && <Text className="text-xs text-ink-soft">{hint}</Text>}
      </View>
      {children}
    </View>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex-1 px-3">
      <Text className="text-xs text-ink-soft">{label}</Text>
      <Text className="mt-1 text-lg font-bold text-coral-deep" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </Card>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-rose/50 px-3 py-1">
      <Text className="text-xs text-rose-deep">{label}</Text>
    </View>
  )
}
