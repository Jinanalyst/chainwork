import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'
import { useT } from '../i18n/index.jsx'

const EFFECTIVE = { ko: '2026년 5월 27일', en: 'May 27, 2026' }

export default function ServicePolicy() {
  const { lang } = useT()

  const ko = (
    <>
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
    </>
  )

  const en = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        This policy governs the scope, transaction procedures, quality standards, and member
        responsibilities of the digital professional services provided and intermediated on ChainWork.
      </p>

      <LegalSection title="1. Scope of Services Provided">
        <ul className="list-disc list-inside space-y-1">
          <li>Design (branding, logos, UI/UX, print materials)</li>
          <li>Web/app development and maintenance</li>
          <li>Marketing support (ad operations, SEO, content marketing)</li>
          <li>Content production (writing, video editing, translation)</li>
          <li>Community management and customer support</li>
          <li>Other lawful digital professional services</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Transaction Procedure">
        <ol className="list-decimal list-inside space-y-1">
          <li>The Hirer posts a job or selects a Worker's service.</li>
          <li>The requirements, schedule, and amount are negotiated, and payment is made.</li>
          <li>The payment is held as a Work Protection Payment.</li>
          <li>The Worker performs the work and submits the deliverables.</li>
          <li>The Hirer reviews and then approves or requests revisions.</li>
          <li>Upon approval, settlement is carried out and the transaction is concluded.</li>
        </ol>
      </LegalSection>

      <LegalSection title="3. Auto-approval">
        <p>If the Hirer does not approve or request revisions within the review period (7 days by
        default) after the Worker submits the final deliverables, the deliverables are deemed
        automatically approved and settlement proceeds.</p>
      </LegalSection>

      <LegalSection title="4. Revision Requests">
        <p>The Hirer may make reasonable revision requests within the agreed scope of work. Additional
        work exceeding the agreed scope must be negotiated at a separate cost.</p>
      </LegalSection>

      <LegalSection title="5. Rights to Deliverables">
        <p>Unless otherwise agreed, the rights to use the deliverables for which settlement has been
        completed are transferred to the Hirer. However, the Worker may use part of those deliverables
        for portfolio purposes. If trade secrets are included, a separate non-disclosure agreement may
        be entered into.</p>
      </LegalSection>

      <LegalSection title="6. Quality Standards">
        <p>The Worker must perform the work faithfully in accordance with the agreed specifications and
        schedule, and if the deliverables have an obvious defect, rework or a refund may be determined
        in accordance with the Company's mediation.</p>
      </LegalSection>

      <LegalSection title="7. Communication">
        <p>All transaction-related communication must take place through the in-service chat, and
        direct dealing by inducing payment on external channels or exchanging contact information is
        prohibited. Because direct dealing creates blind spots in the protection of member rights, it
        may result in use restrictions if detected.</p>
      </LegalSection>

      <LegalSection title="8. Service Use Restrictions">
        <p>The Company may restrict service use in the following cases.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Violation of the Prohibited Services Policy</li>
          <li>Repeated disputes or false reports</li>
          <li>False registration of payment or settlement information</li>
          <li>Inducement of direct dealing outside the platform</li>
          <li>Violation of applicable laws or these terms and policies</li>
        </ul>
      </LegalSection>
    </>
  )

  return (
    <LegalLayout
      eyebrow={lang === 'ko' ? '서비스정책' : 'Service Policy'}
      title={lang === 'ko' ? '서비스 운영정책' : 'Service Operating Policy'}
      effective={EFFECTIVE[lang]}
    >
      {lang === 'ko' ? ko : en}
    </LegalLayout>
  )
}
