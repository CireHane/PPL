"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/tokenAssistant";
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(identifier, password);
      // Immediately show loading screen
      setIsRedirecting(true);
      
      // start fade-out
      setTimeout(() => {
        setIsFading(true);
      }, 900);
      
      // redirect
      setTimeout(() => {
        router.push("/");
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
      setLoading(false);
    }
  };

  if (isRedirecting) {
    return <LoadingScreen isFading={isFading} />;
  }

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      <div className="bg-gray-50 rounded-2xl px-8 py-10 shadow-sm border border-gray-100">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <p
            className="text-4xl font-bold text-gray-900"
            style={{ fontFamily: "Georgia, serif", letterSpacing: "-1px" }}
          >
            ODZA
          </p>
          <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mt-0.5">
            Classic
          </p>
          <p className="text-sm text-gray-400">Warehouse</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleLogin}>

          {/* Email or Username */}
          <div>
            <label className="text-sm text-gray-700 mb-1.5 block">Email or Username</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
              required
              className="w-full bg-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-400 text-gray-800 disabled:opacity-50"
              placeholder="Enter email or username"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-gray-700 mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full bg-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-400 text-gray-800 disabled:opacity-50"
              placeholder="Password"
            />
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRemember(!remember)}
              disabled={loading}
              className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 disabled:opacity-50 ${
                remember ? "bg-gray-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                  remember ? "left-4" : "left-0.5"
                }`}
              />
            </button>
            <span className="text-xs text-gray-500">Remember me?</span>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-medium py-3.5 rounded-lg text-sm transition-colors mt-1 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Register link */}
          <p className="text-center text-xs text-gray-400">
            Don't have an account?{" "}
            <Link href="/register" className="text-gray-600 underline hover:text-gray-900">
              Register
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
}