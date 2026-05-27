import React from 'react'
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx'

const EFFECTIVE = '2026년 5월 27일'

export default function ProhibitedServices() {
  return (
    <LegalLayout eyebrow="금지서비스 정책" title="금지서비스 정책" effective={EFFECTIVE}>
      <p className="mt-8 text-white/75 leading-relaxed">
        ChainWork는 안전하고 합법적인 디지털 전문 서비스 거래를 위해 다음과 같은 서비스의 등록·거래를
        엄격히 금지합니다. 본 정책에 위반되는 서비스는 사전 통지 없이 삭제될 수 있으며, 회원은 이용
        제한 및 법적 조치를 받을 수 있습니다.
      </p>

      <LegalSection title="1. 법령 위반 서비스">
        <ul className="list-disc list-inside space-y-1">
          <li>대한민국 법령 또는 거래 상대방 국가의 법령에 위반되는 모든 서비스</li>
          <li>마약·총기·위조품·밀수품의 제작·판매·중개</li>
          <li>위조 신분증, 위조 서류 제작</li>
          <li>저작권·상표권 등 타인의 지식재산권을 침해하는 작업</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. 도박 관련 서비스">
        <ul className="list-disc list-inside space-y-1">
          <li>불법 도박 사이트·앱의 제작, 운영, 홍보, 트래픽 유입</li>
          <li>스포츠토토 불법 베팅 사이트 관련 서비스</li>
          <li>도박성 게임의 환전 기능 개발</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. 성인·음란물 관련 서비스">
        <ul className="list-disc list-inside space-y-1">
          <li>성인물·음란물의 제작, 편집, 유통</li>
          <li>불법 성인 사이트의 개발·운영·홍보</li>
          <li>성적 노출이 포함된 콘텐츠 의뢰·제공</li>
          <li>성매매 알선 또는 유사 행위와 관련된 모든 서비스</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. 사기·기만 행위">
        <ul className="list-disc list-inside space-y-1">
          <li>피싱·스미싱 사이트 또는 앱 제작</li>
          <li>가짜 후기·평점 조작, 어뷰징 트래픽 생성</li>
          <li>다단계·폰지 구조의 홍보 자료 제작</li>
          <li>허위·과장 광고의 기획 및 제작</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. 해킹·보안 침해">
        <ul className="list-disc list-inside space-y-1">
          <li>허가 없는 시스템·네트워크·계정 침입 또는 그 도구의 제작·판매</li>
          <li>악성코드, 랜섬웨어, 바이러스, 백도어 제작</li>
          <li>DDoS 등 서비스 거부 공격의 의뢰·수행</li>
          <li>타인의 계정·개인정보 탈취 또는 거래</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. 금융 사기 및 무허가 금융 서비스">
        <ul className="list-disc list-inside space-y-1">
          <li>유사수신, 미신고 투자권유, 비인가 금융상품 홍보</li>
          <li>대포통장·대포폰 거래, 자금세탁 관련 서비스</li>
          <li>신용카드 깡, 휴대폰 소액결제 현금화 관련 서비스</li>
          <li>가짜 거래소·지갑·투자 플랫폼 제작</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. 현금성 재화 및 가상자산 관련 거래">
        <p>ChainWork는 디지털 전문 서비스 매칭 플랫폼이며, 다음과 같은 현금성 재화 및 가상자산 자체의
        거래는 일체 취급하지 않습니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>상품권, 모바일 쿠폰, 백화점·주유 상품권</li>
          <li>게임머니, 게임 아이템, 게임 계정</li>
          <li>각종 포인트, 마일리지, 캐시</li>
          <li>가상자산(코인, 토큰, NFT) 자체의 판매·교환·매매 중개</li>
          <li>ICO/IDO/IEO 등 가상자산의 발행·판매</li>
          <li>현금 환급성이 있는 상품 또는 서비스</li>
        </ul>
        <p>※ 다만, 블록체인 관련 디자인·웹사이트 제작·문서 작성 등 합법적인 디지털 작업 의뢰는 허용됩니다.</p>
      </LegalSection>

      <LegalSection title="8. 기타 금지 행위">
        <ul className="list-disc list-inside space-y-1">
          <li>플랫폼 외부 결제 유도</li>
          <li>타인 사칭, 명예훼손, 차별·혐오 표현</li>
          <li>공공질서 및 미풍양속을 저해하는 모든 서비스</li>
        </ul>
      </LegalSection>

      <LegalSection title="9. 신고 및 조치">
        <p>금지서비스를 발견한 경우 고객센터
        (<a className="text-brand-300 hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a>)
        로 신고해 주시기 바랍니다. 회사는 위반 사항 확인 시 서비스 삭제, 계정 정지, 정산 보류, 수사기관
        통보 등 필요한 조치를 취합니다.</p>
      </LegalSection>
    </LegalLayout>
  )
}
