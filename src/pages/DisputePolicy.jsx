import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'

const EFFECTIVE = '2026년 5월 27일'

export default function DisputePolicy() {
  return (
    <LegalLayout eyebrow="분쟁처리정책" title="분쟁처리정책" effective={EFFECTIVE}>
      <p className="mt-8 text-white/75 leading-relaxed">
        ChainWork는 의뢰자와 전문가 사이에 발생하는 분쟁이 공정하고 신속하게 해결될 수 있도록 다음의
        절차를 운영합니다. 본 정책은 작업보호금 보관 상태에서의 분쟁뿐 아니라 정산 이후의 하자
        분쟁에도 적용됩니다.
      </p>

      <LegalSection title="1. 분쟁의 정의">
        <p>분쟁이란 다음과 같이 의뢰자와 전문가 사이에 합의에 이르지 못한 상황을 의미합니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>작업 범위 또는 산출물 품질에 대한 이견</li>
          <li>일정 지연 또는 작업 중단</li>
          <li>환불 또는 정산 비율에 대한 이견</li>
          <li>저작권 등 권리 침해 주장</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. 분쟁 접수">
        <p>회원은 서비스 내 주문 상세 화면의 [분쟁 신청] 또는 고객센터
        (<a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a>)
        를 통해 분쟁을 접수할 수 있습니다. 접수 시 다음 자료를 함께 제출해 주시기 바랍니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>주문번호 및 거래 상대방 식별 정보</li>
          <li>분쟁 사유 및 원하는 해결 방안</li>
          <li>채팅 기록, 산출물, 이메일 등 증빙자료</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. 작업보호금의 일시 정지">
        <p>분쟁이 접수되면 해당 거래의 작업보호금은 분쟁 해결 시까지 정산이 일시 정지됩니다. 자동 승인
        기한도 분쟁 해결 시까지 진행이 멈춥니다.</p>
      </LegalSection>

      <LegalSection title="4. 처리 절차 및 기간">
        <ol className="list-decimal list-inside space-y-1">
          <li>접수 후 영업일 기준 1~3일 내 양 당사자에게 의견·자료를 요청합니다.</li>
          <li>제출된 자료를 검토하여 회사가 중재 의견을 제시합니다.</li>
          <li>양 당사자의 합의가 이루어지면 합의 내용에 따라 환불·정산을 집행합니다.</li>
          <li>합의가 이루어지지 않을 경우, 본 정책 및 관련 법령에 따라 회사가 환불·정산 비율을 결정합니다.</li>
        </ol>
        <p>전체 처리 기간은 일반적으로 영업일 기준 7~14일이며, 사안의 복잡성에 따라 연장될 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="5. 중재 기준">
        <p>회사는 다음의 객관적 자료를 기준으로 중재합니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>최초 합의된 작업 범위·일정·금액</li>
          <li>실제 수행된 작업량 및 산출물의 완성도</li>
          <li>의뢰자의 검수 의견 및 수정 요청 횟수</li>
          <li>전문가의 일정 준수 및 의사소통 성실성</li>
          <li>관련 법령 및 본 정책</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. 외부 분쟁 해결">
        <p>회사의 중재에 동의하지 않는 경우, 한국소비자원 또는 관할 법원에 분쟁 조정·소송을 제기할 수
        있습니다. 회사는 관계 기관의 요청에 성실히 협조합니다.</p>
      </LegalSection>

      <LegalSection title="7. 허위 신고에 대한 조치">
        <p>분쟁 절차를 악용하거나 허위 자료를 제출한 회원에 대해서는 이용 제한, 정산 보류, 손해배상 청구
        등 필요한 조치를 취할 수 있습니다.</p>
      </LegalSection>
    </LegalLayout>
  )
}
