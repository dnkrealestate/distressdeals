import { redirect } from 'next/navigation'

// Mortgage leads moved into the Leads section (its "Mortgage leads" tab). Old links and bookmarks land there.
export default function AdminMortgagePage() {
  redirect('/admin/leads?section=mortgage')
}
