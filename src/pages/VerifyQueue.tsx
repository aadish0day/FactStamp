import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Clock,
  ArrowRight,
  Timer,
  RotateCcw,
  Search,
  Zap,
  Flag,
  Image as ImageIcon,
  Flame,
} from "lucide-react";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useClaims } from "@/contexts/ClaimsContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn, formatDistanceToNow } from "@/lib/utils";
import type { Claim } from "@/lib/types";

type SortMode = "newest" | "closest" | "reputation";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Newest Submissions" },
  { value: "closest", label: "Closest to Resolving" },
  { value: "reputation", label: "Best Rep Match" },
];

const FILTERS = [
  "All",
  "Health",
  "Political",
  "Religious",
  "Financial",
  "Other",
];

function timeRemaining(deadline: string): {
  label: string;
  urgent: boolean;
  expired: boolean;
} {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { label: "Consensus closed", urgent: false, expired: true };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return { label: `${days}d ${hours}h left`, urgent: false, expired: false };
  }
  if (hours > 0) {
    return { label: `${hours}h left`, urgent: hours <= 8, expired: false };
  }
  const minutes = Math.floor(diffMs / (1000 * 60));
  return { label: `${minutes}m left`, urgent: true, expired: false };
}

function ConsensusStepper({ count, max = 3 }: { count: number; max?: number }) {
  const isClose = count === max - 1;

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1.5"
        role="img"
        aria-label={`${count} of ${max} verifications recorded`}
      >
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-4 rounded-full transition-all duration-200",
              i < count
                ? "bg-[var(--color-brand)] shadow-[0_0_6px_var(--color-brand-subtle)]"
                : i === count && isClose
                ? "bg-[var(--color-brand)]/40 animate-pulse border border-[var(--color-brand)]"
                : "bg-[var(--color-surface-2)] border border-[var(--color-border-soft)]"
            )}
          />
        ))}
      </div>
      <span
        className={cn(
          "text-xs font-mono font-bold tabular-nums",
          isClose ? "text-[var(--color-brand)]" : "text-[var(--color-fg-muted)]"
        )}
      >
        {count}/{max}
      </span>
    </div>
  );
}

