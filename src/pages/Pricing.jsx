import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'

const items = [
  {
    name: '기업 Pro 멤버십',
    desc: '연 단위 멤버십. 채용 1건당 정액 수수료로 플랫폼 이용료를 통합 처리합니다.',
    price: '₩400,000 / 채용 1건 · 연간',
  },
  {
    name: '프로젝트 등록 수수료',
    desc: '프로젝트 등록 시 발생하는 플랫폼 이용료 (선택형 / 옵션형 게시).',
    price: '무료 ~ ₩50,000',
  },
  {
    name: '플랫폼 이용 수수료',
    desc: '거래 성사 시 결제 금액에서 정률 공제됩니다.',
    price: '결제 금액의 5% ~ 12%',
  },
  {
    name: '월간 파트너 계약 관리',
    desc: '월간 리테이너 계약의 결제·정산 관리 서비스.',
    price: '월 결제 금액의 5%',
  },
  {
    name: '업무 서비스 대금',
    desc: '의뢰자가 전문가에게 지급하는 업무 대금 — 합의된 금액 그대로 결제됩니다.',
    price: '프로젝트에 따라 상이',
  },
  {
    name: '추천 전문가 노출 (Featured Talent)',
    desc: '전문가 프로필을 카테고리 상단에 추천 영역으로 노출.',
    price: '월 ₩99,000',
  },
  {
    name: '비즈니스 매칭 서비스',
    desc: '기업 요구사항에 맞춰 전담 매니저가 후보 전문가를 큐레이션.',
    price: '건당 ₩300,000부터',
  },
]

export default function Pricing() {
  return (
    <LegalLayout eyebrow="Pricing" title="서비스 요금 안내">
      <p className="mt-8 text-white/75 leading-relaxed">
        ChainWork의 요금은 원화(KRW) 기준으로 안내되며, 부가세는 별도입니다. 현재 결제는 암호화폐 결제
        게이트웨이 <strong className="text-white">NowPayments</strong>를 통해 USDC·USDT 등 스테이블코인으로
        진행됩니다. 결제 시점의 환율에 따라 원화 표시 금액에 해당하는 암호화폐 금액이 청구됩니다. 본
        페이지의 요금은 정책 변경에 따라 업데이트될 수 있으며, 변경 시 사전에 공지합니다.
      </p>
      <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100 leading-relaxed not-prose">
        <strong className="text-amber-50">원화(KRW) 결제 안내</strong> — 국내 규제 및 결제대행사(PG) 승인 절차로
        인해 원화 직접 결제는 현재 지연되고 있습니다. 정식 승인이 완료될 때까지는 NowPayments 암호화폐 결제를
        이용해 주시기 바랍니다.
      </div>

      <LegalSection title="요금 항목">
        <div className="mt-4 grid gap-3 not-prose">
          {items.map((it) => (
            <div key={it.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1">
                <div className="text-white font-semibold">{it.name}</div>
                <div className="text-sm font-mono text-accent-200">{it.price}</div>
              </div>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="결제 수단">
        <p>현재 결제는 암호화폐 결제 게이트웨이 NowPayments를 통해 진행됩니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>USDC · USDT 등 주요 스테이블코인</li>
          <li>BTC · ETH 등 NowPayments가 지원하는 암호화폐</li>
          <li>결제 금액은 결제 시점 환율 기준으로 원화 표시 금액에 맞춰 산정</li>
        </ul>
        <p>※ 원화(KRW) 신용카드·계좌이체·간편결제는 국내 규제 및 PG 승인 절차로 인해 현재 지연되고 있으며,
        정식 승인 이후 활성화될 예정입니다. 그때까지는 NowPayments 암호화폐 결제를 이용해 주세요.</p>
      </LegalSection>

      <LegalSection title="환불 및 분쟁">
        <p>요금 결제에 대한 환불은 <a className="text-brand-300 hover:text-white" href="#/refund-policy">환불정책</a>,
        분쟁 처리는 <a className="text-brand-300 hover:text-white" href="#/dispute-policy">분쟁처리정책</a>에 따릅니다.</p>
      </LegalSection>

      <LegalSection title="문의">
        <p>요금 관련 상담은 <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a> 또는 010-8932-8539 로 연락 주시기 바랍니다.</p>
      </LegalSection>
    </LegalLayout>
  )
}
