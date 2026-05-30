import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'
import { useT } from '../i18n/index.jsx'

export default function BusinessInfo() {
  const { lang } = useT()
  const rows = lang === 'ko' ? [
    ['상호 (Business Name)', '체인 랩스 (Chain Labs)'],
    ['대표자 (Representative)', '장진우'],
    ['사업자등록번호 (Business Reg. No.)', '382-25-02223'],
    ['통신판매업 신고번호 (Mail-order Reg. No.)', '신고 진행 중 (등록 후 업데이트 예정)'],
    ['업태 / 종목', '정보통신업 / 응용 소프트웨어 개발 및 공급, 전자상거래 중개'],
    ['주소 (Address)', '경기도 성남시 중원구 여수울로 50, 406동 403호'],
    ['고객센터 이메일', 'jangj6091@gmail.com'],
    ['고객센터 전화', '010-8932-8539 (평일 10:00 ~ 18:00)'],
    ['결제대행사 (PG)', '연동 준비 중 (정식 승인 후 KRW 결제 활성화)'],
  ] : [
    ['Business name', 'Chain Labs'],
    ['Representative', 'Jinwoo Jang'],
    ['Business reg. no.', '382-25-02223'],
    ['Mail-order reg. no.', 'Filing in progress (updates after registration)'],
    ['Industry / category', 'Information & communications / application software development & supply, e-commerce brokerage'],
    ['Address', '406-403, 50 Yeosuul-ro, Jungwon-gu, Seongnam-si, Gyeonggi-do, South Korea'],
    ['Support email', 'jangj6091@gmail.com'],
    ['Support phone', '010-8932-8539 (Weekdays 10:00–18:00)'],
    ['Payment gateway (PG)', 'Integration in progress (KRW payments activate after approval)'],
  ]
  const ko = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        본 페이지는 「전자상거래 등에서의 소비자보호에 관한 법률」 및 PG사 심사 요건에 따라 ChainWork
        서비스를 운영하는 사업자 정보를 공개합니다. 통신판매업 신고번호 및 PG 정식 연동은 진행 중이며,
        승인 완료 후 본 페이지가 업데이트됩니다.
      </p>

      <LegalSection title="사업자 기본 정보">
        <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 divide-y divide-white/5">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 px-4 py-3 text-sm">
              <div className="text-white/55 md:col-span-1">{k}</div>
              <div className="text-white md:col-span-2">{v}</div>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="안내">
        <ul className="list-disc list-inside space-y-1">
          <li>현재 결제대행사(PG) 연동을 준비 중이며, 정식 승인 후 KRW 결제가 활성화됩니다.</li>
          <li>통신판매업 신고는 진행 중이며, 신고 완료 시 신고번호를 본 페이지에 게시합니다.</li>
          <li>본 사업자 정보는 등록된 사업자 정보 변경 시 갱신됩니다.</li>
        </ul>
      </LegalSection>

      <LegalSection title="관련 정책">
        <ul className="list-disc list-inside space-y-1">
          <li><a className="text-brand-300 hover:text-white" href="#/terms">이용약관</a></li>
          <li><a className="text-brand-300 hover:text-white" href="#/privacy">개인정보 처리방침</a></li>
          <li><a className="text-brand-300 hover:text-white" href="#/payment-policy">결제정책</a></li>
          <li><a className="text-brand-300 hover:text-white" href="#/refund-policy">환불정책</a></li>
          <li><a className="text-brand-300 hover:text-white" href="#/dispute-policy">분쟁처리정책</a></li>
        </ul>
      </LegalSection>
    </>
  )
  const en = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        This page discloses the business information of the operator running the ChainWork service, in accordance with
        the Act on Consumer Protection in Electronic Commerce and the review requirements of payment gateway (PG)
        providers. The mail-order registration number and full PG integration are in progress, and this page will be
        updated once approval is completed.
      </p>

      <LegalSection title="Basic business information">
        <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 divide-y divide-white/5">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 px-4 py-3 text-sm">
              <div className="text-white/55 md:col-span-1">{k}</div>
              <div className="text-white md:col-span-2">{v}</div>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="Notes">
        <ul className="list-disc list-inside space-y-1">
          <li>Payment gateway (PG) integration is currently in progress, and KRW payments will activate after full approval.</li>
          <li>Mail-order business registration is in progress, and the registration number will be posted on this page once filing is complete.</li>
          <li>This business information is updated whenever the registered business information changes.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Related policies">
        <ul className="list-disc list-inside space-y-1">
          <li><a className="text-brand-300 hover:text-white" href="#/terms">Terms of Service</a></li>
          <li><a className="text-brand-300 hover:text-white" href="#/privacy">Privacy Policy</a></li>
          <li><a className="text-brand-300 hover:text-white" href="#/payment-policy">Payment Policy</a></li>
          <li><a className="text-brand-300 hover:text-white" href="#/refund-policy">Refund Policy</a></li>
          <li><a className="text-brand-300 hover:text-white" href="#/dispute-policy">Dispute Resolution Policy</a></li>
        </ul>
      </LegalSection>
    </>
  )
  return (
    <LegalLayout
      eyebrow={lang === 'ko' ? 'Business Information' : 'Business Information'}
      title={lang === 'ko' ? '사업자 정보' : 'Business information'}
    >
      {lang === 'ko' ? ko : en}
    </LegalLayout>
  )
}
