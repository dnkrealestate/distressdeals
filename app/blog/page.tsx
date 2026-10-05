import type { Metadata } from 'next'
import { resolveSeo } from '@/lib/seo'
import BlogListClient from './BlogListClient'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSeo('blog', {
    title: 'Dubai Property Guides & Real Estate Blog',
    description: 'UAE real estate guides: how to buy, sell, rent and invest in Dubai property — fees, mortgages, off-plan, distress sales, Golden Visa and area advice from our in-house specialists.',
    path: '/blog',
  })
  return { ...seo, twitter: { card: 'summary_large_image', title: seo.title as string, description: seo.description as string } }
}

export default function BlogPage() {
  return <BlogListClient />
}
