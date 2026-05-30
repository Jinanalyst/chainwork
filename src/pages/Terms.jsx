import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'

const EFFECTIVE = '2026년 5월 27일'

export default function Terms() {
  return (
    <LegalLayout eyebrow="이용약관" title="ChainWork 이용약관" effective={EFFECTIVE}>
      <p className="mt-8 text-white/75 leading-relaxed">
        본 약관은 체인 랩스(Chain Labs, 이하 &quot;회사&quot;)가 운영하는 ChainWork 플랫폼(이하 &quot;서비스&quot;)의
        이용과 관련하여 회사와 회원 사이의 권리, 의무 및 책임 사항을 규정합니다. ChainWork는 디자인,
        웹 개발, 마케팅, 콘텐츠 제작, 커뮤니티 운영 등 디지털 전문 서비스를 의뢰자와 프리랜서가
        거래할 수 있도록 연결하는 온라인 매칭 플랫폼입니다.
      </p>

      <LegalSection title="제1조 (목적)">
        <p>본 약관은 회원이 서비스를 이용함에 있어 회사와 회원의 권리·의무 및 책임사항, 기타 필요한
        사항을 규정함을 목적으로 합니다.</p>
      </LegalSection>

      <LegalSection title="제2조 (용어의 정의)">
        <ul className="list-disc list-inside space-y-1">
          <li><strong className="text-white">서비스</strong>: 회사가 제공하는 ChainWork 웹/모바일 매칭 플랫폼.</li>
          <li><strong className="text-white">의뢰자(Hirer)</strong>: 서비스를 통해 프리랜서에게 디지털 작업을 의뢰하고 대금을 지급하는 회원.</li>
          <li><strong className="text-white">전문가(Worker/프리랜서)</strong>: 서비스를 통해 디지털 작업을 수행하고 대금을 수령하는 회원.</li>
          <li><strong className="text-white">작업보호금(Work Protection Payment)</strong>: 의뢰자가 결제한 금액을 회사가 일시 보관하고, 작업 완료 확인 또는 분쟁 해결 후 전문가에게 지급하는 완료기반 정산 구조.</li>
          <li><strong className="text-white">완료기반 정산(Completion-based Payout)</strong>: 의뢰자의 검수 승인, 자동 승인, 또는 분쟁 해결 결과에 따라 정산이 이루어지는 방식.</li>
        </ul>
      </LegalSection>

      <LegalSection title="제3조 (약관의 게시와 개정)">
        <p>회사는 본 약관을 서비스 초기화면 및 푸터에 상시 게시합니다. 회사는 관련 법령을 위배하지 않는
        범위에서 본 약관을 개정할 수 있으며, 개정 시 적용일자 및 사유를 명시하여 최소 7일(회원에게
        불리한 변경의 경우 30일) 전에 공지합니다.</p>
      </LegalSection>

      <LegalSection title="제4조 (회원가입 및 계정)">
        <p>회원은 본인의 정확한 정보를 제공하여야 하며, 타인의 명의·결제수단·지갑 주소를 도용할 수 없습니다.
        회사는 회원이 본 약관, 관련 법령 또는 회사의 운영정책을 위반한 경우 이용을 제한하거나 계정을
        해지할 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="제5조 (서비스의 성격)">
        <p>회사는 의뢰자와 전문가를 연결하는 통신판매중개자로서, 거래의 당사자가 아닙니다. 다만 회사는
        암호화폐 결제 게이트웨이 NowPayments를 통한 USDT·USDC 결제와 작업보호금 보관·정산을 운영하며,
        안전한 거래를 위한 검수 기간, 자동 승인, 분쟁 처리 절차를 제공합니다. 원화(KRW) 결제는 국내
        규제로 인해 현재 지연되고 있습니다.</p>
        <p>서비스에서 거래되는 상품은 디자인, 웹/앱 개발, 마케팅 지원, 콘텐츠 제작, 커뮤니티 운영 등
        디지털 전문 서비스에 한정됩니다. 상품권, 게임머니, 포인트, 코인, 토큰 등 현금성 재화는 거래
        대상으로 일체 취급되지 않습니다(암호화폐는 결제 수단으로만 사용되며, 거래 상품이 아닙니다).</p>
      </LegalSection>

      <LegalSection title="제6조 (결제 및 정산)">
        <p>결제는 암호화폐 결제 게이트웨이 NowPayments를 통해 USDT·USDC 등 암호화폐로 이루어집니다.
        결제 방식은 프로젝트 단위, 마일스톤 단위, 월 정기 리테이너 중에서 선택할 수 있습니다. 원화(KRW)
        결제는 국내 규제로 인해 지연되고 있으며, 자세한 사항은 결제정책에서 정합니다.</p>
        <p>정산은 의뢰자의 검수 승인, 자동 승인 기한 도과, 또는 분쟁 해결 결과에 따라 전문가에게
        이루어집니다. 회사는 서비스 이용 수수료를 정산 시 공제할 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="제7조 (회원의 의무)">
        <ul className="list-disc list-inside space-y-1">
          <li>법령, 본 약관, 회사의 운영정책 및 공지사항을 준수합니다.</li>
          <li>금지서비스 정책에 명시된 서비스(불법, 도박, 성인, 사기, 해킹, 금융사기, 현금성 재화, 가상자산/토큰 판매 등)를 등록하거나 거래하지 않습니다.</li>
          <li>저작권 등 제3자의 권리를 침해하지 않습니다.</li>
          <li>회사의 사전 동의 없이 서비스를 영업·광고 등 상업적 목적으로 무단 이용하지 않습니다.</li>
        </ul>
      </LegalSection>

      <LegalSection title="제8조 (회사의 의무)">
        <p>회사는 안정적인 서비스 제공을 위해 노력하며, 회원의 개인정보를 관련 법령 및 개인정보처리방침에
        따라 보호합니다. 회사는 통신판매중개자의 책임 범위 내에서 결제, 정산, 분쟁 처리 절차를 운영합니다.</p>
      </LegalSection>

      <LegalSection title="제9조 (책임의 제한)">
        <p>회사는 통신판매중개자로서, 의뢰자와 전문가 간의 거래 내용·품질·이행에 대해서는 원칙적으로
        책임지지 않습니다. 다만 회사의 고의 또는 중대한 과실로 인한 손해에 대해서는 관련 법령에 따라
        책임을 부담합니다.</p>
        <p>회사는 천재지변, 통신장애, 정전, 외부 서비스(은행/PG/블록체인 네트워크) 장애 등 회사의
        합리적 통제를 벗어난 사유로 인한 서비스 중단에 대해서는 책임지지 않습니다.</p>
      </LegalSection>

      <LegalSection title="제10조 (환불 및 분쟁)">
        <p>환불은 별도의 환불정책에 따르며, 분쟁은 분쟁처리정책에 따라 처리됩니다. 회사는 양 당사자가
        합리적인 합의에 이를 수 있도록 객관적 자료(채팅 기록, 산출물, 결제내역)를 바탕으로 중재 의견을
        제공합니다.</p>
      </LegalSection>

      <LegalSection title="제11조 (준거법 및 관할)">
        <p>본 약관은 대한민국 법률을 준거법으로 하며, 서비스 이용과 관련하여 발생한 분쟁에 대해서는
        민사소송법에 따른 관할법원을 제1심 법원으로 합니다.</p>
      </LegalSection>

      <LegalSection title="제12조 (문의)">
        <p>약관 및 운영 관련 문의는 <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a> 로 연락 주시기 바랍니다.</p>
      </LegalSection>
    </LegalLayout>
  )
}
