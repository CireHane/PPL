"use client";

import { useState, useRef, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Plus,
  ChevronDown,
} from "lucide-react";
import {
  submitScan,
  getSessionState,
  BarcScanResponse,
} from "@/lib/barcScanService";

interface ScanEntry {
  id: string;
  barcode: string;
  type: string;
  status: "success" | "error";
  message: string;
  timestamp: string;
}

interface ScanConsoleProps {
  mode: "inbound" | "outbound";
  sessionId: string;
  onSessionComplete?: () => void;
}

const STEP_CONFIGS = {
  inbound: {
    steps: [
      { step: 0, label: "Ready to scan SKU", hint: "Format: A-Z0-9 with optional * or -" },
      { step: 1, label: "Ready to scan RAK location", hint: "Format: X-##-##" },
      { step: 2, label: "✅ Inbound complete!", hint: "" },
    ],
    endpoint: "/scan/inbound",
  },
  outbound: {
    steps: [
      { step: 0, label: "Ready to scan Channel", hint: "Format: CHANNEL_CODE" },
      { step: 1, label: "Ready to scan RESI", hint: "Format: RESI_CODE" },
      { step: 2, label: "Ready to scan SKU", hint: "Format: A-Z0-9 with optional * or -" },
      { step: 3, label: "Ready to scan RAK location", hint: "Format: X-##-##" },
      { step: 4, label: "✅ Outbound complete!", hint: "" },
    ],
    endpoint: "/scan/outbound",
  },
};

