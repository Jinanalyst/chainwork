import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'
import { useT } from '../i18n/index.jsx'

export default function Contact() {
  const { lang } = useT()
  const ko = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        ChainWork 이용 중 문의사항이 있으시면 아래 채널로 연락해 주시기 바랍니다. 영업일 기준 1~2일 내
        답변 드리도록 노력하고 있습니다.
      </p>

      <LegalSection title="고객센터">
        <p>이메일: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></p>
        <p>전화: 010-8932-8539 (평일 10:00 ~ 18:00, 점심시간 12:30 ~ 13:30 제외)</p>
      </LegalSection>

      <LegalSection title="문의 유형별 안내">
        <ul className="list-disc list-inside space-y-1">
          <li>결제·환불: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></li>
          <li>개인정보: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></li>
          <li>분쟁·신고: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></li>
          <li>제휴·미디어: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></li>
        </ul>
      </LegalSection>

      <LegalSection title="사업자 정보">
        <ul className="list-disc list-inside space-y-1">
          <li>상호: 체인 랩스 (Chain Labs)</li>
          <li>대표자: 장진우</li>
          <li>사업자등록번호: 382-25-02223</li>
          <li>통신판매업 신고번호: 신고 진행 중 (등록 후 업데이트 예정)</li>
          <li>주소: 경기도 성남시 중원구 여수울로 50, 406동 403호</li>
          <li>이메일: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></li>
          <li>전화: 010-8932-8539</li>
        </ul>
      </LegalSection>

      <LegalSection title="우편 문의">
        <p>법적 통지, 서류 송달 등 우편 문의는 위 사업장 주소로 보내주시기 바랍니다.</p>
      </LegalSection>
    </>
  )
  const en = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        If you have any questions while using ChainWork, please contact us through the channels below. We strive to
        respond within 1 to 2 business days.
      </p>

      <LegalSection title="Customer support">
        <p>Email: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></p>
        <p>Phone: 010-8932-8539 (Weekdays 10:00 – 18:00, excluding lunch 12:30 – 13:30)</p>
      </LegalSection>

      <LegalSection title="Inquiries by type">
        <ul className="list-disc list-inside space-y-1">
          <li>Payment / refund: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></li>
          <li>Privacy: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></li>
          <li>Dispute / report: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></li>
          <li>Partnership / media: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></li>
        </ul>
      </LegalSection>

      <LegalSection title="Business information">
        <ul className="list-disc list-inside space-y-1">
          <li>Business name: Chain Labs</li>
          <li>Representative: Jinwoo Jang</li>
          <li>Business reg. no.: 382-25-02223</li>
          <li>Mail-order reg. no.: Filing in progress (updates after registration)</li>
          <li>Address: 406-403, 50 Yeosuul-ro, Jungwon-gu, Seongnam-si, Gyeonggi-do, South Korea</li>
          <li>Email: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></li>
          <li>Phone: 010-8932-8539</li>
        </ul>
      </LegalSection>

      <LegalSection title="Postal inquiries">
        <p>For postal inquiries such as legal notices and document delivery, please send them to the business address above.</p>
      </LegalSection>
    </>
  )
  return (
    <LegalLayout
      eyebrow={lang === 'ko' ? '고객지원' : 'Support'}
      title={lang === 'ko' ? '문의하기' : 'Contact us'}
    >
      {lang === 'ko' ? ko : en}
    </LegalLayout>
  )
}
