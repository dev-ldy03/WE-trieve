import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html'
import type { PropsWithChildren } from 'react'
import colors from '@/theme/colors.json'

const TITLE = 'Wetriever · 내 물건, 내 곁에'
const DESCRIPTION = '두고 오지 않게, 우리가 같이 챙길게요. 자리를 옮길 때마다 소지품을 챙겼는지 알려 주고, 잃어버리면 동선을 되짚어 찾아 드려요.'

/**
 * 웹 정적 빌드의 HTML 뼈대 (앱에는 쓰이지 않는다).
 * SDK 58부터는 스크립트·CSS가 headNodes/bodyNodes로 전달되므로 반드시 함께 그려야 한다.
 * 메신저 링크 미리보기용 og 태그도 여기서 넣는다.
 */
export default function Root({ children }: PropsWithChildren) {
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext()
  return (
    <html {...htmlAttributes} lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Wetriever" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="theme-color" content={colors.paper} />
        <ScrollViewStyleReset />
        {/* 모바일 브라우저는 주소창 때문에 height:100%가 실제 보이는 화면보다 짧을 수 있어 dvh를 쓴다 */}
        <style
          dangerouslySetInnerHTML={{
            __html: `body{background-color:${colors.backdrop}}html,body,#root{height:100vh;height:100dvh}`,
          }}
        />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  )
}
