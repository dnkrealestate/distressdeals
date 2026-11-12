// For a detail page's main API lookup: only a real "doesn't exist" (the API's 404) becomes null → notFound(). Any other
// failure (timeout, rate limit, 5xx, network) is thrown, so Next keeps serving the last good copy of the page (ISR) or
// answers 500, which Google retries later. Turning those into a 404 told Google live pages were gone ("Not found (404)").
// lib/api rejects with the response body and its status as `httpStatus`; a raw axios error has `response.status`.
export function missingOrThrow(err: unknown): null {
  const e = err as { httpStatus?: number; response?: { status?: number } } | undefined
  if ((e?.httpStatus ?? e?.response?.status) === 404) return null
  throw err
}
