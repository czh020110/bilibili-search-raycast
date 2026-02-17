import fetch from "node-fetch";

export interface QRCodeData {
  url: string;
  qrcode_key: string;
}

export interface PollResult {
  code: number;
  message: string;
  url?: string;
  refresh_token?: string;
  timestamp?: number;
  cookies?: string;
}

export async function generateQRCodeKey(): Promise<QRCodeData | null> {
  try {
    const response = await fetch(
      "https://passport.bilibili.com/x/passport-login/web/qrcode/generate",
    );
    const data = (await response.json()) as any;
    if (data.code === 0 && data.data) {
      return {
        url: data.data.url,
        qrcode_key: data.data.qrcode_key,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to generate QR code key:", error);
    return null;
  }
}

export async function pollQRCodeStatus(
  qrcode_key: string,
): Promise<PollResult> {
  try {
    const response = await fetch(
      `https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${qrcode_key}`,
    );
    const data = (await response.json()) as any;

    // data.data.code:
    // 0: success
    // 86101: not scanned
    // 86090: scanned, not confirmed
    // 86038: expired

    if (data.code === 0 && data.data) {
      let cookies = "";
      if (data.data.code === 0) {
        // Extract cookies from response headers is tricky with node-fetch as APIs sets cookies
        // Actually, for this API, the cookies are set in the response headers "Set-Cookie"
        // We need to parse them.
        const rawCookies = response.headers.raw()["set-cookie"];
        if (rawCookies) {
          cookies = rawCookies.map((c) => c.split(";")[0]).join("; ");
        }
      }

      return {
        code: data.data.code,
        message: data.data.message,
        url: data.data.url,
        refresh_token: data.data.refresh_token,
        timestamp: data.data.timestamp,
        cookies,
      };
    }
    return {
      code: -1,
      message: "Network error or invalid response",
    };
  } catch (error) {
    console.error("Failed to poll QR code status:", error);
    return {
      code: -1,
      message: "Network error",
    };
  }
}
