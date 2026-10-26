import { useState } from "react";
import { supabase } from "./supabase.js";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { data, error } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) setMsg({ bad: true, text: error.message });
    else if (mode === "signup" && !data.session)
      setMsg({ text: "Account created. Check your email and confirm it, then log in." });
  }

  return (
    <main className="center">
      <div className="hero" aria-hidden="true">
        {["needs", "wants", "savings"].map((b, i) => (
          <div key={b} className={`mini ${b}`} style={{ "--d": `${i * 0.5}s` }}>
            <span>{[50, 30, 20][i]}%</span><i />
          </div>
        ))}
      </div>
      <form className="panel auth" onSubmit={submit}>
        <h1>Three Jars</h1>
        <p className="sub">Split every month’s income into needs, wants and savings.</p>
        <label>Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {msg && <p className={msg.bad ? "err" : "ok"} role="alert">{msg.text}</p>}
        <button className="primary" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(null); }}>
          {mode === "login" ? "New here? Create an account" : "Have an account? Log in"}
        </button>
      </form>
    </main>
  );
}
