// The built-in text of the three legal pages. The website shows this until an admin saves their own version in
// Admin → Settings → Legal pages, and the editor there starts from it — so the page is never blank.
export interface LegalPageContent { title: string; updated: string; html: string }

export const LEGAL_PAGES: Record<string, { label: string; path: string }> = {
  privacy: { label: 'Privacy Policy', path: '/privacy' },
  terms: { label: 'Terms of Service', path: '/terms' },
  cookies: { label: 'Cookie Policy', path: '/cookies' },
}

const UPDATED = '23 September 2026'

export const LEGAL_DEFAULTS: Record<string, LegalPageContent> = {
  privacy: {
    title: 'Privacy Policy',
    updated: UPDATED,
    html: `<p>Distress Deals UAE ("we", "us", "our") operates distressdealsuae.com and the Distress Deals mobile app (together, the "Platform"). This policy explains what personal information we collect, why we collect it, and the choices you have. By using the Platform, you agree to the collection and use of information as described here.</p>
<h2>1. Information We Collect</h2>
<p><strong>Account information.</strong> When you register, sign in with Google or Facebook, or submit an enquiry on a listing, we collect your name, email address, and phone number. A phone number is verified via a one-time SMS code before certain account actions (such as listing a property or switching to a seller account).</p>
<p><strong>Enquiry and activity information.</strong> Properties and projects you view, favourite, or ask about, messages you exchange with your assigned agent, and any requirements or budget details you share with us.</p>
<p><strong>Listing information (sellers).</strong> If you list a property, we collect the property details, photos, and documents you provide, plus your contact details so our team can manage the listing on your behalf.</p>
<p><strong>Device and usage information.</strong> IP address, browser/device type, pages viewed, and — if you enable notifications on our mobile app — a device push token used solely to deliver notifications to that device.</p>
<p><strong>Cookies and similar technologies.</strong> See our <a href="/cookies">Cookie Policy</a> for details on cookies, local storage, and analytics tools we use.</p>
<h2>2. How We Use Your Information</h2>
<ul>
<li>To create and manage your account, and to verify your identity where required.</li>
<li>To connect you with the dedicated agent who manages your enquiry from first message to handover — our platform is centralized, so your enquiry is routed to one assigned agent rather than shown broadly to multiple sellers or agents.</li>
<li>To respond to enquiries, schedule viewings, and process listing submissions.</li>
<li>To send you service messages (account, security, listing status) and, where you have opted in, marketing or property-alert notifications by email, WhatsApp, or push notification.</li>
<li>To detect fraud, enforce our <a href="/terms">Terms of Service</a>, and comply with legal obligations.</li>
<li>To improve the Platform through aggregated, non-identifying analytics.</li>
</ul>
<h2>3. Who We Share Information With</h2>
<p>We do not sell your personal information. We share it only with:</p>
<ul>
<li><strong>Your assigned agent</strong>, who needs your enquiry and contact details to assist you. Sellers only see a masked view of buyer interest, not raw buyer contact details, consistent with our centralized-lead model.</li>
<li><strong>Service providers</strong> who process data on our behalf under contract — including cloud hosting and database infrastructure, image and file storage, email delivery, and WhatsApp Business messaging for OTP and notifications.</li>
<li><strong>Authentication providers</strong> (Google, Facebook) if you choose to sign in using those services — they share only the profile fields you authorize.</li>
<li><strong>Authorities</strong>, where required by UAE law or a valid legal request.</li>
</ul>
<h2>4. Data Security</h2>
<p>We use industry-standard measures — encrypted connections, hashed passwords, and access-controlled infrastructure — to protect your information. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>
<h2>5. Data Retention</h2>
<p>We retain account and enquiry information for as long as your account is active or as needed to provide our services, resolve disputes, and meet legal, accounting, or reporting obligations. You may request deletion of your account at any time (see Section 6).</p>
<h2>6. Your Rights</h2>
<p>You may, at any time:</p>
<ul>
<li>Request a copy of the personal information we hold about you.</li>
<li>Ask us to correct inaccurate information via your account settings.</li>
<li>Ask us to delete your account and associated personal information, subject to any legal retention requirements.</li>
<li>Opt out of marketing emails, WhatsApp messages, or push notifications at any time from your notification settings.</li>
</ul>
<p>To exercise any of these rights, contact us using the details in Section 9.</p>
<h2>7. Children's Privacy</h2>
<p>The Platform is intended for users aged 18 and over. We do not knowingly collect personal information from anyone under 18.</p>
<h2>8. Changes to This Policy</h2>
<p>We may update this policy from time to time. Material changes will be reflected by updating the "Last updated" date above; continued use of the Platform after a change constitutes acceptance of the revised policy.</p>
<h2>9. Contact Us</h2>
<p>Questions about this policy or your personal information can be sent through our <a href="/contact">Contact page</a>.</p>`,
  },

  terms: {
    title: 'Terms of Service',
    updated: UPDATED,
    html: `<p>These Terms of Service ("Terms") govern your access to and use of distressdealsuae.com and the Distress Deals mobile app (together, the "Platform"), operated by Distress Deals UAE ("we", "us"). By creating an account or otherwise using the Platform, you agree to these Terms.</p>
<h2>1. What We Do</h2>
<p>Distress Deals UAE is a centralized real estate platform. When you express interest in a property or project, your enquiry is routed to one dedicated in-house agent who manages it from first message through to handover. We are not an open marketplace where multiple agents compete for the same buyer — every enquiry has a single point of contact on our side.</p>
<h2>2. Accounts</h2>
<ul>
<li>You must provide accurate, current information when creating an account and keep it up to date.</li>
<li>You are responsible for safeguarding your password and for all activity under your account.</li>
<li>An account may be created automatically on your behalf when you submit an enquiry using an email or phone number that isn't already registered — you'll be prompted to set a password to take ownership of it.</li>
<li>Seller accounts require phone number verification via a one-time SMS code before the account can list a property.</li>
<li>We may suspend or terminate an account that provides false information, violates these Terms, or is used fraudulently.</li>
</ul>
<h2>3. Buyers</h2>
<p>Submitting an enquiry connects you with your assigned agent, who will contact you to discuss the property or project. We do not charge buyers a fee to browse listings or submit enquiries. Prices, availability, and specifications shown on the Platform are supplied by sellers or developers and, while we review listings before publishing, are not guaranteed and should be independently verified before you commit to a transaction.</p>
<h2>4. Sellers</h2>
<ul>
<li>You confirm that you are the legal owner of the property, or are authorized to list it, and that all information and documents you provide are accurate and current.</li>
<li>All listings are reviewed by our team before going live, and we may request changes or decline a listing that does not meet our guidelines.</li>
<li>Buyer contact details are not shared with sellers directly — our team manages buyer communication and interest on your behalf, consistent with our centralized model.</li>
<li>You may withdraw a listing at any time by contacting your assigned agent or through your seller dashboard.</li>
</ul>
<h2>5. Prohibited Use</h2>
<p>You agree not to:</p>
<ul>
<li>Post false, misleading, or duplicate listings, or misrepresent your identity or authority to sell.</li>
<li>Use the Platform to harass, spam, or solicit users outside its intended purpose.</li>
<li>Attempt to bypass our centralized-lead model by soliciting direct contact information from another user's assigned agent conversation for a purpose unrelated to that enquiry.</li>
<li>Scrape, reverse-engineer, or interfere with the Platform's normal operation.</li>
</ul>
<h2>6. Intermediary Role &amp; Disclaimer</h2>
<p>Distress Deals UAE facilitates introductions between buyers, sellers, and our agents; we are not a party to any resulting sale, purchase, or lease agreement unless expressly stated in a separate written agreement. Any calculators, market estimates, or valuation tools on the Platform (including the mortgage and rental yield calculator) are provided for general guidance only and are not financial, legal, or professional advice. Always seek independent advice before making a property decision.</p>
<h2>7. Intellectual Property</h2>
<p>All content on the Platform — branding, design, text, and software — is owned by or licensed to Distress Deals UAE and may not be copied or reused without permission, other than the property photos and details you submit as a seller, which you retain ownership of and grant us a license to display on the Platform for the purpose of marketing your listing.</p>
<h2>8. Limitation of Liability</h2>
<p>To the fullest extent permitted by law, Distress Deals UAE is not liable for indirect, incidental, or consequential damages arising from your use of the Platform, or from any transaction between users, beyond the extent of our own direct involvement.</p>
<h2>9. Termination</h2>
<p>We may suspend or terminate your access to the Platform at any time for conduct that violates these Terms or is otherwise harmful to other users or to us. You may close your account at any time by contacting us.</p>
<h2>10. Governing Law</h2>
<p>These Terms are governed by the laws of the United Arab Emirates, and any dispute arising from them falls under the jurisdiction of the courts of Dubai.</p>
<h2>11. Changes to These Terms</h2>
<p>We may update these Terms from time to time. The "Last updated" date above reflects the most recent revision; continued use of the Platform after a change constitutes acceptance of the revised Terms.</p>
<h2>12. Contact Us</h2>
<p>Questions about these Terms can be sent through our <a href="/contact">Contact page</a>.</p>`,
  },

  cookies: {
    title: 'Cookie Policy',
    updated: UPDATED,
    html: `<p>This policy explains how distressdealsuae.com uses cookies and similar browser storage technologies, and the choices available to you.</p>
<h2>1. What Are Cookies?</h2>
<p>Cookies are small text files a website can store in your browser. Websites also commonly use similar technologies — such as localStorage — that work the same way but aren't technically cookies. We refer to both together in this policy.</p>
<h2>2. What We Use</h2>
<ul>
<li><strong>Essential storage.</strong> We use your browser's local storage to keep you signed in and to remember your light/dark theme preference. This is strictly necessary for the site to function and cannot be disabled without logging you out.</li>
<li><strong>Analytics.</strong> Where enabled, we use Google Tag Manager to load analytics tools such as Google Analytics, which set cookies to help us understand aggregate traffic patterns — which pages are visited, how people arrive at the site, and general usage trends. These do not identify you by name.</li>
<li><strong>Marketing attribution.</strong> When you arrive via a marketing link, we may briefly store the campaign source (UTM parameters) so we can understand which channels bring visitors to the site. This is not used to identify you personally.</li>
</ul>
<p>We do not use cookies for third-party behavioral advertising or resell cookie data to advertisers.</p>
<h2>3. Managing Cookies</h2>
<p>Most browsers let you block or delete cookies through their settings. Because we rely on browser storage to keep you signed in, blocking it will sign you out and may prevent parts of the site (favourites, saved searches, chat) from working correctly. Blocking analytics cookies specifically does not affect core site functionality.</p>
<h2>4. Changes to This Policy</h2>
<p>We may update this policy as the tools we use change. The "Last updated" date above reflects the most recent revision.</p>
<h2>5. Contact Us</h2>
<p>Questions about this policy can be sent through our <a href="/contact">Contact page</a>. See also our <a href="/privacy">Privacy Policy</a>.</p>`,
  },
}
