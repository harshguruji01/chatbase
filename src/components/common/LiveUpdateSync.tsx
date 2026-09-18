import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { OutlinedButton } from './OutlinedButton';

export const LiveUpdateSync: React.FC = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkVersion = async () => {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const storedBuild = localStorage.getItem('chatbase_build_time');
        if (storedBuild && Number(storedBuild) < Number(data.buildTime)) {
          setHasUpdate(true);
        } else if (!storedBuild) {
          localStorage.setItem('chatbase_build_time', String(data.buildTime));
        }
      }
    } catch {
      // Offline or network error
    }
  };

  useEffect(() => {
    // Initial check
    checkVersion();

    // Check periodically every 2 minutes or when user resumes window/app
    const interval = setInterval(checkVersion, 120000);
    const handleFocus = () => checkVersion();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleApplyUpdate = () => {
    setIsUpdating(true);
    // Clear old caches and reload
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    // Update stored build time
    fetch(`/version.json?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        localStorage.setItem('chatbase_build_time', String(data.buildTime));
        window.location.reload();
      })
      .catch(() => {
        window.location.reload();
      });
  };

  if (!hasUpdate || dismissed) return null;

  return (
    <div
      className="fade-in-up"
      style={{
        position: 'fixed',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        width: '92%',
        maxWidth: '460px',
        background: 'var(--bg-modal)',
        border: '1.5px solid var(--color-primary)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
            flexShrink: 0,
          }}
        >
          <Sparkles size={18} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
            New Update Ready!
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Web updates are live. Tap to update the app.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <OutlinedButton
          variant="primary"
          size="sm"
          onClick={handleApplyUpdate}
          isLoading={isUpdating}
          icon={<RefreshCw size={12} />}
        >
          Update
        </OutlinedButton>

        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
          }}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
