import React from 'react'
import { Icon, navigate } from '../components/ui.jsx'
import PayPalCheckoutButton from '../components/PayPalCheckoutButton.jsx'

const TEST_ITEMS = [
  {
    key:         'employer_pro_membership',
    title:       'Employer Pro Membership',
    description: 'ChainWork Employer Pro Membership Test',
    amount:      9.99,
    currency:    'USD',
  },
  {
    key:         'project_posting_fee',
    title:       'Project Posting Fee',
    description: 'ChainWork Project Posting Fee Test',
    amount:      4.99,
    currency:    'USD',
  },
  {
    key:         'business_matching_service',
    title:       'Business Matching Service',
    description: 'ChainWork Business Matching Service Test',
    amount:      19.99,
    currency:    'USD',
  },
]

function ItemCard({ item }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-white">{item.title}</h3>
        <div className="font-mono text-sm text-accent-200">{item.currency} {item.amount.toFixed(2)}</div>
      </div>
      <p className="mt-1 text-xs text-white/55">{item.description}</p>
      <div className="mt-4">
        <PayPalCheckoutButton item={item} />
      </div>
    </div>
  )
}

export default function PayPalTest() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <button
        onClick={() => navigate('#/')}
        className="text-sm text-white/55 hover:text-white inline-flex items-center gap-1.5 mb-6"
      >
        <Icon path={<path d="M15 18l-6-6 6-6" />} className="h-4 w-4" />
        Back to home
      </button>

      <div className="text-[11px] uppercase tracking-[0.2em] text-accent-300 font-mono">Internal · Sandbox testing</div>
      <h1 className="mt-2 text-3xl md:text-4xl font-bold leading-tight">PayPal checkout — Sandbox test</h1>
      <p className="mt-3 text-white/65 text-sm leading-relaxed">
        Pay securely with PayPal or major cards. International payments are processed through
        PayPal Sandbox for testing. ChainWork supports employer memberships, project posting fees,
        business matching services, and work-related service payments.
      </p>

      <div className="mt-8 grid gap-4">
        {TEST_ITEMS.map((it) => <ItemCard key={it.key} item={it} />)}
      </div>

      <div className="mt-10 text-xs text-white/40 leading-relaxed">
        This page is for sandbox testing only and is not linked from the public site. Switch
        <code className="mx-1 font-mono text-white/60">PAYPAL_MODE=live</code> only after all flows pass.
      </div>
    </div>
  )
}
