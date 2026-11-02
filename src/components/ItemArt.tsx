import type { ReactNode } from 'react'
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg'
import type { ItemKind } from '@/types'

/** 레퍼런스(prototype_reference)의 물건 그림. viewBox 120×100 */
const shapes: Record<ItemKind, ReactNode> = {
  wallet: (
    <>
      <Rect x={20} y={29} width={80} height={55} rx={9} fill="#ae7958" />
      <Path d="M23 38h73" stroke="#c79778" strokeWidth={2} />
      <Rect x={74} y={46} width={31} height={23} rx={5} fill="#976348" />
      <Circle cx={84} cy={57} r={3} fill="#e8ceb4" />
      <Path d="M27 75h64" stroke="#c79778" strokeDasharray="3 3" />
    </>
  ),
  buds: (
    <>
      <Rect x={27} y={45} width={68} height={41} rx={17} fill="#e7e8df" stroke="#ccd0c4" />
      <Path d="M28 58h66" stroke="#c8cfc0" />
      <Rect x={38} y={18} width={13} height={31} rx={6} fill="#fff" stroke="#d9dfd1" />
      <Ellipse cx={39} cy={23} rx={11} ry={9} fill="#fff" stroke="#d9dfd1" />
      <Rect x={74} y={18} width={12} height={31} rx={6} fill="#fff" stroke="#d9dfd1" />
      <Ellipse cx={86} cy={23} rx={10} ry={9} fill="#fff" stroke="#d9dfd1" />
      <Circle cx={61} cy={68} r={2} fill="#75a276" />
    </>
  ),
  keys: (
    <>
      <Circle cx={48} cy={34} r={17} fill="none" stroke="#afbbab" strokeWidth={6} />
      <Path d="m43 48-15 32 7 4 4-8 7 3 4-9-7-4 8-17" fill="#c6aa68" />
      <Rect x={57} y={38} width={28} height={42} rx={9} fill="#496f5b" transform="rotate(-15 70 60)" />
      <Circle cx={67} cy={49} r={4} fill="#d4e2cf" />
    </>
  ),
  charger: (
    <>
      <Rect x={29} y={30} width={46} height={45} rx={10} fill="#eee9df" stroke="#d3ccbd" />
      <Path d="M42 29V15M61 29V15" stroke="#b5b4a8" strokeWidth={5} />
      <Path d="M75 51h11q20 0 16 24t-24 6" fill="none" stroke="#b6c1ac" strokeWidth={5} />
      <Rect x={64} y={73} width={20} height={12} rx={3} fill="#d7dece" />
    </>
  ),
}

interface ItemArtProps {
  kind: ItemKind
  width?: number
  height?: number
}

export default function ItemArt({ kind, width = 67, height = 61 }: ItemArtProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 100">
      <Ellipse cx={62} cy={88} rx={36} ry={5} fill="#253d3310" />
      {shapes[kind] ?? shapes.keys}
    </Svg>
  )
}
