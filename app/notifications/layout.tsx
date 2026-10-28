import type { Metadata } from 'next'

// A signed-in person's own notifications — nothing for search engines here.
export const metadata: Metadata = { title: 'Notifications', robots: { index: false, follow: false } }

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children
}
