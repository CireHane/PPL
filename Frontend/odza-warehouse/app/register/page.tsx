"use client";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm mx-auto px-4">
      <div className="bg-gray-50 rounded-2xl px-8 py-10 shadow-sm border border-gray-100">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <p className="text-4xl font-bold tracking-tight text-gray-900"
            style={{ fontFamily: "Georgia, serif", letterSpacing: "-1px" }}>
            ODZA
          </p>
          <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mt-0.5">Classic</p>
          <p className="text-sm text-gray-400">Warehouse</p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-700 mb-1.5 block">Name</label>
            <input
              type="text"
              className="w-full bg-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-400 text-gray-800"
            />
          </div>
          <div>
            <label className="text-sm text-gray-700 mb-1.5 block">Email</label>
            <input
              type="email"
              className="w-full bg-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-400 text-gray-800"
            />
          </div>
          <div>
            <label className="text-sm text-gray-700 mb-1.5 block">Password</label>
            <input
              type="password"
              className="w-full bg-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-400 text-gray-800"
            />
          </div>
          <div>
            <label className="text-sm text-gray-700 mb-1.5 block">Confirm Password</label>
            <input
              type="password"
              className="w-full bg-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-400 text-gray-800"
            />
          </div>

          {/* Register button */}
          <button className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3.5 rounded-lg text-sm transition-colors mt-2">
            Register
          </button>

          {/* Login link */}
          <p className="text-center text-xs text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-gray-600 underline hover:text-gray-900">
              Sign in.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}