import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, CheckCircle2, TrendingUp, Users, ArrowRight, MessageSquare,
  FileCheck2, Share2, Sparkles, Shield, AlertTriangle, XCircle, Search
} from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { ClaimCard } from '@/components/ClaimCard'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { useClaims } from '@/contexts/ClaimsContext'

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
  const verifiedClaims = claims.filter((c) => c.status === 'verified').slice(0, 6)

  // Interactive hero transformation state
  const [transformed, setTransformed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setTransformed(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  const stats = [
    { value: 1247, label: 'Claims verified', icon: CheckCircle2 },
    { value: 94, label: 'Avg confidence', icon: TrendingUp, suffix: '%' },
    { value: 342, label: 'Active verifiers', icon: Users },
  ]

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
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]/20 animate-stamp-bounce">
              <ShieldCheck className="w-4 h-4 text-[var(--color-brand)]" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">
                WhatsApp Misinformation Debunker
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-fg)] leading-[1.1] text-balance">
              Stop WhatsApp fake news before it spreads
            </h1>

            <p className="text-lg text-[var(--color-fg-2)] max-w-xl mx-auto lg:mx-0 leading-relaxed text-pretty">
              Paste suspicious forwards, get community-verified verdicts with confidence scores, and share downloadable fact-check cards back into WhatsApp.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4">
              <Button intent="primary" size="lg" onClick={() => navigate('/submit')}>
                Submit a forward
                <ArrowRight className="w-5 h-5 ml-1" aria-hidden="true" />
              </Button>
              <Button intent="secondary" size="lg" onClick={() => navigate('/verify')}>
                Explore verification queue
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
                    <div className="my-4 py-4 rounded-lg bg-[var(--color-v-false-bg)] border border-[var(--color-v-false-border)] flex items-center justify-center gap-3 animate-stamp-bounce">
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

      {/* 2. Metrics Strip */}
      <section className="container mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="hairline-card p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-border-soft)]">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="pt-4 sm:pt-0 sm:px-6 first:px-0 flex items-center gap-4">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-brand-subtle)] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[var(--color-brand)]" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tabular-nums text-[var(--color-fg)]">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs font-medium text-[var(--color-fg-2)] uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            )
          })}
        </div>
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
          {steps.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.num} className="hairline-card p-8 relative flex flex-col justify-between">
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

      {/* 4. Asymmetric Bento: Why Community, Not AI Single Verdict */}
      <section className="container mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="hairline-card p-8 md:p-12">
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold">
              The FactStamp Difference
            </span>
            <h2 className="text-3xl font-bold text-[var(--color-fg)] mt-2">
              Why Community Consensus Beats a Single AI Answer
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Box: Single AI / Journalist Box (The Problem) */}
            <div className="lg:col-span-5 bg-[var(--color-bg)] p-6 rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--color-v-false)] font-semibold">
                <AlertTriangle className="w-4 h-4" /> Traditional Fact-Checking
              </div>
              <h3 className="text-base font-bold text-[var(--color-fg)]">Centralised & Slow</h3>
              <ul className="text-xs text-[var(--color-fg-2)] space-y-2.5 list-disc list-inside">
                <li>Journalist-only portals take hours or days to respond.</li>
                <li>Single AI outputs lack explicit source verification.</li>
                <li>No shareable PNG card format built for WhatsApp forwards.</li>
              </ul>
            </div>

            {/* Right Box: FactStamp Community Weight (The Solution) */}
            <div className="lg:col-span-7 bg-[var(--color-surface)] p-6 rounded-[var(--radius-lg)] border-2 border-[var(--color-brand)]/30 space-y-4 shadow-md">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--color-brand)] font-semibold">
                <Sparkles className="w-4 h-4" /> FactStamp Multi-Verifier Consensus
              </div>
              <h3 className="text-base font-bold text-[var(--color-fg)]">Weighted 3-Verifier Consensus Algorithm</h3>
              <p className="text-xs text-[var(--color-fg-2)] leading-relaxed">
                FactStamp requires at least 3 independent community reviews per claim. The final verdict combines <strong>Agreement Ratio (40%)</strong>, <strong>Verifier Reputation (30%)</strong>, and <strong>Source Quality (30%)</strong> into a transparent confidence score.
              </p>
              <div className="pt-2 flex items-center gap-4 text-xs font-mono text-[var(--color-accent)] font-semibold">
                <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Reputation Weighted</span>
                <span className="flex items-center gap-1"><Search className="w-4 h-4" /> Source Verified</span>
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
          {verifiedClaims.map((claim) => (
            <motion.div key={claim.id} variants={itemVariants}>
              <ClaimCard claim={claim} to={`/claim/${claim.id}`} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 6. Solid Ink-Teal Footer CTA Band */}
      <section className="container mx-auto px-[clamp(1rem,4vw,3rem)]">
        <div className="bg-[var(--color-accent)] text-[var(--color-accent-fg)] rounded-[var(--radius-xl)] p-10 md:p-14 text-center max-w-4xl mx-auto shadow-xl">
          <h2 className="text-3xl font-bold mb-4 text-white">Help Stop Fake News in Your WhatsApp Groups</h2>
          <p className="text-emerald-100/90 text-sm md:text-base mb-8 max-w-xl mx-auto leading-relaxed">
            Every verification you submit increases your verifier reputation and gives millions of WhatsApp users actionable fact-check cards.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              intent="primary"
              size="lg"
              onClick={() => navigate('/submit')}
              className="w-full sm:w-auto bg-white text-zinc-900 hover:bg-zinc-100 border-none shadow-md"
            >
              Submit a forward
            </Button>
            <Button
              intent="outline"
              size="lg"
              onClick={() => navigate('/verify')}
              className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10"
            >
              Start verifying claims
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}