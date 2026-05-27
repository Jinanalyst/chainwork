import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'

const EFFECTIVE = '2026년 5월 27일'

export default function ServicePolicy() {
  return (
    <LegalLayout eyebrow="서비스정책" title="서비스 운영정책" effective={EFFECTIVE}>
      <p className="mt-8 text-white/75 leading-relaxed">
        본 정책은 ChainWork에서 제공·중개되는 디지털 전문 서비스의 범위, 거래 절차, 품질 기준 및
        회원의 책임을 규정합니다.
      </p>

      <LegalSection title="1. 제공 서비스 범위">
        <ul className="list-disc list-inside space-y-1">
          <li>디자인 (브랜드, 로고, UI/UX, 인쇄물)</li>
          <li>웹/앱 개발 및 유지보수</li>
          <li>마케팅 지원 (광고 운영, SEO, 콘텐츠 마케팅)</li>
          <li>콘텐츠 제작 (글쓰기, 영상 편집, 번역)</li>
          <li>커뮤니티 운영 및 고객 응대</li>
          <li>기타 합법적인 디지털 전문 서비스</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. 거래 절차">
        <ol className="list-decimal list-inside space-y-1">
          <li>의뢰자가 작업을 등록하거나 전문가의 서비스를 선택합니다.</li>
          <li>요구사항·일정·금액을 협의하고 결제를 진행합니다.</li>
          <li>결제 대금은 작업보호금으로 보관됩니다.</li>
          <li>전문가가 작업을 수행하고 산출물을 제출합니다.</li>
          <li>의뢰자는 검수 후 승인 또는 수정 요청을 합니다.</li>
          <li>승인 시 정산이 이루어지고 거래가 종료됩니다.</li>
        </ol>
      </LegalSection>

      <LegalSection title="3. 자동 승인">
        <p>전문가가 최종 산출물을 제출한 후 의뢰자가 검수 기한(기본 7일) 내에 승인 또는 수정 요청을 하지
        않을 경우, 산출물은 자동으로 승인된 것으로 간주되어 정산이 진행됩니다.</p>
      </LegalSection>

      <LegalSection title="4. 수정 요청">
        <p>의뢰자는 합의된 작업 범위 내에서 합리적인 수정 요청을 할 수 있습니다. 합의 범위를 초과하는
        추가 작업은 별도의 비용으로 협의되어야 합니다.</p>
      </LegalSection>

      <LegalSection title="5. 산출물 권리">
        <p>달리 합의한 바가 없는 한, 정산이 완료된 산출물의 사용권은 의뢰자에게 이전됩니다. 다만 전문가는
        해당 산출물의 일부를 포트폴리오 목적으로 사용할 수 있습니다. 영업비밀이 포함된 경우 별도의
        비공개 계약을 체결할 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="6. 품질 기준">
        <p>전문가는 합의된 사양·일정에 맞추어 성실하게 작업을 수행해야 하며, 산출물에 명백한 하자가
        있는 경우 회사의 중재에 따라 재작업 또는 환불이 결정될 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="7. 의사소통">
        <p>모든 거래 관련 소통은 서비스 내 채팅을 통해 이루어져야 하며, 외부 채널에서의 결제 유도·연락처
        교환을 통한 직거래는 금지됩니다. 직거래는 회원 권리 보호의 사각지대를 발생시키므로 적발 시
        이용 제한될 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="8. 서비스 이용 제한">
        <p>회사는 다음의 경우 서비스 이용을 제한할 수 있습니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>금지서비스 정책 위반</li>
          <li>반복적인 분쟁 또는 허위 신고</li>
          <li>결제·정산 정보의 허위 등록</li>
          <li>플랫폼 외부 직거래 유도</li>
          <li>관련 법령 또는 본 약관·정책 위반</li>
        </ul>
      </LegalSection>
    </LegalLayout>
  )
}
