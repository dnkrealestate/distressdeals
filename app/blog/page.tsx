import type { Metadata } from 'next'
import BlogListClient from './BlogListClient'

export const metadata: Metadata = {
  title: 'Blog & Market News',
  description: 'Dubai real estate market trends, buying guides, investment insights, and regulatory news — curated by our in-house specialists.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog & Market News',
    description: 'Dubai real estate market trends, buying guides, investment insights, and regulatory news.',
    type: 'website',
    url: '/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog & Market News',
    description: 'Dubai real estate market trends, buying guides, investment insights, and regulatory news.',
  },
}

export default function BlogPage() {
  return <BlogListClient />
}
