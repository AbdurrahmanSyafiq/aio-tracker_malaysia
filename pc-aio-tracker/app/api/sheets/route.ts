import { google } from "googleapis";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  verifySessionToken,
  safeEqual,
} from "@/lib/session";

// The app may be shown inside an <iframe> on another domain (e.g. GitHub Pages).
// In that case the cookie is "third-party", so in production it must be
// SameSite=None + Secure (+ Partitioned) or the browser drops it and every data
// request fails with 401. Locally (http://localhost) we keep plain Lax.
const isProd = process.env.NODE_ENV === "production";
const cookieBase: any = {
  httpOnly: true,
  path: "/",
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  ...(isProd ? { partitioned: true } : {}),
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, sheetName, username, password } = body;

    // --- 1. LOGIN / SESSION / LOGOUT (username + password from env) ---
    if (action === "login") {
      const validUser = process.env.ADMIN_USERNAME;
      const validPass = process.env.ADMIN_PASSWORD;
      if (!validUser || !validPass || !process.env.AUTH_SECRET) {
        return NextResponse.json({
          success: false,
          error: "Server is not configured. Please contact the admin.",
        });
      }
      const okUser = safeEqual(String(username ?? ""), validUser);
      const okPass = safeEqual(String(password ?? ""), validPass);
      if (okUser && okPass) {
        const res = NextResponse.json({ success: true });
        res.cookies.set(SESSION_COOKIE, createSessionToken(), {
          ...cookieBase,
          maxAge: SESSION_MAX_AGE,
        });
        return res;
      }
      return NextResponse.json({
        success: false,
        error: "Incorrect username or password.",
      });
    }

    if (action === "session") {
      const token = (await cookies()).get(SESSION_COOKIE)?.value;
      return NextResponse.json({ authenticated: verifySessionToken(token) });
    }

    if (action === "logout") {
      const res = NextResponse.json({ success: true });
      res.cookies.set(SESSION_COOKIE, "", { ...cookieBase, maxAge: 0 });
      return res;
    }

    // --- 2. DATA ENGINE ---
    if (action === "getData") {
      const token = (await cookies()).get(SESSION_COOKIE)?.value;
      if (!verifySessionToken(token)) {
        return NextResponse.json(
          { error: "Not authenticated. Please log in again." },
          { status: 401 },
        );
      }

      const allowedSheets = [
        "Media API",
        "Raw",
        "Creative Raw",
        "Media Signal",
        "CIR DAILY",
      ];

      if (!allowedSheets.includes(sheetName)) {
        return NextResponse.json(
          { error: `Unauthorized or invalid sheet name: ${sheetName}` },
          { status: 400 },
        );
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n",
          ).replace(/"/g, ""),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });

      const sheets = google.sheets({ version: "v4", auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: `${sheetName}!A1:ZZ`, // Membaca sampai kolom ZZ agar tidak terpotong
        // Ambil angka mentah (bukan versi tampilan seperti "1.85073E+15"),
        // tapi kolom tanggal/waktu tetap dikirim sebagai string terformat
        // supaya parseSheetDate() di frontend tidak berubah perilakunya.
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      });

      const data = response.data.values;
      if (!data || data.length < 2) {
        return NextResponse.json(
          { error: `Not enough data in sheet: ${sheetName}` },
          { status: 400 },
        );
      }

      // Mengubah format Array menjadi Array of Objects
      const headers = data[0].map((h) => String(h).trim());
      const formattedData = data.slice(1).map((row) => {
        let obj: Record<string, any> = {};
        headers.forEach((header, index) => {
          let value = row[index] !== undefined ? row[index] : "";
          // Angka besar (misal PID/CID) datang sebagai number JS asli dari
          // UNFORMATTED_VALUE. Ubah ke string digit penuh di sini supaya
          // tidak ada komponen yang tidak sengaja menampilkannya dalam
          // notasi ilmiah (mis. toString() pada angka sangat besar).
          if (typeof value === "number") {
            value = Number.isInteger(value)
              ? value.toLocaleString("fullwide", { useGrouping: false })
              : value;
          }
          obj[header] = value;
        });
        return obj;
      });

      return NextResponse.json({
        success: true,
        headers,
        data: formattedData,
        sheetName,
      });
    }

    return NextResponse.json(
      { error: "Invalid action request." },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
