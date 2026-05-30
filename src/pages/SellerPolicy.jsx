import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'
import { useT } from '../i18n/index.jsx'

const EFFECTIVE = { ko: '2026년 5월 27일', en: 'May 27, 2026' }

export default function SellerPolicy() {
  const { lang } = useT()

  const ko = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        본 정책은 ChainWork에서 디지털 전문 서비스를 제공·판매하는 전문가(Worker) 회원의 등록, 운영,
        의무 사항을 규정합니다. 전문가 회원은 본 정책에 동의한 것으로 간주됩니다.
      </p>

      <LegalSection title="1. 전문가 등록 요건">
        <ul className="list-disc list-inside space-y-1">
          <li>만 19세 이상의 개인 또는 사업자</li>
          <li>본인 확인을 위한 휴대전화 인증 또는 사업자 인증</li>
          <li>정산을 위한 본인 명의 국내 은행 계좌</li>
          <li>정확한 프로필 정보 및 포트폴리오 등록</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. 서비스 등록 기준">
        <ul className="list-disc list-inside space-y-1">
          <li>제공 가능한 디지털 전문 서비스만 등록할 수 있습니다.</li>
          <li>가격, 작업 범위, 작업 기간, 수정 횟수 등을 명확히 기재해야 합니다.</li>
          <li>샘플 이미지·포트폴리오는 본인이 직접 제작한 것이어야 하며, 타인의 저작물을 도용할 수 없습니다.</li>
          <li>금지서비스 정책에 해당하는 서비스는 등록할 수 없습니다.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. 작업 수행 의무">
        <ul className="list-disc list-inside space-y-1">
          <li>합의된 일정과 사양에 맞추어 성실하게 작업을 수행합니다.</li>
          <li>의뢰자의 합리적 요구사항에 적극 대응합니다.</li>
          <li>일정 지연이 예상될 경우 즉시 의뢰자에게 통지하고 협의합니다.</li>
          <li>모든 의사소통은 서비스 내 채팅으로 진행하며, 외부 직거래는 금지됩니다.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. 정산">
        <p>정산은 결제정책에 따라 의뢰자 검수 승인, 자동 승인 기한 도과, 또는 분쟁 해결 결과에 따라
        이루어지며, 회사의 수수료를 공제한 후 등록된 계좌로 지급됩니다. 정산 관련 세금 신고 의무는
        전문가 본인에게 있습니다.</p>
      </LegalSection>

      <LegalSection title="5. 평가 및 후기">
        <p>의뢰자는 작업 완료 후 전문가에 대한 별점과 후기를 남길 수 있으며, 전문가는 정당한 사유 없이
        후기 삭제·수정을 요구할 수 없습니다. 허위·비방성 후기에 대해서는 신고를 통해 회사의 검토를
        요청할 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="6. 금지 행위">
        <ul className="list-disc list-inside space-y-1">
          <li>허위·과장된 프로필 또는 포트폴리오 등록</li>
          <li>가격을 유도성으로 낮춰 외부 결제로 유인하는 행위</li>
          <li>의뢰자와의 합의 없이 작업 중단 또는 산출물 미제공</li>
          <li>의뢰자의 영업비밀·개인정보 무단 유출</li>
          <li>금지서비스 정책 위반</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. 위반 시 조치">
        <p>본 정책 또는 관련 법령을 위반한 전문가에 대해 회사는 경고, 서비스 노출 제한, 정산 보류, 계정
        정지, 손해배상 청구 등 필요한 조치를 취할 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="8. 휴면 및 탈퇴">
        <p>장기간 미활동 시 계정이 휴면 처리될 수 있습니다. 회원 탈퇴는 서비스 내 설정 화면에서 가능하며,
        진행 중인 작업이 있는 경우 작업 종료 후 처리됩니다.</p>
      </LegalSection>
    </>
  )

  const en = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        This Policy governs the registration, operation, and obligations of Worker members who provide
        and sell digital professional services on ChainWork. Worker members are deemed to have agreed
        to this Policy.
      </p>

      <LegalSection title="1. Worker Registration Requirements">
        <ul className="list-disc list-inside space-y-1">
          <li>An individual or business at least 19 years of age</li>
          <li>Mobile phone verification or business verification for identity confirmation</li>
          <li>A domestic bank account in the member's own name for settlement</li>
          <li>Accurate profile information and portfolio registration</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Service Listing Standards">
        <ul className="list-disc list-inside space-y-1">
          <li>Only digital professional services that you can actually provide may be listed.</li>
          <li>Price, scope of work, work duration, number of revisions, and similar details must be clearly stated.</li>
          <li>Sample images and portfolios must be created by you, and you may not appropriate others' works.</li>
          <li>Services covered by the Prohibited Services Policy may not be listed.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Work Performance Obligations">
        <ul className="list-disc list-inside space-y-1">
          <li>Perform the work diligently in accordance with the agreed schedule and specifications.</li>
          <li>Respond actively to the Hirer's reasonable requirements.</li>
          <li>If a delay is anticipated, immediately notify the Hirer and consult with them.</li>
          <li>All communication must take place through in-service chat, and external direct dealings are prohibited.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Settlement">
        <p>Settlement is made in accordance with the Payment Policy based on the Hirer's review approval,
        the lapse of the automatic approval deadline, or the outcome of dispute resolution, and is paid
        to the registered account after deducting the Company's fee. The obligation to report taxes
        related to settlement rests with the Worker.</p>
      </LegalSection>

      <LegalSection title="5. Ratings and Reviews">
        <p>After the work is completed, the Hirer may leave a star rating and review of the Worker, and
        the Worker may not request deletion or modification of a review without justifiable cause.
        For false or defamatory reviews, you may request the Company's review by filing a report.</p>
      </LegalSection>

      <LegalSection title="6. Prohibited Conduct">
        <ul className="list-disc list-inside space-y-1">
          <li>Registering a false or exaggerated profile or portfolio</li>
          <li>Inducingly lowering the price to lure the user into external payment</li>
          <li>Stopping work or failing to provide deliverables without the Hirer's agreement</li>
          <li>Unauthorized disclosure of the Hirer's trade secrets or personal information</li>
          <li>Violation of the Prohibited Services Policy</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Measures upon Violation">
        <p>For a Worker who violates this Policy or applicable laws, the Company may take necessary
        measures such as warnings, restriction of service exposure, suspension of settlement, account
        suspension, and claims for damages.</p>
      </LegalSection>

      <LegalSection title="8. Dormancy and Withdrawal">
        <p>If inactive for a long period, an account may be made dormant. Withdrawal of membership is
        available from the settings screen within the service, and if there is work in progress, it is
        processed after the work is completed.</p>
      </LegalSection>
    </>
  )

  return (
    <LegalLayout
      eyebrow={lang === 'ko' ? '판매자(전문가) 정책' : 'Seller (Worker) Policy'}
      title={lang === 'ko' ? '판매자(전문가) 정책' : 'Seller (Worker) Policy'}
      effective={EFFECTIVE[lang]}
    >
      {lang === 'ko' ? ko : en}
    </LegalLayout>
  )
}
