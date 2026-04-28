"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, isLoggedIn } from "@/lib/tokenAssistant";
import LoadingScreen from "@/components/LoadingScreen";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(identifier, password);
      setIsRedirecting(true);
      
      // redirect dashboard early to load in background
      setTimeout(() => {
        router.push("/");
      }, 1300); // adjust delay as needed for better UX
      
      // start fade-out
      setTimeout(() => {
        setIsFading(true);
      }, 600); // fade out after x seconds
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal. Silakan coba lagi.");
      setLoading(false);
    }
  };

  if (isRedirecting) {
    return <LoadingScreen isFading={isFading} />;
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative"
      style={{ backgroundColor: "#F5F0EA" }}
    >
      {/* Background batik pattern overlay */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none"
        style={{ backgroundImage: "url('/batik-pattern.png')" }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[400px] mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E0D6" }}
      >
        {/* Top accent bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: "#2B1D10" }} />

        {/* Header / Logo area */}
        <div
          className="flex flex-col items-center py-10 px-8"
          style={{ backgroundColor: "#2B1D10" }}
        >
          <img
            src="/logo.png"
            alt="Odza Classic"
            className="h-[72px] w-auto object-contain filter brightness-0 invert mb-3"
          />
          <span
            className="text-[11px] tracking-[0.35em] uppercase font-medium"
            style={{ color: "#D4AF37", letterSpacing: "0.35em" }}
          >
            Warehouse System
          </span>
        </div>

        {/* Form area */}
        <div className="px-8 py-8 flex flex-col gap-5">

          {/* Error */}
          {error && (
            <div
              className="px-4 py-3 rounded-lg text-[13px] font-medium"
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#B91C1C",
              }}
            >
              {error}
            </div>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleLogin}>

            {/* Username / Email */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[12px] font-bold uppercase tracking-widest"
                style={{ color: "#555" }}
              >
                Username atau Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                required
                autoComplete="username"
                placeholder="Masukkan username atau email"
                className="w-full px-4 py-3 rounded-lg text-[14px] font-medium outline-none transition-all disabled:opacity-50"
                style={{
                  backgroundColor: "#FAFAF8",
                  border: "1.5px solid #E8E8E4",
                  color: "#1A1A1A",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#D4AF37";
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E8E8E4";
                  e.currentTarget.style.backgroundColor = "#FAFAF8";
                }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[12px] font-bold uppercase tracking-widest"
                style={{ color: "#555" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="current-password"
                placeholder="Masukkan password"
                className="w-full px-4 py-3 rounded-lg text-[14px] font-medium outline-none transition-all disabled:opacity-50"
                style={{
                  backgroundColor: "#FAFAF8",
                  border: "1.5px solid #E8E8E4",
                  color: "#1A1A1A",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#D4AF37";
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E8E8E4";
                  e.currentTarget.style.backgroundColor = "#FAFAF8";
                }}
              />
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRemember(!remember)}
                disabled={loading}
                aria-checked={remember}
                role="switch"
                className="relative flex-shrink-0 w-10 h-[22px] rounded-full transition-colors duration-200 disabled:opacity-50 focus:outline-none"
                style={{
                  backgroundColor: remember ? "#2B1D10" : "#D7CCC8",
                }}
              >
                <span
                  className="absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                  style={{ left: remember ? "22px" : "3px" }}
                />
              </button>
              <span className="text-[13px] font-medium" style={{ color: "#777" }}>
                Ingat saya
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg text-[14px] font-bold tracking-wide transition-all mt-1 disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                backgroundColor: loading ? "#7B6355" : "#2B1D10",
                color: "#FFFFFF",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = "#3E2723";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = "#2B1D10";
              }}
            >
              {loading ? "Memproses..." : "MASUK"}
            </button>

          </form>
        </div>

        {/* Footer */}
        <div
          className="px-8 py-4 text-center"
          style={{ borderTop: "1px solid #F0EDE8" }}
        >
          <p className="text-[11px] font-medium" style={{ color: "#BBBBBB" }}>
            © {new Date().getFullYear()} Odza Classic · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}