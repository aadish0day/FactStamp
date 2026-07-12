import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, ClipboardCheck, Star, BarChart3, Scale } from "lucide-react";
import clsx from "clsx";
import { useData } from "../context/DataContext.jsx";
import "./NotificationBell.css";

const TYPE_ICON = {
  claim_verified: ClipboardCheck,
  reputation_update: Star,
  weekly_report: BarChart3,
  verdict_submitted: Scale,
};

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead } = useData();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const handleItem = (n) => {
    markRead(n.id);
    setOpen(false);
    if (n.claimId) navigate(`/claim/${n.claimId}`);
  };

  const display = notifications.slice(0, 8);

  return (
    <div className="nbell" ref={ref}>
      <button
        className="nbell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="nbell-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="nbell-dropdown">
          <div className="nbell-header">
            <span className="nbell-title">Notifications</span>
            <button className="nbell-markall" onClick={markAllRead}>
              Mark all read
            </button>
          </div>

          {display.length === 0 ? (
            <div className="nbell-empty">
              <BellOff size={18} /> No notifications yet
            </div>
          ) : (
            <div className="nbell-list">
              {display.map((n) => {
                const Icon = TYPE_ICON[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    className={clsx(
                      "nbell-item",
                      !n.isRead && "nbell-item--unread",
                    )}
                    onClick={() => handleItem(n)}
                  >
                    <span className="nbell-item-icon">
                      <Icon size={16} />
                    </span>
                  <span className="nbell-item-body">
                    <span className="nbell-item-msg">{n.message}</span>
                    <span className="nbell-item-time mono">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function timeAgo(iso) {
  const now = new Date("2026-07-12T12:00:00Z");
  const then = new Date(iso);
  const diff = Math.max(0, now - then);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(hr / 24);
  if (hr < 1) return "just now";
  if (hr < 24) return `${hr}h ago`;
  if (day < 30) return `${day}d ago`;
  return `${Math.floor(day / 30)}mo ago`;
}