export function VerifyQueue() {
  const navigate = useNavigate();
  const { getPendingClaims, isLoading } = useClaims();
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [searchQuery, setSearchQuery] = useState("");

  const pendingClaims = getPendingClaims();

  const filteredClaims = useMemo(() => {
    let list = pendingClaims.filter((claim) => {
      if (
        activeFilter !== "all" &&
        (claim.category || "").toLowerCase() !== activeFilter.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (claim.text || "").toLowerCase().includes(q) ||
          (claim.category || "").toLowerCase().includes(q) ||
          (claim.id || "").toLowerCase().includes(q)
        );
      }
      return true;
    });

    switch (sortMode) {
      case "newest":
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "closest":
        list.sort((a, b) => b.verificationCount - a.verificationCount);
        break;
      case "reputation":
        list.sort((a, b) => {
          const userRep = user?.reputation ?? 50;
          const aDiff = Math.abs((a.avgVerifierReputation ?? 50) - userRep);
          const bDiff = Math.abs((b.avgVerifierReputation ?? 50) - userRep);
          return aDiff - bDiff;
        });
        break;
    }

    // Expedited claims surface on top
    list.sort((a, b) => (b.adminFlagged ? 1 : 0) - (a.adminFlagged ? 1 : 0));

    return list;
  }, [pendingClaims, activeFilter, sortMode, searchQuery, user]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Seo
        title="Verification Queue"
        description="Help fact-check these claims by researching and submitting your verdict with sources."
      />
      <Breadcrumbs />

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-gradient-to-r from-[var(--color-surface-2)] via-[var(--color-surface)] to-[var(--color-surface-2)] p-6 lg:p-8 rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] border border-[var(--color-brand-subtle)] mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Earn +2 Reputation Per Verified Claim</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[var(--color-fg)] tracking-tight mb-2">
            Verification Queue
          </h1>
          <p className="text-sm lg:text-base text-[var(--color-fg-2)] max-w-xl leading-relaxed">
            Review viral WhatsApp claims, inspect sources, and cast your verdict
            to protect the community.
          </p>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0 bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)] p-4 rounded-[var(--radius-lg)]">
          <div className="w-10 h-10 rounded-full bg-[var(--color-brand-subtle)] flex items-center justify-center text-[var(--color-brand)] font-bold text-lg">
            {pendingClaims.length}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)]">
              Pending Claims
            </p>
            <p className="text-[11px] text-[var(--color-fg-muted)]">
              Awaiting consensus verification
            </p>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search + Category Filters + Sort */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]" />
            <input
              type="text"
              placeholder="Search pending claims text or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs lg:text-sm rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-subtle)] shadow-[var(--shadow-xs)]"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold text-[var(--color-fg-2)] uppercase tracking-wider hidden sm:inline">
              Sort:
            </span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="text-xs font-bold rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-subtle)] focus:border-[var(--color-brand)] shadow-[var(--shadow-xs)] cursor-pointer"
              aria-label="Sort claims"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((filter) => {
            const value = filter.toLowerCase();
            const isSelected = activeFilter === value;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(value)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-full font-bold text-xs transition-all duration-150 ease-out active:scale-[0.97] cursor-pointer select-none",
                  isSelected
                    ? "bg-[var(--color-brand)] text-white shadow-[var(--shadow-sm)]"
                    : "bg-[var(--color-surface)] text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] border border-[var(--color-border-soft)]",
                )}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Queue Content ── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : filteredClaims.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No claims match your filters"
          description="Try clearing your search query or selecting a different category tab."
          action={{
            label: "Reset All Filters",
            onClick: () => {
              setActiveFilter("all");
              setSearchQuery("");
            },
          }}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-mono text-[var(--color-fg-muted)]">
            Showing {filteredClaims.length} claim
            {filteredClaims.length !== 1 ? "s" : ""} awaiting community verification
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-3.5"
          >
            {filteredClaims.map((claim) => (
              <ClaimDossierCard
                key={claim.id}
                claim={claim}
                onVerify={() => navigate(`/verify/${claim.id}`)}
              />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}

/**
 * Editorial Dossier Card for Fact-Checkers.
 * Replaces the cramped single-line table with a readable, structured dossier.
 */
function ClaimDossierCard({
  claim,
  onVerify,
}: {
  claim: Claim;
  onVerify: () => void;
}) {
  const deadline = timeRemaining(claim.consensusDeadline);
  const isNearConsensus = claim.verificationCount === 2;

  return (
    <div
      className={cn(
        "group relative rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-5 transition-all duration-150",
        "hover:border-[var(--color-border-strong)] hover:shadow-sm",
        isNearConsensus
          ? "border-s-4 border-s-[var(--color-brand)] border-[var(--color-border)]"
          : claim.adminFlagged
          ? "border-s-4 border-s-amber-500 border-[var(--color-border)]"
          : "border-[var(--color-border)]"
      )}
    >
      {/* Top Metadata Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={claim.category} />

          {claim.adminFlagged && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <Flag className="w-3 h-3" />
              Expedited Review
            </span>
          )}

          {isNearConsensus && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-2 py-0.5 rounded border border-[var(--color-brand-subtle)]">
              <Flame className="w-3 h-3" />
              1 Verdict to Resolve
            </span>
          )}

          {claim.imageUrl && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-fg-muted)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded border border-[var(--color-border-soft)]">
              <ImageIcon className="w-3 h-3 text-[var(--color-brand)]" />
              Screenshot Attached
            </span>
          )}
        </div>

        {/* Deadline Indicator */}
        <div className="text-right">
          {deadline.expired ? (
            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[var(--color-v-contested)]">
              <RotateCcw className="w-3.5 h-3.5" />
              {deadline.label}
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-mono font-bold tabular-nums px-2 py-0.5 rounded",
                deadline.urgent
                  ? "text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30"
                  : "text-[var(--color-fg-muted)] bg-[var(--color-surface-2)] border border-[var(--color-border-soft)]"
              )}
            >
              <Clock className="w-3 h-3" />
              {deadline.label}
            </span>
          )}
        </div>
      </div>

      {/* Claim Text (Hero of the Card — Full, Readable Typography) */}
      <h2 className="text-base sm:text-lg font-semibold text-[var(--color-fg)] leading-relaxed mb-3 line-clamp-3">
        &ldquo;{claim.text}&rdquo;
      </h2>

      {/* Optional WhatsApp Screenshot Thumbnail */}
      {claim.imageUrl && (
        <div className="flex items-center gap-3 p-2 mb-3.5 rounded-[var(--radius-md)] bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)] w-fit max-w-full">
          <img
            src={claim.imageUrl}
            alt="Attached viral forward screenshot"
            className="w-12 h-12 object-cover rounded border border-[var(--color-border-soft)] flex-shrink-0"
          />
          <div className="text-xs pr-2">
            <p className="font-semibold text-[var(--color-fg)] flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-[var(--color-brand)]" /> Attached WhatsApp Forward
            </p>
            <p className="text-[11px] text-[var(--color-fg-muted)]">Image evidence attached for cross-examination</p>
          </div>
        </div>
      )}

      {/* Bottom Action Strip: Consensus Stepper, Submitter Info, and Verify CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--color-border-soft)]">
        <div className="flex items-center gap-3 flex-wrap">
          <ConsensusStepper count={claim.verificationCount} />

          <span className="text-xs text-[var(--color-fg-muted)] font-mono">
            {claim.verificationCount === 0
              ? "Awaiting first independent verifier"
              : claim.verificationCount === 1
              ? "1 verifier verified • 2 more needed"
              : "2 verifiers verified • Final verdict pending"}
          </span>

          <span className="hidden sm:inline text-[var(--color-fg-muted)]">•</span>

          <span className="text-[11px] text-[var(--color-fg-muted)] font-mono tabular-nums">
            Reported {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
          </span>
        </div>

        <Button
          intent="primary"
          size="sm"
          onClick={onVerify}
          className="font-bold flex-shrink-0 w-full sm:w-auto"
        >
          {isNearConsensus ? "Submit Resolving Verdict" : "Inspect & Verify"}
          <ArrowRight className="w-3.5 h-3.5 ms-1 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}
