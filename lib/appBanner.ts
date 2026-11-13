// "Get our Android app" bar at the top of the site, for Android phones only.
// The decision is made before the first paint (APP_BANNER_BOOT_SCRIPT in app/layout.tsx sets html[data-app-banner]),
// so the bar and the space it takes are there from the start — no layout jump. components/AppBanner.tsx then hides it
// for good if the app turns out to be installed, or for 30 days when the visitor closes it.
export const ANDROID_PACKAGE = 'com.distressdealsuae.app'
// The Play listing, tagged so Play Console shows installs that came from the website banner.
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&referrer=${encodeURIComponent('utm_source=website&utm_medium=app_banner')}`
// localStorage: a timestamp before which the bar stays hidden (closed, or the app is installed).
export const APP_BANNER_HIDE_KEY = 'dd_app_banner_hide_until'
export const APP_BANNER_HIDE_DAYS = 30

// Shown only on Android browsers — never to crawlers (Googlebot's phone crawler says "Android" too), on the admin
// pages, when the site runs as an installed web app, or while hidden.
export const APP_BANNER_BOOT_SCRIPT = `(function(){try{var u=navigator.userAgent||'';if(!/Android/i.test(u)||/bot|crawl|spider|slurp|Google-InspectionTool|Mediapartners|AdsBot|Chrome-Lighthouse/i.test(u))return;if(/^\\/admin/.test(location.pathname))return;if(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)return;if(Date.now()<(+localStorage.getItem('${APP_BANNER_HIDE_KEY}')||0))return;document.documentElement.setAttribute('data-app-banner','show');}catch(e){}})();`
