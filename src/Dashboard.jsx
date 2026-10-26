import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase.js";

const CUR = "PKR "; // change to another symbol if needed
const BUCKETS = {
  needs:   { name: "Needs",   target: 0.5, hint: "Rent, groceries, bills, transport, school fees" },
  wants:   { name: "Wants",   target: 0.3, hint: "Dining out, shopping, subscriptions, trips" },
  savings: { name: "Savings & debt", target: 0.2, hint: "Emergency fund, investments, debt repayment" },
};
const money = (n) => CUR + Math.round(n).toLocaleString();
const monthKey = (d) => d.toISOString().slice(0, 7);
const shift = (m, by) => { const [y, mo] = m.split("-").map(Number); return monthKey(new Date(Date.UTC(y, mo - 1 + by, 1))); };
const pretty = (m) => new Date(m + "-01T00:00:00Z").toLocaleString("en", { month: "long", year: "numeric", timeZone: "UTC" });

function Jar({ id, spent, income }) {
  const b = BUCKETS[id];
  const goal = income * b.target;
  const pct = goal > 0 ? Math.min(spent / goal, 1) : 0;
  const over = goal > 0 && spent > goal;
  const share = income > 0 ? Math.round((spent / income) * 100) : 0;
  const [h, setH] = useState(0);
  useEffect(() => { const t = setTimeout(() => setH(pct * 100), 150); return () => clearTimeout(t); }, [pct]);
  const note = income <= 0 ? "Add income to set a target"
    : over ? `${money(spent - goal)} over target`
    : id === "savings" && spent < goal ? `${money(goal - spent)} still to save`
    : `${money(goal - spent)} left`;
  return (
    <section className={`jar ${id} ${over && id !== "savings" ? "over" : ""}`}>
      <div className="vessel" role="img" aria-label={`${b.name}: ${share}% of income, target ${b.target * 100}%`}>
        <div className="fill" style={{ height: `${h}%` }}>
          <svg className="wave" viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M0 6 Q25 0 50 6 T100 6 T150 6 T200 6 V12 H0Z" /></svg>
          <svg className="wave w2" viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M0 6 Q25 12 50 6 T100 6 T150 6 T200 6 V12 H0Z" /></svg>
        </div>
        <strong className="pct">{share}%<small>of {b.target * 100}%</small></strong>
      </div>
      <h3>{b.name}</h3>
      <p className="amt">{money(spent)} <span>of {money(goal)}</span></p>
      <p className="note">{note}</p>
    </section>
  );
}

export default function Dashboard({ session }) {
  const [month, setMonth] = useState(monthKey(new Date()));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [kind, setKind] = useState("expense");
  const [bucket, setBucket] = useState("needs");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("entries").select("*").eq("month", month).order("created_at", { ascending: false });
    if (error) setErr(error.message); else { setErr(null); setRows(data); }
    setLoading(false);
  }
  useEffect(() => { load(); }, [month]);

  const t = useMemo(() => {
    const s = { income: 0, needs: 0, wants: 0, savings: 0 };
    rows.forEach((r) => { if (r.kind === "income") s.income += +r.amount; else s[r.bucket] += +r.amount; });
    s.spent = s.needs + s.wants + s.savings;
    return s;
  }, [rows]);

  async function add(e) {
    e.preventDefault();
    const { error } = await supabase.from("entries").insert({
      month, kind, label: label.trim(), amount: +amount, bucket: kind === "expense" ? bucket : null,
    });
    if (error) return setErr(error.message);
    setLabel(""); setAmount(""); load();
  }
  async function remove(id) {
    setRows((r) => r.filter((x) => x.id !== id));
    await supabase.from("entries").delete().eq("id", id);
  }

  const unallocated = t.income - t.spent;
  return (
    <div className="shell">
      <header>
        <h1>Three Jars</h1>
        <div className="months">
          <button aria-label="Previous month" onClick={() => setMonth(shift(month, -1))}>‹</button>
          <span>{pretty(month)}</span>
          <button aria-label="Next month" onClick={() => setMonth(shift(month, 1))}>›</button>
        </div>
        <button className="link" onClick={() => supabase.auth.signOut()} title={session.user.email}>Log out</button>
      </header>

      <div className="summary">
        <div><span>Income</span><b>{money(t.income)}</b></div>
        <div><span>Spent</span><b>{money(t.spent)}</b></div>
        <div><span>{unallocated >= 0 ? "Unassigned" : "Overspent"}</span><b className={unallocated < 0 ? "neg" : ""}>{money(Math.abs(unallocated))}</b></div>
      </div>

      <div className="jars">{Object.keys(BUCKETS).map((id) => <Jar key={id} id={id} spent={t[id]} income={t.income} />)}</div>

      <div className="lower">
        <form className="panel" onSubmit={add}>
          <h2>Add entry</h2>
          <div className="seg" role="tablist">
            {["expense", "income"].map((k) => <button type="button" key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>{k === "expense" ? "Expense" : "Income"}</button>)}
          </div>
          {kind === "expense" && (
            <div className="seg">
              {Object.entries(BUCKETS).map(([id, b]) => <button type="button" key={id} className={`${bucket === id ? "on" : ""} ${id}`} title={b.hint} onClick={() => setBucket(id)}>{b.name}</button>)}
            </div>
          )}
          <label>Description<input required value={label} onChange={(e) => setLabel(e.target.value)} placeholder={kind === "income" ? "Salary" : "Groceries"} /></label>
          <label>Amount<input required type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <button className="primary">Add {kind}</button>
          {err && <p className="err" role="alert">{err}</p>}
        </form>

        <div className="panel">
          <h2>{pretty(month)}</h2>
          {loading ? <div className="loader" /> : rows.length === 0 ? <p className="sub">Nothing here yet. Start with this month’s income.</p> :
            <ul className="list">{rows.map((r) => (
              <li key={r.id}>
                <i className={`dot ${r.kind === "income" ? "income" : r.bucket}`} />
                <span>{r.label}<small>{r.kind === "income" ? "Income" : BUCKETS[r.bucket].name}</small></span>
                <b className={r.kind === "income" ? "pos" : ""}>{r.kind === "income" ? "+" : "−"}{money(r.amount)}</b>
                <button aria-label={`Delete ${r.label}`} onClick={() => remove(r.id)}>×</button>
              </li>))}</ul>}
        </div>
      </div>
    </div>
  );
}
