"use client";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [remember, setRemember] = useState(false);

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

        {/* Form */}
        <div className="flex flex-col gap-4">

          {/* Email */}
          <div>
            <label className="text-sm text-gray-700 mb-1.5 block">Email</label>
            <input
              type="email"
              className="w-full bg-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-400 text-gray-800"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-gray-700 mb-1.5 block">Password</label>
            <input
              type="password"
              className="w-full bg-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-400 text-gray-800"
            />
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRemember(!remember)}
              className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${
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
          <button className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3.5 rounded-lg text-sm transition-colors mt-1">
            Login
          </button>

          {/* Register link */}
          <p className="text-center text-xs text-gray-400">
            Don't have an account?{" "}
            <Link href="/register" className="text-gray-600 underline hover:text-gray-900">
              Register
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}