import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { newsAPI } from '@/lib/api'
import NewsDetailClient from './NewsDetailClient'
import type { NewsItem } from '@/types'

const getItem = cache(async (slug: string): Promise<NewsItem | null> => {
  try {
    const res = await newsAPI.getOne(slug)
    return res.data.success ? res.data.data : null
  } catch {
    return null
  }
})

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const item = await getItem(params.slug)
  if (!item) return { title: 'Article Not Found' }

  const title = item.title
  const description = item.summary
  const images = item.coverImage ? [{ url: item.coverImage }] : undefined

  return {
    title,
    description,
    alternates: { canonical: `/news/${item.slug}` },
    openGraph: { title: item.title, description, type: 'article', url: `/news/${item.slug}`, images, publishedTime: item.publishedAt || item.createdAt },
    twitter: { card: 'summary_large_image', title: item.title, description, images: item.coverImage ? [item.coverImage] : undefined },
  }
}

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const item = await getItem(params.slug)
  if (!item) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: item.title,
    description: item.summary,
    image: item.coverImage ? [item.coverImage] : undefined,
    datePublished: item.publishedAt || item.createdAt,
    dateModified: item.publishedAt || item.createdAt,
    author: { '@type': 'Organization', name: 'Distress Deals Dubai' },
    publisher: { '@type': 'Organization', name: 'Distress Deals Dubai' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://www.distressdealsuae.com/news/${item.slug}` },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.distressdealsuae.com' },
      { '@type': 'ListItem', position: 2, name: 'News', item: 'https://www.distressdealsuae.com/news' },
      { '@type': 'ListItem', position: 3, name: item.title, item: `https://www.distressdealsuae.com/news/${item.slug}` },
    ],
  }

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <NewsDetailClient item={item} />
    </>
  )
}
