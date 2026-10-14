import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, ExternalLink, Key, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

export const GoogleSignInButton = ({
  onSuccess,
  onError,
  loading = false,
  label = 'Continue with Google',
  className = '',
}) => {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const buttonDivRef = useRef(null);

  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

  useEffect(() => {
    // Check if google gsi client is loaded
    const checkGsi = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        setIsGsiLoaded(true);
        return true;
      }
      return false;
    };

    if (checkGsi()) return;

    const interval = setInterval(() => {
      if (checkGsi()) {
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!clientId || !isGsiLoaded || !buttonDivRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response && response.credential) {
            onSuccess(response.credential);
          } else {
            onError?.('No credential returned by Google');
          }
        },
      });

      const googleBtnText = label.toLowerCase().includes('sign up')
        ? 'signup_with'
        : 'continue_with';
      const containerWidth = buttonDivRef.current?.offsetWidth || 340;
      const btnWidth = Math.min(400, Math.max(220, containerWidth));

      // Render official Google button into container
      buttonDivRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonDivRef.current, {
        theme: 'outline',
        size: 'large',
        text: googleBtnText,
        shape: 'rectangular',
        width: btnWidth,
        logo_alignment: 'center',
      });
    } catch (err) {
      console.warn('Failed to render official Google button:', err);
    }
  }, [clientId, isGsiLoaded, label, onSuccess, onError]);

  const handleClick = () => {
    if (!clientId) {
      setShowSetupModal(true);
      return;
    }

    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification && notification.isNotDisplayed && notification.isNotDisplayed()) {
            console.warn('Google One Tap not displayed:', notification.getNotDisplayedReason?.());
          }
        });
      } catch (err) {
        console.warn('Google prompt failed:', err);
      }
    } else {
      setShowSetupModal(true);
    }
  };

  return (
    <>
      <div className={`w-full flex flex-col items-center ${className}`}>
        {clientId && isGsiLoaded ? (
          <div className="w-full flex justify-center min-h-[44px]">
            <div ref={buttonDivRef} className="w-full flex justify-center" />
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className="w-full h-11 px-4 py-2.5 bg-white hover:bg-[#F8FAFC] active:bg-[#EEF2F8] border border-[#CBD5E1] hover:border-[#94A3B8] rounded-[12px] flex items-center justify-center gap-3 text-sm font-bold text-[#334155] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#0FA38F]/30 disabled:opacity-60 cursor-pointer"
          >
            {/* Google official SVG logo */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Connecting to Google...' : label}</span>
          </button>
        )}
      </div>

      {/* Google OAuth Setup Guide Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B3A]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-[24px] border border-[#E3E8F0] p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowSetupModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-[#8B96AB] hover:text-[#0B1B3A] hover:bg-[#EEF2F8] transition-colors"
              aria-label="Close setup modal"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#EEF2F8] text-[#4285F4] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0B1B3A]">
                  Google Sign-In Configuration
                </h3>
                <p className="text-xs font-bold text-[#8B96AB] uppercase tracking-wider">
                  One-time OAuth Setup
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-[#53607A] font-medium leading-relaxed my-4">
              <div className="p-3.5 rounded-[14px] bg-[#FFF8EB] border border-[#FDE68A] flex items-start gap-2.5 text-[#92400E]">
                <AlertTriangle size={18} className="shrink-0 mt-0.5 text-[#D97706]" />
                <span>
                  Google OAuth requires a valid <strong>Google Client ID</strong> to exchange secure sign-in tokens with Google Identity Services.
                </span>
              </div>

              <div className="p-4 rounded-[14px] bg-[#F4F7FB] border border-[#E3E8F0] space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0FA38F] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                  <div>
                    <strong className="text-[#0B1B3A]">Open Google Cloud Console:</strong>
                    <p className="text-[#53607A] mt-0.5">
                      Visit{' '}
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0FA38F] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        console.cloud.google.com/apis/credentials
                        <ExternalLink size={12} />
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0FA38F] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                  <div>
                    <strong className="text-[#0B1B3A]">Create OAuth 2.0 Client ID:</strong>
                    <p className="text-[#53607A] mt-0.5">
                      Select <strong>Web application</strong>. Under <em>Authorized JavaScript origins</em>, add:
                    </p>
                    <div className="mt-1 font-mono text-[11px] bg-white p-2 rounded border border-[#E3E8F0] text-[#0B1B3A] space-y-1">
                      <div>http://localhost:5190</div>
                      <div>http://localhost:5191</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0FA38F] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                  <div>
                    <strong className="text-[#0B1B3A]">Add to Environment Variables:</strong>
                    <p className="text-[#53607A] mt-0.5">
                      Copy the Client ID and add to your client and server configuration:
                    </p>
                    <div className="mt-1 font-mono text-[11px] bg-white p-2.5 rounded border border-[#E3E8F0] text-[#0B1B3A] space-y-1">
                      <div className="text-[#8B96AB]"># client/.env</div>
                      <div>VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</div>
                      <div className="text-[#8B96AB] mt-1"># server/.env</div>
                      <div>GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[#8B96AB] italic">
                Tip: You can continue logging in directly with your email and password in the meantime.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full mt-2"
              onClick={() => setShowSetupModal(false)}
            >
              Understood
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleSignInButton;
