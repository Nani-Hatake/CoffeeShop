import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import MobileFrame from "../components/MobileFrame.jsx";
import AuthWebShell from "../components/AuthWebShell.jsx";
import { api } from "../api";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, verify, refresh } = useAuth();
  const toast = useToast();
  const isMobile = useIsMobile();
  const email = location.state?.email || user?.email || "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const inputs = useRef([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  const setDigit = (i, v) => {
    const ch = v.replace(/\D/g, "").slice(0, 1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    if (ch && i < 5) inputs.current[i + 1]?.focus();
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    const code = digits.join("");
    if (code.length < 6) return;
    setBusy(true);
    try {
      await verify(email, code);
      await refresh();
      toast.push("Email verified.", { tone: "success" });
      navigate("/home", { replace: true });
    } catch (err) {
      toast.push(err.message || "Invalid code", { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await api.resendCode(email);
      toast.push("Sent a fresh code.");
    } catch (err) {
      toast.push(err.message || "Could not resend code", { tone: "error" });
    }
  };

  const codeInputs = (
    <form onSubmit={submit}>
      <div className="flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i] && i > 0) {
                inputs.current[i - 1]?.focus();
              }
            }}
            inputMode="numeric"
            maxLength={1}
            className="flex-1 h-14 text-center font-serif text-3xl rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
          />
        ))}
      </div>
      <button
        type="submit"
        disabled={busy || digits.join("").length < 6}
        className="mt-8 w-full h-14 rounded-full bg-primary text-on-primary font-medium tracking-wide hover:opacity-90 transition disabled:opacity-60"
      >
        {busy ? "Verifying…" : "Verify"}
      </button>
    </form>
  );

  if (!isMobile) {
    return (
      <AuthWebShell
        image="https://images.unsplash.com/photo-1442550528053-c431ecb55509?auto=format&fit=crop&w=1600&q=80"
        caption="One last sip and you're in."
      >
        <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Verify your email</p>
        <h1 className="font-serif text-5xl text-primary mt-3 leading-tight">One last sip.</h1>
        <p className="text-on-surface-variant mt-3">
          We sent a 6-digit code to <strong className="text-primary">{email || "your inbox"}</strong>.
          In dev mode any 6-digit code works.
        </p>
        <div className="mt-10">{codeInputs}</div>
        <button onClick={resend} className="mt-8 w-full text-on-surface-variant underline underline-offset-4 hover:text-primary transition">
          Resend code
        </button>
      </AuthWebShell>
    );
  }

  return (
    <MobileFrame>
      <div className="px-margin-mobile pt-12 pb-10 min-h-screen flex flex-col">
        <Link to="/join" className="text-primary inline-flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back
        </Link>
        <div className="mt-10">
          <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">Verify your email</p>
          <h1 className="font-serif text-[36px] leading-tight text-primary mt-2">One last sip.</h1>
          <p className="text-on-surface-variant mt-3">
            We sent a 6-digit code to <strong className="text-primary">{email || "your inbox"}</strong>.
            In dev mode any 6-digit code works.
          </p>
        </div>
        <div className="mt-10">{codeInputs}</div>
        <button onClick={resend} className="mt-auto pt-10 text-center text-on-surface-variant underline underline-offset-4">
          Resend code
        </button>
      </div>
    </MobileFrame>
  );
}
