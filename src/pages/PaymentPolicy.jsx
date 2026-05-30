import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'
import { useT } from '../i18n/index.jsx'

const EFFECTIVE = { ko: '2026년 5월 27일', en: 'May 27, 2026' }

export default function PaymentPolicy() {
  const { lang } = useT()

  const ko = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        ChainWork는 현재 암호화폐 결제 게이트웨이 NowPayments를 통하여 USDT·USDC 스테이블코인 결제를
        제공합니다. 원화(KRW) 결제는 국내 규제 및 결제대행사(PG) 승인 절차로 인해 지연되고 있으며,
        정식 승인 이후 도입될 예정입니다. 본 정책은 결제 수단, 결제 구조, 작업보호금 보관, 정산 절차에
        관한 사항을 안내합니다.
      </p>

      <LegalSection title="1. 결제 수단">
        <p>결제는 암호화폐 결제 게이트웨이 NowPayments를 통해 처리됩니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>USDT · USDC 스테이블코인 (USD 표시 금액 그대로 결제)</li>
          <li>BTC · ETH 등 NowPayments가 지원하는 암호화폐 (결제 시점 시세로 환산)</li>
        </ul>
        <p>※ 원화(KRW) 신용카드·계좌이체·간편결제는 국내 규제 및 PG 승인 절차로 인해 현재 지연되고
        있으며, 정식 승인 이후 활성화될 예정입니다.</p>
      </LegalSection>

      <LegalSection title="2. 결제 구조">
        <p>의뢰자는 작업의 성격에 따라 다음 중 한 가지 방식을 선택할 수 있습니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong className="text-white">프로젝트 단위 결제</strong>: 전체 작업 대금을 한 번에 결제하고, 완료 검수 후 정산.</li>
          <li><strong className="text-white">마일스톤 단위 결제</strong>: 작업을 단계별로 나누어 각 단계 완료 시 결제·정산.</li>
          <li><strong className="text-white">월 정기 리테이너</strong>: 매월 동일 금액을 결제하여 지속적인 작업을 의뢰. 자동 갱신은 언제든지 해지 가능.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. 작업보호금(Work Protection Payment)">
        <p>의뢰자의 결제 대금은 회사가 운영하는 작업보호금 계좌에 일시 보관됩니다. 작업보호금은 다음
        조건이 충족되는 경우에 전문가에게 정산됩니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>의뢰자의 검수 승인</li>
          <li>전문가 산출물 제출 후 자동 승인 기한(기본 7일) 도과</li>
          <li>분쟁 해결 절차의 종료</li>
        </ul>
        <p>작업보호금은 회사가 별도로 관리하며, 회사의 운영자금과 분리하여 보관합니다.</p>
      </LegalSection>

      <LegalSection title="4. 수수료">
        <p>회사는 거래 중개에 대한 수수료를 정산 시 공제할 수 있습니다. 수수료율 및 결제수수료는 서비스
        화면에서 별도로 안내되며, 변경 시 사전에 공지합니다.</p>
      </LegalSection>

      <LegalSection title="5. 정산 절차">
        <p>전문가는 본인 명의의 국내 은행 계좌를 등록하여 정산을 받을 수 있습니다. 정산은 검수 승인 후
        영업일 기준 1~3일 이내에 처리되며, 은행 사정에 따라 지연될 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="6. 영수증 및 세금계산서">
        <p>결제 영수증은 NowPayments를 통해 발급되며, 온체인 트랜잭션 해시로 결제 내역을 확인할 수
        있습니다. 사업자 회원은 정산 내역에 대한 세금계산서 발행을 요청할 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="7. 결제 취소·오류">
        <p>결제 직후 오류·중복 결제 또는 금액 불일치가 발생한 경우 트랜잭션 해시와 함께 즉시 고객센터로
        연락 주시기 바랍니다. 회사는 NowPayments와 협조하여 신속하게 조치합니다.</p>
      </LegalSection>

      <LegalSection title="8. 거래 금지 품목">
        <p>본 서비스에서는 상품권, 게임머니, 포인트, 가상자산(코인/토큰), 현금 환급성 상품 등 현금성
        재화의 거래가 일체 금지됩니다. 자세한 내용은 금지서비스 정책을 참고하시기 바랍니다.</p>
      </LegalSection>
    </>
  )

  const en = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        ChainWork currently provides USDT and USDC stablecoin payments through the cryptocurrency
        payment gateway NowPayments. KRW (Korean won) payments are delayed due to domestic
        regulations and the payment gateway (PG) approval process, and will be introduced after
        official approval. This policy covers payment methods, payment structures, Work Protection
        Payment custody, and settlement procedures.
      </p>

      <LegalSection title="1. Payment Methods">
        <p>Payments are processed through the cryptocurrency payment gateway NowPayments.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>USDT and USDC stablecoins (paid at the USD-denominated amount as is)</li>
          <li>Cryptocurrencies supported by NowPayments such as BTC and ETH (converted at the exchange rate at the time of payment)</li>
        </ul>
        <p>※ KRW (Korean won) credit card, bank transfer, and simple payment methods are currently
        delayed due to domestic regulations and the PG approval process, and will be enabled after
        official approval.</p>
      </LegalSection>

      <LegalSection title="2. Payment Structure">
        <p>The Hirer may choose one of the following methods depending on the nature of the work.</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong className="text-white">Project-based payment</strong>: Pay the entire work amount at once, with settlement after completion review.</li>
          <li><strong className="text-white">Milestone-based payment</strong>: Divide the work into stages, with payment and settlement upon completion of each stage.</li>
          <li><strong className="text-white">Monthly retainer</strong>: Pay the same amount each month to commission continuous work. Auto-renewal can be canceled at any time.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Work Protection Payment">
        <p>The Hirer's payment is temporarily held in a Work Protection Payment account operated by
        the Company. The Work Protection Payment is settled to the Worker when the following
        conditions are met.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Review approval by the Hirer</li>
          <li>Expiry of the auto-approval period (7 days by default) after the Worker submits the deliverables</li>
          <li>Conclusion of the dispute resolution process</li>
        </ul>
        <p>The Work Protection Payment is managed separately by the Company and held apart from the Company's operating funds.</p>
      </LegalSection>

      <LegalSection title="4. Fees">
        <p>The Company may deduct a fee for transaction intermediation at the time of settlement. The
        fee rate and payment fees are provided separately on the service screen, and any changes will
        be announced in advance.</p>
      </LegalSection>

      <LegalSection title="5. Settlement Procedure">
        <p>The Worker may register a domestic bank account in their own name to receive settlement.
        Settlement is processed within 1 to 3 business days after review approval, and may be delayed
        depending on bank circumstances.</p>
      </LegalSection>

      <LegalSection title="6. Receipts and Tax Invoices">
        <p>Payment receipts are issued through NowPayments, and payment details can be verified via
        the on-chain transaction hash. Business members may request the issuance of a tax invoice for
        settlement details.</p>
      </LegalSection>

      <LegalSection title="7. Payment Cancellation and Errors">
        <p>If an error, duplicate payment, or amount mismatch occurs immediately after payment, please
        contact customer support immediately along with the transaction hash. The Company will take
        prompt action in cooperation with NowPayments.</p>
      </LegalSection>

      <LegalSection title="8. Prohibited Transaction Items">
        <p>This service strictly prohibits the trading of cash-equivalent goods such as gift
        certificates, game currency, points, virtual assets (coins/tokens), and cash-refundable
        products. For details, please refer to the Prohibited Services Policy.</p>
      </LegalSection>
    </>
  )

  return (
    <LegalLayout
      eyebrow={lang === 'ko' ? '결제정책' : 'Payment Policy'}
      title={lang === 'ko' ? '결제정책' : 'Payment Policy'}
      effective={EFFECTIVE[lang]}
    >
      {lang === 'ko' ? ko : en}
    </LegalLayout>
  )
}
