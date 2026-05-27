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
]

// Used by filter rows that need an explicit "All" option
export const CATEGORIES_WITH_ALL = [
  { id: 'all', title: '전체' },
  ...CATEGORIES.map(({ id, title }) => ({ id, title })),
]

// Quick id → title lookup
export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.title]))
