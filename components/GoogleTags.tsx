import Script from 'next/script'

// Google Analytics 4 and/or Google Tag Manager, switched on by env vars so nothing loads (and nothing
// is tracked) until an ID is set:
//   NEXT_PUBLIC_GA_ID  = G-XXXXXXXXXX   (Analytics 4 measurement ID)
//   NEXT_PUBLIC_GTM_ID = GTM-XXXXXXX    (Tag Manager container ID)
// If GTM is used, GA4 is normally configured inside the container — set only one to avoid double-counting.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

export function GoogleTagHead() {
  return (
    <>
      {GTM_ID && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      )}
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
    </>
  )
}

// GTM's no-JS fallback; belongs right after <body> opens.
export function GoogleTagNoScript() {
  if (!GTM_ID) return null
  return (
    <noscript>
      <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
    </noscript>
  )
}
