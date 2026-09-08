import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  FileText,
  AlertTriangle,
  Activity,
  Search,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Flag,
  RotateCcw,
  Download,
  Bell,
  Sparkles,
  ExternalLink,
  Filter,
  KeyRound,
  Eye,
  Sliders,
  Server,
  Lock,
  Sun,
  Moon,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'
import { toast } from 'sonner'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { VerdictPill } from '@/components/ui/VerdictPill'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { EmptyState } from '@/components/ui/EmptyState'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useClaims } from '@/contexts/ClaimsContext'
import { useUsers } from '@/contexts/UsersContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useNotifications } from '@/contexts/NotificationsContext'
import {
  subscribeReportsRealtime,
  createModerationReport,
  updateReportInFirestore,
  subscribeAuditLogsRealtime,
  addAuditLogToFirestore,
} from '@/services/firebaseService'
import { isFirebaseConfigured } from '@/lib/firebase'
import { formatDistanceToNow, cn } from '@/lib/utils'
import type {
  Claim,
  User,
  Verdict,
  ClaimCategory,
  ModerationReport,
  ReportTargetType,
  ReportReason,
  ReportSeverity,
  ReportStatus,
  AdminAuditLog,
} from '@/lib/types'

type AdminTab = 'overview' | 'users' | 'claims' | 'reports' | 'tools'

const CATEGORY_COLORS: Record<string, string> = {
  health: '#BA3E03',
  political: '#1C5560',
  financial: '#047857',
  religious: '#B45309',
  other: '#64748B',
}

const VERDICT_COLORS: Record<Verdict, string> = {
  TRUE: '#16a34a',
  FALSE: '#dc2626',
  MISLEADING: '#d97706',
  UNVERIFIABLE: '#64748b',
  CONTESTED: '#2563eb',
}

