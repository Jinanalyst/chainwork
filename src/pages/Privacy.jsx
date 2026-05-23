import React from 'react'
import { Icon, navigate } from '../components/ui.jsx'

const Section = ({ title, children }) => (
  <section className="mt-10">
    <h2 className="text-xl md:text-2xl font-semibold text-white">{title}</h2>
    <div className="mt-3 space-y-3 text-white/70 leading-relaxed">{children}</div>
  </section>
)

const EFFECTIVE_DATE = 'May 23, 2026'

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <button
        onClick={() => navigate('#/')}
        className="text-sm text-white/55 hover:text-white inline-flex items-center gap-1.5 mb-6"
      >
        <Icon path={<path d="M15 18l-6-6 6-6" />} className="h-4 w-4" />
        Back to home
      </button>

      <div className="text-[11px] uppercase tracking-[0.2em] text-accent-300 font-mono">Legal</div>
      <h1 className="mt-2 text-3xl md:text-5xl font-bold leading-tight">Privacy Policy</h1>
      <p className="mt-3 text-white/55 text-sm">Effective {EFFECTIVE_DATE}</p>

      <p className="mt-8 text-white/75 leading-relaxed">
        ChainWork (&quot;ChainWork&quot;, &quot;we&quot;, &quot;us&quot;) connects independent workers with hirers and
        settles payments on public blockchains. This policy explains what data we
        collect, how we use it, and the choices you have. Plain-English version:
        we collect as little as possible, never sell personal data, and most of
        the &quot;account&quot; is a wallet you control.
      </p>

      <Section title="1. Information we collect">
        <p><strong className="text-white">Wallet identity.</strong> When you sign in with a Web3 wallet (Ethereum, Solana) or with LinkedIn / another OAuth provider, we store the resulting account identifier (wallet address or OAuth subject id) and any minimal claims the provider returns — typically name, email, and avatar URL when you authorize them.</p>
        <p><strong className="text-white">Profile data you provide.</strong> Display name, company, role, location, bio, contact email, portfolio links, and social handles you fill in. These are visible to other authenticated users.</p>
        <p><strong className="text-white">Work content.</strong> Tasks you post or accept, attachments, chat messages, reviews, portfolio images / videos, experience entries.</p>
        <p><strong className="text-white">Payment proofs.</strong> Transaction hashes, sending wallet addresses (optional), token, chain, and amount you submit to verify ChainWork Pro or task funding payments.</p>
        <p><strong className="text-white">Operational data.</strong> IP address, user-agent, and basic request metadata via our hosting provider, used only for security, abuse prevention, and debugging.</p>
        <p><strong className="text-white">Cookies / local storage.</strong> A session token (so you stay signed in) and small UI preferences (e.g. last opened tab, optimistic payment-proof cache). We do not use third-party advertising trackers.</p>
      </Section>

      <Section title="2. LinkedIn and other OAuth sign-in">
        <p>If you choose &quot;Continue with LinkedIn&quot; (or another OAuth provider) we request a minimal scope — typically your name, email, and profile picture URL. We use this only to create or sign you into your ChainWork account and to pre-fill the profile editor. We do not post on your behalf and do not pull connections, messages, or any other LinkedIn data.</p>
        <p>You can disconnect LinkedIn at any time by signing out and signing back in with a different method, or by emailing us to delete your account.</p>
      </Section>

      <Section title="3. How we use your information">
        <ul className="list-disc list-inside space-y-1">
          <li>To run the service: show your profile to hirers, match tasks to workers, deliver chat messages, surface payment proofs to admins for verification.</li>
          <li>To prevent abuse and comply with applicable law.</li>
          <li>To improve product quality based on aggregate, non-identifying usage signals.</li>
        </ul>
        <p>We do not sell personal data. We do not use your data to train third-party AI models.</p>
      </Section>

      <Section title="4. Public-blockchain disclosure">
        <p>Stablecoin payments to ChainWork wallets and any payouts to your wallet are recorded on public blockchains (Ethereum, Base, Solana, Polygon, Tron). Transaction hashes, sending and receiving addresses, and amounts on those chains are public and outside our control once broadcast. Treat any address you publish (here or elsewhere) as permanently linked to those transactions.</p>
      </Section>

      <Section title="5. Sharing">
        <p>We share data only with the service providers required to run ChainWork:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong className="text-white">Supabase</strong> — authentication, database, storage, realtime.</li>
          <li><strong className="text-white">Vercel</strong> — frontend hosting and CDN.</li>
          <li><strong className="text-white">LinkedIn / wallet providers</strong> — only for the sign-in handshake you initiate.</li>
        </ul>
        <p>We may disclose data when required by law or to protect the rights and safety of users.</p>
      </Section>

      <Section title="6. Data retention">
        <p>Profile and work data persists for as long as your account exists. Payment proofs are retained for accounting and dispute resolution. You can request deletion of your account at any time (see &quot;Your rights&quot; below). On-chain transactions cannot be deleted by anyone — including us.</p>
      </Section>

      <Section title="7. Security">
        <p>We use TLS in transit, row-level security on the database, and authenticated storage policies for uploads. We never see your wallet's private key. No system is perfectly secure — choose a reputable wallet, keep your seed phrase offline, and use a hardware wallet for high-value flows.</p>
      </Section>

      <Section title="8. Your rights">
        <p>Depending on where you live (GDPR / UK GDPR / CCPA / similar), you may have the right to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Access the personal data we hold about you.</li>
          <li>Correct or update inaccurate data (you can edit most of it in your profile directly).</li>
          <li>Delete your account and associated personal data.</li>
          <li>Object to or restrict certain processing.</li>
          <li>Port your data to another service.</li>
        </ul>
        <p>To exercise any of these, email us at <a className="text-brand-300 hover:text-white" href="mailto:privacy@chainwork.kr">privacy@chainwork.kr</a>. We respond within 30 days.</p>
      </Section>

      <Section title="9. Children">
        <p>ChainWork is not directed to children under 16. We do not knowingly collect data from anyone under 16. If you believe a child has signed up, email us and we will delete the account.</p>
      </Section>

      <Section title="10. International transfers">
        <p>Our service providers may process data in regions outside your country (typically the United States and the European Union). We rely on standard contractual clauses and equivalent safeguards where required.</p>
      </Section>

      <Section title="11. Changes to this policy">
        <p>We may update this policy as the product evolves. Material changes will be announced on the home page or by email. The &quot;Effective&quot; date above always reflects the current version.</p>
      </Section>

      <Section title="12. Contact">
        <p>Privacy questions: <a className="text-brand-300 hover:text-white" href="mailto:privacy@chainwork.kr">privacy@chainwork.kr</a></p>
        <p>General: <a className="text-brand-300 hover:text-white" href="mailto:hello@chainwork.kr">hello@chainwork.kr</a></p>
      </Section>

      <div className="mt-16 pt-8 border-t border-white/5 text-xs text-white/40">
        <p>This page is the canonical privacy policy referenced from third-party app registrations (LinkedIn, GitHub, etc.).</p>
        <p className="mt-1">Canonical URL: <code className="font-mono text-white/70">/#/privacy</code></p>
      </div>
    </div>
  )
}
