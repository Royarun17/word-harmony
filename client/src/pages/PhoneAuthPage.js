import React, { useState, useRef } from 'react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../utils/firebase';

const T = {
  pageBg:'#F7F2EA', cardBg:'#FFFFFF', border:'#E8E0D0',
  textPrimary:'#1A1A2E', textSecondary:'#9B8E7A', textMuted:'#C4B9A8',
  gold:'#C8930C', teal:'#1A8C8C', red:'#E94560', navy:'#1A1A2E',
  white:'#FFFFFF', tabBg:'#F0EDE8',
};

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
      // Start resend timer
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
    <div style={{ minHeight:'100vh', background:T.pageBg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{`@keyframes wh-pop{0%{transform:scale(0.95);opacity:0;}100%{transform:scale(1);opacity:1;}}.wh-pop{animation:wh-pop 0.25s cubic-bezier(.34,1.56,.64,1) forwards;}`}</style>
      <div id="recaptcha-container"/>

      <div className="wh-pop" style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:20, padding:28, width:'100%', maxWidth:400, boxShadow:'0 8px 32px rgba(26,26,46,0.1)' }}>
        <button onClick={()=>onNavigate('welcome')} style={{ background:'none', border:'none', color:T.textSecondary, fontSize:13, cursor:'pointer', marginBottom:16, padding:0 }}>← Back</button>

        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:44, marginBottom:8 }}>📱</div>
          <h2 style={{ fontSize:20, fontWeight:700, color:T.navy, fontFamily:'Georgia,serif', margin:0 }}>
            {step==='phone' ? 'Enter phone number' : 'Verify your phone'}
          </h2>
          <p style={{ fontSize:12, color:T.textSecondary, marginTop:4 }}>
            {step==='phone' ? "We'll send you a 6-digit code" : `Code sent to ${countryCode} ${phone}`}
          </p>
        </div>

        {error && <p style={{ color:T.red, fontSize:12, marginBottom:12, textAlign:'center', background:'#FEE2E2', padding:'8px 12px', borderRadius:8 }}>{error}</p>}

        {step === 'phone' ? (
          <>
            <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Phone number</p>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              <select value={countryCode} onChange={e=>setCountryCode(e.target.value)}
                style={{ padding:'12px 8px', borderRadius:10, border:`1.5px solid ${T.border}`, background:T.white, color:T.textPrimary, fontSize:13, outline:'none', cursor:'pointer' }}>
                {countryCodes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="98765 43210" type="tel"
                style={{ flex:1, padding:'12px 14px', borderRadius:10, border:`1.5px solid ${T.border}`, background:T.white, color:T.textPrimary, fontSize:14, outline:'none', boxSizing:'border-box' }}
                onFocus={e=>e.target.style.borderColor=T.gold} onBlur={e=>e.target.style.borderColor=T.border}/>
            </div>
            <button onClick={handleSendOTP} disabled={loading} style={{
              width:'100%', padding:'14px', borderRadius:12, border:'none',
              background:`linear-gradient(135deg,${T.gold},#A07010)`,
              color:T.navy, fontSize:14, fontWeight:800, fontFamily:'Georgia,serif',
              cursor:'pointer', boxShadow:'0 4px 16px rgba(200,147,12,0.3)',
            }}>
              {loading ? 'Sending…' : 'Send OTP →'}
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Enter 6-digit code</p>
            <div style={{ display:'flex', gap:8, marginBottom:16, justifyContent:'center' }}>
              {otp.map((digit, i) => (
                <input key={i} ref={el=>otpRefs.current[i]=el}
                  value={digit} onChange={e=>handleOtpChange(e.target.value,i)}
                  onKeyDown={e=>handleOtpKeyDown(e,i)}
                  maxLength={1} type="tel"
                  style={{ width:44, height:52, borderRadius:10, border:`2px solid ${digit?T.gold:T.border}`, background: digit?'#FEF3E2':T.white, textAlign:'center', fontSize:20, fontWeight:700, color:T.navy, outline:'none', transition:'all 0.15s' }}/>
              ))}
            </div>
            <button onClick={handleVerifyOTP} disabled={loading} style={{
              width:'100%', padding:'14px', borderRadius:12, border:'none',
              background:`linear-gradient(135deg,${T.teal},#115E59)`,
              color:T.white, fontSize:14, fontWeight:800, fontFamily:'Georgia,serif',
              cursor:'pointer', boxShadow:'0 4px 16px rgba(26,140,140,0.3)', marginBottom:12,
            }}>
              {loading ? 'Verifying…' : 'Verify OTP →'}
            </button>
            <div style={{ textAlign:'center', fontSize:12, color:T.textSecondary }}>
              {resendTimer > 0 ? `Resend code in ${resendTimer}s` : (
                <button onClick={handleSendOTP} style={{ background:'none', border:'none', color:T.gold, fontSize:12, fontWeight:700, cursor:'pointer' }}>Resend code</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
