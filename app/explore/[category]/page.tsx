import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import SectionList, { sectionListMetadata, type ListParams } from '@/components/explore/SectionList'
import { sectionByPath, sectionHref, emirateFromSlug } from '@/lib/explore'

// A whole Explore section across the UAE, e.g. /explore/malls. One emirate lives at /explore/malls/dubai.
export const revalidate = 300

type SP = ListParams & { emirate?: string }

export async function generateMetadata({ params, searchParams }: { params: { category: string }; searchParams?: SP }): Promise<Metadata> {
  const section = sectionByPath(params.category)
  if (!section) return { title: 'Not Found' }
  return sectionListMetadata(section, undefined, searchParams)
}

export default function ExploreSectionPage({ params, searchParams = {} }: { params: { category: string }; searchParams?: SP }) {
  const section = sectionByPath(params.category)
  if (!section) notFound()
  // Old-style ?emirate=dubai links go to the emirate's own page.
  const emirate = emirateFromSlug(searchParams.emirate)
  if (emirate) permanentRedirect(sectionHref(section, emirate))
  return <SectionList section={section} searchParams={searchParams} />
}
