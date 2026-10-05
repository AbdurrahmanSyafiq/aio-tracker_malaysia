"use client";
import { useState } from "react";

export default function LoginView({
  onLoggedIn,
}: {
  onLoggedIn: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username, password }),
      });
      const data = await res.json();
      if (data.success) {
        onLoggedIn();
      } else {
        setErrorMessage(data.error || "Login failed. Please try again.");
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full h-screen font-sans overflow-hidden bg-white">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fluidMove1 { 0% { transform: translate(0px, 0px) scale(1); } 50% { transform: translate(80px, 60px) scale(1.15); } 100% { transform: translate(0px, 0px) scale(1); } }
        @keyframes fluidMove2 { 0% { transform: translate(0px, 0px) scale(1.1); } 50% { transform: translate(-70px, -50px) scale(0.95); } 100% { transform: translate(0px, 0px) scale(1.1); } }
        @keyframes fluidMove3 { 0% { transform: translate(0px, 0px) scale(1); } 50% { transform: translate(60px, -70px) scale(1.2); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-enter { animation: slideUp 0.5s ease-out forwards; }
        .fluid-blob-1 { animation: fluidMove1 14s ease-in-out infinite; }
        .fluid-blob-2 { animation: fluidMove2 18s ease-in-out infinite; }
        .fluid-blob-3 { animation: fluidMove3 16s ease-in-out infinite; }
      `,
        }}
      />

      <div className="hidden md:block w-[60%] h-full relative bg-[#090d16] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#12082b] via-[#210e4a] to-[#0a1f24]" />
        <div
          className="fluid-blob-1 absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full opacity-90 mix-blend-screen pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, #8beb3a 0%, #43ca55 45%, transparent 70%)",
            filter: "blur(75px)",
          }}
        />
        <div
          className="fluid-blob-2 absolute -bottom-32 -right-20 w-[600px] h-[600px] rounded-full opacity-95 mix-blend-screen pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, #7a22cf 0%, #48118d 50%, transparent 75%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="fluid-blob-3 absolute top-1/3 left-1/4 w-[480px] h-[480px] rounded-full opacity-70 mix-blend-screen pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, #299e74 0%, #1f5068 55%, transparent 75%)",
            filter: "blur(90px)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none" />
      </div>

      <div className="w-full md:w-[40%] flex flex-col justify-center px-12 lg:px-20 bg-white relative z-20">
        <div className="w-full max-w-sm mx-auto animate-enter">
          <h2 className="text-[clamp(2rem,3vw,3rem)] font-black text-slate-900 tracking-tight mb-2">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-500 font-medium mb-12">
            Sign in with your username and password to continue.
          </p>

          {errorMessage && (
            <div className="text-rose-500 text-xs font-bold mb-6">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              autoComplete="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-200 rounded-full px-5 py-3.5 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 transition-colors"
              required
            />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-full px-5 py-3.5 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 transition-colors"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#111827] hover:bg-indigo-600 disabled:opacity-60 text-white font-bold py-4 rounded-full transition-colors text-sm">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}