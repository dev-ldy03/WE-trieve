import colors from './colors.json'

/** 카드에 쓰는 은은한 코랄 그림자 (iOS shadow / Android elevation) */
export const softShadow = {
  shadowColor: colors.coralDeep,
  shadowOpacity: 0.1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
}
