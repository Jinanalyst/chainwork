import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'
import { useT } from '../i18n/index.jsx'

export default function Verification() {
  const { lang } = useT()
  const ko = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        ChainWork는 의뢰자가 안심하고 협업할 수 있도록 모든 전문가(프리랜서/파트너) 회원에게 단계별
        검증 절차를 운영합니다. 본 페이지는 검증 항목과 노출 기준을 안내합니다.
      </p>

      <LegalSection title="1. 본인 인증">
        <ul className="list-disc list-inside space-y-1">
          <li>휴대전화 본인 인증 (필수)</li>
          <li>이메일 인증 (필수)</li>
          <li>실명 확인 정보의 정확성 검토</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. 사업자/소속 검증 (선택)">
        <ul className="list-disc list-inside space-y-1">
          <li>사업자등록증 확인 (개인사업자 / 법인)</li>
          <li>소속 회사 도메인 이메일 인증</li>
          <li>증빙 자료를 통한 경력 확인</li>
        </ul>
        <p>검증이 완료된 회원에게는 프로필에 검증 배지(Verified Badge)가 부여됩니다.</p>
      </LegalSection>

      <LegalSection title="3. 포트폴리오 검토">
        <p>등록된 포트폴리오는 본인 제작 여부, 권리 침해 여부, 카테고리 적합성을 기준으로 검토됩니다.
        타인의 저작물을 무단으로 도용한 경우 등록이 거절되며, 적발 시 계정 이용이 제한될 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="4. 활동 평가">
        <ul className="list-disc list-inside space-y-1">
          <li>응답 속도 (의뢰자 메시지에 대한 평균 응답 시간)</li>
          <li>완료율 (수락한 작업 중 정상 완료된 비율)</li>
          <li>고객 평가 (별점 및 후기)</li>
          <li>분쟁 발생 빈도 및 해결 결과</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. 검증 등급">
        <ul className="list-disc list-inside space-y-1">
          <li><strong className="text-white">Standard</strong> — 본인 인증 완료</li>
          <li><strong className="text-white">Verified</strong> — 사업자/소속 검증 완료, 포트폴리오 검토 완료</li>
          <li><strong className="text-white">Top Rated</strong> — 30건 이상 완료 + 평점 4.7 이상 + 분쟁률 1% 이하</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. 자료의 보관 및 파기">
        <p>검증에 사용된 자료는 검증 목적 외 다른 용도로 사용되지 않으며,
        <a className="text-brand-300 hover:text-white" href="#/privacy"> 개인정보 처리방침</a>에 따라 보관 후 파기됩니다.</p>
      </LegalSection>

      <LegalSection title="7. 검증 신청 / 문의">
        <p>검증 신청 및 문의: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></p>
      </LegalSection>
    </>
  )
  const en = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        ChainWork operates a step-by-step verification process for all expert (freelancer/partner) members so that
        hirers can collaborate with confidence. This page explains the verification items and visibility criteria.
      </p>

      <LegalSection title="1. Identity verification">
        <ul className="list-disc list-inside space-y-1">
          <li>Mobile phone identity verification (required)</li>
          <li>Email verification (required)</li>
          <li>Review of the accuracy of real-name verification information</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Business / affiliation verification (optional)">
        <ul className="list-disc list-inside space-y-1">
          <li>Business registration certificate check (sole proprietor / corporation)</li>
          <li>Affiliated company domain email verification</li>
          <li>Career verification through supporting documents</li>
        </ul>
        <p>Members who complete verification receive a Verified Badge on their profile.</p>
      </LegalSection>

      <LegalSection title="3. Portfolio review">
        <p>Registered portfolios are reviewed based on whether the work is the member's own, whether it infringes any
        rights, and its category suitability. Unauthorized use of another person's work will result in rejection of
        registration, and account use may be restricted if such use is detected.</p>
      </LegalSection>

      <LegalSection title="4. Activity evaluation">
        <ul className="list-disc list-inside space-y-1">
          <li>Response speed (average response time to hirer messages)</li>
          <li>Completion rate (proportion of accepted work completed normally)</li>
          <li>Customer ratings (star ratings and reviews)</li>
          <li>Frequency of disputes and their resolution outcomes</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Verification tiers">
        <ul className="list-disc list-inside space-y-1">
          <li><strong className="text-white">Standard</strong> — identity verification completed</li>
          <li><strong className="text-white">Verified</strong> — business/affiliation verification completed, portfolio review completed</li>
          <li><strong className="text-white">Top Rated</strong> — 30+ completed + rating 4.7 or higher + dispute rate 1% or lower</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Retention and destruction of materials">
        <p>Materials used for verification are not used for any purpose other than verification, and are
        <a className="text-brand-300 hover:text-white" href="#/privacy"> retained and destroyed in accordance with the Privacy Policy</a>.</p>
      </LegalSection>

      <LegalSection title="7. Verification request / inquiries">
        <p>Verification requests and inquiries: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></p>
      </LegalSection>
    </>
  )
  return (
    <LegalLayout
      eyebrow={lang === 'ko' ? 'Verification' : 'Verification'}
      title={lang === 'ko' ? '프리랜서 검증 절차' : 'Freelancer verification process'}
    >
      {lang === 'ko' ? ko : en}
    </LegalLayout>
  )
}
