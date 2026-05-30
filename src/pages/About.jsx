import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'
import { useT } from '../i18n/index.jsx'

export default function About() {
  const { lang } = useT()
  const ko = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        ChainWork(체인워크)는 기업과 프리랜서·비즈니스 파트너를 연결하는 업무 매칭 플랫폼입니다.
        기업은 프로젝트 등록, 월간 파트너 계약, 업무 관리 서비스를 이용할 수 있으며, 결제는 암호화폐 결제
        게이트웨이 <strong className="text-white">NowPayments</strong>를 통해 USDT·USDC 스테이블코인으로
        처리됩니다. 원화(KRW) 결제는 국내 규제 및 결제대행사(PG) 승인 절차로 인해 현재 지연되고 있습니다.
      </p>

      <LegalSection title="우리가 해결하는 문제">
        <p>중소기업과 1인 사업자는 디자인, 개발, 마케팅, 콘텐츠, 운영 업무를 외부 전문가와 협업해야 하는
        순간이 점점 늘어나고 있습니다. ChainWork는 검증된 프리랜서와의 매칭, 명확한 업무 범위 합의,
        안전한 결제·정산 절차를 한 곳에서 제공하여 외주 협업의 위험을 줄입니다.</p>
      </LegalSection>

      <LegalSection title="제공하는 서비스">
        <ul className="list-disc list-inside space-y-1">
          <li>프로젝트 등록 및 전문가 매칭</li>
          <li>월간 파트너 계약 관리 (리테이너)</li>
          <li>건별 업무 발주 및 진행 관리</li>
          <li>업무 대금 결제 및 정산 (USDT·USDC 스테이블코인, NowPayments)</li>
          <li>분쟁 조정 및 환불 처리</li>
          <li>기업 회원을 위한 Pro 멤버십</li>
        </ul>
      </LegalSection>

      <LegalSection title="원칙">
        <ul className="list-disc list-inside space-y-1">
          <li>투명한 가격 — 모든 수수료는 사전 공지</li>
          <li>검증된 프로필 — 본인 인증 및 사업자 인증</li>
          <li>안전한 거래 — 작업보호금(Work Protection Payment) 보관</li>
          <li>공정한 분쟁 — 객관 자료 기반의 중재</li>
        </ul>
      </LegalSection>

      <LegalSection title="운영 회사">
        <p>본 서비스는 체인 랩스(Chain Labs)가 운영합니다. 자세한 사업자 정보는 <a className="text-brand-300 hover:text-white" href="#/business-info">사업자 정보</a> 페이지를 참고해 주십시오.</p>
      </LegalSection>
    </>
  )
  const en = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        ChainWork is a work-matching platform that connects companies with freelancers and business partners.
        Companies can post projects, set up monthly partner contracts, and use work management services, while payments are
        processed in USDT and USDC stablecoins through the crypto payment gateway <strong className="text-white">NowPayments</strong>.
        KRW payments are currently delayed due to domestic regulations and the payment gateway (PG) approval process.
      </p>

      <LegalSection title="The problem we solve">
        <p>Small businesses and solo entrepreneurs increasingly need to collaborate with outside experts on
        design, development, marketing, content, and operations work. ChainWork reduces the risks of outsourced
        collaboration by providing matching with verified freelancers, clear scope agreements, and secure
        payment and settlement processes all in one place.</p>
      </LegalSection>

      <LegalSection title="Services we provide">
        <ul className="list-disc list-inside space-y-1">
          <li>Project posting and expert matching</li>
          <li>Monthly partner contract management (retainer)</li>
          <li>Per-task ordering and progress management</li>
          <li>Work payment and settlement (USDT and USDC stablecoins, NowPayments)</li>
          <li>Dispute mediation and refund handling</li>
          <li>Pro membership for company members</li>
        </ul>
      </LegalSection>

      <LegalSection title="Our principles">
        <ul className="list-disc list-inside space-y-1">
          <li>Transparent pricing — all fees announced in advance</li>
          <li>Verified profiles — identity verification and business verification</li>
          <li>Secure transactions — Work Protection Payment held in escrow</li>
          <li>Fair disputes — mediation based on objective evidence</li>
        </ul>
      </LegalSection>

      <LegalSection title="Operating company">
        <p>This service is operated by Chain Labs. For detailed business information, please refer to the <a className="text-brand-300 hover:text-white" href="#/business-info">Business information</a> page.</p>
      </LegalSection>
    </>
  )
  return (
    <LegalLayout
      eyebrow={lang === 'ko' ? 'About' : 'About'}
      title={lang === 'ko' ? 'ChainWork 소개' : 'About ChainWork'}
    >
      {lang === 'ko' ? ko : en}
    </LegalLayout>
  )
}
