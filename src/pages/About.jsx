import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'

export default function About() {
  return (
    <LegalLayout eyebrow="About" title="ChainWork 소개">
      <p className="mt-8 text-white/75 leading-relaxed">
        ChainWork(체인워크)는 기업과 프리랜서·비즈니스 파트너를 연결하는 업무 매칭 플랫폼입니다.
        기업은 프로젝트 등록, 월간 파트너 계약, 업무 관리 서비스를 이용할 수 있으며, 결제는 원화(KRW)
        기반의 플랫폼 이용료 및 업무 서비스 대금 결제로 처리됩니다.
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
          <li>업무 대금 결제 및 정산(원화 기준)</li>
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
    </LegalLayout>
  )
}