export function Admin() {
  const { user } = useAuth()
  const { theme, setTheme, toggleTheme } = useTheme()
  const { claims, flagClaim, deleteClaim, adminUpdateClaim, deleteVerification, expireOverdueClaims } = useClaims()
  const { users, adminUpdateUser, adminDeleteUser } = useUsers()
  const { addNotification } = useNotifications()

  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  // Reports and Audit Logs state — 100% dynamically loaded from Firebase Firestore DB
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([])

  // Realtime subscription for reports & audit logs directly from Cloud Firestore
  useEffect(() => {
    if (!isFirebaseConfigured || !user) return
    const unsubReports = subscribeReportsRealtime(
      (firestoreReports) => {
        setReports(firestoreReports)
      },
      () => {}
    )

    const unsubLogs = subscribeAuditLogsRealtime(
      (firestoreLogs) => {
        setAuditLogs(firestoreLogs)
      },
      () => {}
    )

    return () => {
      unsubReports()
      unsubLogs()
    }
  }, [user])

  // Audit log helper (synced with Firestore DB)
  const addAuditLog = useCallback(
    (action: string, targetType: AdminAuditLog['targetType'], targetId: string, details: string) => {
      const newLogData: Omit<AdminAuditLog, 'id'> = {
        timestamp: new Date().toISOString(),
        adminId: user?.uid || 'admin',
        adminName: user?.displayName || 'Administrator',
        action,
        targetType,
        targetId,
        details,
      }

      if (isFirebaseConfigured) {
        addAuditLogToFirestore(newLogData).catch((err) => {
          console.warn('Could not persist audit log to Firestore:', err)
        })
      }

      const localLog: AdminAuditLog = {
        ...newLogData,
        id: `log_${Date.now()}`,
      }
      setAuditLogs((prev) => [localLog, ...prev])
    },
    [user]
  )

  /* ─────────────────────────────────────────────────────────────
     TAB 2: USERS MODERATION MODALS & STATE
  ───────────────────────────────────────────────────────────── */
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'verifier'>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditUserRepModalOpen, setIsEditUserRepModalOpen] = useState(false)
  const [newUserReputation, setNewUserReputation] = useState<number>(50)
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false)

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        (u.displayName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.uid || '').toLowerCase().includes(userSearch.toLowerCase())
      const matchRole =
        userRoleFilter === 'all'
          ? true
          : userRoleFilter === 'admin'
          ? Boolean(u.isAdmin)
          : !u.isAdmin
      return matchSearch && matchRole
    })
  }, [users, userSearch, userRoleFilter])

  const handleUpdateReputation = async () => {
    if (!selectedUser) return
    try {
      await adminUpdateUser(selectedUser.uid, { reputation: newUserReputation })
      addAuditLog(
        'Adjusted Verifier Reputation',
        'user',
        selectedUser.uid,
        `Changed ${selectedUser.displayName}'s reputation from ${selectedUser.reputation} to ${newUserReputation}`
      )
      toast.success('Reputation updated', {
        description: `${selectedUser.displayName}'s reputation set to ${newUserReputation}%.`,
      })
      setIsEditUserRepModalOpen(false)
    } catch {
      toast.error('Failed to update reputation')
    }
  }

  const handleToggleAdmin = async (targetUser: User) => {
    const newAdminState = !targetUser.isAdmin
    try {
      await adminUpdateUser(targetUser.uid, { isAdmin: newAdminState })
      addAuditLog(
        newAdminState ? 'Granted Admin Clearance' : 'Revoked Admin Clearance',
        'user',
        targetUser.uid,
        `Updated admin role for ${targetUser.displayName}`
      )
      toast.success(newAdminState ? 'Admin role granted' : 'Admin role revoked', {
        description: `${targetUser.displayName} is ${newAdminState ? 'now an Administrator' : 'now a standard Verifier'}.`,
      })
    } catch {
      toast.error('Failed to update admin status')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    try {
      await adminDeleteUser(selectedUser.uid)
      addAuditLog('Deleted Verifier Account', 'user', selectedUser.uid, `Removed ${selectedUser.displayName} (${selectedUser.email})`)
      toast.success('User deleted', {
        description: `Account ${selectedUser.displayName} removed from platform.`,
      })
      setIsDeleteUserModalOpen(false)
      setSelectedUser(null)
    } catch {
      toast.error('Failed to delete user')
    }
  }

  /* ─────────────────────────────────────────────────────────────
     TAB 3: CLAIMS MODERATION MODALS & STATE
  ───────────────────────────────────────────────────────────── */
  const [claimSearch, setClaimSearch] = useState('')
  const [claimCategoryFilter, setClaimCategoryFilter] = useState<string>('all')
  const [claimStatusFilter, setClaimStatusFilter] = useState<'all' | 'pending' | 'verified'>('all')
  const [claimFlaggedOnly, setClaimFlaggedOnly] = useState(false)

  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false)
  const [overrideVerdict, setOverrideVerdict] = useState<Verdict>('TRUE')
  const [overrideConfidence, setOverrideConfidence] = useState<number>(85)
  const [overrideStatus, setOverrideStatus] = useState<'pending' | 'verified'>('verified')

  const [isEditClaimModalOpen, setIsEditClaimModalOpen] = useState(false)
  const [editClaimText, setEditClaimText] = useState('')
  const [editClaimCategory, setEditClaimCategory] = useState<ClaimCategory>('health')

  const [isInspectVerifsModalOpen, setIsInspectVerifsModalOpen] = useState(false)
  const [isDeleteClaimModalOpen, setIsDeleteClaimModalOpen] = useState(false)

  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      const matchSearch =
        c.text.toLowerCase().includes(claimSearch.toLowerCase()) ||
        c.submittedByName.toLowerCase().includes(claimSearch.toLowerCase()) ||
        c.id.toLowerCase().includes(claimSearch.toLowerCase())
      const matchCat = claimCategoryFilter === 'all' || c.category === claimCategoryFilter
      const matchStatus = claimStatusFilter === 'all' || c.status === claimStatusFilter
      const matchFlag = claimFlaggedOnly ? Boolean(c.adminFlagged) : true
      return matchSearch && matchCat && matchStatus && matchFlag
    })
  }, [claims, claimSearch, claimCategoryFilter, claimStatusFilter, claimFlaggedOnly])

  const handleToggleClaimFlag = async (c: Claim) => {
    const nextFlag = !c.adminFlagged
    try {
      await flagClaim(c.id, nextFlag)
      addAuditLog(
        nextFlag ? 'Flagged Claim (Expedited Review)' : 'Unflagged Claim',
        'claim',
        c.id,
        `Updated priority for: "${c.text.slice(0, 50)}..."`
      )
      toast.success(nextFlag ? 'Claim flagged for expedited review' : 'Flag removed')
    } catch {
      toast.error('Failed to toggle flag')
    }
  }

  const handleApplyVerdictOverride = async () => {
    if (!selectedClaim) return
    try {
      await adminUpdateClaim(selectedClaim.id, {
        verdict: overrideVerdict,
        status: overrideStatus,
        confidenceScore: overrideConfidence,
        verifiedAt: overrideStatus === 'verified' ? new Date().toISOString() : undefined,
      })
      addAuditLog(
        'Manual Verdict Override',
        'claim',
        selectedClaim.id,
        `Admin set verdict=${overrideVerdict}, score=${overrideConfidence}%, status=${overrideStatus}`
      )
      toast.success('Verdict overridden', {
        description: `Claim updated with ${overrideVerdict} verdict and ${overrideConfidence}% confidence score.`,
      })
      setIsOverrideModalOpen(false)
    } catch {
      toast.error('Failed to override verdict')
    }
  }

  const handleSaveClaimEdit = async () => {
    if (!selectedClaim) return
    try {
      await adminUpdateClaim(selectedClaim.id, {
        text: editClaimText,
        category: editClaimCategory,
      })
      addAuditLog(
        'Edited Claim Metadata',
        'claim',
        selectedClaim.id,
        `Modified text and category to ${editClaimCategory}`
      )
      toast.success('Claim updated successfully')
      setIsEditClaimModalOpen(false)
    } catch {
      toast.error('Failed to edit claim')
    }
  }

  const handleDeleteVerification = async (verificationId: string) => {
    if (!selectedClaim) return
    try {
      await deleteVerification(selectedClaim.id, verificationId)
      addAuditLog(
        'Removed Illegitimate Verification',
        'claim',
        selectedClaim.id,
        `Deleted verification ${verificationId} from claim ${selectedClaim.id}`
      )
      toast.success('Verification removed')
      // Update the local selectedClaim view
      setSelectedClaim((prev) =>
        prev
          ? {
              ...prev,
              verifications: prev.verifications.filter((v) => v.id !== verificationId),
              verificationCount: Math.max(0, prev.verifications.length - 1),
            }
          : null
      )
    } catch {
      toast.error('Failed to remove verification')
    }
  }

  const handleDeleteClaim = async () => {
    if (!selectedClaim) return
    try {
      await deleteClaim(selectedClaim.id)
      addAuditLog(
        'Hard Deleted Claim',
        'claim',
        selectedClaim.id,
        `Permanently removed claim "${selectedClaim.text.slice(0, 50)}..."`
      )
      toast.success('Claim deleted permanently')
      setIsDeleteClaimModalOpen(false)
      setSelectedClaim(null)
    } catch {
      toast.error('Failed to delete claim')
    }
  }

  /* ─────────────────────────────────────────────────────────────
     TAB 4: REPORTS QUEUE STATE & ACTIONS
  ───────────────────────────────────────────────────────────── */
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | ReportStatus>('all')
  const [reportSeverityFilter, setReportSeverityFilter] = useState<'all' | ReportSeverity>('all')
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null)
  const [isResolveReportModalOpen, setIsResolveReportModalOpen] = useState(false)
  const [reportActionNotes, setReportActionNotes] = useState('')
  const [isCreateReportModalOpen, setIsCreateReportModalOpen] = useState(false)

  // New report form state
  const [newReportTargetType, setNewReportTargetType] = useState<ReportTargetType>('claim')
  const [newReportTargetId, setNewReportTargetId] = useState('')
  const [newReportTitle, setNewReportTitle] = useState('')
  const [newReportReason, setNewReportReason] = useState<ReportReason>('misinformation_spam')
  const [newReportDetails, setNewReportDetails] = useState('')
  const [newReportSeverity, setNewReportSeverity] = useState<ReportSeverity>('medium')

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchStatus = reportStatusFilter === 'all' || r.status === reportStatusFilter
      const matchSeverity = reportSeverityFilter === 'all' || r.severity === reportSeverityFilter
      return matchStatus && matchSeverity
    })
  }, [reports, reportStatusFilter, reportSeverityFilter])

  const handleResolveReport = async (status: 'resolved' | 'dismissed') => {
    if (!selectedReport) return
    const updates: Partial<ModerationReport> = {
      status,
      actionTaken: reportActionNotes || (status === 'resolved' ? 'Reviewed and actioned by Admin' : 'Dismissed as unfounded'),
      resolvedAt: new Date().toISOString(),
      resolvedBy: user?.displayName || 'Administrator',
    }

    setReports((prev) =>
      prev.map((r) => (r.id === selectedReport.id ? { ...r, ...updates } : r))
    )

    if (isFirebaseConfigured) {
      updateReportInFirestore(selectedReport.id, updates).catch(() => {})
    }

    addAuditLog(
      status === 'resolved' ? 'Resolved Moderation Report' : 'Dismissed Moderation Report',
      'report',
      selectedReport.id,
      `${status.toUpperCase()}: ${selectedReport.targetTitle} — ${updates.actionTaken}`
    )

    toast.success(status === 'resolved' ? 'Report resolved' : 'Report dismissed')
    setIsResolveReportModalOpen(false)
    setSelectedReport(null)
    setReportActionNotes('')
  }

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    const newReport: Omit<ModerationReport, 'id'> = {
      targetType: newReportTargetType,
      targetId: newReportTargetId || `target_${Date.now()}`,
      targetTitle: newReportTitle,
      reason: newReportReason,
      details: newReportDetails,
      reportedBy: user?.uid || 'admin',
      reportedByName: user?.displayName || 'Administrator',
      reportedAt: new Date().toISOString(),
      status: 'pending',
      severity: newReportSeverity,
    }

    if (isFirebaseConfigured) {
      try {
        const id = await createModerationReport(newReport)
        setReports((prev) => [{ ...newReport, id }, ...prev])
      } catch {
        setReports((prev) => [{ ...newReport, id: `rep_${Date.now()}` }, ...prev])
      }
    } else {
      setReports((prev) => [{ ...newReport, id: `rep_${Date.now()}` }, ...prev])
    }

    addAuditLog('Created Moderation Ticket', 'report', newReportTargetId, `Reason: ${newReportReason} — ${newReportTitle}`)
    toast.success('Moderation ticket created')
    setIsCreateReportModalOpen(false)
    setNewReportTitle('')
    setNewReportDetails('')
  }

  /* ─────────────────────────────────────────────────────────────
     TAB 5: SYSTEM TOOLS (EXPORT, NOTIFICATIONS, EXPIRY)
  ───────────────────────────────────────────────────────────── */
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')

  const handleBroadcastNotification = () => {
    if (!broadcastTitle || !broadcastMessage) return
    addNotification({
      userId: user?.uid || 'all',
      type: 'weekly_report',
      title: broadcastTitle,
      message: broadcastMessage,
    })
    addAuditLog('Sent System Broadcast', 'system', 'all_users', `Title: "${broadcastTitle}"`)
    toast.success('Broadcast notification dispatched to users')
    setIsBroadcastModalOpen(false)
    setBroadcastTitle('')
    setBroadcastMessage('')
  }

  const handleForceExpiry = () => {
    expireOverdueClaims()
    addAuditLog('Triggered Manual Consensus Expiry', 'system', 'claims', 'Executed force settlement on overdue submissions')
    toast.success('Consensus expiry check executed', {
      description: 'Overdue claims without 3 verifications settled as CONTESTED.',
    })
  }

  const handleExportData = () => {
    const exportBundle = {
      exportTimestamp: new Date().toISOString(),
      exporter: user?.displayName,
      totalUsers: users.length,
      totalClaims: claims.length,
      totalReports: reports.length,
      claims,
      users,
      reports,
      auditLogs,
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `factstamp_database_backup_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()

    addAuditLog('Exported System Data Backup', 'system', 'database', 'Exported JSON backup of claims, users, and reports')
    toast.success('Database backup downloaded')
  }

  /* ─────────────────────────────────────────────────────────────
     OVERVIEW TAB CHARTS & STATS COMPUTATIONS
  ───────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const totalUsers = users.length
    const totalClaims = claims.length
    const pendingClaims = claims.filter((c) => c.status === 'pending').length
    const verifiedClaims = claims.filter((c) => c.status === 'verified').length
    const flaggedClaims = claims.filter((c) => c.adminFlagged).length
    const totalVerifications = claims.reduce((acc, c) => acc + (c.verifications?.length || 0), 0)
    const falseClaims = claims.filter((c) => c.verdict === 'FALSE').length
    const falseRate = verifiedClaims > 0 ? Math.round((falseClaims / verifiedClaims) * 100) : 0
    const pendingReports = reports.filter((r) => r.status === 'pending').length

    return {
      totalUsers,
      totalClaims,
      pendingClaims,
      verifiedClaims,
      flaggedClaims,
      totalVerifications,
      falseRate,
      pendingReports,
    }
  }, [users, claims, reports])

  // Category breakdown for Recharts
  const categoryChartData = useMemo(() => {
    const categories: ClaimCategory[] = ['health', 'political', 'financial', 'religious', 'other']
    return categories.map((cat) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      count: claims.filter((c) => c.category === cat).length,
      color: CATEGORY_COLORS[cat] || '#64748B',
    }))
  }, [claims])

  // Verdict breakdown for Recharts
  const verdictChartData = useMemo(() => {
    const verdicts: Verdict[] = ['TRUE', 'FALSE', 'MISLEADING', 'UNVERIFIABLE', 'CONTESTED']
    return verdicts.map((v) => ({
      name: v,
      count: claims.filter((c) => c.verdict === v).length,
      color: VERDICT_COLORS[v] || '#64748b',
    }))
  }, [claims])

  // Reputation tier breakdown
  const reputationTiers = useMemo(() => {
    return [
      { name: 'Novice (0-30)', count: users.filter((u) => u.reputation <= 30).length, color: '#dc2626' },
      { name: 'Trusted (31-60)', count: users.filter((u) => u.reputation > 30 && u.reputation <= 60).length, color: '#d97706' },
      { name: 'Expert (61-85)', count: users.filter((u) => u.reputation > 60 && u.reputation <= 85).length, color: '#16a34a' },
      { name: 'Elite (86-100)', count: users.filter((u) => u.reputation > 85).length, color: '#1C5560' },
    ]
  }, [users])

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Seo
        title="Admin Command Center — FactStamp"
        description="Administrative moderation console and intelligence center."
      />

      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border-soft)] mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-brand)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-fg)]">
              Admin Command Center
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-[var(--color-brand)] text-white font-semibold tracking-wider">
              Staff Clearance
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-fg-muted)]">
            Unlisted management console. Oversee verifier reputation, override consensus verdicts, triage incident reports, and manage database integrity.
          </p>
        </div>

        {/* Live Status Indicators, Theme Toggle & Lock Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[var(--color-fg-2)]">Live Sync Active</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-[var(--color-surface-2)] border border-[var(--color-border-soft)] text-[var(--color-fg-muted)]">
            <Server className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            {isFirebaseConfigured ? 'Cloud Firestore' : 'Local Memory Store'}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          <Button
            intent="secondary"
            size="sm"
            className="text-xs py-1 px-2.5"
            title="Lock administrative console and return to login gate"
            onClick={() => {
              sessionStorage.removeItem('fs_admin_session_unlocked')
              window.location.reload()
            }}
          >
            <Lock className="w-3.5 h-3.5 mr-1" />
            Lock Console
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 mb-8 border-b border-[var(--color-border-soft)] no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer',
            activeTab === 'overview'
              ? 'bg-[var(--color-brand)] text-white shadow-xs'
              : 'text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]'
          )}
        >
          <Activity className="w-4 h-4" />
          System Overview
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer',
            activeTab === 'users'
              ? 'bg-[var(--color-brand)] text-white shadow-xs'
              : 'text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]'
          )}
        >
          <Users className="w-4 h-4" />
          Verifier Directory
          <span className={cn(
            'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
            activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]'
          )}>
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer',
            activeTab === 'claims'
              ? 'bg-[var(--color-brand)] text-white shadow-xs'
              : 'text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]'
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          Claims Moderation
          <span className={cn(
            'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
            activeTab === 'claims' ? 'bg-white/20 text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]'
          )}>
            {claims.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer',
            activeTab === 'reports'
              ? 'bg-[var(--color-brand)] text-white shadow-xs'
              : 'text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]'
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Incident Queue
          {stats.pendingReports > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-red-500 text-white animate-pulse">
              {stats.pendingReports}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer',
            activeTab === 'tools'
              ? 'bg-[var(--color-brand)] text-white shadow-xs'
              : 'text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]'
          )}
        >
          <Sliders className="w-4 h-4" />
          Audit & Tools
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: SYSTEM OVERVIEW & KPIS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* KPI Stat Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
              <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Registered Verifiers</span>
                <Users className="w-4 h-4 text-[var(--color-accent)]" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-[var(--color-fg)]">
                <AnimatedCounter value={stats.totalUsers} />
              </p>
              <p className="text-[11px] text-[var(--color-fg-muted)] mt-1">
                Active crowd-factcheckers
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
              <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Claims</span>
                <FileText className="w-4 h-4 text-[var(--color-brand)]" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-[var(--color-fg)]">
                <AnimatedCounter value={stats.totalClaims} />
              </p>
              <div className="flex items-center gap-2 text-[11px] text-[var(--color-fg-muted)] mt-1">
                <span className="text-amber-600 font-semibold">{stats.pendingClaims} pending</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">{stats.verifiedClaims} verified</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
              <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Verifications Logged</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-[var(--color-fg)]">
                <AnimatedCounter value={stats.totalVerifications} />
              </p>
              <p className="text-[11px] text-[var(--color-fg-muted)] mt-1">
                Cross-referenced sources
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
              <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Incident Queue</span>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-[var(--color-fg)]">
                <AnimatedCounter value={stats.pendingReports} />
              </p>
              <p className="text-[11px] text-[var(--color-fg-muted)] mt-1">
                {stats.flaggedClaims} claims flagged for priority review
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution Bar Chart */}
            <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-[var(--color-fg)]">
                    Claims by Category
                  </h2>
                  <p className="text-xs text-[var(--color-fg-muted)]">
                    Topic distribution across the repository
                  </p>
                </div>
                <CategoryBadge category="health" />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border-soft)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="var(--color-fg-muted)"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis stroke="var(--color-fg-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: 'var(--color-fg)',
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Verdict Split Chart */}
            <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-[var(--color-fg)]">
                    Verdict Consensus Breakdown
                  </h2>
                  <p className="text-xs text-[var(--color-fg-muted)]">
                    Outcome split across evaluated claims
                  </p>
                </div>
                <VerdictPill verdict="FALSE" />
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={verdictChartData.filter((d) => d.count > 0)}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {verdictChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: 'var(--color-fg)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend row */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-[var(--color-border-soft)]">
                {verdictChartData.map((v) => (
                  <div key={v.name} className="flex items-center gap-1.5 text-xs text-[var(--color-fg-2)]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }} />
                    <span className="font-medium">{v.name}:</span>
                    <span className="font-mono font-bold text-[var(--color-fg)]">{v.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Verifier Reputation Tier Breakdown */}
          <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
            <h2 className="text-base font-bold text-[var(--color-fg)] mb-1">
              Verifier Reputation Tiers
            </h2>
            <p className="text-xs text-[var(--color-fg-muted)] mb-4">
              Community trust distribution and voting weight tiers
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {reputationTiers.map((tier) => (
                <div key={tier.name} className="p-4 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border-soft)]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                    <span className="text-xs font-semibold text-[var(--color-fg)]">{tier.name}</span>
                  </div>
                  <p className="text-xl font-bold font-mono text-[var(--color-fg)]">{tier.count} <span className="text-xs font-normal text-[var(--color-fg-muted)]">users</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: USER & VERIFIER MANAGEMENT
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]" />
              <Input
                type="text"
                placeholder="Search by name, email, or UID…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as 'all' | 'admin' | 'verifier')}
                aria-label="Filter users by role"
                className="text-xs font-medium px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins Only</option>
                <option value="verifier">Verifiers Only</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] uppercase text-[11px] font-semibold border-b border-[var(--color-border-soft)]">
                  <tr>
                    <th className="px-4 py-3.5">Verifier</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Reputation</th>
                    <th className="px-4 py-3.5">Verifications</th>
                    <th className="px-4 py-3.5">Joined</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-soft)]">
                  {filteredUsers.map((u) => {
                    const isAdminUser = Boolean(u.isAdmin)
                    return (
                      <tr key={u.uid} className="hover:bg-[var(--color-surface-2)] transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar initials={(u.displayName?.trim() || u.email || 'V').charAt(0).toUpperCase()} size="sm" />
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--color-fg)] truncate max-w-[160px] sm:max-w-[200px]">
                                {u.displayName?.trim() || u.email?.split('@')[0] || 'Verifier'}
                              </p>
                              <p className="text-[11px] text-[var(--color-fg-muted)] truncate max-w-[160px] sm:max-w-[200px]">
                                {u.email}
                              </p>
                              <p className="text-[9px] font-mono text-[var(--color-fg-muted)] truncate max-w-[120px]">
                                {u.uid}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          {isAdminUser ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-border)]">
                              <KeyRound className="w-2.5 h-2.5" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--color-surface-2)] text-[var(--color-fg-2)]">
                              Verifier
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[var(--color-fg)]">
                              {u.reputation}%
                            </span>
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                              u.reputation >= 85
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : u.reputation >= 60
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                            )}>
                              {u.reputation >= 85 ? 'Elite' : u.reputation >= 60 ? 'Expert' : u.reputation >= 30 ? 'Trusted' : 'Novice'}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-[var(--color-fg-2)]">
                          {u.totalVerifications} checks
                        </td>

                        <td className="px-4 py-3.5 text-[11px] text-[var(--color-fg-muted)]">
                          {formatDistanceToNow(u.joinedAt)}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              intent="ghost"
                              size="sm"
                              title="Edit Reputation"
                              onClick={() => {
                                setSelectedUser(u)
                                setNewUserReputation(u.reputation)
                                setIsEditUserRepModalOpen(true)
                              }}
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[var(--color-fg-2)]" />
                            </Button>

                            <Button
                              intent="ghost"
                              size="sm"
                              title={isAdminUser ? 'Revoke Admin' : 'Promote to Admin'}
                              onClick={() => handleToggleAdmin(u)}
                            >
                              <KeyRound className={cn('w-3.5 h-3.5', isAdminUser ? 'text-[var(--color-brand)]' : 'text-[var(--color-fg-muted)]')} />
                            </Button>

                            <Button
                              intent="ghost"
                              size="sm"
                              title="Delete User"
                              onClick={() => {
                                setSelectedUser(u)
                                setIsDeleteUserModalOpen(true)
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-xs text-[var(--color-fg-muted)]">
                  No verifiers found matching the current search or filters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: CLAIMS MODERATION & OVERRIDES
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'claims' && (
        <div className="space-y-6 animate-fade-in">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]" />
              <Input
                type="text"
                placeholder="Search claim text, submitter, or ID…"
                value={claimSearch}
                onChange={(e) => setClaimSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={claimCategoryFilter}
                onChange={(e) => setClaimCategoryFilter(e.target.value)}
                aria-label="Filter claims by category"
                className="text-xs font-medium px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)]"
              >
                <option value="all">All Categories</option>
                <option value="health">Health</option>
                <option value="political">Political</option>
                <option value="financial">Financial</option>
                <option value="religious">Religious</option>
                <option value="other">Other</option>
              </select>

              <select
                value={claimStatusFilter}
                onChange={(e) => setClaimStatusFilter(e.target.value as 'all' | 'pending' | 'verified')}
                aria-label="Filter claims by status"
                className="text-xs font-medium px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
              </select>

              <Button
                intent={claimFlaggedOnly ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setClaimFlaggedOnly((prev) => !prev)}
                className="text-xs"
              >
                <Flag className="w-3.5 h-3.5 mr-1" />
                {claimFlaggedOnly ? 'Flagged Only' : 'Flagged (All)'}
              </Button>
            </div>
          </div>

          {/* Claims List Table */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] uppercase text-[11px] font-semibold border-b border-[var(--color-border-soft)]">
                  <tr>
                    <th className="px-4 py-3.5">Claim Details</th>
                    <th className="px-4 py-3.5">Status & Verdict</th>
                    <th className="px-4 py-3.5">Score</th>
                    <th className="px-4 py-3.5">Verifications</th>
                    <th className="px-4 py-3.5">Submitted By</th>
                    <th className="px-4 py-3.5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-soft)]">
                  {filteredClaims.map((c) => (
                    <tr key={c.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                      <td className="px-4 py-3.5 max-w-sm">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <CategoryBadge category={c.category} />
                              {c.adminFlagged && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                  <Flag className="w-2.5 h-2.5 fill-current" />
                                  Expedited Flag
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-[var(--color-fg-muted)]">
                                {c.id}
                              </span>
                            </div>
                            <p className="font-medium text-[var(--color-fg)] line-clamp-2 text-xs leading-relaxed">
                              {c.text}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="space-y-1">
                          {c.verdict ? (
                            <VerdictPill verdict={c.verdict} />
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                              Pending ({c.verificationCount}/3)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[var(--color-fg)]">
                        {c.confidenceScore !== undefined ? `${c.confidenceScore}%` : '—'}
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => {
                            setSelectedClaim(c)
                            setIsInspectVerifsModalOpen(true)
                          }}
                          className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline font-medium cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {c.verifications?.length || 0} reviews
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-[var(--color-fg-muted)]">
                        <p className="text-[var(--color-fg)] font-medium truncate max-w-[120px]">
                          {c.submittedByName}
                        </p>
                        <p className="text-[10px]">{formatDistanceToNow(c.createdAt)}</p>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Expedited Flag Button */}
                          <Button
                            intent="ghost"
                            size="sm"
                            title={c.adminFlagged ? 'Remove Expedited Flag' : 'Flag for Expedited Review'}
                            onClick={() => handleToggleClaimFlag(c)}
                          >
                            <Flag className={cn('w-3.5 h-3.5', c.adminFlagged ? 'text-amber-600 fill-current' : 'text-[var(--color-fg-muted)]')} />
                          </Button>

                          {/* Override Verdict Button */}
                          <Button
                            intent="ghost"
                            size="sm"
                            title="Override Verdict / Force Consensus"
                            onClick={() => {
                              setSelectedClaim(c)
                              setOverrideVerdict(c.verdict || 'TRUE')
                              setOverrideConfidence(c.confidenceScore || 85)
                              setOverrideStatus(c.status)
                              setIsOverrideModalOpen(true)
                            }}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[var(--color-brand)]" />
                          </Button>

                          {/* Edit Text/Category Button */}
                          <Button
                            intent="ghost"
                            size="sm"
                            title="Edit Claim Text & Category"
                            onClick={() => {
                              setSelectedClaim(c)
                              setEditClaimText(c.text)
                              setEditClaimCategory(c.category)
                              setIsEditClaimModalOpen(true)
                            }}
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[var(--color-fg-2)]" />
                          </Button>

                          {/* Delete Claim Button */}
                          <Button
                            intent="ghost"
                            size="sm"
                            title="Delete Claim Permanently"
                            onClick={() => {
                              setSelectedClaim(c)
                              setIsDeleteClaimModalOpen(true)
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredClaims.length === 0 && (
                <div className="p-8 text-center text-xs text-[var(--color-fg-muted)]">
                  No claims found matching current filters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: INCIDENT & REPORTS QUEUE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value as 'all' | ReportStatus)}
                aria-label="Filter reports by status"
                className="text-xs font-medium px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)]"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>

              <select
                value={reportSeverityFilter}
                onChange={(e) => setReportSeverityFilter(e.target.value as 'all' | ReportSeverity)}
                aria-label="Filter reports by severity"
                className="text-xs font-medium px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)]"
              >
                <option value="all">All Severities</option>
                <option value="high">High Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="low">Low Severity</option>
              </select>
            </div>

            <Button
              intent="primary"
              size="sm"
              onClick={() => setIsCreateReportModalOpen(true)}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create Incident Ticket
            </Button>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((r) => (
              <div
                key={r.id}
                className={cn(
                  'p-5 rounded-xl border bg-[var(--color-surface)] shadow-xs transition-all flex flex-col justify-between',
                  r.status === 'pending'
                    ? 'border-amber-400 dark:border-amber-800'
                    : 'border-[var(--color-border)]'
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[var(--color-surface-2)] text-[var(--color-fg-2)] border border-[var(--color-border-soft)]">
                        {r.targetType}
                      </span>
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                        r.severity === 'high'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          : r.severity === 'medium'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      )}>
                        {r.severity} severity
                      </span>
                    </div>

                    <span className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-semibold uppercase',
                      r.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : r.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
                    )}>
                      {r.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[var(--color-fg)] mb-1">
                    {r.targetTitle}
                  </h3>

                  <p className="text-xs text-[var(--color-fg-muted)] mb-3 leading-relaxed">
                    {r.details}
                  </p>

                  <div className="p-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border-soft)] text-[11px] text-[var(--color-fg-muted)] mb-3">
                    <p><span className="font-semibold text-[var(--color-fg-2)]">Reason:</span> {r.reason.replace('_', ' ')}</p>
                    <p><span className="font-semibold text-[var(--color-fg-2)]">Reported by:</span> {r.reportedByName} ({formatDistanceToNow(r.reportedAt)})</p>
                    {r.actionTaken && (
                      <p className="mt-1 text-emerald-600 dark:text-emerald-400">
                        <span className="font-semibold">Action:</span> {r.actionTaken}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border-soft)]">
                  {r.status === 'pending' || r.status === 'investigating' ? (
                    <>
                      <Button
                        intent="secondary"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setSelectedReport(r)
                          handleResolveReport('dismissed')
                        }}
                      >
                        Dismiss
                      </Button>
                      <Button
                        intent="primary"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setSelectedReport(r)
                          setIsResolveReportModalOpen(true)
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Resolve & Action
                      </Button>
                    </>
                  ) : (
                    <span className="text-[11px] text-[var(--color-fg-muted)] italic">
                      Settled by {r.resolvedBy || 'Admin'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredReports.length === 0 && (
            <div className="p-12 text-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[var(--color-fg)]">No Pending Reports</h3>
              <p className="text-xs text-[var(--color-fg-muted)] mt-1 max-w-sm mx-auto">
                The incident queue is clear. All reported forwards, verifications, and user flags have been addressed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: AUDIT TRAIL & SYSTEM TOOLS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'tools' && (
        <div className="space-y-8 animate-fade-in">
          {/* Quick Operations Utilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-brand)] mb-3">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[var(--color-fg)] mb-1">
                  Force Consensus Expiry
                </h3>
                <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed mb-4">
                  Run the consensus settlement engine immediately. Any pending claims older than 7 days without 3 verifications are settled as CONTESTED.
                </p>
              </div>
              <Button intent="secondary" size="sm" onClick={handleForceExpiry} className="w-full text-xs">
                Run Expiry Engine
              </Button>
            </div>

            <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-brand)] mb-3">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[var(--color-fg)] mb-1">
                  Broadcast Announcement
                </h3>
                <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed mb-4">
                  Dispatch a high-priority system-wide notification or weekly digest report to all connected fact-checkers.
                </p>
              </div>
              <Button intent="secondary" size="sm" onClick={() => setIsBroadcastModalOpen(true)} className="w-full text-xs">
                Compose Broadcast
              </Button>
            </div>

            <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-brand)] mb-3">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[var(--color-fg)] mb-1">
                  Export System Backup
                </h3>
                <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed mb-4">
                  Download a complete, structured JSON backup of all registered users, claims, verifications, and audit logs.
                </p>
              </div>
              <Button intent="primary" size="sm" onClick={handleExportData} className="w-full text-xs">
                Export JSON Data
              </Button>
            </div>

            <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-brand)] mb-3">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <h3 className="text-sm font-bold text-[var(--color-fg)] mb-1">
                  Console Theme: {theme === 'dark' ? 'Dark' : 'Light'}
                </h3>
                <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed mb-4">
                  Switch the administration command center interface between dark and light appearance modes.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-soft)]">
                <span className="text-xs text-[var(--color-fg-muted)] font-medium">Switch appearance</span>
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Audit Log Timeline */}
          <div className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--color-fg)]">
                  Administrative Audit Trail
                </h2>
                <p className="text-xs text-[var(--color-fg-muted)]">
                  Chronological record of staff moderation events and system overrides
                </p>
              </div>
              <Badge variant="neutral" className="font-mono text-xs">
                {auditLogs.length} events logged
              </Badge>
            </div>

            <div className="divide-y divide-[var(--color-border-soft)]">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3.5 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--color-fg)]">{log.action}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]">
                        {log.targetType}:{log.targetId}
                      </span>
                    </div>
                    <p className="text-[var(--color-fg-muted)]">{log.details}</p>
                    <p className="text-[10px] text-[var(--color-fg-muted)]">
                      By <span className="font-medium text-[var(--color-fg-2)]">{log.adminName}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--color-fg-muted)] shrink-0">
                    {formatDistanceToNow(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODALS
      ───────────────────────────────────────────────────────────── */}

      {/* 1. Edit User Reputation Modal */}
      {selectedUser && (
        <Modal
          open={isEditUserRepModalOpen}
          onClose={() => setIsEditUserRepModalOpen(false)}
          title={`Adjust Verifier Reputation: ${selectedUser.displayName}`}
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-[var(--color-fg-muted)]">
              Update {selectedUser.displayName}&apos;s trustworthiness reputation score (0–100%).
            </p>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span>Reputation Score</span>
                <span className="font-mono text-[var(--color-brand)] text-base">{newUserReputation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={newUserReputation}
                onChange={(e) => setNewUserReputation(Number(e.target.value))}
                className="w-full h-2 bg-[var(--color-surface-2)] rounded-lg appearance-none cursor-pointer accent-[var(--color-brand)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button intent="secondary" size="sm" onClick={() => setIsEditUserRepModalOpen(false)}>
                Cancel
              </Button>
              <Button intent="primary" size="sm" onClick={handleUpdateReputation}>
                Save Reputation
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Delete User Confirmation Modal */}
      {selectedUser && (
        <Modal
          open={isDeleteUserModalOpen}
          onClose={() => setIsDeleteUserModalOpen(false)}
          title={`Delete User: ${selectedUser.displayName}`}
        >
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-lg bg-[var(--color-v-false-bg)] border border-[var(--color-v-false-border)] text-xs text-[var(--color-v-false)] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Warning: This will permanently delete the verifier profile for <strong>{selectedUser.displayName}</strong> ({selectedUser.email}).
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button intent="secondary" size="sm" onClick={() => setIsDeleteUserModalOpen(false)}>
                Cancel
              </Button>
              <Button intent="primary" size="sm" onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
                Confirm Deletion
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Override Verdict Modal */}
      {selectedClaim && (
        <Modal
          open={isOverrideModalOpen}
          onClose={() => setIsOverrideModalOpen(false)}
          title="Manual Verdict Override"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-[var(--color-fg-muted)] line-clamp-2">
              Claim: &ldquo;{selectedClaim.text}&rdquo;
            </p>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5">
                Consensus Verdict
              </label>
              <select
                value={overrideVerdict}
                onChange={(e) => setOverrideVerdict(e.target.value as Verdict)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)]"
              >
                <option value="TRUE">TRUE (Confirmed Accurate)</option>
                <option value="FALSE">FALSE (Debunked / Misinformation)</option>
                <option value="MISLEADING">MISLEADING (Lacks Context / Exaggerated)</option>
                <option value="UNVERIFIABLE">UNVERIFIABLE (Insufficient Public Evidence)</option>
                <option value="CONTESTED">CONTESTED (Community Divided / Expired)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5">
                Resolution Status
              </label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value as 'pending' | 'verified')}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)]"
              >
                <option value="verified">Verified (Settled Consensus)</option>
                <option value="pending">Pending (Active Review Queue)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span>Confidence Score</span>
                <span className="font-mono text-[var(--color-brand)]">{overrideConfidence}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="99"
                value={overrideConfidence}
                onChange={(e) => setOverrideConfidence(Number(e.target.value))}
                className="w-full h-2 bg-[var(--color-surface-2)] rounded-lg appearance-none cursor-pointer accent-[var(--color-brand)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button intent="secondary" size="sm" onClick={() => setIsOverrideModalOpen(false)}>
                Cancel
              </Button>
              <Button intent="primary" size="sm" onClick={handleApplyVerdictOverride}>
                Apply Verdict Override
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. Edit Claim Text & Category Modal */}
      {selectedClaim && (
        <Modal
          open={isEditClaimModalOpen}
          onClose={() => setIsEditClaimModalOpen(false)}
          title="Edit Claim Text & Category"
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5">
                Claim Text
              </label>
              <textarea
                rows={4}
                value={editClaimText}
                onChange={(e) => setEditClaimText(e.target.value)}
                className="w-full text-xs p-3 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5">
                Category
              </label>
              <select
                value={editClaimCategory}
                onChange={(e) => setEditClaimCategory(e.target.value as ClaimCategory)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)]"
              >
                <option value="health">Health</option>
                <option value="political">Political</option>
                <option value="financial">Financial</option>
                <option value="religious">Religious</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button intent="secondary" size="sm" onClick={() => setIsEditClaimModalOpen(false)}>
                Cancel
              </Button>
              <Button intent="primary" size="sm" onClick={handleSaveClaimEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. Inspect Verifications Modal */}
      {selectedClaim && (
        <Modal
          open={isInspectVerifsModalOpen}
          onClose={() => setIsInspectVerifsModalOpen(false)}
          title={`Verifications Log (${selectedClaim.verifications?.length || 0})`}
        >
          <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto pr-1">
            {selectedClaim.verifications && selectedClaim.verifications.length > 0 ? (
              selectedClaim.verifications.map((v) => (
                <div key={v.id} className="p-3.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border-soft)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <VerdictPill verdict={v.verdict} />
                      <span className="text-xs font-semibold text-[var(--color-fg)]">{v.verifierName}</span>
                      <span className="text-[10px] font-mono text-[var(--color-fg-muted)]">({v.verifierReputation}%)</span>
                    </div>
                    <Button
                      intent="ghost"
                      size="sm"
                      onClick={() => handleDeleteVerification(v.id)}
                      title="Delete this verification"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </Button>
                  </div>
                  <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed">
                    {v.explanation}
                  </p>
                  {v.sourceUrl && (
                    <a
                      href={v.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[var(--color-accent)] hover:underline truncate max-w-full"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {v.sourceUrl}
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--color-fg-muted)] text-center py-6">
                No verifications have been logged for this claim yet.
              </p>
            )}

            <div className="flex items-center justify-end pt-2">
              <Button intent="secondary" size="sm" onClick={() => setIsInspectVerifsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Delete Claim Confirmation Modal */}
      {selectedClaim && (
        <Modal
          open={isDeleteClaimModalOpen}
          onClose={() => setIsDeleteClaimModalOpen(false)}
          title="Delete Claim Permanently"
        >
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-lg bg-[var(--color-v-false-bg)] border border-[var(--color-v-false-border)] text-xs text-[var(--color-v-false)] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Warning: This will permanently delete the claim &ldquo;{selectedClaim.text.slice(0, 60)}...&rdquo; and all associated community verifications from the database.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button intent="secondary" size="sm" onClick={() => setIsDeleteClaimModalOpen(false)}>
                Cancel
              </Button>
              <Button intent="primary" size="sm" onClick={handleDeleteClaim} className="bg-red-600 hover:bg-red-700">
                Confirm Deletion
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. Resolve Report Modal */}
      {selectedReport && (
        <Modal
          open={isResolveReportModalOpen}
          onClose={() => setIsResolveReportModalOpen(false)}
          title={`Resolve Report: ${selectedReport.targetTitle}`}
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-[var(--color-fg-muted)]">
              Report Reason: <strong className="text-[var(--color-fg)]">{selectedReport.reason}</strong>
            </p>
            <p className="text-xs text-[var(--color-fg-muted)]">
              Details: {selectedReport.details}
            </p>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5">
                Resolution Action Notes
              </label>
              <textarea
                rows={3}
                placeholder="Explain the moderation action taken (e.g. Flagged claim for expedited check, penalized reporter, etc.)"
                value={reportActionNotes}
                onChange={(e) => setReportActionNotes(e.target.value)}
                className="w-full text-xs p-3 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-fg)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button intent="secondary" size="sm" onClick={() => setIsResolveReportModalOpen(false)}>
                Cancel
              </Button>
              <Button intent="primary" size="sm" onClick={() => handleResolveReport('resolved')}>
                Mark as Resolved
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 8. Create Incident Ticket Modal */}
      <Modal
        open={isCreateReportModalOpen}
        onClose={() => setIsCreateReportModalOpen(false)}
        title="Create Incident Report"
      >
        <form onSubmit={handleCreateReport} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5">
              Target Type
            </label>
            <select
              value={newReportTargetType}
              onChange={(e) => setNewReportTargetType(e.target.value as ReportTargetType)}
              className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)]"
            >
              <option value="claim">Claim</option>
              <option value="user">Verifier / User Account</option>
              <option value="verification">Source Verification</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5">
              Target Entity Title / Name
            </label>
            <Input
              type="text"
              placeholder="e.g. WhatsApp viral remedy forward #102"
              value={newReportTitle}
              onChange={(e) => setNewReportTitle(e.target.value)}
              required
              className="w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5">
              Target Entity ID (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. c_seed_1 or u103"
              value={newReportTargetId}
              onChange={(e) => setNewReportTargetId(e.target.value)}
              className="w-full text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5">
                Report Reason
              </label>
              <select
                value={newReportReason}
                onChange={(e) => setNewReportReason(e.target.value as ReportReason)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)]"
              >
                <option value="misinformation_spam">Misinformation Spam</option>
                <option value="low_quality_source">Low-Quality Source</option>
                <option value="manipulation">Coordinated Manipulation</option>
                <option value="fake_account">Suspicious / Fake Account</option>
                <option value="harassment">Harassment</option>
                <option value="other">Other Concern</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5">
                Severity
              </label>
              <select
                value={newReportSeverity}
                onChange={(e) => setNewReportSeverity(e.target.value as ReportSeverity)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High (Immediate Action)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5">
              Investigation Details & Notes
            </label>
            <textarea
              rows={3}
              placeholder="Provide evidence or context for staff investigation..."
              value={newReportDetails}
              onChange={(e) => setNewReportDetails(e.target.value)}
              required
              className="w-full text-xs p-3 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-fg)]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button intent="secondary" size="sm" type="button" onClick={() => setIsCreateReportModalOpen(false)}>
              Cancel
            </Button>
            <Button intent="primary" size="sm" type="submit">
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* 9. Broadcast Announcement Modal */}
      <Modal
        open={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        title="Send Broadcast Announcement"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5">
              Broadcast Title
            </label>
            <Input
              type="text"
              placeholder="e.g. High-Volume Misinformation Alert: Financial Scams"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              className="w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5">
              Notification Body
            </label>
            <textarea
              rows={4}
              placeholder="Message shown to all fact-checkers and platform users..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full text-xs p-3 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-fg)]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button intent="secondary" size="sm" onClick={() => setIsBroadcastModalOpen(false)}>
              Cancel
            </Button>
            <Button intent="primary" size="sm" onClick={handleBroadcastNotification}>
              Dispatch Announcement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
