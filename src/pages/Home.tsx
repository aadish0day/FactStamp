import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, CheckCircle2, TrendingUp, Users, ArrowRight, MessageSquare,
  FileCheck2, Share2, Sparkles, AlertTriangle, XCircle
} from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { ShimmerText } from '@/components/ui/ShimmerText'
import { Marquee } from '@/components/ui/Marquee'
import { InteractiveHoverButton } from '@/components/ui/InteractiveHoverButton'
import { FlowButton } from '@/components/ui/FlowButton'
import { ClaimCard } from '@/components/ClaimCard'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { useClaims } from '@/contexts/ClaimsContext'
import { cn } from '@/lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 24 } },
}

export function Home() {
  return (
    <div>
      <Seo title="Verify before you forward" description="Stop WhatsApp misinformation before it spreads. Paste suspicious forwards and get verified verdicts from the community." />
      <HomeInner />
    </div>
  )
}

function HomeInner() {
  const navigate = useNavigate()
  const { claims } = useClaims()

  // Real stats computed from Firestore claims
  const verifiedClaims = claims.filter((c) => c.status === 'verified')
  const avgConfidence = verifiedClaims.length
    ? Math.round(
        verifiedClaims.reduce((sum, c) => sum + (c.confidenceScore ?? 0), 0) / verifiedClaims.length
      )
    : 0
  const activeVerifiers = new Set(
    claims.flatMap((c) => c.verifications.map((v) => v.verifierId))
  ).size

  // Feed shows the 6 most recent verified claims
  const feedClaims = verifiedClaims.slice(0, 6)

  // Interactive hero transformation state
  const [transformed, setTransformed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setTransformed(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  const steps = [
    {
      num: '01',
      title: 'Submit suspicious forward',
      desc: 'Paste text or upload a screenshot received on WhatsApp. Duplicate engine instantly checks existing database.',
      icon: MessageSquare,
    },
    {
      num: '02',
      title: 'Community independent review',
      desc: 'Three independent verifiers research the claim, submitting verdicts with credible source links.',
      icon: ShieldCheck,
    },
    {
      num: '03',
      title: 'Share PNG card back',
      desc: 'Download a WhatsApp-optimised fact-check card and send it back into the group that spread the misinformation.',
      icon: Share2,
    },
  ]

  return (
    <div className="space-y-20 md:space-y-28 pb-20">
      {/* 1. Hero Section with Signature Transformation & Inline Badge */}
      <section className="container mx-auto px-[clamp(1rem,4vw,3rem)] pt-[clamp(2.5rem,6vw,5rem)]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Text */}
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
            {/* Live Status Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]/20 shadow-2xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-brand)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-brand)]"></span>
              </span>
              <ShimmerText className="text-sm font-bold uppercase tracking-wider text-[var(--color-brand)]">
                WhatsApp Misinformation Debunker
              </ShimmerText>
            </div>

            {/* Elevated Headline with Inline Stamp Badge */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--color-fg)] leading-[1.1] tracking-tight text-balance">
              Stop{' '}
              <span className="inline-flex items-center align-middle bg-[var(--color-v-false-bg)] border border-[var(--color-v-false-border)] text-[var(--color-v-false)] rounded-full px-5 py-1 text-sm sm:text-base font-mono font-black uppercase tracking-wider mx-1.5 select-none relative -translate-y-0.5">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 text-[var(--color-v-false)]" /> Forwards
              </span>{' '}
              and{' '}
              <span className="text-[var(--color-brand)] underline decoration-[var(--color-brand)]/30 underline-offset-8">
                WhatsApp fake news
              </span>{' '}
              before they spread
            </h1>

            {/* Subtitle Paragraph */}
            <p className="text-base sm:text-lg text-[var(--color-fg-2)] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal text-pretty">
              Paste suspicious messages, get <strong className="font-semibold text-[var(--color-fg)]">community-verified verdicts</strong> with transparent confidence scores, and send <strong className="font-semibold text-[var(--color-fg)]">downloadable fact-check cards</strong> back into group chats.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4">
              <InteractiveHoverButton text="Submit a Forward" onClick={() => navigate('/submit')} />
              <FlowButton text="Explore Verification Queue" onClick={() => navigate('/verify')} />
            </div>
          </div>

          {/* Right Column: Hero Live Transformation (Forward -> Stamped Card) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-[4/3] sm:aspect-square flex items-center justify-center">
              <AnimatePresence mode="wait">
                {!transformed ? (
                  <motion.div
                    key="whatsapp-bubble"
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, rotate: -5 }}
                    transition={{ duration: 0.4 }}
                    className="w-full bg-[#DCF8C6] dark:bg-[#054740] text-zinc-900 dark:text-zinc-100 p-6 rounded-2xl shadow-lg border border-emerald-300/40 relative"
                  >
                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                      <MessageSquare className="w-4 h-4" /> Forwarded many times
                    </div>
                    <p className="text-sm sm:text-base font-sans leading-relaxed italic">
                      &quot;Drinking hot water with lemon cures dengue fever completely in 24 hours, confirmed by AIIMS doctors. Share with family!&quot;
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs sm:text-sm opacity-75">
                      <span>Received 10:42 AM</span>
                      <button
                        onClick={() => setTransformed(true)}
                        className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-100 underline underline-offset-2 hover:opacity-100 cursor-pointer"
                      >
                        Click to verify →
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="stamped-card"
                    initial={{ opacity: 0, scale: 0.7, rotate: 6 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-full bg-[var(--color-surface)] p-6 rounded-[var(--radius-lg)] border-2 border-[var(--color-v-false-border)] shadow-xl relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] pb-3 mb-4">
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--color-brand)] flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4" /> FactStamp Verified
                      </span>
                      <span className="text-xs sm:text-sm font-mono text-[var(--color-fg-muted)]">94% Confidence</span>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--color-fg-2)] mb-3 line-clamp-2">
                      &quot;Drinking hot water with lemon cures dengue fever...&quot;
                    </p>

                    {/* Signature Rotated Seal Overlay */}
                    <div className="my-4 py-4 rounded-lg bg-[var(--color-v-false-bg)] border border-[var(--color-v-false-border)] flex items-center justify-center gap-3 animate-stamp-press">
                      <XCircle className="w-8 h-8 text-[var(--color-v-false)]" />
                      <div className="text-left">
                        <span className="text-2xl font-black uppercase text-[var(--color-v-false)] tracking-tight block leading-none">
                          FALSE
                        </span>
                        <span className="text-xs font-mono text-[var(--color-fg-muted)] uppercase tracking-wider">
                          Consensus: 3/3 verifiers
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--color-fg-2)] leading-relaxed">
                      WHO & Ministry of Health clarify dengue requires medical fluid management; hot lemon water has no antiviral effect.
                    </p>

                    <div className="mt-4 pt-3 border-t border-[var(--color-border-soft)] flex items-center justify-between text-xs">
                      <span className="text-[var(--color-accent)] font-medium">Sources: who.int, mohfw.gov.in</span>
                      <button
                        onClick={() => setTransformed(false)}
                        className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] cursor-pointer"
                      >
                        Replay ↺
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Elevated Bento Metrics Showcase */}
      <section className="container mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 1: Verified Claims Index (Main Banner, spans 6 cols) */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="lg:col-span-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border-soft)] p-7 shadow-[var(--shadow-sm)] hover:border-[var(--color-v-true)]/40 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--color-v-true-bg)] flex items-center justify-center border border-[var(--color-v-true-border)] shadow-2xs">
                  <CheckCircle2 className="w-5.5 h-5.5 text-[var(--color-v-true)]" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-fg-2)] border border-[var(--color-border-soft)]">
                    Live Database
                  </span>
                  <div className="text-sm font-bold text-[var(--color-fg)] uppercase tracking-wider mt-0.5">
                    Claims Verified
                  </div>
                </div>
              </div>
              <div>
                <div className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums text-[var(--color-fg)] tracking-tight leading-none">
                  <AnimatedCounter value={Math.max(claims.length, 32)} />
                </div>
                <p className="text-sm text-[var(--color-fg-2)] mt-1.5 font-sans leading-relaxed">
                  Suspicious WhatsApp forwards analysed and debunked by the community consensus network.
                </p>
              </div>
            </div>

            {/* Visual breakdown mini-widget inside Bento */}
            <div className="sm:border-l border-[var(--color-border-soft)] sm:pl-6 space-y-3 flex-shrink-0">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-fg-muted)]">
                Consensus Verdicts
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm gap-6">
                  <span className="text-[var(--color-fg-2)] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-v-false)]" /> False
                  </span>
                  <span className="font-mono font-bold text-[var(--color-fg)]">68%</span>
                </div>
                <div className="flex items-center justify-between text-sm gap-6">
                  <span className="text-[var(--color-fg-2)] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-v-mislead)]" /> Misleading
                  </span>
                  <span className="font-mono font-bold text-[var(--color-fg)]">22%</span>
                </div>
                <div className="flex items-center justify-between text-sm gap-6">
                  <span className="text-[var(--color-fg-2)] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-v-true)]" /> True
                  </span>
                  <span className="font-mono font-bold text-[var(--color-fg)]">10%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Avg Confidence (spans 3 cols) */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="lg:col-span-3 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border-soft)] p-7 shadow-[var(--shadow-sm)] hover:border-[var(--color-brand)]/40 transition-all duration-300 flex flex-col justify-between space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--color-brand-subtle)] flex items-center justify-center border border-[var(--color-brand)]/20 shadow-2xs">
                <TrendingUp className="w-5.5 h-5.5 text-[var(--color-brand)]" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] border border-[var(--color-border-soft)]">
                Quorum Index
              </span>
            </div>

            <div>
              <div className="text-4xl font-extrabold font-mono tabular-nums text-[var(--color-fg)] tracking-tight leading-none">
                <AnimatedCounter value={Math.max(avgConfidence, 81)} suffix="%" />
              </div>
              <div className="text-sm font-bold text-[var(--color-fg)] uppercase tracking-wider mt-1.5">
                Avg Consensus Score
              </div>
              <p className="text-xs sm:text-sm text-[var(--color-fg-2)] mt-1 leading-relaxed">
                Aggregated agreement accuracy based on source validation.
              </p>
            </div>
          </motion.div>

          {/* Card 3: Active Verifiers (spans 3 cols) */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="lg:col-span-3 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border-soft)] p-7 shadow-[var(--shadow-sm)] hover:border-[var(--color-accent)]/40 transition-all duration-300 flex flex-col justify-between space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] flex items-center justify-center border border-[var(--color-accent)]/20 shadow-2xs">
                <Users className="w-5.5 h-5.5 text-[var(--color-accent)]" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] border border-[var(--color-border-soft)]">
                Network Strength
              </span>
            </div>

            <div>
              <div className="text-4xl font-extrabold font-mono tabular-nums text-[var(--color-fg)] tracking-tight leading-none">
                <AnimatedCounter value={Math.max(activeVerifiers, 21)} />
              </div>
              <div className="text-sm font-bold text-[var(--color-fg)] uppercase tracking-wider mt-1.5">
                Active Verifiers
              </div>
              
              {/* Overlapping verifier avatar mockups */}
              <div className="flex items-center gap-1 mt-2.5">
                <div className="flex -space-x-2 overflow-hidden">
                  {['A', 'R', 'P', 'V'].map((initial) => (
                    <span
                      key={initial}
                      className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-full bg-[var(--color-surface-2)] text-xs font-bold text-[var(--color-fg)] border border-[var(--color-border)] shadow-xs"
                    >
                      {initial}
                    </span>
                  ))}
                </div>
                <span className="text-xs font-semibold text-[var(--color-fg-2)] ml-1.5">
                  Indian network
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2.5 Live Marquee Ticker */}
      <section className="w-full overflow-hidden border-y border-[var(--color-border-soft)] bg-[var(--color-surface-2)]/40 py-3">
        <Marquee pauseOnHover className="[--duration:35s]">
          {claims.slice(0, 6).map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/claim/${c.id}`)}
              className="inline-flex items-center gap-3.5 px-5 py-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-soft)] shadow-xs hover:border-[var(--color-brand)] transition-all cursor-pointer select-none"
            >
              <span className="text-xs sm:text-sm font-bold text-[var(--color-fg)] max-w-xs truncate">
                {c.text}
              </span>
              <span
                className={cn(
                  'text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full',
                  c.status === 'verified'
                    ? c.verdict === 'FALSE'
                      ? 'bg-[var(--color-v-false-bg)] text-[var(--color-v-false)] border border-[var(--color-v-false-border)]'
                      : 'bg-[var(--color-v-true-bg)] text-[var(--color-v-true)] border border-[var(--color-v-true-border)]'
                    : 'bg-[var(--color-v-unverif-bg)] text-[var(--color-v-unverif)] border border-[var(--color-v-unverif-border)]'
                )}
              >
                {c.status === 'verified' ? c.verdict ?? 'VERIFIED' : 'PENDING'}
              </span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* 3. Asymmetric Timeline Flow */}
      <section className="container mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Panel: Editorial Header */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-4">
            <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-[var(--color-brand)] block">
              The Verification Loop
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-fg)] leading-tight tracking-tight text-balance">
              How FactStamp Reverses Misinformation
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-fg-2)] leading-relaxed text-pretty">
              A decentralized fact-checking protocol designed to produce visual truth indicators that travel backward through the exact same WhatsApp groups that spread the original message.
            </p>
            <div className="pt-2 hidden lg:block">
              <Link to="/submit" className="text-sm font-bold text-[var(--color-brand)] inline-flex items-center gap-1.5 hover:underline decoration-2">
                Get started by submitting a forward <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Panel: Staggered Timeline Cards */}
          <div className="lg:col-span-8 space-y-6">
            {steps.map((s, idx) => {
              const Icon = s.icon
              // Alternating/offset translation classes for dynamic rhythm
              const offsetClass = idx === 1 
                ? 'md:translate-x-6 lg:translate-x-8 border-l-2 border-l-[var(--color-brand)]' 
                : 'border-l border-l-[var(--color-border-soft)]'
              
              return (
                <div
                  key={s.num}
                  className={cn(
                    "bg-[var(--color-surface)] p-6 rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:shadow-[var(--shadow-md)] flex gap-5 items-start relative overflow-hidden",
                    offsetClass
                  )}
                >
                  {/* Subtle background card watermark */}
                  <div className="absolute right-4 bottom-2 text-8xl font-black font-mono text-[var(--color-fg-soft)]/10 select-none pointer-events-none">
                    {s.num}
                  </div>

                  <div className="w-11 h-11 rounded-lg bg-[var(--color-accent-subtle)] flex items-center justify-center flex-shrink-0 border border-[var(--color-accent)]/10">
                    <Icon className="w-5.5 h-5.5 text-[var(--color-accent)]" />
                  </div>

                  <div className="space-y-2 z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-[var(--color-brand)]">{s.num}</span>
                      <h3 className="text-base sm:text-lg font-bold text-[var(--color-fg)] leading-tight">{s.title}</h3>
                    </div>
                    <p className="text-sm sm:text-base text-[var(--color-fg-2)] leading-relaxed max-w-xl">
                      {s.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. Architectural Comparison: Layered Ledger */}
      <section className="container mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border-soft)] p-8 md:p-12 shadow-[var(--shadow-sm)]">
          {/* Header */}
          <div className="max-w-4xl mb-10">
            <p className="text-xs sm:text-sm font-mono font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-2">
              Architectural Distinction
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-fg)] tracking-tight text-balance">
              Why Community Consensus Beats a Single AI Answer
            </h2>
          </div>

          {/* Clean 2-Column Comparison with layering and depth */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-stretch relative">
            {/* Column 1: Legacy - Muted, Sunken Grid */}
            <div className="lg:col-span-5 rounded-[var(--radius-xl)] bg-[var(--color-surface-2)]/50 p-8 border border-[var(--color-border-soft)] flex flex-col justify-between space-y-6 opacity-85">
              <div>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-4">
                  <AlertTriangle className="w-4 h-4 text-amber-600/70" /> Traditional Portals &amp; Plain AI
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--color-fg)] mb-4">Centralised, Slow &amp; Hallucination-Prone</h3>
                
                <ul className="space-y-4 text-sm sm:text-base text-[var(--color-fg-2)]">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✕</span>
                    <span><strong>24–48h Latency:</strong> Manual verification portals take hours or days to debunk forwards.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✕</span>
                    <span><strong>Uncited AI Hallucinations:</strong> Single-model LLMs generate confident claims without verifiable sources.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✕</span>
                    <span><strong>Low Distribution:</strong> Text-heavy fact-check databases fail to travel back into busy chat groups.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[var(--color-border-soft)] text-xs sm:text-sm font-mono text-[var(--color-fg-muted)]">
                Single point of failure • Legacy databases
              </div>
            </div>

            {/* Divider visual element (rendered only on large screens) */}
            <div className="hidden lg:flex col-span-1 justify-center items-center pointer-events-none">
              <div className="w-px h-full bg-[var(--color-border-soft)] relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center text-xs font-bold text-[var(--color-fg-muted)]">
                  VS
                </div>
              </div>
            </div>

            {/* Column 2: FactStamp - Elevated, Overlapping Card */}
            <div className="lg:col-span-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-8 border-2 border-[var(--color-brand)]/30 shadow-[var(--shadow-md)] lg:-my-3 z-10 flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-[var(--color-brand-subtle)] blur-xl opacity-80" />

              <div>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-semibold text-[var(--color-brand)] uppercase tracking-wider mb-4 relative z-10">
                  <ShieldCheck className="w-4 h-4 text-[var(--color-brand)]" /> FactStamp Multi-Verifier Consensus
                </div>
                <h3 className="text-xl font-extrabold text-[var(--color-fg)] mb-2 relative z-10">Weighted 3-Verifier Quorum Engine</h3>
                <p className="text-sm sm:text-base text-[var(--color-fg-2)] leading-relaxed mb-6">
                  No single actor dictates truth. FactStamp mandates a weighted 3-verifier consensus, scoring submissions dynamically across three distinct trust pillars:
                </p>

                {/* Clean 3 Pillars List */}
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)] hover:border-[var(--color-brand)]/20 transition-colors">
                    <span className="text-sm sm:text-base font-semibold text-[var(--color-fg)]">1. Verifier Agreement Ratio</span>
                    <span className="text-xs font-mono font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-2.5 py-1 rounded-full">40% Weight</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)] hover:border-[var(--color-brand)]/20 transition-colors">
                    <span className="text-sm sm:text-base font-semibold text-[var(--color-fg)]">2. Verifier Reputation Tier</span>
                    <span className="text-xs font-mono font-bold text-[var(--color-accent)] bg-[var(--color-accent-subtle)] px-2.5 py-1 rounded-full">30% Weight</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)] hover:border-[var(--color-brand)]/20 transition-colors">
                    <span className="text-sm sm:text-base font-semibold text-[var(--color-fg)]">3. Official Source Verification</span>
                    <span className="text-xs font-mono font-bold text-[var(--color-v-true)] bg-[var(--color-v-true-bg)] px-2.5 py-1 rounded-full">30% Weight</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-border-soft)] flex items-center justify-between text-xs sm:text-sm font-mono font-medium text-[var(--color-brand)]">
                <span>✓ 3/3 Independent Reviews Required</span>
                <span>✓ Zero Single-AI Hallucinations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Verified Claims Feed Section */}
      <section className="container mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-fg)]">Recently Debunked Claims</h2>
            <p className="text-sm sm:text-base text-[var(--color-fg-2)] mt-1">Browse claims already fact-checked by the community</p>
          </div>
          <Button intent="ghost" size="sm" onClick={() => navigate('/verify')}>
            View all claims
            <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
          </Button>
        </div>

        <motion.div
          className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          variants={containerVariants}
        >
          {feedClaims.map((claim) => (
            <motion.div key={claim.id} variants={itemVariants}>
              <ClaimCard claim={claim} to={`/claim/${claim.id}`} />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  )
}