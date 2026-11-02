import type { ReactNode } from 'react'

/** 앱(iOS·Android)에서는 그대로 보여준다. 웹에서는 MapView처럼 .web.tsx가 대신 쓰인다. */
export default function WebPhoneFrame({ children }: { children: ReactNode }) {
  return <>{children}</>
}
