import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'
import { useT } from '../i18n/index.jsx'

export default function Pricing() {
  const { lang } = useT()

  const benefits = lang === 'ko' ? [
    '채용 공고 등록',
    '지원자 관리',
    '기업 인증 배지',
    '회사 프로필 페이지',
    '추천 기업 노출 (Featured Employer)',
    '프리랜서 연락 요청 열람',
  ] : [
    'Job posting publication',
    'Applicant management',
    'Company verification badge',
    'Company profile page',
    'Featured Employer exposure',
    'Access to freelancer contact requests',
  ]

  const ko = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        ChainWork는 단일 연간 요금제 <strong className="text-white">인증 기업회원(Verified Employer)</strong> 하나로
        운영됩니다. 결제는 암호화폐 결제 게이트웨이 <strong className="text-white">NowPayments</strong>를 통해
        USDT(BEP20)로 진행됩니다. 본 페이지의 요금은 정책 변경에 따라 업데이트될 수 있으며, 변경 시 사전에 공지합니다.
      </p>

      <LegalSection title="요금제">
        <div className="mt-4 rounded-2xl border border-accent-400/30 bg-accent-400/[0.06] p-6 not-prose">
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1">
            <div className="text-white font-semibold text-lg">인증 기업회원 · 연간</div>
            <div className="text-sm font-mono text-accent-200">990,000 KRW / 년 · USDT(BEP20)</div>
          </div>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            연간 단일 결제. 월간 구독은 없습니다. 채용 공고 등록과 모든 기업 기능을 이용할 수 있습니다.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-white/80">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-accent-300 shrink-0 mt-0.5"><path d="M5 12l5 5L20 7" /></svg>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </LegalSection>

      <LegalSection title="결제 수단">
        <p>결제는 암호화폐 결제 게이트웨이 NowPayments를 통해 진행됩니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>USDT (BEP20 / BSC) — 990,000 KRW 상당을 결제 시점 시세로 환산하여 청구</li>
          <li>연간 결제 전용 — 월간 구독 없음</li>
          <li>결제가 온체인에서 확인되면 인증 기업회원 자격이 자동으로 활성화됩니다</li>
        </ul>
      </LegalSection>

      <LegalSection title="환불 및 분쟁">
        <p>요금 결제에 대한 환불은 <a className="text-brand-300 hover:text-white" href="#/refund-policy">환불정책</a>,
        분쟁 처리는 <a className="text-brand-300 hover:text-white" href="#/dispute-policy">분쟁처리정책</a>에 따릅니다.</p>
      </LegalSection>

      <LegalSection title="문의">
        <p>요금 관련 상담은 <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a> 또는 010-8932-8539 로 연락 주시기 바랍니다.</p>
      </LegalSection>
    </>
  )

  const en = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        ChainWork operates with a single annual plan, the <strong className="text-white">Verified Employer</strong> membership.
        Payment is made in USDT(BEP20) through the cryptocurrency payment gateway <strong className="text-white">NowPayments</strong>.
        The pricing on this page may be updated as policy changes, and any change will be announced in advance.
      </p>

      <LegalSection title="Plan">
        <div className="mt-4 rounded-2xl border border-accent-400/30 bg-accent-400/[0.06] p-6 not-prose">
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1">
            <div className="text-white font-semibold text-lg">Verified Employer · Annual</div>
            <div className="text-sm font-mono text-accent-200">990,000 KRW / year · USDT(BEP20)</div>
          </div>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            A single annual payment. There is no monthly subscription. You can post jobs and use all employer features.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-white/80">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-accent-300 shrink-0 mt-0.5"><path d="M5 12l5 5L20 7" /></svg>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </LegalSection>

      <LegalSection title="Payment Methods">
        <p>Payment is made through the cryptocurrency payment gateway NowPayments.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>USDT (BEP20 / BSC) — billed by converting the equivalent of 990,000 KRW at the exchange rate at the time of payment</li>
          <li>Annual payment only — no monthly subscription</li>
          <li>Once payment is confirmed on-chain, the Verified Employer status is automatically activated</li>
        </ul>
      </LegalSection>

      <LegalSection title="Refunds and Disputes">
        <p>Refunds for fee payments follow the <a className="text-brand-300 hover:text-white" href="#/refund-policy">Refund Policy</a>,
        and dispute handling follows the <a className="text-brand-300 hover:text-white" href="#/dispute-policy">Dispute Policy</a>.</p>
      </LegalSection>

      <LegalSection title="Inquiries">
        <p>For pricing-related inquiries, please contact <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a> or 010-8932-8539.</p>
      </LegalSection>
    </>
  )

  return (
    <LegalLayout eyebrow="Pricing" title={lang === 'ko' ? '서비스 요금 안내' : 'Service Pricing'}>
      {lang === 'ko' ? ko : en}
    </LegalLayout>
  )
}
