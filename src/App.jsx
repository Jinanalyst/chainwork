import React, { useMemo, useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import NativeWalletApp from './components/NativeWalletApp.jsx'
import { LogoMark, Wordmark, Icon, useHashRoute, navigate } from './components/ui.jsx'
import { CATEGORIES as WEB_CATEGORIES } from './data/categories.jsx'
import SignInModal from './components/SignInModal.jsx'
import RoleSelectModal from './components/RoleSelectModal.jsx'
import { useSession, shortAddress, getWalletDisplay, getWalletAddress, handleFor } from './hooks/useSession.js'
import { useProfile } from './hooks/useProfile.js'
import { supabase } from './lib/supabase.js'
import PostTask from './pages/PostTask.jsx'
import WorkerDashboard from './pages/WorkerDashboard.jsx'
import JoinAsWorker from './pages/JoinAsWorker.jsx'
import Talents from './pages/Talents.jsx'
import HirerDashboard from './pages/HirerDashboard.jsx'
import AdminPayments from './pages/AdminPayments.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import RefundPolicy from './pages/RefundPolicy.jsx'
import PaymentPolicy from './pages/PaymentPolicy.jsx'
import ServicePolicy from './pages/ServicePolicy.jsx'
import DisputePolicy from './pages/DisputePolicy.jsx'
import SellerPolicy from './pages/SellerPolicy.jsx'
import ProhibitedServices from './pages/ProhibitedServices.jsx'
import Contact from './pages/Contact.jsx'
import ChainPay from './pages/ChainPay.jsx'
import ProMembershipBadge from './components/ProMembershipBadge.jsx'
import { isCurrentUserAdmin } from './lib/platform.js'
import About from './pages/About.jsx'
import Pricing from './pages/Pricing.jsx'
import Verification from './pages/Verification.jsx'
import BusinessInfo from './pages/BusinessInfo.jsx'
import PayPalTest from './pages/PayPalTest.jsx'

const UserChip = ({ user, onSignOut }) => {
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [copied, setCopied] = useState(false)
  const address = getWalletAddress(user)
  const handle  = handleFor(user)
  const label   = handle || shortAddress(address) || 'Account'
  useEffect(() => {
    if (!user) { setIsAdmin(false); return }
    let cancelled = false
    isCurrentUserAdmin().then((v) => { if (!cancelled) setIsAdmin(v) })
    return () => { cancelled = true }
  }, [user?.id])
  const copyAddress = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] hover:border-white/30 px-3 py-1.5 text-sm"
      >
        <span className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-400 to-accent-400" />
        <span className="text-xs">{label}</span>
        <Icon path={<path d="M6 9l6 6 6-6" />} className="h-3.5 w-3.5 text-white/60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/10 bg-ink-900 shadow-glow z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">Signed in as</div>
              <div className="mt-1 text-sm font-semibold">{handle || 'Account'}</div>
              {address && (
                <button
                  onClick={copyAddress}
                  className="mt-1 w-full text-left group inline-flex items-center justify-between gap-2 font-mono text-[11px] text-white/55 hover:text-white"
                >
                  <span className="truncate">{shortAddress(address)}</span>
                  <span className="text-[10px] text-white/45 group-hover:text-white shrink-0">
                    {copied ? 'Copied' : 'Copy'}
                  </span>
                </button>
              )}
            </div>
            <a href="#/hirer"     onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-white/5">Hirer dashboard</a>
            <a href="#/worker"    onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-white/5">Worker dashboard</a>
            <a href="#/post-task" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-white/5">Post a task</a>
            {isAdmin && (
              <a href="#/admin/payments" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-white/5 border-t border-white/5 text-accent-200">Admin · Payment proofs</a>
            )}
            <button onClick={() => { setOpen(false); onSignOut() }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 border-t border-white/5 text-rose-200">
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const Nav = ({ route, user, onSignIn, onSignOut }) => (
  <header className="sticky top-0 z-50 backdrop-blur-md bg-ink-950/60 border-b border-white/5">
    <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
      <a href="#/" className="flex items-center gap-2">
        <LogoMark className="h-9 w-9" />
        <Wordmark className="text-xl" />
      </a>
      <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
        <a href="#/"          className={'hover:text-white ' + (route === '#/' ? 'text-white' : '')}>홈</a>
        <a href="#/talents"   className={'hover:text-white ' + (route.startsWith('#/talents') ? 'text-white' : '')}>전문가 찾기</a>
        <a href="#/hirer"     className={'hover:text-white ' + ((route.startsWith('#/hirer') || route.startsWith('#/post-task')) ? 'text-white' : '')}>기업 회원</a>
        <a href="#/worker"    className={'hover:text-white ' + (route.startsWith('#/worker') ? 'text-white' : '')}>전문가 회원</a>
        <a href="#/pricing"   className={'hover:text-white ' + (route.startsWith('#/pricing') ? 'text-white' : '')}>요금 안내</a>
        <a href="#/about"     className={'hover:text-white ' + (route.startsWith('#/about') ? 'text-white' : '')}>소개</a>
      </nav>
      <div className="flex items-center gap-3">
        {user ? (
          <UserChip user={user} onSignOut={onSignOut} />
        ) : (
          <>
            <button onClick={onSignIn} className="hidden sm:inline text-sm text-white/80 hover:text-white">로그인</button>
            <button onClick={onSignIn} className="btn-primary !py-2 !px-4 text-sm">시작하기</button>
          </>
        )}
      </div>
    </div>
  </header>
)

const AuthGate = ({ title, sub, onSignIn }) => (
  <section className="py-24">
    <div className="mx-auto max-w-md px-6 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-brand-500/15 border border-brand-400/30 grid place-items-center text-brand-200 mb-6">
        <Icon path={<><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>} className="h-7 w-7" />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-white/65">{sub}</p>
      <button onClick={onSignIn} className="btn-primary mt-8 mx-auto">로그인</button>
      <p className="mt-4 text-xs text-white/45">이메일·LinkedIn 등 다양한 방식으로 로그인할 수 있습니다.</p>
    </div>
  </section>
)

const Hero = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0 grid-overlay pointer-events-none" />
    <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-28 md:pt-28 md:pb-36 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/80 mb-6">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" />
        업무 매칭 플랫폼 · 원화(KRW) 결제 지원 예정
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
        <Wordmark className="text-4xl md:text-6xl lg:text-7xl" />
      </h1>
      <p className="mt-6 text-2xl md:text-3xl font-semibold text-white/90 max-w-3xl mx-auto leading-snug">
        검증된 프리랜서와 <span className="gradient-text">비즈니스 파트너</span>를 연결하세요.
      </p>
      <p className="mt-5 text-base md:text-lg text-white/70 max-w-2xl mx-auto">
        건별 프로젝트, 월간 파트너 계약, 업무 대금 결제를 하나의 플랫폼에서 관리할 수 있습니다.
        디자인, 개발, 마케팅, 콘텐츠, 운영 업무를 안전하게 외주해 보세요.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#/post-task" className="btn-primary">
          프로젝트 등록
          <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
        </a>
        <a href="#categories" className="btn-ghost">카테고리 살펴보기</a>
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-white/50">
        <span className="uppercase tracking-[0.2em]">인기 업무</span>
        {['랜딩 페이지 제작', 'SaaS MVP 개발', 'AI 챗봇 구축', '브랜드 디자인', '퍼포먼스 광고 운영', '월간 콘텐츠 운영'].map((t) => (
          <a key={t} href="#categories" className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 hover:border-white/25 hover:text-white transition">
            {t}
          </a>
        ))}
      </div>
    </div>
  </section>
)

const HowItWorks = () => {
  const steps = [
    { title: '프로젝트 등록', body: '필요한 업무 내용, 일정, 예산을 입력해 프로젝트를 등록합니다.', icon: <><path d="M4 6h16M4 12h10M4 18h7" /></> },
    { title: '전문가/파트너 지원', body: '검증된 프리랜서와 파트너가 제안서를 보내옵니다.', icon: <><path d="M3 6h7v12H3zM14 6h7v8h-7zM14 18h7" /></> },
    { title: '프로필 검토 및 합의', body: '경력, 포트폴리오, 평점을 확인하고 업무 범위를 합의합니다.', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
    { title: '원화(KRW) 결제', body: 'PG사를 통해 신용카드·계좌이체·간편결제로 결제합니다. 금액은 작업보호금으로 보관됩니다.', icon: <><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20" /></> },
    { title: '업무 진행 및 검수', body: '전문가가 업무를 수행하고 산출물을 제출하면 의뢰자가 검수합니다.', icon: <><path d="M5 12l5 5L20 7" /></> },
    { title: '최종 확인 및 정산', body: '검수 승인 또는 자동 승인 후 서비스 정책에 따라 정산이 처리됩니다.', icon: <><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></> },
  ]
  return (
    <section id="how" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">How ChainWork Works</div>
          <h2 className="text-3xl md:text-5xl font-bold">등록 → 매칭 → 검수 → 정산</h2>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            업무 의뢰부터 정산까지 ChainWork가 중간 단계를 안전하게 관리합니다.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={s.title} className="card relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400/30 to-accent-400/30 border border-white/10 flex items-center justify-center text-brand-200">
                  <Icon path={s.icon} className="h-5 w-5" />
                </div>
                <div className="text-xs font-mono text-white/40">0{i + 1}</div>
              </div>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-white/70 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const CATEGORIES = WEB_CATEGORIES

const FILTERS = {
  budget: [
    { id: 'any',  label: 'Any budget' },
    { id: 'lt100', label: 'Under $100' },
    { id: '100-500', label: '$100 – $500' },
    { id: '500-2k', label: '$500 – $2k' },
    { id: 'gt2k', label: '$2k+' },
  ],
  difficulty: [
    { id: 'any',  label: 'Any level' },
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
  ],
  delivery: [
    { id: 'any',  label: 'Any time' },
    { id: '24h',  label: 'Within 24h' },
    { id: '3d',   label: 'Within 3 days' },
    { id: '1w',   label: 'Within 1 week' },
    { id: 'flex', label: 'Flexible' },
  ],
}

const FilterRow = ({ label, options, value, onChange }) => (
  <div className="flex items-center gap-2 min-w-max">
    <span className="text-[11px] uppercase tracking-[0.15em] text-white/40 mr-1">{label}</span>
    {options.map((o) => {
      const active = value === o.id
      return (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={
            'rounded-full px-3 py-1.5 text-xs whitespace-nowrap border transition ' +
            (active
              ? 'bg-white text-ink-950 border-white'
              : 'bg-white/[0.03] text-white/75 border-white/10 hover:border-white/25 hover:text-white')
          }
        >
          {o.label}
        </button>
      )
    })}
  </div>
)

const Categories = () => {
  const [category, setCategory] = useState('all')
  const [budget, setBudget] = useState('any')
  const [difficulty, setDifficulty] = useState('any')
  const [delivery, setDelivery] = useState('any')

  const visible = useMemo(
    () => (category === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.id === category)),
    [category],
  )

  return (
    <section id="categories" className="py-24 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">Categories</div>
          <h2 className="text-3xl md:text-5xl font-bold">Find the right worker for your web task.</h2>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            From landing pages and bug fixes to AI automation and Web3 projects, ChainWork helps you get small digital work done faster.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
          <div className="flex flex-col gap-3">
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <div className="flex items-center gap-2 min-w-max">
                <span className="text-[11px] uppercase tracking-[0.15em] text-white/40 mr-1">Category</span>
                <button
                  type="button"
                  onClick={() => setCategory('all')}
                  className={
                    'rounded-full px-3 py-1.5 text-xs whitespace-nowrap border transition ' +
                    (category === 'all'
                      ? 'bg-white text-ink-950 border-white'
                      : 'bg-white/[0.03] text-white/75 border-white/10 hover:border-white/25 hover:text-white')
                  }
                >
                  All
                </button>
                {CATEGORIES.map((c) => {
                  const active = category === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={
                        'rounded-full px-3 py-1.5 text-xs whitespace-nowrap border transition ' +
                        (active
                          ? 'bg-white text-ink-950 border-white'
                          : 'bg-white/[0.03] text-white/75 border-white/10 hover:border-white/25 hover:text-white')
                      }
                    >
                      {c.title}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <FilterRow label="Budget" options={FILTERS.budget} value={budget} onChange={setBudget} />
            </div>
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <FilterRow label="Difficulty" options={FILTERS.difficulty} value={difficulty} onChange={setDifficulty} />
            </div>
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <FilterRow label="Delivery" options={FILTERS.delivery} value={delivery} onChange={setDelivery} />
            </div>
          </div>
        </div>

        {/* Category cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((c) => (
            <div key={c.id} className="card flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${c.accent} border border-white/10 flex items-center justify-center text-white`}>
                  <Icon path={c.icon} className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 border border-white/10 rounded-full px-2 py-0.5">
                  {c.tag}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-white/65 leading-relaxed">{c.blurb}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {c.examples.map((e) => (
                  <li key={e} className="text-[11px] text-white/75 bg-white/[0.04] border border-white/10 rounded-full px-2 py-1">
                    {e}
                  </li>
                ))}
              </ul>
              <a href="#/post-task" className="btn-primary mt-6 !py-2.5 !px-5 text-sm self-start">
                Post a task
                <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const Trust = () => (
  <section className="py-20">
    <div className="mx-auto max-w-7xl px-6">
      <div className="text-center mb-10">
        <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">신뢰 요소</div>
        <h2 className="text-2xl md:text-4xl font-bold">안심하고 외주할 수 있는 이유</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['검증된 프로필', '본인 인증, 사업자 인증, 포트폴리오 검토를 통과한 회원'],
          ['명확한 업무 범위', '합의된 산출물·일정·금액을 시스템에 기록'],
          ['투명한 요금', '모든 수수료는 사전 공지 — 숨겨진 비용 없음'],
          ['환불·분쟁 정책', '단계별 환불 기준과 객관적 자료 기반의 분쟁 처리'],
          ['고객 지원', '평일 10:00 ~ 18:00 운영 · 이메일 · 전화'],
          ['사업자 정보 공개', '상호, 대표자, 사업자등록번호, 주소를 상시 공개'],
          ['안전한 KRW 결제', '결제대행사(PG)를 통한 신용카드·계좌이체·간편결제'],
          ['작업보호금 보관', '검수 승인 또는 분쟁 해결 시까지 대금을 별도 보관'],
        ].map(([k, v]) => (
          <div key={k} className="card">
            <div className="text-sm font-semibold text-white">{k}</div>
            <div className="text-xs text-white/60 mt-1 leading-relaxed">{v}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

const TwoSides = () => (
  <section className="py-24">
    <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-8">
      <div id="talent" className="card p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.2em] text-brand-300 mb-3">기업 회원</div>
          <h3 className="text-3xl font-bold">프로젝트 등록 후 몇 분 안에 제안서를 받아보세요.</h3>
          <ul className="mt-6 space-y-3 text-white/80">
            {[
              '필요한 업무를 설명하면 검증된 전문가를 매칭',
              '가격·일정·평점을 한눈에 비교',
              '월간 파트너 계약으로 장기 협업도 안정적으로 관리',
              '원화(KRW) 결제 · 작업보호금으로 안전 보관',
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Icon path={<path d="M5 12l5 5L20 7" />} className="h-5 w-5 text-accent-400 shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#/post-task" className="btn-primary">프로젝트 등록</a>
            <a href="#/hirer" className="btn-ghost">기업 대시보드</a>
          </div>
        </div>
      </div>
      <div id="work" className="card p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">전문가 회원</div>
          <h3 className="text-3xl font-bold">자신 있는 분야의 업무를 골라 안정적으로 수익을 만드세요.</h3>
          <ul className="mt-6 space-y-3 text-white/80">
            {[
              '디자인·개발·AI·마케팅·콘텐츠·운영 등 다양한 카테고리',
              '경쟁 입찰 없이 핵심 제안서만 전달',
              '평판이 누적되어 다음 프로젝트로 이어짐',
              '검수 승인 후 원화로 빠르게 정산',
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Icon path={<path d="M5 12l5 5L20 7" />} className="h-5 w-5 text-accent-400 shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <a href="#/join-as-worker" className="btn-ghost mt-8">전문가로 가입</a>
        </div>
      </div>
    </div>
  </section>
)

const Payments = () => {
  const structures = [
    {
      key: 'completion',
      pill: '가장 많이 선택',
      title: '완료기반 정산',
      blurb: '결제 금액 전액을 작업보호금으로 보관한 뒤, 의뢰자가 검수 승인하면 정산됩니다.',
      bullets: [
        '의뢰자는 산출물 확인 후 지급 — 위험 최소화',
        '명확한 업무 범위의 단건 프로젝트에 적합',
        '전문가는 결제 완료 상태를 사전에 확인 가능',
      ],
      accent: 'from-brand-400/30 to-brand-500/10',
      icon: <><path d="M5 12l5 5L20 7" /></>,
    },
    {
      key: 'milestone',
      title: '마일스톤 정산',
      blurb: '작업을 단계별로 나누어 각 단계 완료 시 결제·정산합니다. 장기 프로젝트에 권장.',
      bullets: [
        '단계별 검수 — 양측의 부담 분산',
        '대규모 프로젝트의 진행 가시성 확보',
        '단계별 변경 사항을 합의로 관리',
      ],
      accent: 'from-accent-400/30 to-accent-500/10',
      icon: <><path d="M3 12h18M12 3v18" /></>,
    },
    {
      key: 'retainer',
      title: '월간 파트너 계약',
      blurb: '매월 동일 금액으로 지속적인 업무를 의뢰하는 리테이너 계약. 갱신 전 언제든 해지 가능.',
      bullets: [
        '장기 협업 파트너십 관리',
        '월별 업무 보고 및 정산 자동화',
        '월 단위 일할 환불 정책 적용',
      ],
      accent: 'from-emerald-400/30 to-brand-500/10',
      icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    },
  ]

  return (
    <section id="payments" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">결제 구조</div>
          <h2 className="text-3xl md:text-5xl font-bold">원화(KRW) 결제 · 작업보호금 보관</h2>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            결제대행사(PG)를 통한 신용카드, 계좌이체, 간편결제를 지원하며, 결제 금액은 검수 승인 또는
            분쟁 해결 시까지 작업보호금으로 안전하게 보관됩니다.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {structures.map((s) => (
            <div key={s.key} className="card relative overflow-hidden">
              {s.pill && (
                <span className="absolute top-5 right-5 inline-flex items-center rounded-full bg-accent-500/20 border border-accent-500/40 text-accent-200 text-[10px] font-semibold tracking-wider px-2 py-0.5">
                  {s.pill}
                </span>
              )}
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${s.accent} border border-white/10 flex items-center justify-center text-white mb-4`}>
                <Icon path={s.icon} className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{s.blurb}</p>
              <ul className="mt-5 space-y-2">
                {s.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-white/80">
                    <Icon path={<path d="M5 12l5 5L20 7" />} className="h-4 w-4 text-accent-400 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center text-xs text-white/45">
          ※ 결제대행사(PG) 연동을 준비 중입니다. 정식 승인 이후 KRW 결제가 활성화됩니다. 자세한 요금은{' '}
          <a href="#/pricing" className="text-brand-300 hover:text-white">요금 안내</a>를 참고해 주세요.
        </div>
      </div>
    </section>
  )
}

const CTA = () => {
  const PRICE_PER_HIRE_KRW = 400000
  const MIN_HIRES = 1
  const MAX_HIRES = 100
  const [hires, setHires] = useState(5)
  const { user } = useSession()
  const total = hires * PRICE_PER_HIRE_KRW
  const percent = ((hires - MIN_HIRES) / (MAX_HIRES - MIN_HIRES)) * 100
  const fmt = (n) => '₩' + n.toLocaleString('ko-KR')

  return (
    <section id="pro" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-700/40 via-ink-800 to-accent-600/30 p-8 md:p-14">
          <div className="absolute inset-0 grid-overlay opacity-50" />
          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-400/40 bg-accent-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent-200">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-300" />
                기업 Pro 멤버십
              </div>
              <h2 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">
                더 많이 채용, <span className="bg-gradient-to-r from-brand-300 to-accent-300 bg-clip-text text-transparent">더 합리적으로</span>.
              </h2>
              <p className="mt-4 text-white/75 max-w-lg">
                ChainWork Pro는 연간 채용이 많은 팀을 위한 멤버십입니다. 건별 플랫폼 수수료 대신, 채용
                1건당 <span className="text-white font-semibold">₩400,000</span>의 정액 요금으로 연간 결제합니다.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-white/75">
                {[
                  '채용 1건당 정액 — 건별 플랫폼 수수료 부담 해소',
                  '검증된 전문가 우선 매칭 및 빠른 정산',
                  '전담 매니저의 분쟁 패스트트랙 지원',
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <Icon path={<path d="M5 12l5 5L20 7" />} className="h-4 w-4 text-accent-300 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {user && (
                <div className="mt-6">
                  <ProMembershipBadge />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-ink-900/70 backdrop-blur p-6 md:p-8">
              <div className="flex items-baseline justify-between">
                <div className="text-xs uppercase tracking-[0.2em] text-white/50">연간 채용 예상 인원</div>
                <div className="font-mono text-2xl font-bold tabular-nums">{hires}</div>
              </div>

              <div className="mt-4">
                <input
                  type="range"
                  min={MIN_HIRES}
                  max={MAX_HIRES}
                  step={1}
                  value={hires}
                  onChange={(e) => setHires(Number(e.target.value))}
                  className="cw-range w-full"
                  style={{ '--cw-range-fill': `${percent}%` }}
                  aria-label="연간 채용 인원"
                />
                <div className="mt-2 flex justify-between text-[11px] text-white/40 font-mono">
                  <span>{MIN_HIRES}</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>{MAX_HIRES}+</span>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>{hires} × ₩400,000 / 년</span>
                  <span className="font-mono tabular-nums">{fmt(total)}</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/50">연간 멤버십</span>
                  <span className="font-mono text-3xl md:text-4xl font-bold tabular-nums bg-gradient-to-r from-brand-300 to-accent-300 bg-clip-text text-transparent">
                    {fmt(total)}
                  </span>
                </div>
                <div className="mt-3 text-[11px] text-white/45">부가세(VAT) 별도</div>
              </div>

              <a href="#/pricing" className="btn-primary mt-6 w-full justify-center">
                요금 안내 보기
              </a>
              <p className="mt-3 text-center text-xs text-white/45">
                결제대행사(PG) 연동 준비 중 · 정식 승인 이후 KRW 결제 활성화
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const Footer = () => (
  <footer className="border-t border-white/5 py-12">
    <div className="mx-auto max-w-7xl px-6 flex flex-col gap-6 text-sm text-white/50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <LogoMark className="h-6 w-6" />
          <span>© {new Date().getFullYear()} <Wordmark className="text-sm" /></span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs md:text-sm">
          <a href="#/about" className="hover:text-white">소개</a>
          <a href="#/pricing" className="hover:text-white">요금 안내</a>
          <a href="#/verification" className="hover:text-white">전문가 검증</a>
          <a href="#/terms" className="hover:text-white">이용약관</a>
          <a href="#/privacy" className="hover:text-white">개인정보처리방침</a>
          <a href="#/payment-policy" className="hover:text-white">결제정책</a>
          <a href="#/refund-policy" className="hover:text-white">환불정책</a>
          <a href="#/dispute-policy" className="hover:text-white">분쟁처리</a>
          <a href="#/service-policy" className="hover:text-white">서비스정책</a>
          <a href="#/seller-policy" className="hover:text-white">판매자정책</a>
          <a href="#/prohibited-services" className="hover:text-white">금지서비스</a>
          <a href="#/business-info" className="hover:text-white">사업자정보</a>
          <a href="#/contact" className="hover:text-white">고객지원</a>
        </nav>
      </div>
      <div className="border-t border-white/5 pt-4 grid gap-1 text-xs text-white/40 leading-relaxed">
        <p>
          <span className="text-white/60">상호</span> 체인 랩스 (Chain Labs) ·
          <span className="text-white/60"> 대표</span> 장진우 ·
          <span className="text-white/60"> 사업자등록번호</span> 382-25-02223
        </p>
        <p>
          <span className="text-white/60">통신판매업 신고번호</span> 신고 진행 중 (등록 후 업데이트 예정)
        </p>
        <p>
          <span className="text-white/60">주소</span> 경기도 성남시 중원구 여수울로 50, 406동 403호
        </p>
        <p>
          <span className="text-white/60">고객센터</span>{' '}
          <a href="mailto:jangj6091@gmail.com" className="hover:text-white">jangj6091@gmail.com</a>{' '}
          · <span className="text-white/60">전화</span> 010-8932-8539 (평일 10:00~18:00)
        </p>
        <p className="text-white/35 mt-2">
          ChainWork는 기업과 프리랜서·파트너를 연결하는 업무 매칭 플랫폼이며, 통신판매중개자로서 거래의
          당사자가 아닙니다. 결제대행사(PG) 연동을 준비 중이며, 정식 승인 이후 KRW 결제가 활성화됩니다.
        </p>
      </div>
    </div>
  </footer>
)

const Home = () => (
  <>
    <Hero />
    <Categories />
    <HowItWorks />
    <Trust />
    <TwoSides />
    <Payments />
    <CTA />
  </>
)

export default function App() {
  // Inside the installed ChainPay APK we bypass the entire ChainWork web app
  // (no marketing pages, no Supabase session needed) and boot straight into
  // the self-custodial wallet.
  if (Capacitor.isNativePlatform()) return <NativeWalletApp/>

  const route = useHashRoute()
  const { user, loading } = useSession()
  const { profile, loading: profileLoading } = useProfile()
  const [signInOpen, setSignInOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)

  // First-time picker: open once after sign-in when the profile row has no
  // role_chosen_at. Doesn't block any routes — modal renders on top.
  useEffect(() => {
    if (!user || profileLoading) { setRoleModalOpen(false); return }
    setRoleModalOpen(!profile?.role_chosen_at)
  }, [user, profile, profileLoading])

  const openSignIn  = () => setSignInOpen(true)
  const closeSignIn = () => setSignInOpen(false)
  const signOut = () => {
    // Order matters. We wipe persisted session synchronously BEFORE asking
    // Supabase to sign out — otherwise autoRefreshToken can race the wipe
    // and re-persist a fresh token under the same storage key, leaving the
    // user "auto-signed-in to the wallet" the moment the page reloads.
    if (typeof window !== 'undefined') {
      try {
        for (const storage of [window.localStorage, window.sessionStorage]) {
          const remove = []
          for (let i = 0; i < storage.length; i++) {
            const k = storage.key(i)
            if (k && (/^sb-/.test(k) || k.startsWith('chainwork.') || k.includes('supabase'))) {
              remove.push(k)
            }
          }
          for (const k of remove) { try { storage.removeItem(k) } catch {} }
        }
        // Best-effort IndexedDB cleanup in case the SDK ever switches.
        if (window.indexedDB?.databases) {
          window.indexedDB.databases().then((dbs) => {
            for (const db of dbs || []) {
              if (db.name && /supabase|gotrue/i.test(db.name)) {
                try { window.indexedDB.deleteDatabase(db.name) } catch {}
              }
            }
          }).catch(() => {})
        }
      } catch {}
    }

    // Fire-and-forget server-side revocation. Do NOT await — async failures
    // (offline, slow auth API) must never block the navigation below.
    if (supabase) {
      try { supabase.auth.signOut({ scope: 'local' }) } catch {}
      try { supabase.auth.signOut() } catch {}
    }

    // Hard-navigate to root. This drops any leftover OAuth fragments in the
    // URL (?code=…, #access_token=…) so detectSessionInUrl can't re-auth on
    // load, and starts the React tree completely cold.
    if (typeof window !== 'undefined') {
      window.location.href = window.location.origin + window.location.pathname
    }
  }

  // Onboarding routes render their own minimal chrome — hide the global nav/footer.
  const isOnboarding =
    route.startsWith('#/post-task') || route.startsWith('#/join-as-worker')
  const needsAuth = isOnboarding || route.startsWith('#/worker') || route.startsWith('#/hirer') || route.startsWith('#/admin')

  let page
  if (route.startsWith('#/about')) {
    page = <About />
  } else if (route.startsWith('#/pricing')) {
    page = <Pricing />
  } else if (route.startsWith('#/verification')) {
    page = <Verification />
  } else if (route.startsWith('#/business-info')) {
    page = <BusinessInfo />
  } else if (route.startsWith('#/paypal-test')) {
    page = <PayPalTest />
  } else if (route.startsWith('#/privacy')) {
    page = <Privacy />
  } else if (route.startsWith('#/terms')) {
    page = <Terms />
  } else if (route.startsWith('#/refund-policy')) {
    page = <RefundPolicy />
  } else if (route.startsWith('#/payment-policy')) {
    page = <PaymentPolicy />
  } else if (route.startsWith('#/service-policy')) {
    page = <ServicePolicy />
  } else if (route.startsWith('#/dispute-policy')) {
    page = <DisputePolicy />
  } else if (route.startsWith('#/seller-policy')) {
    page = <SellerPolicy />
  } else if (route.startsWith('#/prohibited-services')) {
    page = <ProhibitedServices />
  } else if (route.startsWith('#/contact')) {
    page = <Contact />
  } else if (route.startsWith('#/pay')) {
    page = <ChainPay />
  } else if (route.startsWith('#/talents')) {
    page = <Talents />
  } else if (route.startsWith('#/admin/payments')) {
    page = user
      ? <AdminPayments />
      : <AuthGate title="Sign in to access admin" sub="Admin tools require a signed-in account flagged as admin." onSignIn={openSignIn} />
  } else if (route.startsWith('#/hirer')) {
    page = user
      ? <HirerDashboard />
      : <AuthGate title="Sign in to open your hirer dashboard" sub="Your posted tasks, escrow, and chats with workers live behind your wallet." onSignIn={openSignIn} />
  } else if (route.startsWith('#/post-task')) {
    page = user
      ? <PostTask />
      : <AuthGate title="Sign in to post a task" sub="Connect a wallet to keep your tasks, offers, and escrow safe." onSignIn={openSignIn} />
  } else if (route.startsWith('#/join-as-worker')) {
    page = user
      ? <JoinAsWorker />
      : <AuthGate title="Sign in to join as a worker" sub="Connect a wallet so your portfolio and earnings stay yours." onSignIn={openSignIn} />
  } else if (route.startsWith('#/worker')) {
    page = user
      ? <WorkerDashboard />
      : <AuthGate title="Sign in to open your dashboard" sub="Your portfolio, earnings, and active tasks live behind your wallet." onSignIn={openSignIn} />
  } else {
    page = <Home />
  }

  // ChainPay renders its own brand chrome (logo + topbar), so hide the global Nav/Footer.
  const isStandalone = route.startsWith('#/pay')
  const showChrome = !isStandalone && (!isOnboarding || !user)

  return (
    <div className="min-h-screen flex flex-col">
      {showChrome && <Nav route={route} user={user} onSignIn={openSignIn} onSignOut={signOut} />}
      <main className="flex-1">
        {needsAuth && loading && !user ? (
          <div className="py-24 text-center text-white/50 text-sm">Loading…</div>
        ) : page}
      </main>
      {showChrome && <Footer />}
      <SignInModal open={signInOpen} onClose={closeSignIn} onSignedIn={() => closeSignIn()} />
      <RoleSelectModal open={roleModalOpen} onClose={() => setRoleModalOpen(false)} />
    </div>
  )
}
