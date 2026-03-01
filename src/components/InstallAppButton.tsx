'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkInstalled()) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible || isInstalled) return null;

  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        @keyframes iconPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        .install-button {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 9999;
          animation: fadeInUp 0.5s ease-out;
        }
        .install-button-inner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9));
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
        }
        .install-button-inner:hover {
          transform: scale(1.03);
          box-shadow: 0 6px 25px rgba(99, 102, 241, 0.4);
        }
        .install-icon {
          font-size: 1.25rem;
          animation: iconPulse 2s ease-in-out infinite;
        }
        .install-text {
          display: flex;
          flex-direction: column;
        }
        .install-title {
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          margin: 0;
        }
        .install-subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.7rem;
          margin: 0;
        }
        @media (max-width: 480px) {
          .install-button {
            bottom: 1rem;
            right: 1rem;
            left: 1rem;
          }
          .install-button-inner {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div className="install-button">
        <button
          className="install-button-inner"
          onClick={handleInstall}
          aria-label="Instalar aplicativo"
        >
          <span className="install-icon">📲</span>
          <div className="install-text">
            <p className="install-title">Instalar App</p>
            <p className="install-subtitle">Use como aplicativo no seu celular</p>
          </div>
        </button>
      </div>
    </>
  );
}
