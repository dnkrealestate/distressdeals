import type { Metadata } from 'next'
import NewsListClient from './NewsListClient'

export const metadata: Metadata = {
  title: 'News',
  description: 'Dubai real estate regulatory updates, market announcements, and industry news — as they happen.',
  alternates: { canonical: '/news' },
  openGraph: {
    title: 'News',
    description: 'Dubai real estate regulatory updates, market announcements, and industry news.',
    type: 'website',
    url: '/news',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'News',
    description: 'Dubai real estate regulatory updates, market announcements, and industry news.',
  },
}

export default function NewsPage() {
  return <NewsListClient />
}
