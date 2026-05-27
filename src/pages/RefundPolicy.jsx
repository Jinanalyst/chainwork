import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'

const EFFECTIVE = '2026년 5월 27일'

export default function RefundPolicy() {
  return (
    <LegalLayout eyebrow="환불정책" title="환불정책" effective={EFFECTIVE}>
      <p className="mt-8 text-white/75 leading-relaxed">
        ChainWork는 의뢰자와 전문가 사이의 디지털 전문 서비스 거래를 중개하며, 결제 대금은 작업보호금
        (Work Protection Payment)으로 보관됩니다. 본 정책은 작업 단계별 환불 기준을 안내합니다.
        환불은 「전자상거래 등에서의 소비자보호에 관한 법률」 및 PG사 정책을 준수합니다.
      </p>

      <LegalSection title="1. 작업 시작 전 환불">
        <p>전문가가 작업을 시작하기 전(작업 착수 이전 상태)에는 의뢰자가 결제일로부터 7일 이내 환불을
        요청할 수 있으며, 결제 수단별 환불 절차에 따라 전액 환불됩니다.</p>
      </LegalSection>

      <LegalSection title="2. 작업 시작 후 환불">
        <p>전문가가 작업에 착수한 이후에는 진행된 작업량과 산출물의 활용 가능 여부를 고려하여 부분 환불이
        가능합니다. 일반적인 기준은 다음과 같습니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>진행률 25% 이하: 결제금액의 75% 환불</li>
          <li>진행률 25%~50%: 결제금액의 50% 환불</li>
          <li>진행률 50%~75%: 결제금액의 25% 환불</li>
          <li>진행률 75% 초과: 원칙적으로 환불 불가, 분쟁 시 분쟁처리정책 적용</li>
        </ul>
        <p>진행률은 채팅 기록, 산출물, 마일스톤 등 객관적 자료를 기준으로 회사가 중재 의견을 제공합니다.</p>
      </LegalSection>

      <LegalSection title="3. 완료된 작업의 환불">
        <p>의뢰자의 검수 승인 또는 자동 승인 기한이 도과되어 정산이 완료된 작업은 원칙적으로 환불되지
        않습니다. 다만, 산출물이 의뢰 내용과 명백히 다르거나 전문가의 귀책으로 인한 하자가 확인되는
        경우에는 회사 검토 후 환불 또는 재작업이 결정될 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="4. 월 정기 리테이너 환불">
        <p>월 단위 리테이너 결제는 다음 기준에 따라 환불됩니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>해당 월의 작업이 시작되기 전 해지: 전액 환불</li>
          <li>해당 월의 작업이 일부 수행된 경우: 사용 일수 또는 진행 작업량에 비례하여 일할 환불</li>
          <li>해당 월의 작업이 대부분 완료된 경우: 환불 불가</li>
        </ul>
        <p>리테이너의 자동 갱신은 회원이 갱신일 이전에 언제든지 해지할 수 있으며, 해지 시 다음 회차부터
        결제가 중지됩니다.</p>
      </LegalSection>

      <LegalSection title="5. 분쟁 시 환불">
        <p>의뢰자와 전문가 간 환불에 합의가 이루어지지 않는 경우, 분쟁처리정책에 따라 양 당사자가 제출한
        자료를 검토하여 회사가 환불·재작업·정산 비율을 중재합니다. 회사의 중재 결과는 본 환불정책 및
        관련 법령에 따릅니다.</p>
      </LegalSection>

      <LegalSection title="6. 환불 처리 절차 및 기간">
        <p>환불은 결제 수단과 동일한 방법으로 환급되며, PG사 영업일 기준 3~7일이 소요될 수 있습니다.
        카드 결제의 경우 카드사의 결제 취소·환급 일정에 따라 다소 지연될 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="7. 환불 신청 방법">
        <p>서비스 내 주문 상세 화면의 [환불 요청] 버튼 또는 고객센터
        (<a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a>)
        를 통해 신청할 수 있습니다. 신청 시 주문번호, 사유, 첨부자료를 함께 제출해 주시기 바랍니다.</p>
      </LegalSection>
    </LegalLayout>
  )
}
