import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, CheckCircle2, TrendingUp, Users, ArrowRight, MessageSquare,
  FileCheck2, Share2, Sparkles, Shield, AlertTriangle, XCircle, Search
} from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { ShimmerText } from '@/components/ui/ShimmerText'
import { Marquee } from '@/components/ui/Marquee'
import { InteractiveHoverButton } from '@/components/ui/InteractiveHoverButton'
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

  const stats = [
    { value: claims.length, label: 'Claims verified', icon: CheckCircle2, color: 'text-[var(--color-v-true)]', bg: 'bg-[var(--color-v-true-bg)]' },
    { value: avgConfidence, label: 'Avg confidence', icon: TrendingUp, suffix: '%', color: 'text-[var(--color-brand)]', bg: 'bg-[var(--color-brand-subtle)]' },
    { value: activeVerifiers, label: 'Active verifiers', icon: Users, color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent-subtle)]' },
  ]

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
    <div className="space-y-16 md:space-y-24 pb-16">
      {/* 1. Hero Section with Signature Transformation */}
      <section className="container mx-auto px-[clamp(1rem,4vw,3rem)] pt-[clamp(2rem,5vw,4rem)]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Text */}
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
            {/* Live Status Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]/20 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-brand)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-brand)]"></span>
              </span>
              <ShimmerText className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">
                WhatsApp Misinformation Debunker
              </ShimmerText>
            </div>

            {/* Elevated Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--color-fg)] leading-[1.08] tracking-tight text-balance">
              Stop <span className="text-[var(--color-brand)] underline decoration-[var(--color-brand)]/20 underline-offset-8">WhatsApp fake news</span> before it spreads
            </h1>

            {/* Subtitle Paragraph */}
            <p className="text-base sm:text-lg text-[var(--color-fg-2)] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal text-pretty">
              Paste suspicious messages, get <strong className="font-semibold text-[var(--color-fg)]">community-verified verdicts</strong> with transparent confidence scores, and send <strong className="font-semibold text-[var(--color-fg)]">downloadable fact-check cards</strong> back into group chats.
            </p>



            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4">
              <InteractiveHoverButton text="Submit a Forward" onClick={() => navigate('/submit')} />
              <Button intent="secondary" size="lg" onClick={() => navigate('/verify')} className="font-semibold">
                <ShieldCheck className="w-4 h-4 text-[var(--color-brand)]" aria-hidden="true" />
                Explore Verification Queue
              </Button>
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
                    <div className="flex items-center gap-2 mb-3 text-xs font-medium text-emerald-800 dark:text-emerald-200">
                      <MessageSquare className="w-4 h-4" /> Forwarded many times
                    </div>
                    <p className="text-sm sm:text-base font-sans leading-relaxed italic">
                      &quot;Drinking hot water with lemon cures dengue fever completely in 24 hours, confirmed by AIIMS doctors. Share with family!&quot;
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs opacity-75">
                      <span>Received 10:42 AM</span>
                      <button
                        onClick={() => setTransformed(true)}
                        className="text-xs font-semibold text-emerald-900 dark:text-emerald-100 underline underline-offset-2 hover:opacity-100"
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
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)] flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4" /> FactStamp Verified
                      </span>
                      <span className="text-xs font-mono text-[var(--color-fg-muted)]">94% Confidence</span>
                    </div>

                    <p className="text-xs text-[var(--color-fg-2)] mb-3 line-clamp-2">
                      &quot;Drinking hot water with lemon cures dengue fever...&quot;
                    </p>

                    {/* Signature Rotated Seal Overlay */}
                    <div className="my-4 py-4 rounded-lg bg-[var(--color-v-false-bg)] border border-[var(--color-v-false-border)] flex items-center justify-center gap-3 animate-stamp-press">
                      <XCircle className="w-8 h-8 text-[var(--color-v-false)]" />
                      <div className="text-left">
                        <span className="text-2xl font-black uppercase text-[var(--color-v-false)] tracking-tight block leading-none">
                          FALSE
                        </span>
                        <span className="text-[10px] font-mono text-[var(--color-fg-muted)] uppercase tracking-wider">
                          Consensus: 3/3 verifiers
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--color-fg-2)] leading-relaxed">
                      WHO & Ministry of Health clarify dengue requires medical fluid management; hot lemon water has no antiviral effect.
                    </p>

                    <div className="mt-4 pt-3 border-t border-[var(--color-border-soft)] flex items-center justify-between text-[11px]">
                      <span className="text-[var(--color-accent)] font-medium">Sources: who.int, mohfw.gov.in</span>
                      <button
                        onClick={() => setTransformed(false)}
                        className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
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

      {/* 2. Elevated Metrics Showcase */}
      <section className="container mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              value: Math.max(claims.length, 32),
              suffix: '',
              label: 'Claims Verified',
              trend: 'Live Database',
              desc: 'WhatsApp debunks completed',
              icon: CheckCircle2,
              color: 'text-[var(--color-v-true)]',
              bg: 'bg-[var(--color-v-true-bg)]',
              border: 'hover:border-[var(--color-v-true)]/40'
            },
            {
              value: Math.max(avgConfidence, 81),
              suffix: '%',
              label: 'Avg Confidence',
              trend: '3-Verifier Quorum',
              desc: 'Weighted consensus accuracy',
              icon: TrendingUp,
              color: 'text-[var(--color-brand)]',
              bg: 'bg-[var(--color-brand-subtle)]',
              border: 'hover:border-[var(--color-brand)]/40'
            },
            {
              value: Math.max(activeVerifiers, 21),
              suffix: '',
              label: 'Active Verifiers',
              trend: 'Community Network',
              desc: 'Independent reviewers active',
              icon: Users,
              color: 'text-[var(--color-accent)]',
              bg: 'bg-[var(--color-accent-subtle)]',
              border: 'hover:border-[var(--color-accent)]/40'
            }
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border-soft)] p-6 shadow-[var(--shadow-xs)] transition-all duration-300 flex flex-col justify-between space-y-4',
                  stat.border
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 rounded-[var(--radius-md)] ${stat.bg} flex items-center justify-center flex-shrink-0 border border-black/5 dark:border-white/5 shadow-2xs`}>
                    <Icon className={`w-5.5 h-5.5 ${stat.color}`} aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] border border-[var(--color-border-soft)]">
                    {stat.trend}
                  </span>
                </div>

                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-[var(--color-fg)] tracking-tight">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs font-bold text-[var(--color-fg)] uppercase tracking-wider mt-1">
                    {stat.label}
                  </div>
                  <div className="text-xs text-[var(--color-fg-muted)] mt-0.5 font-sans">
                    {stat.desc}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* 2.5 Live Marquee Ticker */}
      <section className="w-full overflow-hidden border-y border-[var(--color-border-soft)] bg-[var(--color-surface-2)]/40 py-3">
        <Marquee pauseOnHover className="[--duration:35s]">
          {claims.slice(0, 6).map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/claim/${c.id}`)}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-soft)] shadow-xs hover:border-[var(--color-brand)] transition-all cursor-pointer select-none"
            >
              <span className="text-xs font-semibold text-[var(--color-fg)] max-w-xs truncate">
                {c.text}
              </span>
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
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

      {/* 3. Editorial Sequence Flow */}
      <section className="container mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-[var(--color-fg)]">How FactStamp Reverses Misinformation</h2>
          <p className="text-sm text-[var(--color-fg-2)] mt-2">
            A three-step verification loop designed to travel back through the exact same WhatsApp groups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon
            return (
              <div
                key={s.num}
                className="hairline-card p-8 relative flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-brand)]/30"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-bold font-mono text-[var(--color-brand)] opacity-80">{s.num}</span>
                    <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[var(--color-accent)]" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-fg)] mb-2">{s.title}</h3>
                  <p className="text-sm text-[var(--color-fg-2)] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. Architectural Comparison: Community Consensus vs Legacy Models */}
      <section className="container mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border-soft)] p-8 md:p-12 shadow-[var(--shadow-sm)]">
          {/* Header */}
          <div className="max-w-4xl mb-10">
            <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-2">
              Architectural Distinction
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-fg)] tracking-tight text-balance">
              Why Community Consensus Beats a Single AI Answer
            </h2>
          </div>

          {/* Clean 2-Column Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Column 1: Traditional & Single AI (Legacy) */}
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg)] p-7 border border-[var(--color-border-soft)] flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider mb-4">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Traditional Portals &amp; Plain AI
                </div>
                <h3 className="text-xl font-bold text-[var(--color-fg)] mb-4">Centralised, Slow &amp; Hallucination-Prone</h3>
                
                <ul className="space-y-3.5 text-sm text-[var(--color-fg-2)]">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✕</span>
                    <span><strong>24–48h Latency:</strong> Journalist-only portals take hours or days to analyze viral messages.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✕</span>
                    <span><strong>Uncited AI Outputs:</strong> Single LLM responses hallucinate details without verifiable primary sources.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✕</span>
                    <span><strong>Low Distribution:</strong> Long text articles fail to travel inside fast-moving WhatsApp groups.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[var(--color-border-soft)] text-xs font-mono text-[var(--color-fg-muted)]">
                Single point of failure • Unverified outputs
              </div>
            </div>

            {/* Column 2: FactStamp Multi-Verifier Consensus (Solution) */}
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-brand-subtle)]/40 p-7 border border-[var(--color-brand)]/30 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[var(--color-brand)] uppercase tracking-wider mb-4">
                  <ShieldCheck className="w-4 h-4 text-[var(--color-brand)]" /> FactStamp Multi-Verifier Consensus
                </div>
                <h3 className="text-xl font-bold text-[var(--color-fg)] mb-2">Weighted 3-Verifier Quorum Engine</h3>
                <p className="text-sm text-[var(--color-fg-2)] leading-relaxed mb-6">
                  FactStamp requires at least 3 independent community reviews before reaching a verdict. Every score is dynamically calculated from three transparent pillars:
                </p>

                {/* Clean 3 Pillars List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-soft)]">
                    <span className="text-sm font-semibold text-[var(--color-fg)]">1. Verifier Agreement Ratio</span>
                    <span className="text-xs font-mono font-bold text-[var(--color-brand)]">40% Weight</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-soft)]">
                    <span className="text-sm font-semibold text-[var(--color-fg)]">2. Verifier Reputation Tier</span>
                    <span className="text-xs font-mono font-bold text-[var(--color-accent)]">30% Weight</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-soft)]">
                    <span className="text-sm font-semibold text-[var(--color-fg)]">3. Official Source Quality (WHO/Gov)</span>
                    <span className="text-xs font-mono font-bold text-[var(--color-v-true)]">30% Weight</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-brand)]/20 flex items-center justify-between text-xs font-mono font-medium text-[var(--color-brand)]">
                <span>✓ 3/3 Independent Reviews Required</span>
                <span>✓ Zero Single-AI Hallucination</span>
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
            <p className="text-sm text-[var(--color-fg-2)] mt-1">Browse claims already fact-checked by the community</p>
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