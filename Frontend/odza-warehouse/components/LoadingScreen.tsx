// Loading transition screen from login to dashboard.

export default function LoadingScreen({ isFading = false }: { isFading?: boolean }) {
  return (
    <div className={`w-full h-screen bg-gray-50 flex flex-col items-center justify-center transition-opacity duration-500 ${
      isFading ? 'opacity-0' : 'opacity-100'
    }`}>
      {/* Logo */}
      <div className="flex flex-col items-center mb-12">
        <p
          className="text-5xl font-bold text-gray-900"
          style={{ fontFamily: "Georgia, serif", letterSpacing: "-1px" }}
        >
          ODZA
        </p>
        <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mt-1">
          Classic
        </p>
        <p className="text-sm text-gray-400">Warehouse</p>
      </div>

      {/* Loading spinner */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gray-600 border-r-gray-600 animate-spin"></div>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">Loading Dashboard</p>
          <p className="text-xs text-gray-400 mt-1">Preparing your warehouse...</p>
        </div>
      </div>

      {/* Dots animation */}
      <div className="mt-12 flex items-center gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
      </div>
    </div>
  );
}
