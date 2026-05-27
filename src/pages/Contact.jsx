import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'

export default function Contact() {
  return (
    <LegalLayout eyebrow="고객지원" title="문의하기">
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
    </LegalLayout>
  )
}
