import { useEffect, useState } from "react";
import { supabase, configured } from "./supabase.js";
import Auth from "./Auth.jsx";
import Dashboard from "./Dashboard.jsx";

export default function App() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    if (!configured) return setSession(null);
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  if (!configured)
    return <main className="center"><div className="panel"><h2>Almost there</h2>
      <p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment, then reload. See the README.</p></div></main>;
  if (session === undefined) return <main className="center"><div className="loader" /></main>;
  return session ? <Dashboard session={session} /> : <Auth />;
}