export default function ScanConsole({
  mode = "inbound",
  sessionId,
  onSessionComplete,
}: ScanConsoleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [scanHistory, setScanHistory] = useState<ScanEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<string>("");
  const [lastSuccess, setLastSuccess] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const config = STEP_CONFIGS[mode];
  const currentStepConfig = config.steps[currentStep];

  // Auto-focus input on mount and after each scan
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentStep]);

  // Poll session state every 2 seconds to stay in sync
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const state = await getSessionState(sessionId);
        setCurrentStep(state.currentStep);
        setIsComplete(state.isComplete);
      } catch (error) {
        console.error("Failed to poll session state:", error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [sessionId]);

  const handleSubmitScan = async (barcode: string) => {
    if (!barcode.trim()) return;

    setIsSubmitting(true);
    setLastError("");
    setLastSuccess("");

    try {
      const response: BarcScanResponse = await submitScan(
        sessionId,
        barcode,
        mode
      );

      const timestamp = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const entry: ScanEntry = {
        id: Date.now().toString(),
        barcode: barcode.toUpperCase(),
        type: config.steps[currentStep]?.label || "Unknown",
        status: response.success ? "success" : "error",
        message: response.success
          ? response.data?.message || "✓ Scan accepted"
          : response.error || "Scan failed",
        timestamp,
      };

      setScanHistory((prev) => [entry, ...prev]);

      if (response.success) {
        setLastSuccess(entry.message);
        setCurrentStep(response.data?.currentStep || currentStep + 1);

        if (response.data?.isComplete) {
          setIsComplete(true);
          if (onSessionComplete) {
            onSessionComplete();
          }
        }

        // Clear input and refocus
        inputRef.current?.focus();
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      } else {
        setLastError(entry.message);
        // Keep input focused for retry
        inputRef.current?.focus();
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Network error";
      setLastError(errorMsg);
      setScanHistory((prev) => [
        {
          id: Date.now().toString(),
          barcode: barcode.toUpperCase(),
          type: "Error",
          status: "error",
          message: errorMsg,
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        },
        ...prev,
      ]);
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      const barcode = inputRef.current?.value || "";
      handleSubmitScan(barcode);
    } else if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  };

  const handleNewSession = () => {
    setScanHistory([]);
    setCurrentStep(0);
    setIsComplete(false);
    setLastError("");
    setLastSuccess("");
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-white rounded-[24px] border border-[#E8E8E4] shadow-sm p-8">
      {/* ─── HEADER ─── */}
      <div>
        <h2 className="text-[20px] font-bold text-[#1A1A1A]">
          {mode.charAt(0).toUpperCase() + mode.slice(1)} Barcode Scanner
        </h2>
        <p className="text-[13px] text-[#888] mt-1">
          Session ID: <span className="font-mono font-bold">{sessionId}</span>
        </p>
      </div>

      {/* ─── STATUS DISPLAY ─── */}
      <div className="flex items-center gap-3 bg-[#FAFAF8] border border-[#E8E8E4] rounded-xl p-4">
        {isComplete ? (
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
        ) : isSubmitting ? (
          <Loader2 size={20} className="text-blue-600 animate-spin shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-[#CDCDC9] shrink-0"></div>
        )}
        <div>
          <p className="text-[14px] font-bold text-[#1A1A1A]">
            {currentStepConfig?.label || "Unknown"}
          </p>
          {currentStepConfig?.hint && (
            <p className="text-[12px] text-[#888] mt-0.5">
              {currentStepConfig.hint}
            </p>
          )}
        </div>
      </div>

      {/* ─── BARCODE INPUT ─── */}
      <div>
        <label className="text-[13px] font-bold text-[#555] block mb-2">
          Scan Barcode
        </label>
        <input
          ref={inputRef}
          type="text"
          placeholder="Point barcode scanner here..."
          onKeyDown={handleKeyDown}
          disabled={isComplete || isSubmitting}
          className={`w-full px-4 py-4 border-2 rounded-xl font-mono text-[16px] font-bold outline-none transition-all
            ${
              isComplete
                ? "bg-[#FAFAF8] border-[#E8E8E4] text-[#CDCDC9] cursor-not-allowed"
                : lastError
                  ? "bg-red-50 border-red-300 text-[#1A1A1A] focus:bg-red-50 focus:border-red-400"
                  : lastSuccess
                    ? "bg-green-50 border-green-300 text-[#1A1A1A] focus:bg-green-50 focus:border-green-400"
                    : "bg-white border-[#CDCDC9] text-[#1A1A1A] focus:bg-white focus:border-[#1A1A1A]"
            }
          `}
          autoComplete="off"
        />
      </div>

      {/* ─── FEEDBACK MESSAGES ─── */}
      {lastError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-[13px] text-red-700 font-medium">{lastError}</p>
        </div>
      )}

      {lastSuccess && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
          <p className="text-[13px] text-green-700 font-medium">{lastSuccess}</p>
        </div>
      )}

      {isComplete && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <CheckCircle2 size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[13px] text-blue-700 font-medium">
            ✅ {mode} session completed successfully!
          </p>
        </div>
      )}

      {/* ─── SCAN HISTORY (COLLAPSIBLE) ─── */}
      {scanHistory.length > 0 && (
        <div className="border border-[#E8E8E4] rounded-xl overflow-hidden">
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#FAFAF8] hover:bg-[#F0F0EC] transition-colors"
          >
            <p className="text-[13px] font-bold text-[#555]">
              Scan History ({scanHistory.length})
            </p>
            <ChevronDown
              size={18}
              className={`text-[#888] transition-transform ${
                historyOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {historyOpen && (
            <div className="divide-y divide-[#F0F0EC] max-h-[250px] overflow-y-auto">
              {scanHistory.map((entry) => (
                <div
                  key={entry.id}
                  className={`px-4 py-3 flex items-start justify-between text-[13px] ${
                    entry.status === "success"
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-mono font-bold text-[#1A1A1A]">
                      {entry.barcode}
                    </p>
                    <p className="text-[11px] text-[#888] mt-0.5">
                      {entry.type}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        entry.status === "success"
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {entry.status === "success" ? "✓" : "✗"}
                    </span>
                    <span className="text-[11px] text-[#888]">
                      {entry.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── ACTION BUTTONS ─── */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleNewSession}
          disabled={!isComplete}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-[13px] transition-all
            ${
              isComplete
                ? "bg-[#1A1A1A] text-white hover:bg-[#333]"
                : "bg-[#E8E8E4] text-[#CDCDC9] cursor-not-allowed"
            }
          `}
        >
          <RotateCcw size={16} />
          New Session
        </button>

        {isComplete && (
          <button
            onClick={onSessionComplete}
            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold text-[13px] transition-all"
          >
            <Plus size={16} className="inline mr-1" />
            Start Another Session
          </button>
        )}
      </div>
    </div>
  );
}