import { router } from 'expo-router'
import { useMemo, useState, type ReactNode } from 'react'
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'
import Card from '@/components/Card'
import Icon, { type IconName } from '@/components/Icon'
import MapView from '@/components/MapView'
import PeriodToggle from '@/components/PeriodToggle'
import Screen from '@/components/Screen'
import Title from '@/components/Title'
import Toggle from '@/components/Toggle'
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
import { WEB_FRAME_WIDTH } from '@/theme/layout'

const PERIOD_LABEL: Record<Period, string> = { day: '오늘', week: '최근 7일', month: '최근 30일' }
const BAR_COLORS = ['#4266ed', '#6482cc', '#90a3d2', '#b7c4e6', '#d6deef']

export default function My() {
  const { points, stays, nearLosses, items, stayById, spotById, now, notify, setNotify, claim, showToast } = useApp()
  const [period, setPeriod] = useState<Period>('week')
  const { width } = useWindowDimensions()
  const range = useMemo(() => periodRange(period, now), [period, now])

  const stats = useMemo(() => movementStats(points, stays, range), [points, stays, range])
  const dwell = useMemo(() => topDwell(stays, range), [stays, range])
  const losses = useMemo(() => analyzeLosses(nearLosses, items, stayById, spotById, range), [nearLosses, items, stayById, spotById, range])
  const good = goodDays(nearLosses, range)

  // 한 달은 경로 대신 자주 간 장소만 크게 보여준다
  const mapPath = useMemo(() => (period === 'month' ? [] : pointsIn(points, range)), [period, points, range])
  const mapStays = useMemo(() => (period === 'month' ? [] : staysIn(stays, range)), [period, stays, range])
  const frequent = useMemo(() => (period === 'month' ? frequentPlaces(stays, range) : []), [period, stays, range])

  // 화면 좌우 여백(48) + 카드 안쪽 여백(36) + y축 눈금(30)을 뺀 그래프 폭에 막대 5개가 꼭 맞게
  const chartWidth = Math.min(width, Platform.OS === 'web' ? WEB_FRAME_WIDTH : 480) - 48 - 36 - 30
  const barWidth = 26
  const edge = 10
  const barSpacing = Math.max(8, Math.floor((chartWidth - edge * 2 - barWidth * 5) / 4))
  const maxHours = Math.max(...dwell.map((d) => d.minutes / 60), 1)
  const chartMax = Math.ceil((maxHours * 1.2) / 4) * 4
  const maxLoss = Math.max(1, ...losses.byItem.map((x) => x.count))

  return (
    <Screen>
      <Title title="나의 WEtriever" sub="물건, 알림, 지원 내역을 관리하세요." />

      <Card className="mt-4 flex-row items-center gap-3">
        <View className="h-[42px] w-[42px] items-center justify-center rounded-[14px] bg-accent-soft">
          <Icon name="user" color={colors.accent} />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-ink">방문자님</Text>
          <Text className="text-muted" style={{ fontSize: 12 }}>등록한 물건 {items.length}개</Text>
        </View>
      </Card>

      <Section title="나의 기록">
        <PeriodToggle value={period} onChange={setPeriod} />
        <Card className="flex-row items-center gap-3" style={{ backgroundColor: colors.okSoft, borderColor: colors.okSoft }}>
          <Icon name="check" size={22} color={colors.ok} />
          <View className="flex-1">
            <Text className="text-ok-text" style={{ fontSize: 12 }}>{PERIOD_LABEL[period]} 끝까지 잘 챙긴 날</Text>
            <Text className="text-ok-text" style={{ fontSize: 20, fontWeight: '700' }}>
              {good}일 <Text style={{ fontSize: 13, fontWeight: '400' }}>/ {range.days}일</Text>
            </Text>
          </View>
        </Card>
        <MapView path={mapPath} stays={mapStays} frequentPlaces={frequent} height={240} />
        {period === 'month' && <Text className="text-muted" style={{ fontSize: 11 }}>자주 간 장소일수록 크게, 숫자는 방문 횟수예요.</Text>}
        <View className="flex-row gap-2">
          <Stat label="총 이동 거리" value={formatDistance(stats.totalDistance)} />
          <Stat label="일평균" value={formatDistance(stats.dailyAverage)} />
          <Stat label="머문 장소" value={`${stats.placeCount}곳`} />
        </View>
        <Card className="gap-3">
          <Text className="font-semibold text-ink" style={{ fontSize: 13 }}>
            오래 머문 곳 Top 5 <Text className="font-normal text-muted" style={{ fontSize: 11 }}>(시간)</Text>
          </Text>
          {dwell.length === 0 ? (
            <Text className="text-muted" style={{ fontSize: 12 }}>아직 머문 기록이 없어요.</Text>
          ) : (
            <>
              <BarChart
                data={dwell.map((d, i) => ({
                  value: Math.round((d.minutes / 60) * 10) / 10,
                  label: `${i + 1}`,
                  frontColor: BAR_COLORS[i],
                  topLabelComponent: () => (
                    <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 2 }}>{hoursLabel(d.minutes)}</Text>
                  ),
                }))}
                width={chartWidth}
                height={140}
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
                xAxisColor={colors.line}
                yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.ink, fontSize: 11, fontWeight: '600' }}
              />
              <View className="gap-1">
                {dwell.map((d, i) => (
                  <View key={d.label} className="flex-row items-center gap-2">
                    <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BAR_COLORS[i] }} />
                    <Text className="flex-1 text-ink" style={{ fontSize: 12 }} numberOfLines={1}>{i + 1}. {d.label}</Text>
                    <Text className="text-muted" style={{ fontSize: 12 }}>{formatDuration(d.minutes)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>
      </Section>

      <Section title="분실 위험 분석">
        <View className="flex-row gap-3 rounded-[12px] bg-accent-tint p-4">
          <Icon name="spark" size={18} color="#5270d2" />
          <Text className="flex-1 text-ink" style={{ fontSize: 13, lineHeight: 21 }}>{losses.insight}</Text>
        </View>
        <Card className="gap-2.5">
          <Text className="font-semibold text-ink" style={{ fontSize: 13 }}>물건별 잃어버릴 뻔한 횟수</Text>
          {losses.byItem.map(({ item, count }) => (
            <View key={item.id} className="flex-row items-center gap-2">
              <Text className="w-[72px] text-ink" style={{ fontSize: 12 }} numberOfLines={1}>{item.name}</Text>
              <View className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                <View className="h-full rounded-full bg-warn-dot" style={{ width: `${(count / maxLoss) * 100}%`, opacity: count === 0 ? 0 : 0.8 }} />
              </View>
              <Text className="w-8 text-right text-muted" style={{ fontSize: 12 }}>{count}번</Text>
            </View>
          ))}
        </Card>
        <Card className="gap-2">
          <Text className="font-semibold text-ink" style={{ fontSize: 13 }}>자주 깜빡하는 곳 Top 3</Text>
          {losses.topPlaces.length === 0 ? (
            <Text className="text-muted" style={{ fontSize: 12 }}>깜빡한 곳이 없어요. 아주 잘하고 있어요!</Text>
          ) : (
            losses.topPlaces.map((p, i) => (
              <View key={p.label} className="flex-row items-center justify-between">
                <Text className="flex-1 text-ink" style={{ fontSize: 13 }} numberOfLines={1}>{i + 1}. {p.label}</Text>
                <Text className="text-warn-text" style={{ fontSize: 12, fontWeight: '600' }}>{p.count}번</Text>
              </View>
            ))
          )}
          {losses.topWeekday && losses.topTimeOfDay && (
            <View className="mt-1 flex-row flex-wrap gap-2">
              <View className="rounded-[5px] bg-warn-soft px-[9px] py-1"><Text className="text-warn-text" style={{ fontSize: 11 }}>{losses.topWeekday.name}에 {losses.topWeekday.count}번</Text></View>
              <View className="rounded-[5px] bg-warn-soft px-[9px] py-1"><Text className="text-warn-text" style={{ fontSize: 11 }}>{losses.topTimeOfDay.name}에 {losses.topTimeOfDay.count}번</Text></View>
            </View>
          )}
        </Card>
      </Section>

      <Card className="mt-6 py-0">
        <Menu icon="home" label="내 물건 관리" onPress={() => router.push('/')} />
        <Menu icon="shield" label="재구매 지원" onPress={() => router.push('/support')} />
        <Menu icon="file" label="지원 신청 내역" onPress={() => (claim ? router.push('/support') : showToast('아직 작성한 신청이 없어요.'))} />
        <View className="flex-row items-center gap-[13px] py-[15px]">
          <Icon name="bell" color={colors.ink} />
          <Text className="flex-1 text-ink">분실 예방 알림</Text>
          <Toggle value={notify} onChange={setNotify} label="분실 예방 알림" />
        </View>
      </Card>
      <Text className="my-[15px] text-[#9299a2]" style={{ fontSize: 11, lineHeight: 18 }}>
        프로토타입 안내{'\n'}모든 위치·챙김 기록·추천은 예시예요. 실제 센서 수집이나 지원 접수는 이루어지지 않고, 입력한 내용은 새로고침하면 초기화돼요.
      </Text>
    </Screen>
  )
}

/** 막대 위 숫자: 10시간 미만은 소수 한 자리 */
function hoursLabel(minutes: number) {
  const hours = minutes / 60
  return hours < 10 ? hours.toFixed(1) : String(Math.round(hours))
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-6 gap-3">
      <Text className="text-ink" style={{ fontSize: 17, fontWeight: '700', letterSpacing: -0.5 }}>{title}</Text>
      {children}
    </View>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex-1 px-3 py-3.5">
      <Text className="text-muted" style={{ fontSize: 11 }}>{label}</Text>
      <Text className="mt-1 text-ink" style={{ fontSize: 17, fontWeight: '700' }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </Card>
  )
}

function Menu({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-[13px] border-b border-line py-[15px]">
      <Icon name={icon} color={colors.ink} />
      <Text className="flex-1 text-ink">{label}</Text>
      <Icon name="arrow" size={16} color={colors.muted} />
    </Pressable>
  )
}
