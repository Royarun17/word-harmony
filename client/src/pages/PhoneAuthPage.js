import React, { useState, useRef } from 'react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../utils/firebase';
import { ThemeSwitcher } from '../SynapseComponents';

export default function PhoneAuthPage({ onNavigate }) {
  const [phone, setPhone]           = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp]               = useState(['','','','','','']);
  const [step, setStep]             = useState('phone'); // phone | otp
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const confirmationRef             = useRef(null);
  const otpRefs                     = useRef([]);

  async function handleSendOTP() {
    if (!phone.trim()) { setError('Enter your phone number'); return; }
    setLoading(true); setError('');
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size:'invisible' });
      }
      const result = await signInWithPhoneNumber(auth, `${countryCode}${phone}`, window.recaptchaVerifier);
      confirmationRef.current = result;
      setStep('otp');
      let t = 30;
      setResendTimer(t);
      const interval = setInterval(() => { t--; setResendTimer(t); if (t<=0) clearInterval(interval); }, 1000);
    } catch (err) { setError('Failed to send OTP. Check your number.'); }
    setLoading(false);
  }

  async function handleVerifyOTP() {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter the 6-digit code'); return; }
    setLoading(true); setError('');
    try {
      const result = await confirmationRef.current.confirm(code);
      onNavigate('checkProfile', { user: result.user });
    } catch { setError('Wrong code. Try again.'); }
    setLoading(false);
  }

  function handleOtpChange(val, idx) {
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) otpRefs.current[idx+1]?.focus();
  }

  function handleOtpKeyDown(e, idx) {
    if (e.key==='Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx-1]?.focus();
  }

  const countryCodes = ['+91','+1','+44','+61','+971','+65','+81','+82','+55','+234'];

  return (
    <div className="scene" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <ThemeSwitcher />
      <style>{`
        @media (orientation: landscape) and (max-width: 900px) and (max-height: 500px) {
          .auth-content { flex-direction: row !important; align-items: flex-start !important; gap: 28px; padding: 16px 28px !important; overflow: hidden !important; }
          .auth-left { flex: 0 0 240px; overflow: hidden; }
          .auth-wordmark { margin-bottom: 10px !important; }
          .auth-wordmark > div:last-child { font-size: 26px !important; }
          .auth-right { flex: 1; min-width: 0; overflow-y: auto; max-height: calc(100dvh - 32px); padding-right: 4px; }
          .auth-header-block { margin-bottom: 10px !important; }
          .auth-header-block h1 { font-size: 20px !important; margin-bottom: 2px !important; }
          .auth-header-block p { display: none; }
          .auth-panel { padding: 12px !important; gap: 8px !important; }
        }
      `}</style>
      <div id="recaptcha-container"/>

      <div className="scene-content auth-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '56px 24px 32px', overflowY: 'auto' }}>

        <div className="auth-left">
          {/* Back button */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            <button onClick={() => onNavigate('welcome')} className="tap-target" style={{ width: 44, height: 44, borderRadius: 99, background: 'oklch(0.22 0.03 232 / 0.7)', border: '1px solid var(--border)', color: 'var(--ink)', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 18, backdropFilter: 'blur(8px)' }}>
              ‹
            </button>
          </div>

          {/* Synapse wordmark — floating with glow, matching Sign In/Sign Up */}
          <div className="auth-wordmark" style={{ textAlign: 'center', marginBottom: 32, position: 'relative', animation: 'syn-float 6s ease-in-out infinite' }}>
            <div aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 160, height: 80, background: 'radial-gradient(ellipse 70% 60% at 50% 50%, var(--accent), transparent 70%)', filter: 'blur(24px)', opacity: 0.6, pointerEvents: 'none' }}/>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 40, lineHeight: 1, letterSpacing: '-0.02em', position: 'relative' }}>
              <span style={{ color: 'var(--ink)' }}>Syn</span>
              <span style={{ color: 'var(--accent)', textShadow: '0 0 22px oklch(0.82 0.16 195 / 0.7)' }}>apse</span>
            </div>
          </div>

          {/* Header */}
          <div className="auth-header-block" style={{ marginBottom: 24, animation: 'syn-rise 500ms cubic-bezier(.2,.8,.2,1) both' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.32em', color: 'var(--accent)', marginBottom: 8 }}>Phone sign-in</div>
            <h1 style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 8 }}>
              {step === 'phone' ? 'Enter phone number' : 'Verify your phone'}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-dim)' }}>
              {step === 'phone' ? "We'll send you a 6-digit code" : `Code sent to ${countryCode} ${phone}`}
            </p>
          </div>
        </div>

        <div className="auth-right">
          <div style={{ animation: 'syn-rise 600ms 80ms cubic-bezier(.2,.8,.2,1) both' }}>

            <div className="panel auth-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16, padding: 12, background: 'oklch(0.68 0.22 22 / 0.12)', border: '1px solid oklch(0.68 0.22 22 / 0.5)', color: 'var(--danger)', animation: 'syn-pop 260ms cubic-bezier(.2,.8,.2,1) both' }} role="alert">
                  <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
                  <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{error}</div>
                </div>
              )}

              {step === 'phone' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 8, color: 'var(--ink-dim)' }}>
                      Phone number
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                        className="num"
                        style={{ padding: '0 10px', borderRadius: 24, border: '1px solid var(--border)', background: 'oklch(0.22 0.03 232 / 0.85)', color: 'var(--ink)', fontSize: 14, minHeight: 56, outline: 'none', cursor: 'pointer' }}>
                        {countryCodes.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="98765 43210" type="tel"
                        style={{ flex: 1, padding: '0 16px', borderRadius: 24, border: '1px solid var(--border)', background: 'oklch(0.22 0.03 232 / 0.85)', color: 'var(--ink)', fontSize: 16, minHeight: 56, outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}/>
                    </div>
                  </div>

                  <button type="button" onClick={handleSendOTP} disabled={loading}
                    className="btn-primary tap-target"
                    style={{ opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {loading ? '⏳ Sending…' : 'Send OTP →'}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 10, color: 'var(--ink-dim)' }}>
                      Enter 6-digit code
                    </label>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      {otp.map((digit, i) => (
                        <input key={i} ref={el => otpRefs.current[i] = el}
                          value={digit} onChange={e => handleOtpChange(e.target.value, i)}
                          onKeyDown={e => handleOtpKeyDown(e, i)}
                          maxLength={1} type="tel" className="num"
                          style={{
                            width: 44, height: 56, borderRadius: 14,
                            border: `1.5px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
                            background: digit ? 'oklch(0.82 0.16 195 / 0.12)' : 'oklch(0.22 0.03 232 / 0.85)',
                            boxShadow: digit ? '0 0 0 4px oklch(0.82 0.16 195 / 0.18)' : 'none',
                            textAlign: 'center', fontSize: 20, fontWeight: 700, color: 'var(--ink)', outline: 'none', transition: 'all 150ms',
                          }}/>
                      ))}
                    </div>
                  </div>

                  <button type="button" onClick={handleVerifyOTP} disabled={loading}
                    className="btn-primary tap-target"
                    style={{ opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {loading ? '⏳ Verifying…' : 'Verify OTP →'}
                  </button>

                  <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-dim)' }}>
                    {resendTimer > 0 ? (
                      <span className="num">Resend code in {resendTimer}s</span>
                    ) : (
                      <button onClick={handleSendOTP} type="button" style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                        Resend code
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
