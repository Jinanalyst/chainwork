import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'
import { useT } from '../i18n/index.jsx'

const EFFECTIVE = { ko: '2026년 5월 27일', en: 'May 27, 2026' }

export default function Privacy() {
  const { lang } = useT()

  const ko = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        체인 랩스(Chain Labs, 이하 &quot;회사&quot;)는 ChainWork 서비스를 운영함에 있어 회원의 개인정보를
        중요하게 생각하며, 「개인정보 보호법」 및 관련 법령을 준수합니다. 본 처리방침은 회사가 수집하는
        개인정보의 항목, 이용 목적, 보유 기간, 회원의 권리 등을 안내합니다.
      </p>

      <LegalSection title="1. 수집하는 개인정보 항목">
        <p><strong className="text-white">필수 항목</strong>: 이메일, 비밀번호(또는 OAuth/지갑 식별자), 닉네임/실명, 휴대전화번호.</p>
        <p><strong className="text-white">선택 항목</strong>: 프로필 이미지, 자기소개, 포트폴리오 링크, 소셜 핸들, 회사명, 주소.</p>
        <p><strong className="text-white">결제·정산 항목</strong>: PG사를 통한 결제 시 카드사명/카드번호 일부, 거래 식별번호, 정산용 예금주명·계좌번호·은행명, 거래내역.</p>
        <p><strong className="text-white">서비스 이용 과정에서 자동 수집</strong>: IP 주소, 접속 일시, 브라우저/OS 정보, 쿠키, 서비스 이용 기록.</p>
      </LegalSection>

      <LegalSection title="2. 개인정보의 수집 및 이용 목적">
        <ul className="list-disc list-inside space-y-1">
          <li>회원 가입 및 본인 확인, 부정 이용 방지</li>
          <li>의뢰자-전문가 매칭, 작업 의뢰·수행·정산</li>
          <li>결제, 환불, 작업보호금 보관 및 정산</li>
          <li>고객 문의 대응, 공지 및 안내사항 전달</li>
          <li>분쟁 처리 및 법령상 의무 이행</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. 개인정보의 보유 및 이용기간">
        <p>회원 탈퇴 시 지체 없이 파기합니다. 다만 관련 법령에 의해 보존이 필요한 경우 아래와 같이 보관합니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
          <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
          <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
          <li>표시·광고에 관한 기록: 6개월 (전자상거래법)</li>
          <li>접속 로그 등: 3개월 (통신비밀보호법)</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. 개인정보의 제3자 제공">
        <p>회사는 회원의 개인정보를 본 처리방침에서 명시한 범위 내에서 처리하며, 회원의 사전 동의 없이는
        제3자에게 제공하지 않습니다. 단, 다음의 경우 예외로 합니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>회원이 사전에 동의한 경우</li>
          <li>법령에 근거하거나 수사기관의 적법한 요청이 있는 경우</li>
          <li>거래의 이행을 위해 필요한 경우(예: PG사·정산은행에 결제·정산 정보 제공)</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. 개인정보 처리업무의 위탁">
        <ul className="list-disc list-inside space-y-1">
          <li><strong className="text-white">PG사(결제대행)</strong>: 결제 처리 및 환불</li>
          <li><strong className="text-white">Supabase</strong>: 인증, 데이터베이스, 파일 저장</li>
          <li><strong className="text-white">Vercel</strong>: 웹 호스팅 및 CDN</li>
          <li><strong className="text-white">이메일/SMS 발송 대행사</strong>: 안내·인증 메시지 발송</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. 회원의 권리와 행사 방법">
        <p>회원은 언제든지 자신의 개인정보를 조회·수정·삭제하거나 처리정지를 요청할 수 있습니다.
        요청은 서비스 내 프로필 화면 또는 <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a> 로
        가능하며, 회사는 지체 없이 조치합니다.</p>
      </LegalSection>

      <LegalSection title="7. 개인정보의 안전성 확보 조치">
        <p>회사는 개인정보 암호화 전송(TLS), 접근 통제, 권한 분리, 데이터베이스 RLS(행 단위 보안), 접속
        기록 보관 등 기술적·관리적 보호조치를 시행합니다.</p>
      </LegalSection>

      <LegalSection title="8. 개인정보 보호책임자">
        <p>성명: 장진우<br/>이메일: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></p>
      </LegalSection>

      <LegalSection title="9. 처리방침의 변경">
        <p>본 처리방침은 법령·서비스의 변경에 따라 개정될 수 있으며, 개정 시 서비스 내 공지를 통해
        안내합니다.</p>
      </LegalSection>
    </>
  )

  const en = (
    <>
      <p className="mt-8 text-white/75 leading-relaxed">
        In operating the ChainWork service, Chain Labs (the &quot;Company&quot;) values members' personal
        information and complies with the Personal Information Protection Act and related laws. This
        Privacy Policy explains the items of personal information the Company collects, the purposes of
        use, the retention period, members' rights, and more.
      </p>

      <LegalSection title="1. Items of Personal Information Collected">
        <p><strong className="text-white">Mandatory items</strong>: email, password (or OAuth/wallet identifier), nickname/legal name, mobile phone number.</p>
        <p><strong className="text-white">Optional items</strong>: profile image, self-introduction, portfolio links, social handles, company name, address.</p>
        <p><strong className="text-white">Payment and settlement items</strong>: when paying through a PG provider, the card issuer name/partial card number, transaction identifier, account holder name/account number/bank name for settlement, and transaction history.</p>
        <p><strong className="text-white">Automatically collected during use of the Service</strong>: IP address, access date and time, browser/OS information, cookies, and service usage records.</p>
      </LegalSection>

      <LegalSection title="2. Purposes of Collection and Use of Personal Information">
        <ul className="list-disc list-inside space-y-1">
          <li>Membership registration and identity verification, and prevention of fraudulent use</li>
          <li>Hirer-Worker matching, and the commissioning, performance, and settlement of work</li>
          <li>Payment, refunds, and the holding and settlement of Work Protection Payments</li>
          <li>Responding to customer inquiries and delivering notices and announcements</li>
          <li>Dispute handling and fulfillment of statutory obligations</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Retention and Use Period of Personal Information">
        <p>Upon membership withdrawal, personal information is destroyed without delay. However, where retention is required by applicable laws, it is retained as follows.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Records on contracts or withdrawal of offers: 5 years (the E-Commerce Act)</li>
          <li>Records on payment and supply of goods, etc.: 5 years (the E-Commerce Act)</li>
          <li>Records on consumer complaints or dispute handling: 3 years (the E-Commerce Act)</li>
          <li>Records on labeling and advertising: 6 months (the E-Commerce Act)</li>
          <li>Access logs, etc.: 3 months (the Protection of Communications Secrets Act)</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Provision of Personal Information to Third Parties">
        <p>The Company processes members' personal information within the scope specified in this Privacy
        Policy and does not provide it to third parties without the member's prior consent. However, the
        following cases are exceptions.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Where the member has given prior consent</li>
          <li>Where there is a legal basis or a lawful request from an investigative agency</li>
          <li>Where necessary to perform a transaction (e.g., providing payment/settlement information to a PG provider or settlement bank)</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Outsourcing of Personal Information Processing">
        <ul className="list-disc list-inside space-y-1">
          <li><strong className="text-white">PG provider (payment processing)</strong>: payment processing and refunds</li>
          <li><strong className="text-white">Supabase</strong>: authentication, database, file storage</li>
          <li><strong className="text-white">Vercel</strong>: web hosting and CDN</li>
          <li><strong className="text-white">Email/SMS delivery providers</strong>: sending notification and verification messages</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Members' Rights and How to Exercise Them">
        <p>Members may at any time view, modify, or delete their personal information, or request a halt to
        its processing. Requests can be made through the profile screen within the Service or via <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a>,
        and the Company will take action without delay.</p>
      </LegalSection>

      <LegalSection title="7. Measures to Ensure the Security of Personal Information">
        <p>The Company implements technical and administrative protection measures, including encrypted
        transmission of personal information (TLS), access control, separation of privileges, database RLS
        (row-level security), and retention of access logs.</p>
      </LegalSection>

      <LegalSection title="8. Personal Information Protection Officer">
        <p>Name: Jinwoo Jang<br/>Email: <a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></p>
      </LegalSection>

      <LegalSection title="9. Changes to This Privacy Policy">
        <p>This Privacy Policy may be amended in accordance with changes in laws or the Service, and any
        amendment will be announced through a notice within the Service.</p>
      </LegalSection>
    </>
  )

  return (
    <LegalLayout
      eyebrow={lang === 'ko' ? '개인정보 처리방침' : 'Privacy Policy'}
      title={lang === 'ko' ? '개인정보 처리방침' : 'Privacy Policy'}
      effective={EFFECTIVE[lang]}
    >
      {lang === 'ko' ? ko : en}
    </LegalLayout>
  )
}
