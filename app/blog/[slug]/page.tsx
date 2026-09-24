import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { blogAPI } from '@/lib/api'
import BlogDetailClient from './BlogDetailClient'
import type { BlogPost } from '@/types'

// Memoized per-request so generateMetadata and the page body share one fetch
// — getBlogPost increments a view counter server-side, so fetching twice
// would double-count every single page load.
const getPost = cache(async (slug: string): Promise<BlogPost | null> => {
  try {
    const res = await blogAPI.getOne(slug)
    return res.data.success ? res.data.data : null
  } catch {
    return null
  }
})

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return { title: 'Article Not Found' }

  // The root layout's title template ("%s | Distress Deals Dubai") already
  // appends the brand suffix — return the bare post title, not a pre-suffixed one.
  const title = post.title
  const description = post.excerpt
  const images = post.coverImage ? [{ url: post.coverImage }] : undefined

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description, type: 'article', url: `/blog/${post.slug}`, images, publishedTime: post.publishedAt || post.createdAt },
    twitter: { card: 'summary_large_image', title: post.title, description, images: post.coverImage ? [post.coverImage] : undefined },
  }
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.publishedAt || post.createdAt,
    author: { '@type': 'Organization', name: post.author?.name || 'Distress Deals Dubai' },
    publisher: { '@type': 'Organization', name: 'Distress Deals Dubai' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://www.distressdealsuae.com/blog/${post.slug}` },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.distressdealsuae.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.distressdealsuae.com/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://www.distressdealsuae.com/blog/${post.slug}` },
    ],
  }

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <BlogDetailClient post={post} />
    </>
  )
}
