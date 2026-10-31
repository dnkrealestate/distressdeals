// A project's photos: the gallery, in the order set in the admin form. Photo 1 is the main picture — used on every
// list, card, map pin, share preview and at the top of the project page (the rule the backend applies on save).
// The older separate cover is only a fallback for a project with no gallery: it is usually a second copy of photo 1,
// so adding it too would show the same picture twice.
type WithPhotos = { coverImage?: string; images?: { url: string }[] }

export function projectPhotos(p?: WithPhotos | null): string[] {
  const gallery = (p?.images || []).map(i => i?.url).filter((u): u is string => !!u)
  return gallery.length ? [...new Set(gallery)] : p?.coverImage ? [p.coverImage] : []
}

export function projectMainPhoto(p?: WithPhotos | null): string | undefined {
  return p?.images?.find(i => i?.url)?.url || p?.coverImage || undefined
}
