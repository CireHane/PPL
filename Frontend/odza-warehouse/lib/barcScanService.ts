import { getToken } from "./tokenAssistant";

export interface BarcScanResponse {
  success: boolean;
  data?: {
    sessionId?: string;
    currentStep: number;
    isComplete: boolean;
    nextExpected?: string;
    scannedData?: Record<string, any>;
    message?: string;
  };
  error?: string;
}

export interface ScanSession {
  sessionId: string;
  currentStep: number;
  scannedData: Record<string, any>;
  isComplete: boolean;
}

const API_BASE_URL = "http://localhost:3000";

/**
 * Create a new barcode scanning session
 * POST /scan/session/new
 */
export async function createSession(mode: "inbound" | "outbound"): Promise<ScanSession> {
  try {
    const token = getToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${API_BASE_URL}/scan/session/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ scan_type: mode }),
    });

    const data: BarcScanResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to create session");
    }

    return {
      sessionId: data.data?.sessionId || "",
      currentStep: data.data?.currentStep || 0,
      scannedData: data.data?.scannedData || {},
      isComplete: data.data?.isComplete || false,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to create scanning session"
    );
  }
}

/**
 * Submit a barcode scan for validation
 * POST /scan/inbound or /scan/outbound
 */
export async function submitScan(
  sessionId: string,
  barcode: string,
  mode: "inbound" | "outbound"
): Promise<BarcScanResponse> {
  try {
    const token = getToken();
    if (!token) throw new Error("No authentication token found");

    const endpoint =
      mode === "inbound" ? "/scan/inbound" : "/scan/outbound";

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionId: sessionId,
        barcode: barcode,
      }),
    });

    const data: BarcScanResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Scan validation failed",
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error during scan",
    };
  }
}

/**
 * Get current session state
 * GET /scan/session/:sessionId
 */
export async function getSessionState(sessionId: string): Promise<ScanSession> {
  try {
    const token = getToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(
      `${API_BASE_URL}/scan/session/${sessionId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    const data: BarcScanResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to fetch session state");
    }

    return {
      sessionId: sessionId,
      currentStep: data.data?.currentStep || 0,
      scannedData: data.data?.scannedData || {},
      isComplete: data.data?.isComplete || false,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch session state"
    );
  }
}