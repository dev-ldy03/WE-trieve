import type { ReactNode } from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

/** 레퍼런스(prototype_reference)의 선 아이콘. viewBox 24, stroke 1.7 */
const shapes: Record<string, ReactNode> = {
  home: (
    <>
      <Path d="m3 10 9-7 9 7v10H3z" />
      <Path d="M9 20v-7h6v7" />
    </>
  ),
  search: (
    <>
      <Circle cx={10.5} cy={10.5} r={6.5} />
      <Path d="m16 16 5 5" />
    </>
  ),
  shield: (
    <>
      <Path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" />
      <Path d="m8 12 3 3 5-6" />
    </>
  ),
  user: (
    <>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21v-2a8 8 0 0 1 16 0v2" />
    </>
  ),
  bell: <Path d="M5 17h14l-2-4V9a5 5 0 0 0-10 0v4zM10 21h4" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  arrow: <Path d="m9 5 7 7-7 7" />,
  back: <Path d="m14 5-7 7 7 7" />,
  check: <Path d="m5 12 4 4L19 6" />,
  sound: <Path d="M4 10h4l5-4v12l-5-4H4zM16 8q6 4 0 8M18 4q10 8 0 16" />,
  pin: (
    <>
      <Path d="M19 10c0 6-7 11-7 11S5 16 5 10a7 7 0 1 1 14 0" />
      <Circle cx={12} cy={10} r={2} />
    </>
  ),
  clock: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 6v6l4 2" />
    </>
  ),
  close: <Path d="m6 6 12 12M6 18 18 6" />,
  spark: <Path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" />,
  file: <Path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6" />,
}

export type IconName = keyof typeof shapes

interface IconProps {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
}

export default function Icon({ name, size = 21, color = 'currentColor', strokeWidth = 1.7 }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shapes[name] ?? shapes.pin}
    </Svg>
  )
}
