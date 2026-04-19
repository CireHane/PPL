"use client";

import Link from "next/link";

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
    <div className="w-full max-w-[420px] bg-white rounded-[32px] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-stone-100">
      
      <div className="flex justify-center mb-8 mt-2">
        <img 
          src="/logo.png" 
          alt="Odza Classic Warehouse" 
          className="h-[150px] w-auto object-contain" 
        />
      </div>

      {/* ── Form ── */}
      <form className="flex flex-col gap-4">
        
        {/* Email Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-stone-500">Email</label>
          <input 
            type="email" 
            placeholder="Enter your email"
            className="w-full h-[52px] bg-[#F5F5F5] rounded-2xl px-4 text-[14px] text-[#1A1A1A] outline-none focus:ring-2 focus:ring-stone-200 transition-all placeholder:text-stone-400"
          />
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-stone-500">Password</label>
          <input 
            type="password" 
            placeholder="Enter your password"
            className="w-full h-[52px] bg-[#F5F5F5] rounded-2xl px-4 text-[14px] text-[#1A1A1A] outline-none focus:ring-2 focus:ring-stone-200 transition-all placeholder:text-stone-400"
          />
        </div>

        {/* ── PERBAIKAN TOTAL SAKELAR (Toggle Switch) ── */}
        <label className="relative inline-flex items-center cursor-pointer mt-1 group w-max">
          <input type="checkbox" className="sr-only peer" />
          
          {/* Pembungkus luar sakelar h-6 w-10 */}
          <div className="w-10 h-6 bg-stone-200 rounded-full transition-colors peer peer-checked:bg-[#1A1A1A] 
                          {/* Jarak simetris 2px di kedua sisi */}
                          after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                          after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-transform 
                          {/* Nilai geser presisi agar tidak menabrak sisi kanan */}
                          peer-checked:after:translate-x-[16px] peer-checked:after:border-white">
          </div>
          
          <span className="ml-3 text-[13px] font-medium text-stone-500 group-hover:text-stone-700 transition-colors">
            Remember me?
          </span>
        </label>

        {/* Login Button */}
        <Link 
          href="/"
          className="w-full h-[52px] mt-4 bg-[#1A1A1A] hover:bg-[#333333] text-white text-[15px] font-medium rounded-2xl flex items-center justify-center transition-colors shadow-md"
        >
          Login
        </Link>
      </form>

      {/* Redirect to Register */}
      <div className="mt-8 text-center">
        <Link href="/register" className="text-[13px] font-medium text-stone-500 hover:text-[#1A1A1A] underline underline-offset-4 transition-colors">
          Create Account
        </Link>
      </div>
    </div>
  );
}