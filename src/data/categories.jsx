import React from 'react'

/**
 * Canonical category list — used by:
 *   • Home page Categories section
 *   • Talents page filter
 *   • Matching helper
 *
 * Korean labels are primary; English subtitles are kept for filter clarity.
 */
export const CATEGORIES = [
  {
    id: 'web-dev',
    tag: '개발',
    title: '웹/앱 개발',
    blurb: '랜딩 페이지부터 SaaS, 사내 도구까지 — 프론트엔드, 백엔드, 배포, 유지보수.',
    examples: ['랜딩 페이지', 'SaaS MVP', '웹 앱', 'API 연동', '버그 수정', '배포/운영'],
    accent: 'from-brand-400/30 to-brand-500/10',
    icon: <><path d="M16 18l6-6-6-6" /><path d="M8 6l-6 6 6 6" /></>,
  },
  {
    id: 'no-code',
    tag: '노코드',
    title: '노코드 / 웹사이트 빌더',
    blurb: 'Webflow, Framer, WordPress, Shopify 기반의 빠른 사이트 제작 및 운영.',
    examples: ['Webflow 사이트', 'Framer 랜딩', 'WordPress 테마', 'Shopify 스토어', '이메일 도메인', '카페24 셋업'],
    accent: 'from-amber-400/30 to-rose-500/10',
    icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  },
  {
    id: 'ai-automation',
    tag: 'AI',
    title: 'AI 자동화',
    blurb: '고객 응대 챗봇, 문서 요약, 업무 자동화 등 AI 워크플로우 구축.',
    examples: ['AI 챗봇', '문서 RAG', '메일 자동화', '콘텐츠 요약', 'OpenAI API', '리드 수집 봇'],
    accent: 'from-violet-400/30 to-brand-500/10',
    icon: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  },
  {
    id: 'marketing',
    tag: '마케팅',
    title: '마케팅 지원',
    blurb: '퍼포먼스 광고, SEO, 콘텐츠 마케팅, 소셜 채널 운영을 도와줄 전문가.',
    examples: ['네이버 광고', 'Google Ads', 'SEO 진단', '인스타 운영', '뉴스레터', '랜딩 카피'],
    accent: 'from-accent-400/30 to-brand-400/10',
    icon: <><path d="M3 11l16-6v14L3 13v-2z" /><path d="M7 15.5a3 3 0 1 1-2-5.6" /></>,
  },
  {
    id: 'ui-ux',
    tag: '디자인',
    title: 'UI/UX · 브랜드 디자인',
    blurb: '제품 디자인, 브랜드 아이덴티티, 디자인 시스템, 전환율 중심 레이아웃.',
    examples: ['Figma 리디자인', '디자인 시스템', '브랜드 아이덴티티', '로고 패키지', '마케팅 일러스트', '앱 UX'],
    accent: 'from-accent-400/30 to-emerald-500/10',
    icon: <><circle cx="13.5" cy="6.5" r=".8" /><circle cx="17.5" cy="11.5" r=".8" /><circle cx="8.5" cy="7.5" r=".8" /><circle cx="6.5" cy="12.5" r=".8" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.42-4.48-8-10-8z" /></>,
  },
  {
    id: 'content',
    tag: '콘텐츠',
    title: '콘텐츠 · 운영',
    blurb: '카피라이팅, 영상 편집, 번역, 고객 응대, 커뮤니티 운영.',
    examples: ['랜딩 카피', '블로그 시리즈', '영상 편집', '한영 번역', '고객 응대', '커뮤니티 운영'],
    accent: 'from-brand-300/30 to-accent-400/10',
    icon: <><path d="M4 6h16M4 12h10M4 18h7" /></>,
  },
  {
    id: 'writing',
    tag: '글쓰기',
    title: '글쓰기 · 번역',
    blurb: '세일즈 카피, 블로그·뉴스레터, 기술 문서, 다국어 번역과 교정까지.',
    examples: ['세일즈 카피', '블로그 글', '제품 설명', '기술 문서', '한영 번역', '맞춤법 교정'],
    accent: 'from-sky-400/30 to-brand-400/10',
    icon: <><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" /></>,
  },
  {
    id: 'design-graphics',
    tag: '디자인',
    title: '그래픽 · 일러스트',
    blurb: '로고, SNS·광고 배너, 상세페이지, 인포그래픽, 일러스트레이션.',
    examples: ['로고 디자인', '상세페이지', 'SNS 배너', '인포그래픽', '일러스트', '썸네일'],
    accent: 'from-pink-400/30 to-violet-500/10',
    icon: <><circle cx="13.5" cy="6.5" r=".8" /><circle cx="17.5" cy="11.5" r=".8" /><circle cx="8.5" cy="7.5" r=".8" /><circle cx="6.5" cy="12.5" r=".8" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.42-4.48-8-10-8z" /></>,
  },
  {
    id: 'video-motion',
    tag: '영상',
    title: '영상 · 모션그래픽',
    blurb: '숏폼·유튜브 편집, 모션그래픽, 광고 영상, 자막·더빙 작업.',
    examples: ['유튜브 편집', '숏폼/릴스', '모션그래픽', '광고 영상', '자막 작업', '인트로 제작'],
    accent: 'from-rose-400/30 to-amber-500/10',
    icon: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M10 9l5 3-5 3V9z" /></>,
  },
  {
    id: 'data-analytics',
    tag: '데이터',
    title: '데이터 · 분석',
    blurb: '데이터 정제, 대시보드, 스프레드시트 자동화, 리포팅, 크롤링.',
    examples: ['데이터 정제', '대시보드', '엑셀 자동화', '리포팅', '웹 크롤링', 'SQL 쿼리'],
    accent: 'from-emerald-400/30 to-brand-500/10',
    icon: <><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" /><rect x="12" y="7" width="3" height="10" /><rect x="17" y="13" width="3" height="4" /></>,
  },
]

// Used by filter rows that need an explicit "All" option
export const CATEGORIES_WITH_ALL = [
  { id: 'all', title: '전체' },
  ...CATEGORIES.map(({ id, title }) => ({ id, title })),
]

// Quick id → title lookup
export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.title]))
