// The built-in text of the three legal pages. The website shows this until an admin saves their own version in
// Admin → Settings → Legal pages, and the editor there starts from it — so the page is never blank.
//
// Keep it true to what the product does. When a feature that touches personal data changes (sign-in methods, how
// phone numbers are verified, which providers receive data, what account deletion removes), update the text here.
export interface LegalPageContent { title: string; updated: string; html: string }

export const LEGAL_PAGES: Record<string, { label: string; path: string }> = {
  privacy: { label: 'Privacy Policy', path: '/privacy' },
  terms: { label: 'Terms of Service', path: '/terms' },
  cookies: { label: 'Cookie Policy', path: '/cookies' },
}

const UPDATED = '6 October 2026'

export const LEGAL_DEFAULTS: Record<string, LegalPageContent> = {
  privacy: {
    title: 'Privacy Policy',
    updated: UPDATED,
    html: `<p>Distress Deals UAE ("we", "us", "our") operates distressdealsuae.com and the Distress Deals UAE mobile app (together, the "Platform"). This policy explains what personal information we collect, why we collect it, who we share it with, and the choices you have. By using the Platform, you agree to the collection and use of information as described here.</p>
<h2>1. How the Platform Works</h2>
<p>Distress Deals UAE is a centralized real estate platform. When you enquire about a property or a project, your enquiry goes to one dedicated agent from our own team, who looks after it from first message to handover. Your contact details are not passed to a list of outside brokers, and sellers see only a masked view of buyer interest — not your name, phone number or email.</p>
<h2>2. Information We Collect</h2>
<p><strong>Account information.</strong> Your name, email address and phone number, a password if you set one (stored only in hashed form), and a profile photo if you add one. You can register with an email and password, or sign in with Google or Facebook — in which case we receive the basic profile details you authorize (name, email, profile picture).</p>
<p><strong>Phone verification.</strong> Before certain actions — such as listing a property or using a seller account — we verify your mobile number with a one-time code sent by SMS. The code is sent and checked through Google Firebase Authentication, so your phone number is processed by Google for that purpose. We do not send verification codes by WhatsApp.</p>
<p><strong>Email verification and password reset.</strong> We send a verification link or a one-time code to your email address to confirm it is yours and to let you reset a forgotten password.</p>
<p><strong>Enquiries and requests.</strong> The properties and projects you ask about, the messages you write, your budget or requirements if you share them, viewing and meeting requests, mortgage enquiries (the figures you enter in the calculator), and the free valuation, fast-sale and contact forms.</p>
<p><strong>Messages.</strong> The chat messages you exchange with your assigned agent on the Platform.</p>
<p><strong>Listing information (sellers).</strong> The property details, photos, videos and documents you provide, the property's address and map position, and your contact details. The exact address and your contact details are visible only to our team; the public listing shows the area or community.</p>
<p><strong>Reviews and ratings.</strong> If you review an area, community, building, place or article, we publish your rating and comment with your name once our team has approved it.</p>
<p><strong>Your activity on the Platform.</strong> Saved properties and projects, your comparison list, saved searches and alerts, and your notification preferences.</p>
<p><strong>Device and usage information.</strong> IP address, browser and device type, pages viewed and approximate country (worked out from your IP address to count views by country). On the mobile app, and only if you allow notifications, a device push token used solely to deliver notifications to that device.</p>
<p><strong>Location.</strong> If you use "Near me" on the map, your browser or phone asks your permission first. Your location is used at that moment to centre the map and search around you; we do not keep a history of it.</p>
<p><strong>Cookies and browser storage.</strong> See our <a href="/cookies">Cookie Policy</a>.</p>
<h2>3. How We Use Your Information</h2>
<ul>
<li>To create and manage your account and to verify your phone number and email address.</li>
<li>To route your enquiry to your assigned agent, respond to it, arrange viewings and meetings, and process listing, valuation and mortgage requests.</li>
<li>To review and publish property listings, and to moderate reviews before they appear.</li>
<li>To send service messages — account, security, listing status, meeting reminders and replies to your enquiries — by email, in-app notification and, on the mobile app, push notification.</li>
<li>To send property alerts and saved-search updates where you have switched them on. You can change these at any time in your notification settings.</li>
<li>To show you relevant listings, such as properties similar to ones you have viewed or saved.</li>
<li>To understand how the Platform is used, measure which pages and campaigns bring enquiries, and improve our services.</li>
<li>To detect fraud and misuse, enforce our <a href="/terms">Terms of Service</a>, and comply with legal obligations.</li>
</ul>
<h2>4. Who We Share Information With</h2>
<p>We do not sell your personal information. We share it only with:</p>
<ul>
<li><strong>Your assigned agent and our team</strong>, who need your enquiry and contact details to help you. Sellers see only a masked view of buyer interest.</li>
<li><strong>Google</strong> — Firebase Authentication (to send and check SMS verification codes), Firebase Cloud Messaging (to deliver push notifications to the mobile app), Google Sign-In if you choose it, and Google Maps, which loads in your browser on map pages.</li>
<li><strong>Meta (Facebook)</strong>, if you choose to sign in with Facebook.</li>
<li><strong>Hosting, database and storage providers</strong> that run the Platform on our behalf, including website hosting, a cloud database, and cloud storage and delivery for photos and documents.</li>
<li><strong>Email delivery providers</strong>, to send verification, security and service emails.</li>
<li><strong>Analytics providers.</strong> We use Vercel Web Analytics and Speed Insights to measure visits and site speed, and may use Google Analytics. When you submit an enquiry or a form, a record of that submission — which can include your name, phone number and email address — is also logged in our analytics account so that we can track where enquiries come from.</li>
<li><strong>OpenAI</strong>, when you use the AI-assisted search: the words you type into that search are sent to OpenAI to interpret them. Our team may also use AI tools to help draft listing descriptions from property details.</li>
<li><strong>Routing services</strong>, when you ask the map for directions or drive times: the map points involved (not your identity) are sent to a routing provider to calculate the route.</li>
<li><strong>Authorities</strong>, where required by UAE law or a valid legal request.</li>
</ul>
<p>If you contact us through WhatsApp using a button on the Platform, the conversation takes place in WhatsApp and is subject to WhatsApp's own terms and privacy policy.</p>
<h2>5. International Transfers</h2>
<p>Some of our service providers store or process data on servers outside the United Arab Emirates. Where that happens, we rely on providers that apply recognised security and data-protection standards.</p>
<h2>6. Data Security</h2>
<p>We use industry-standard measures — encrypted connections, hashed passwords and access-controlled systems in which staff see only what their role requires — to protect your information. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.</p>
<h2>7. Data Retention and Deleting Your Account</h2>
<p>We keep account and enquiry information for as long as your account is active or as needed to provide our services, resolve disputes and meet legal, accounting or reporting obligations.</p>
<p>You can delete your account at any time from the <a href="/delete-account">Delete Account page</a> or from the mobile app. When you do, we remove your name, email address, phone number, profile photo, password and social sign-in links; delete your saved searches, notifications, reviews and device tokens; remove your contact details from your past enquiries; and withdraw your active listings. A small anonymised record may be kept where the law requires it, for example for completed transactions.</p>
<h2>8. Your Rights</h2>
<p>You may, at any time:</p>
<ul>
<li>Request a copy of the personal information we hold about you.</li>
<li>Correct inaccurate information in your account settings, or ask us to correct it.</li>
<li>Delete your account and the associated personal information, as described in Section 7.</li>
<li>Switch off property alerts, marketing emails and push notifications in your notification settings.</li>
<li>Withdraw location or notification permission in your browser or phone settings.</li>
</ul>
<p>To exercise any of these rights, contact us using the details in Section 11.</p>
<h2>9. Children's Privacy</h2>
<p>The Platform is intended for users aged 18 and over. We do not knowingly collect personal information from anyone under 18.</p>
<h2>10. Changes to This Policy</h2>
<p>We may update this policy from time to time. Material changes will be reflected by updating the "Last updated" date above; continued use of the Platform after a change constitutes acceptance of the revised policy.</p>
<h2>11. Contact Us</h2>
<p>Questions about this policy or your personal information can be sent through our <a href="/contact">Contact page</a>.</p>`,
  },

  terms: {
    title: 'Terms of Service',
    updated: UPDATED,
    html: `<p>These Terms of Service ("Terms") govern your access to and use of distressdealsuae.com and the Distress Deals UAE mobile app (together, the "Platform"), operated by Distress Deals UAE ("we", "us"). By creating an account or otherwise using the Platform, you agree to these Terms.</p>
<h2>1. What We Do</h2>
<p>Distress Deals UAE is a centralized real estate platform for buying, selling and renting property in the UAE, with a focus on below-market ("distress") sales and new off-plan projects. When you express interest in a property or project, your enquiry is routed to one dedicated in-house agent who manages it from first message through to handover. We are not an open marketplace where multiple agents compete for the same buyer — every enquiry has a single point of contact on our side.</p>
<h2>2. Accounts</h2>
<ul>
<li>You can register with an email address and password, or sign in with Google or Facebook. You must provide accurate, current information and keep it up to date.</li>
<li>You are responsible for safeguarding your password and for all activity under your account.</li>
<li>We verify mobile numbers with a one-time code sent by SMS. Seller accounts must verify their number before they can list a property, and we may ask any user to verify theirs before certain actions.</li>
<li>An account may be created automatically on your behalf when you submit an enquiry using an email or phone number that isn't already registered — you'll be prompted to set a password to take ownership of it.</li>
<li>You must be at least 18 years old to use the Platform.</li>
<li>We may suspend or terminate an account that provides false information, violates these Terms, or is used fraudulently.</li>
</ul>
<h2>3. Buyers and Tenants</h2>
<p>Submitting an enquiry connects you with your assigned agent, who will contact you by phone, email, WhatsApp or the Platform's chat to discuss the property or project. We do not charge buyers or tenants a fee to browse listings or submit enquiries. Prices, availability, payment plans, handover dates and specifications shown on the Platform are supplied by sellers or developers and, while we review listings before publishing, are not guaranteed and should be independently verified before you commit to a transaction.</p>
<h2>4. Sellers and Landlords</h2>
<ul>
<li>You confirm that you are the legal owner of the property, or are authorized to list it, and that all information, photos and documents you provide are accurate and current.</li>
<li>All listings are reviewed by our team before going live. Our team may complete or edit a listing — for example its title, description, location details and photos — and may request changes or decline a listing that does not meet our guidelines.</li>
<li>Buyer contact details are not shared with sellers directly. You see a masked view of buyer interest, and our team manages buyer communication on your behalf, consistent with our centralized model.</li>
<li>The public listing shows the property's area or community; the exact address and your contact details are visible only to our team.</li>
<li>You may withdraw a listing at any time by contacting your assigned agent or through your seller dashboard.</li>
</ul>
<h2>5. Reviews and Other Content You Submit</h2>
<ul>
<li>Reviews and ratings must be honest, based on your own experience, and free of abusive, unlawful, promotional or misleading content.</li>
<li>Reviews are checked by our team before they appear, and we may decline, edit for clarity or remove any review.</li>
<li>You keep ownership of the content you submit — reviews, messages, listing photos and details — and grant us a licence to store and display it on the Platform for the purpose it was submitted.</li>
</ul>
<h2>6. Prohibited Use</h2>
<p>You agree not to:</p>
<ul>
<li>Post false, misleading or duplicate listings, or misrepresent your identity or authority to sell or let.</li>
<li>Use the Platform to harass, spam or solicit users outside its intended purpose.</li>
<li>Attempt to bypass our centralized model by soliciting direct contact details for a purpose unrelated to the enquiry in hand.</li>
<li>Create accounts by automated means, or use someone else's phone number or email address to verify an account.</li>
<li>Scrape, reverse-engineer or interfere with the Platform's normal operation.</li>
</ul>
<h2>7. Information, Maps and Tools on the Platform</h2>
<p>The Platform includes guides to areas, communities, buildings and developers, a map with nearby schools, hospitals, shops, cafés and places of interest, distance and drive-time estimates, a mortgage calculator, valuations, and an AI-assisted search. These are provided for general guidance only:</p>
<ul>
<li>Place and amenity information comes partly from third-party and open sources and may be incomplete or out of date.</li>
<li>Distances are straight-line unless stated otherwise, and drive times are estimates that do not guarantee real travel time.</li>
<li>Mortgage figures, price comparisons and valuations are estimates, not offers of finance or formal valuations.</li>
<li>AI-assisted search interprets what you type and may not always understand a request correctly.</li>
</ul>
<p>None of this is financial, legal or professional advice. Always seek independent advice before making a property decision.</p>
<h2>8. Intermediary Role</h2>
<p>Distress Deals UAE facilitates introductions between buyers, sellers, developers and our agents; we are not a party to any resulting sale, purchase or lease agreement unless expressly stated in a separate written agreement.</p>
<h2>9. Intellectual Property</h2>
<p>All content on the Platform — branding, design, text and software — is owned by or licensed to Distress Deals UAE and may not be copied or reused without permission. Some photographs are used under open licences and are credited to their authors where shown.</p>
<h2>10. Third-Party Services and Links</h2>
<p>The Platform uses third-party services, such as Google and Facebook sign-in, Google Maps and WhatsApp links, and may link to other websites. Your use of those services is subject to their own terms and privacy policies, and we are not responsible for their content or availability.</p>
<h2>11. Limitation of Liability</h2>
<p>To the fullest extent permitted by law, Distress Deals UAE is not liable for indirect, incidental or consequential damages arising from your use of the Platform, or from any transaction between users, beyond the extent of our own direct involvement.</p>
<h2>12. Closing Your Account and Termination</h2>
<p>You may delete your account at any time from the <a href="/delete-account">Delete Account page</a> or from the mobile app; our <a href="/privacy">Privacy Policy</a> explains what is removed. We may suspend or terminate your access to the Platform at any time for conduct that violates these Terms or is otherwise harmful to other users or to us.</p>
<h2>13. Governing Law</h2>
<p>These Terms are governed by the laws of the United Arab Emirates, and any dispute arising from them falls under the jurisdiction of the courts of Dubai.</p>
<h2>14. Changes to These Terms</h2>
<p>We may update these Terms from time to time. The "Last updated" date above reflects the most recent revision; continued use of the Platform after a change constitutes acceptance of the revised Terms.</p>
<h2>15. Contact Us</h2>
<p>Questions about these Terms can be sent through our <a href="/contact">Contact page</a>.</p>`,
  },

  cookies: {
    title: 'Cookie Policy',
    updated: UPDATED,
    html: `<p>This policy explains how distressdealsuae.com uses cookies and similar browser storage technologies, and the choices available to you. The mobile app does not use browser cookies; it stores your sign-in and preferences securely on your device.</p>
<h2>1. What Are Cookies?</h2>
<p>Cookies are small text files a website can store in your browser. Websites also commonly use similar technologies — such as local storage — that work the same way but aren't technically cookies. We refer to both together in this policy.</p>
<h2>2. What We Use</h2>
<ul>
<li><strong>Essential storage.</strong> We use your browser's local storage to keep you signed in, and to remember your light or dark theme. This is strictly necessary for the site to function and cannot be disabled without signing you out.</li>
<li><strong>Features you use.</strong> Your comparison list, recently viewed properties, and unfinished form drafts are kept in your browser so they are still there when you come back. They stay on your device.</li>
<li><strong>Visitor counter.</strong> A random identifier is stored in your browser so that a property or project view by the same visitor is counted once. It does not contain your name or contact details.</li>
<li><strong>Sign-in and verification.</strong> When you sign in with Google or Facebook, or verify your phone number by SMS code, Google or Meta may set their own cookies or storage to complete the sign-in and to protect it against abuse.</li>
<li><strong>Maps.</strong> Pages that show a map load Google Maps, which may set its own cookies.</li>
<li><strong>Analytics.</strong> We use Vercel Web Analytics and Speed Insights to understand aggregate traffic and site speed; these do not use cookies. Where enabled, we may also use Google Analytics or Google Tag Manager, which set cookies to measure which pages are visited and how people arrive at the site.</li>
<li><strong>Marketing attribution.</strong> When you arrive via a marketing link, we store the campaign source (UTM parameters) so we can understand which channels bring visitors and enquiries to the site.</li>
</ul>
<p>We do not use cookies for third-party behavioural advertising, and we do not sell cookie data to advertisers.</p>
<h2>3. Managing Cookies</h2>
<p>Most browsers let you block or delete cookies and site storage through their settings. Because we rely on browser storage to keep you signed in, blocking it will sign you out and may prevent parts of the site — favourites, comparison, saved searches, chat — from working correctly. Blocking analytics cookies specifically does not affect core site functionality.</p>
<h2>4. Changes to This Policy</h2>
<p>We may update this policy as the tools we use change. The "Last updated" date above reflects the most recent revision.</p>
<h2>5. Contact Us</h2>
<p>Questions about this policy can be sent through our <a href="/contact">Contact page</a>. See also our <a href="/privacy">Privacy Policy</a>.</p>`,
  },
}
