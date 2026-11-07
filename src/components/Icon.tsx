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
  // 커뮤니티
  people: (
    <>
      <Circle cx={9} cy={8} r={3.5} />
      <Path d="M2.5 20v-1a6.5 6.5 0 0 1 13 0v1" />
      <Path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M18.5 14.2a6.5 6.5 0 0 1 3 4.8v1" />
    </>
  ),
  chat: <Path d="M4 5h16v11H9l-5 4z" />,
  heart: <Path d="M12 20s-8-4.6-8-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.8C20 15.4 12 20 12 20" />,
  tag: (
    <>
      <Path d="M3 12V4h8l10 10-8 8z" />
      <Circle cx={7.5} cy={8.5} r={1.3} />
    </>
  ),
  calc: (
    <>
      <Path d="M6 3h12v18H6z" />
      <Path d="M9 6.5h6v3H9zM9 13h.01M12 13h.01M15 13h.01M9 17h.01M12 17h.01M15 17h.01" />
    </>
  ),
  iron: (
    <>
      <Path d="M8 3h3v13H8zM13 3h3v13h-3z" />
      <Path d="M10 16v5M14 16v5" />
    </>
  ),
  umbrella: <Path d="M3 12a9 9 0 0 1 18 0zM12 12v7a2 2 0 0 0 4 0M12 3v0" />,
  battery: (
    <>
      <Path d="M7 5h10v16H7zM10 2.5h4V5h-4z" />
      <Path d="m12.5 9-2 4h3l-2 4" />
    </>
  ),
  plug: <Path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4" />,
  wallet: (
    <>
      <Path d="M3 7h18v13H3zM3 7l13-3v3" />
      <Path d="M16 12h5v4h-5z" />
    </>
  ),
  key: (
    <>
      <Circle cx={8} cy={15} r={4.5} />
      <Path d="m11.2 11.8 8.8-8.8M16 7l3 3M14 9l2 2" />
    </>
  ),
  buds: <Path d="M8 4a3 3 0 0 0-3 3v1a3 3 0 0 0 3 3v9M16 4a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3v9" />,
  pen: <Path d="m14.5 4.5 5 5L9 20H4v-5zM12.5 6.5l5 5" />,
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
