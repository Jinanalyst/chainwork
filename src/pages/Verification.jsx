import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'

export default function Verification() {
  return (
    <LegalLayout eyebrow="Verification" title="프리랜서 검증 절차">
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
    </LegalLayout>
  )
}
