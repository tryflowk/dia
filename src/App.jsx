import { useState, useEffect, useMemo } from "react";
import { useAuth, useData } from "./lib/db";

/* ═══════════════════════════════════════
   DIA — MVP COMPLETO com Supabase
   ═══════════════════════════════════════ */

// ── CONSTANTS ──
const CATS = [
  { id: "exercise", label: "Exercício", icon: "🏃", color: "#34d399" },
  { id: "tedious_task", label: "Tarefa Chata", icon: "😤", color: "#fbbf24" },
  { id: "brain_in", label: "Brain In", icon: "📥", color: "#818cf8" },
  { id: "brain_out", label: "Brain Out", icon: "📤", color: "#f472b6" },
  { id: "brain_wave", label: "Brain Wave", icon: "🧠", color: "#a78bfa" },
  { id: "social", label: "Social", icon: "👥", color: "#2dd4bf" },
];
const CM = Object.fromEntries(CATS.map(c => [c.id, c]));

const LVL = [
  { n: "Iniciante", min: 0, max: 49, i: "🌱", c: "#94a3b8" },
  { n: "Consistente", min: 50, max: 149, i: "⚡", c: "#38bdf8" },
  { n: "Estrategista", min: 150, max: 299, i: "🎯", c: "#a78bfa" },
  { n: "Comandante", min: 300, max: 499, i: "🔥", c: "#fb923c" },
  { n: "Lenda", min: 500, max: Infinity, i: "👑", c: "#fbbf24" },
];

const gl = s => LVL.find(l => s >= l.min && s <= l.max) || LVL[0];
const tdy = (d = new Date()) => d.toISOString().split("T")[0];
const tmrw = () => { const d = new Date(); d.setDate(d.getDate() + 1); return tdy(d); };
const fd = s => { try { return new Date(s + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }); } catch { return s; } };
const cp = t => (t.urgency || 1) * 3 + (t.importance || 1) * 2 + (t.tediousness || 1);
const rnd = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

// ── THEME ──
const X = {
  bg: "#080b16", bg2: "#0d1120", s1: "#111628", s2: "#161c34", s3: "#1b2240",
  card: "#13182e", brd: "#1f2747", brdH: "#283058",
  t: "#e8ecf4", t2: "#94a0bf", t3: "#5a6480",
  ac: "#f97316", acG: "rgba(249,115,22,.1)", acS: "#fdba74",
  g: "#34d399", r: "#f87171", p: "#a78bfa", y: "#fbbf24", cy: "#2dd4bf", pk: "#f472b6",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${X.brd};border-radius:9px}
select option{background:${X.bg};color:${X.t}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes toast{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(120vh) rotate(720deg);opacity:0}}
.af{animation:fadeUp .35s ease both}.asi{animation:scaleIn .25s ease both}.asu{animation:slideUp .4s ease both}
`;

// ── ICONS ──
const Ic = ({ n, s = 16, c = "currentColor" }) => {
  const p = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  const m = {
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></>,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>,
    moon: <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>,
    grip: <><circle cx="9" cy="5" r="1" fill={c} stroke="none" /><circle cx="15" cy="5" r="1" fill={c} stroke="none" /><circle cx="9" cy="12" r="1" fill={c} stroke="none" /><circle cx="15" cy="12" r="1" fill={c} stroke="none" /><circle cx="9" cy="19" r="1" fill={c} stroke="none" /><circle cx="15" cy="19" r="1" fill={c} stroke="none" /></>,
    refresh: <><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></>,
  };
  return <svg {...p}>{m[n]}</svg>;
};

// ── PRIMITIVES ──
const Btn = ({ ch, v = "primary", sm, onClick, dis, sty, icon, full, loading: ld }) => {
  const b = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, border: "none",
    cursor: dis || ld ? "not-allowed" : "pointer", fontFamily: "'Outfit'", fontWeight: 600, borderRadius: 10,
    transition: "all .15s", opacity: dis ? .4 : 1, whiteSpace: "nowrap", width: full ? "100%" : "auto" };
  const vs = {
    primary: { background: X.ac, color: "#fff", padding: sm ? "7px 14px" : "10px 20px", fontSize: sm ? 12 : 13 },
    secondary: { background: X.s3, color: X.t, padding: sm ? "7px 14px" : "10px 20px", fontSize: sm ? 12 : 13, border: `1px solid ${X.brd}` },
    ghost: { background: "transparent", color: X.t2, padding: "5px 8px", fontSize: 12 },
    danger: { background: `${X.r}12`, color: X.r, padding: sm ? "7px 14px" : "10px 20px", fontSize: sm ? 12 : 13 },
    success: { background: `${X.g}12`, color: X.g, padding: sm ? "7px 14px" : "10px 20px", fontSize: sm ? 12 : 13, border: `1px solid ${X.g}30` },
    accent: { background: X.acG, color: X.ac, padding: sm ? "7px 14px" : "10px 20px", fontSize: sm ? 12 : 13, border: `1px solid ${X.ac}30` },
  };
  return <button style={{ ...b, ...vs[v], ...sty }} onClick={onClick} disabled={dis || ld}>{ld ? "..." : <>{icon && <Ic n={icon} s={sm ? 13 : 15} />}{ch}</>}</button>;
};

const Inp = ({ label, value, onChange, type = "text", ph, sty, ...r }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, ...sty }}>
    {label && <label style={{ fontSize: 11, fontWeight: 600, color: X.t3, fontFamily: "'Outfit'", textTransform: "uppercase", letterSpacing: .5 }}>{label}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={ph} {...r}
      style={{ padding: "9px 12px", background: X.bg2, border: `1px solid ${X.brd}`, borderRadius: 8, color: X.t, fontSize: 14, fontFamily: "'Outfit'", outline: "none", transition: "border .15s" }}
      onFocus={e => e.target.style.borderColor = X.ac} onBlur={e => e.target.style.borderColor = X.brd} />
  </div>
);

const Sel = ({ label, value, onChange, opts, sty }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, ...sty }}>
    {label && <label style={{ fontSize: 11, fontWeight: 600, color: X.t3, fontFamily: "'Outfit'", textTransform: "uppercase", letterSpacing: .5 }}>{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding: "9px 12px", background: X.bg2, border: `1px solid ${X.brd}`, borderRadius: 8, color: X.t, fontSize: 14, fontFamily: "'Outfit'", outline: "none", appearance: "none", cursor: "pointer" }}>
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>
);

const Dots = ({ value, onChange, max = 5, label, color = X.ac }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    {label && <label style={{ fontSize: 11, fontWeight: 600, color: X.t3, fontFamily: "'Outfit'", textTransform: "uppercase", letterSpacing: .5 }}>{label}</label>}
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: max }, (_, i) => (
        <div key={i} onClick={() => onChange(i + 1)}
          style={{ width: 20, height: 20, borderRadius: "50%", cursor: "pointer", transition: "all .12s",
            background: i < value ? color : "transparent", border: `2px solid ${i < value ? color : X.brd}` }} />
      ))}
    </div>
  </div>
);

const Tag = ({ ch, color = X.ac, sty }) => (
  <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 7px", borderRadius: 5, fontSize: 10, fontWeight: 600,
    fontFamily: "'Outfit'", background: `${color}18`, color, ...sty }}>{ch}</span>
);

const Modal = ({ open, onClose, title, ch, w = 460 }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)" }} />
      <div onClick={e => e.stopPropagation()} className="asi"
        style={{ position: "relative", background: X.s1, borderRadius: 18, border: `1px solid ${X.brd}`, width: "100%", maxWidth: w, maxHeight: "88vh", overflow: "auto", padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: X.t, fontFamily: "'Outfit'" }}>{title}</h2>
          <button onClick={onClose} style={{ background: X.s3, border: "none", color: X.t2, cursor: "pointer", padding: 5, borderRadius: 8, display: "flex" }}><Ic n="x" s={16} /></button>
        </div>
        {ch}
      </div>
    </div>
  );
};

const Empty = ({ icon, title, sub, action }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px", textAlign: "center" }} className="af">
    <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
    <h3 style={{ fontSize: 14, fontWeight: 600, color: X.t, fontFamily: "'Outfit'", margin: "0 0 3px" }}>{title}</h3>
    <p style={{ fontSize: 11, color: X.t2, fontFamily: "'Outfit'", margin: "0 0 12px", maxWidth: 220 }}>{sub}</p>
    {action}
  </div>
);

function Confetti({ show }) {
  if (!show) return null;
  const colors = [X.ac, X.g, X.y, X.p, X.pk, X.cy, "#fff"];
  return <div style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}>
    {Array.from({ length: 40 }, (_, i) => <div key={i} style={{
      position: "absolute", top: -10, left: `${Math.random() * 100}%`,
      width: Math.random() * 8 + 4, height: Math.random() * 8 + 4, borderRadius: Math.random() > .5 ? "50%" : 2,
      background: colors[Math.floor(Math.random() * colors.length)],
      animation: `confetti ${Math.random() * 2 + 1.5}s ease-in forwards`, animationDelay: `${Math.random() * .5}s`
    }} />)}
  </div>;
}

function Toast({ msg, type = "success", onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  const cc = { success: X.g, error: X.r, info: X.ac };
  return <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 9998, background: X.s2,
    border: `1px solid ${(cc[type] || X.ac)}40`, borderRadius: 12, padding: "10px 18px", boxShadow: `0 12px 40px rgba(0,0,0,.4)`,
    fontFamily: "'Outfit'", fontSize: 13, fontWeight: 600, color: cc[type], animation: "toast .3s ease", display: "flex", alignItems: "center", gap: 8 }}>
    {type === "success" ? "✓" : type === "error" ? "✗" : "ℹ"} {msg}
  </div>;
}

// ── SCORING ──
function calcScore(pts, tasks) {
  const ts = pts.map(pt => ({ ...pt, ...(tasks.find(t => t.id === pt.task_id) || {}) }));
  const done = ts.filter(t => t.status === "done"); const n = ts.length;
  if (!n) return { ds: 0, bs: 0, ts: 0, ex: false, fr: false, ac: false, dn: 0, tt: 0 };
  const ex = done.some(t => t.category === "exercise");
  const fg = ts.find(t => t.is_frog); const fr = fg ? fg.status === "done" : false;
  const ds_ = rnd((ex ? .3 : 0) + (fr ? .3 : 0) + (done.length / n) * .4);
  const cats = new Set(done.map(t => t.category)); const ac = CATS.every(c => cats.has(c.id));
  return { ds: ds_, bs: ac ? 1 : 0, ts: rnd(ds_ + (ac ? 1 : 0)), ex, fr, ac, dn: done.length, tt: n };
}

// ── SCORE RING ──
function ScoreRing({ value, max = 1, size = 72, color = X.ac, label }) {
  const pct = Math.min(value / max, 1); const r = (size - 8) / 2; const circ = 2 * Math.PI * r;
  return <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={X.brd} strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" style={{ transition: "stroke-dashoffset .6s ease" }} />
    </svg>
    <div style={{ position: "absolute", textAlign: "center" }}>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: size * .25, fontWeight: 700, color, lineHeight: 1 }}>{value.toFixed(1)}</div>
      {label && <div style={{ fontFamily: "'Outfit'", fontSize: 8, color: X.t3, marginTop: 1 }}>{label}</div>}
    </div>
  </div>;
}

// ── AUTH SCREEN ──
function AuthScreen({ onAuth }) {
  const { signIn, signUp } = onAuth;
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState(""); const [pass, setPass] = useState(""); const [name, setName] = useState("");
  const [err, setErr] = useState(""); const [ld, setLd] = useState(false);

  const handle = async () => {
    setErr(""); setLd(true);
    if (mode === "signup") {
      if (!name.trim()) { setErr("Informe seu nome"); setLd(false); return; }
      const { error } = await signUp(email, pass, name.trim());
      if (error) setErr(error.message === "User already registered" ? "Email já cadastrado" : error.message);
      else setErr("");
    } else {
      const { error } = await signIn(email, pass);
      if (error) setErr(error.message === "Invalid login credentials" ? "Email ou senha incorretos" : error.message);
    }
    setLd(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: X.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 340, width: "100%" }} className="asu">
        <div style={{ fontSize: 52, marginBottom: 6 }}>🎯</div>
        <h1 style={{ fontFamily: "'Outfit'", fontSize: 48, fontWeight: 900, color: X.ac, margin: "0 0 2px", letterSpacing: 6, textTransform: "uppercase" }}>DIA</h1>
        <p style={{ fontFamily: "'Outfit'", fontSize: 13, color: X.t2, margin: "0 0 24px", letterSpacing: .5 }}>Planeje · Execute · Evolua</p>

        <div style={{ display: "flex", gap: 2, marginBottom: 16, background: X.bg2, borderRadius: 8, padding: 2 }}>
          {[{ id: "login", l: "Entrar" }, { id: "signup", l: "Criar conta" }].map(v => (
            <button key={v.id} onClick={() => { setMode(v.id); setErr(""); }}
              style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "'Outfit'", fontSize: 13, fontWeight: 600,
                background: mode === v.id ? X.s2 : "transparent", color: mode === v.id ? X.t : X.t3, transition: "all .12s" }}>{v.l}</button>
          ))}
        </div>

        <div style={{ background: X.s1, borderRadius: 18, border: `1px solid ${X.brd}`, padding: 24, textAlign: "left" }}>
          {mode === "signup" && <Inp label="Nome" value={name} onChange={setName} ph="Seu nome" sty={{ marginBottom: 12 }} />}
          <Inp label="Email" value={email} onChange={setEmail} ph="email@exemplo.com" type="email" sty={{ marginBottom: 12 }} />
          <Inp label="Senha" value={pass} onChange={setPass} ph="••••••••" type="password" sty={{ marginBottom: 16 }} />
          {err && <p style={{ fontSize: 12, color: X.r, fontFamily: "'Outfit'", margin: "0 0 12px", textAlign: "center" }}>{err}</p>}
          <Btn onClick={handle} dis={!email || !pass} full loading={ld}
            sty={{ padding: "12px 20px", fontSize: 15 }} ch={mode === "signup" ? "Criar conta" : "Entrar"} />
        </div>
        <p style={{ fontFamily: "'Outfit'", fontSize: 10, color: X.t3, marginTop: 14 }}>Sincroniza entre todos os seus dispositivos</p>
      </div>
    </div>
  );
}

// ── TASK FORM ──
function TaskForm({ open, onClose, onSave, task, projects, loading: ld }) {
  const blank = { title: "", description: "", category: "brain_out", urgency: 3, importance: 3, tediousness: 1, effort_minutes: 30, project_id: null };
  const [f, sF] = useState(blank);
  useEffect(() => { if (open) sF(task ? { title: task.title || "", description: task.description || "", category: task.category || "brain_out", urgency: task.urgency || 3, importance: task.importance || 3, tediousness: task.tediousness || 1, effort_minutes: task.effort_minutes || 30, project_id: task.project_id || "" } : blank); }, [task, open]);
  return <Modal open={open} onClose={onClose} title={task ? "Editar Tarefa" : "Nova Tarefa"} ch={
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Inp label="Título" value={f.title} onChange={v => sF(p => ({ ...p, title: v }))} ph="O que precisa ser feito?" />
      <Inp label="Descrição" value={f.description} onChange={v => sF(p => ({ ...p, description: v }))} ph="Detalhes opcionais..." />
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: X.t3, fontFamily: "'Outfit'", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>Categoria</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {CATS.map(c => <button key={c.id} onClick={() => sF(p => ({ ...p, category: c.id }))}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8,
              border: `1.5px solid ${f.category === c.id ? c.color : X.brd}`, background: f.category === c.id ? `${c.color}12` : "transparent",
              color: f.category === c.id ? c.color : X.t3, fontSize: 11, fontFamily: "'Outfit'", fontWeight: 500, cursor: "pointer" }}>
            {c.icon} {c.label}
          </button>)}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Dots label="Urgência" value={f.urgency} onChange={v => sF(p => ({ ...p, urgency: v }))} color={X.r} />
        <Dots label="Importância" value={f.importance} onChange={v => sF(p => ({ ...p, importance: v }))} color={X.y} />
        <Dots label="Chatice" value={f.tediousness} onChange={v => sF(p => ({ ...p, tediousness: v }))} color={X.p} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Inp label="Esforço (min)" type="number" value={f.effort_minutes} onChange={v => sF(p => ({ ...p, effort_minutes: parseInt(v) || 0 }))} min={5} max={480} />
        <Sel label="Projeto" value={f.project_id || ""} onChange={v => sF(p => ({ ...p, project_id: v || null }))}
          opts={[{ v: "", l: "Sem projeto" }, ...projects.map(p => ({ v: p.id, l: p.name }))]} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <Btn v="secondary" onClick={onClose} ch="Cancelar" />
        <Btn onClick={() => { if (f.title.trim()) { onSave({ ...f, title: f.title.trim() }); onClose(); } }} dis={!f.title.trim()} ch={task ? "Salvar" : "Criar"} loading={ld} />
      </div>
    </div>
  } />;
}

// ── PROJECT FORM ──
function ProjForm({ open, onClose, onSave, proj }) {
  const [n, sN] = useState(""); const [c, sC] = useState("#f97316");
  const cs = ["#f97316", "#34d399", "#818cf8", "#f472b6", "#a78bfa", "#2dd4bf", "#f87171", "#fbbf24"];
  useEffect(() => { if (open) { sN(proj?.name || ""); sC(proj?.color || "#f97316"); } }, [proj, open]);
  return <Modal open={open} onClose={onClose} title={proj ? "Editar Projeto" : "Novo Projeto"} w={350} ch={
    <div>
      <Inp label="Nome" value={n} onChange={sN} ph="Ex: Trabalho..." sty={{ marginBottom: 12 }} />
      <label style={{ fontSize: 11, fontWeight: 600, color: X.t3, fontFamily: "'Outfit'", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>Cor</label>
      <div style={{ display: "flex", gap: 7, marginBottom: 18 }}>
        {cs.map(x => <div key={x} onClick={() => sC(x)} style={{ width: 24, height: 24, borderRadius: "50%", background: x, cursor: "pointer",
          border: c === x ? "3px solid #fff" : "3px solid transparent", boxShadow: c === x ? `0 0 0 2px ${x}` : "none" }} />)}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn v="secondary" onClick={onClose} ch="Cancelar" />
        <Btn onClick={() => { if (n.trim()) { onSave({ name: n.trim(), color: c }); onClose(); } }} dis={!n.trim()} ch={proj ? "Salvar" : "Criar"} />
      </div>
    </div>
  } />;
}

// ── TASK CARD ──
function TC({ task, projects, onEdit, onDelete, onStatus, compact, isFrog, showFrog, onFrog }) {
  const cat = CM[task.category]; const proj = projects?.find(p => p.id === task.project_id); const done = task.status === "done";
  const [hov, sH] = useState(false);
  return <div className="af" onMouseEnter={() => sH(true)} onMouseLeave={() => sH(false)}
    style={{ background: hov ? X.s3 : X.card, borderRadius: 12, border: `1px solid ${hov ? X.brdH : X.brd}`, padding: compact ? "9px 11px" : "11px 13px",
      borderLeft: `3px solid ${cat?.color || X.brd}`, opacity: done ? .5 : 1, transition: "all .15s" }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
      <button onClick={() => onStatus(task.id, done ? "not_started" : "done")}
        style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${done ? X.g : X.brd}`, background: done ? X.g : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all .15s" }}>
        {done && <Ic n="check" s={11} c="#fff" />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: done ? X.t3 : X.t, fontFamily: "'Outfit'", textDecoration: done ? "line-through" : "none", marginBottom: 3, lineHeight: 1.3 }}>
          {isFrog && "🐸 "}{task.title}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <Tag ch={`${cat?.icon} ${cat?.label}`} color={cat?.color} />
          {proj && <Tag ch={proj.name} color={proj.color} />}
          {!compact && <span style={{ fontSize: 9, color: X.t3, fontFamily: "'JetBrains Mono'" }}>P{cp(task)} · {task.effort_minutes || 0}m</span>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 1, flexShrink: 0, opacity: hov || compact ? 1 : .5 }}>
        {showFrog && !done && <button onClick={() => onFrog?.(task.id)} style={{ background: isFrog ? `${X.y}18` : "none", border: "none", color: isFrog ? X.y : X.t3, cursor: "pointer", padding: 4, borderRadius: 5, fontSize: 12 }}>🐸</button>}
        {onEdit && <button onClick={() => onEdit(task)} style={{ background: "none", border: "none", color: X.t3, cursor: "pointer", padding: 4, borderRadius: 5 }}><Ic n="edit" s={12} /></button>}
        {onDelete && <button onClick={() => onDelete(task.id)} style={{ background: "none", border: "none", color: X.t3, cursor: "pointer", padding: 4, borderRadius: 5 }}><Ic n="trash" s={12} /></button>}
      </div>
    </div>
  </div>;
}

// ── PLANNING MODAL ──
function PlanModal({ open, onClose, tasks, projects, plans, onSave, targetDate, addTask, profile }) {
  const [sel, sSel] = useState([]); const [frog, sFrog] = useState(null); const [step, sStep] = useState(1); const [dragI, sDragI] = useState(null); const [saving, sSaving] = useState(false);
  const [quickTitle, sQuickTitle] = useState(""); const [addingQuick, sAddingQuick] = useState(false);
  const bl = useMemo(() => tasks.filter(t => t.status !== "done" && !t.archived_at).sort((a, b) => cp(b) - cp(a)), [tasks]);

  // If editing existing plan, pre-select its tasks
  const existingPlan = plans.find(p => p.date === targetDate);
  useEffect(() => {
    if (open) {
      if (existingPlan && existingPlan.status !== "closed") {
        const pts = (existingPlan.plan_tasks || []).sort((a, b) => a.order_index - b.order_index);
        sSel(pts.map(pt => pt.task_id));
        const f = pts.find(pt => pt.is_frog);
        sFrog(f ? f.task_id : null);
        sStep(1);
      } else { sSel([]); sFrog(null); sStep(1); }
      sQuickTitle("");
    }
  }, [open]);

  const sugg = useMemo(() => {
    const cc = new Set(sel.map(id => tasks.find(t => t.id === id)?.category));
    return bl.filter(t => !sel.includes(t.id)).sort((a, b) => {
      const ab = !cc.has(a.category) ? 5 : 0; const bb = !cc.has(b.category) ? 5 : 0;
      return (cp(b) + bb) - (cp(a) + ab);
    }).slice(0, 5);
  }, [bl, sel, tasks]);
  const selT = sel.map(id => tasks.find(t => t.id === id)).filter(Boolean);
  const cc = new Set(selT.map(t => t.category));
  const tog = id => sSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const drop = to => { if (dragI == null || dragI === to) return; const a = [...sel]; const [it] = a.splice(dragI, 1); a.splice(to, 0, it); sSel(a); sDragI(null); };

  // Quick add task
  const handleQuickAdd = async () => {
    const title = quickTitle.trim();
    if (!title || addingQuick) return;
    sAddingQuick(true);
    const newTask = await addTask({ title, category: "brain_out", effort_minutes: 30 });
    if (newTask) sSel(p => [...p, newTask.id]);
    sQuickTitle("");
    sAddingQuick(false);
  };

  // Time slot calculations
  const startTime = profile?.day_start_time || "07:00";
  const timeSlots = useMemo(() => {
    const [h, m] = startTime.split(":").map(Number);
    let mins = h * 60 + m;
    return selT.map(t => {
      const slotH = Math.floor(mins / 60) % 24;
      const slotM = mins % 60;
      const label = `${String(slotH).padStart(2, "0")}:${String(slotM).padStart(2, "0")}`;
      const dur = Math.max(30, Math.ceil((t.effort_minutes || 30) / 30) * 30);
      mins += dur;
      return { label, dur };
    });
  }, [selT, startTime]);
  const endMins = useMemo(() => {
    const [h, m] = startTime.split(":").map(Number);
    return selT.reduce((acc, t) => acc + Math.max(30, Math.ceil((t.effort_minutes || 30) / 30) * 30), h * 60 + m);
  }, [selT, startTime]);
  const endLabel = `${String(Math.floor(endMins / 60) % 24).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;

  const save = async () => { sSaving(true); await onSave(targetDate, sel, frog); sSaving(false); onClose(); };

  const Row = ({ t, checked }) => (
    <div onClick={() => tog(t.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 9px", borderRadius: 8, cursor: "pointer",
      background: checked ? X.acG : "transparent", border: `1px solid ${checked ? X.ac + "35" : "transparent"}`, transition: "all .1s" }}>
      <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? X.ac : X.brd}`, background: checked ? X.ac : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{checked && <Ic n="check" s={9} c="#fff" />}</div>
      <span style={{ flex: 1, fontSize: 12, color: X.t, fontFamily: "'Outfit'", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
      <Tag ch={CM[t.category]?.icon} color={CM[t.category]?.color} />
      <span style={{ fontSize: 9, color: X.t3, fontFamily: "'JetBrains Mono'", minWidth: 22, textAlign: "right" }}>P{cp(t)}</span>
    </div>
  );

  return <Modal open={open} onClose={onClose} title={`${existingPlan ? "Editar" : "Planejar"} ${fd(targetDate)}`} ch={
    <div>
      <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
        {["Selecionar", "Horários & 🐸", "Confirmar"].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", padding: "5px 0", borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: "'Outfit'",
            background: step === i + 1 ? X.acG : "transparent", color: step === i + 1 ? X.ac : X.t3,
            borderBottom: step === i + 1 ? `2px solid ${X.ac}` : "2px solid transparent" }}>{s}</div>
        ))}
      </div>

      {step === 1 && <>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <input value={quickTitle} onChange={e => sQuickTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleQuickAdd()}
            placeholder="+ Adicionar tarefa rápida..."
            style={{ flex: 1, background: X.bg, border: `1px solid ${X.brd}`, borderRadius: 8, padding: "8px 10px", color: X.t, fontSize: 12,
              fontFamily: "'Outfit'", outline: "none" }} />
          <button onClick={handleQuickAdd} disabled={!quickTitle.trim() || addingQuick}
            style={{ background: X.ac, border: "none", borderRadius: 8, padding: "0 12px", color: "#fff", fontSize: 14, cursor: "pointer",
              opacity: !quickTitle.trim() || addingQuick ? 0.4 : 1 }}>+</button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: X.t2, fontFamily: "'Outfit'" }}>{sel.length} selecionada{sel.length !== 1 && "s"}</span>
          <div style={{ display: "flex", gap: 2 }}>
            {CATS.map(c => <div key={c.id} style={{ width: 18, height: 18, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9,
              background: cc.has(c.id) ? `${c.color}20` : X.bg, border: `1px solid ${cc.has(c.id) ? c.color + "40" : X.brd}`, opacity: cc.has(c.id) ? 1 : .3 }}>{c.icon}</div>)}
          </div>
        </div>
        {sugg.length > 0 && <>
          <div style={{ fontSize: 10, fontWeight: 700, color: X.ac, fontFamily: "'Outfit'", marginBottom: 4 }}>💡 Sugestões</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 8 }}>{sugg.map(t => <Row key={t.id} t={t} checked={sel.includes(t.id)} />)}</div>
        </>}
        <div style={{ fontSize: 10, fontWeight: 700, color: X.t3, fontFamily: "'Outfit'", marginBottom: 4 }}>Backlog ({bl.length})</div>
        <div style={{ maxHeight: 190, overflow: "auto", display: "flex", flexDirection: "column", gap: 2 }}>{bl.map(t => <Row key={t.id} t={t} checked={sel.includes(t.id)} />)}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
          <Btn v="secondary" onClick={onClose} ch="Cancelar" sm />
          <Btn onClick={() => sStep(2)} dis={!sel.length} ch={`Próximo (${sel.length})`} sm />
        </div>
      </>}

      {step === 2 && <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 10px" }}>
          <p style={{ fontSize: 11, color: X.ac, fontFamily: "'Outfit'", margin: 0 }}>Arraste para reordenar · 🐸 = sapo (+0.3)</p>
          <span style={{ fontSize: 10, color: X.t3, fontFamily: "'JetBrains Mono'" }}>{startTime} → {endLabel}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {selT.map((t, i) => <div key={t.id} draggable onDragStart={() => sDragI(i)} onDragOver={e => e.preventDefault()} onDrop={() => drop(i)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 10px", borderRadius: 9, background: X.card,
              border: `1px solid ${frog === t.id ? X.y + "45" : X.brd}`, cursor: "grab" }}>
            <span style={{ color: X.t3, display: "flex" }}><Ic n="grip" s={14} c={X.t3} /></span>
            <span style={{ fontSize: 10, color: X.ac, fontFamily: "'JetBrains Mono'", width: 36, flexShrink: 0 }}>{timeSlots[i]?.label}</span>
            <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: X.t, fontFamily: "'Outfit'", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
            <span style={{ fontSize: 9, color: X.t3, fontFamily: "'JetBrains Mono'", flexShrink: 0 }}>{timeSlots[i]?.dur}m</span>
            <Tag ch={CM[t.category]?.icon} color={CM[t.category]?.color} />
            <button onClick={() => sFrog(frog === t.id ? null : t.id)}
              style={{ background: frog === t.id ? `${X.y}18` : "none", border: `1.5px solid ${frog === t.id ? X.y : X.brd}`, borderRadius: 6, padding: "2px 6px", cursor: "pointer", fontSize: 13 }}>🐸</button>
          </div>)}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <input value={quickTitle} onChange={e => sQuickTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleQuickAdd()}
            placeholder="+ Tarefa rápida aqui também..."
            style={{ flex: 1, background: X.bg, border: `1px solid ${X.brd}`, borderRadius: 8, padding: "7px 10px", color: X.t, fontSize: 11,
              fontFamily: "'Outfit'", outline: "none" }} />
          <button onClick={handleQuickAdd} disabled={!quickTitle.trim() || addingQuick}
            style={{ background: X.ac, border: "none", borderRadius: 8, padding: "0 10px", color: "#fff", fontSize: 13, cursor: "pointer",
              opacity: !quickTitle.trim() || addingQuick ? 0.4 : 1 }}>+</button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <Btn v="ghost" onClick={() => sStep(1)} ch="← Voltar" sm />
          <Btn onClick={() => sStep(3)} ch="Próximo" sm />
        </div>
      </>}

      {step === 3 && <>
        <div style={{ background: X.bg, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${X.brd}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11, color: X.t2, fontFamily: "'Outfit'" }}>
            <div>📋 {selT.length} tarefa{selT.length !== 1 && "s"}</div>
            <div>🐸 {frog ? (selT.find(t => t.id === frog)?.title || "—").slice(0, 20) : "Nenhum"}</div>
            <div>🕐 {startTime} → {endLabel}</div>
            <div>📊 {cc.size}/6 categorias</div>
          </div>
        </div>
        <div style={{ maxHeight: 150, overflow: "auto", display: "flex", flexDirection: "column", gap: 3, marginBottom: 12 }}>
          {selT.map((t, i) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 6, background: X.card, fontSize: 11, fontFamily: "'Outfit'" }}>
              <span style={{ color: X.ac, fontFamily: "'JetBrains Mono'", fontSize: 10, width: 36 }}>{timeSlots[i]?.label}</span>
              <span style={{ flex: 1, color: X.t, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
              {t.id === frog && <span style={{ fontSize: 11 }}>🐸</span>}
            </div>
          ))}
        </div>
        {cc.size === 6 && <div style={{ background: `${X.g}08`, border: `1px solid ${X.g}20`, borderRadius: 8, padding: "7px 12px", marginBottom: 10, fontSize: 11, color: X.g, fontFamily: "'Outfit'", fontWeight: 600 }}>⭐ 6/6 categorias! +1.0 bônus se completar tudo</div>}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Btn v="ghost" onClick={() => sStep(2)} ch="← Voltar" sm />
          <Btn onClick={save} icon="check" ch={existingPlan ? "Salvar alterações" : "Salvar plano"} sm loading={saving} />
        </div>
      </>}
    </div>
  } />;
}

// ── CLOSE MODAL ──
function CloseModal({ open, onClose, plan, tasks, onClosePlan }) {
  const [dec, sDec] = useState({}); const [saving, sSaving] = useState(false);
  useEffect(() => { if (open) sDec({}); }, [open]);
  if (!open || !plan) return null;
  const pts = (plan.plan_tasks || []).map(pt => ({ ...pt, ...(tasks.find(t => t.id === pt.task_id) || {}) }));
  const pend = pts.filter(t => t.status !== "done"); const allD = pend.every(t => dec[t.task_id]);
  const sc = calcScore(plan.plan_tasks || [], tasks);

  const handle = async () => { sSaving(true); await onClosePlan(plan.id, sc, dec); sSaving(false); onClose(); };

  return <Modal open={open} onClose={onClose} title="Fechar o dia" w={440} ch={
    <div>
      {pend.length > 0 && <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: X.y, fontFamily: "'Outfit'", fontWeight: 600, margin: "0 0 6px" }}>⚠ {pend.length} pendente{pend.length !== 1 && "s"}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {pend.map(t => <div key={t.task_id} style={{ background: X.bg, borderRadius: 8, padding: 8, border: `1px solid ${X.brd}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: X.t, fontFamily: "'Outfit'", marginBottom: 5 }}>{t.title}</div>
            <div style={{ display: "flex", gap: 4 }}>
              {[{ id: "tomorrow", l: "→ Amanhã", c: X.y }, { id: "return", l: "↩ Backlog", c: X.p }].map(o => (
                <button key={o.id} onClick={() => sDec(p => ({ ...p, [t.task_id]: o.id }))}
                  style={{ flex: 1, padding: "4px 6px", borderRadius: 6, fontSize: 10, fontWeight: 600, fontFamily: "'Outfit'", cursor: "pointer",
                    border: `1.5px solid ${dec[t.task_id] === o.id ? o.c : X.brd}`, background: dec[t.task_id] === o.id ? `${o.c}12` : "transparent",
                    color: dec[t.task_id] === o.id ? o.c : X.t3 }}>{o.l}</button>
              ))}
            </div>
          </div>)}
        </div>
      </div>}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><ScoreRing value={sc.ts} max={2} size={90} label="pontos" /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 12 }}>
        {[{ ok: sc.ex, i: "🏃", l: "Exercício", p: .3 }, { ok: sc.fr, i: "🐸", l: "Sapo", p: .3 },
          { ok: sc.dn > 0, i: "📋", l: `${sc.dn}/${sc.tt}`, p: rnd(sc.ds - (sc.ex ? .3 : 0) - (sc.fr ? .3 : 0)) }
        ].map(s => <div key={s.l} style={{ padding: 6, borderRadius: 7, background: X.bg, textAlign: "center" }}>
          <div style={{ fontSize: 14 }}>{s.ok ? "✅" : s.i}</div><div style={{ fontSize: 9, color: X.t3 }}>{s.l}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: s.ok ? X.g : X.t3, fontFamily: "'JetBrains Mono'" }}>+{s.p.toFixed(1)}</div>
        </div>)}
      </div>
      {sc.ac && <div style={{ textAlign: "center", marginBottom: 10, padding: "5px 0", background: `${X.g}08`, borderRadius: 6, fontSize: 11, color: X.g, fontWeight: 700 }}>⭐ Bônus +1.0</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn v="secondary" onClick={onClose} ch="Cancelar" sm />
        <Btn v="success" onClick={handle} dis={pend.length > 0 && !allD} icon="lock" ch="Fechar dia" sm loading={saving} />
      </div>
    </div>
  } />;
}

// ── TAB: HOJE ──
function TabToday({ profile, data, addScore, updateProfile, tst, sCf }) {
  const { tasks, projects, plans, savePlan, updatePlanTaskStatus, closePlan, reopenPlan } = data;
  const today = tdy(); const tw_ = tmrw(); const tp = plans.find(p => p.date === today);
  const [showPlan, sShowPlan] = useState(false); const [showClose, sShowClose] = useState(false); const [target, sTarget] = useState(tw_);
  const lv = gl(profile.score);

  const planT = useMemo(() => {
    if (!tp) return [];
    const sorted = (tp.plan_tasks || []).map(pt => { const t = tasks.find(x => x.id === pt.task_id); return t ? { ...t, _ptId: pt.id, is_frog: pt.is_frog, order_index: pt.order_index } : null; }).filter(Boolean).sort((a, b) => a.order_index - b.order_index);
    const [h, m] = (profile.day_start_time || "07:00").split(":").map(Number);
    let mins = h * 60 + m;
    return sorted.map(t => {
      const slotH = Math.floor(mins / 60) % 24; const slotM = mins % 60;
      const label = `${String(slotH).padStart(2, "0")}:${String(slotM).padStart(2, "0")}`;
      mins += Math.max(30, Math.ceil((t.effort_minutes || 30) / 30) * 30);
      return { ...t, _time: label };
    });
  }, [tp, tasks, profile.day_start_time]);

  const sc = tp ? calcScore(tp.plan_tasks || [], tasks) : null;
  const cc = new Set(planT.filter(t => t.status === "done").map(t => t.category));

  const hStatus = async (taskId, status) => {
    const pt = tp?.plan_tasks?.find(p => p.task_id === taskId);
    if (pt) await updatePlanTaskStatus(pt.id, status);
    if (status === "done") tst("Tarefa concluída! ✨");
  };

  const hSavePlan = async (date, taskIds, frogId) => {
    await savePlan(date, taskIds, frogId);
    tst(`Plano ${fd(date)} salvo!`);
  };

  const hClose = async (pid, sd, dec) => {
    const pts = await closePlan(pid, sd, dec);
    await addScore(pts);
    tst(`Dia fechado! +${sd.ts.toFixed(1)} pontos`);
    if (sd.ts >= 1.5) sCf(true);
  };

  const hReopen = async () => {
    if (!tp) return;
    // Subtract old score
    await addScore(-(tp.total_score || 0));
    await reopenPlan(tp.id);
    tst("Dia reaberto para edição", "info");
  };

  const hasTw = plans.some(p => p.date === tw_);

  return <div style={{ padding: "12px 12px 96px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }} className="af">
      <div>
        <h2 style={{ fontFamily: "'Outfit'", fontSize: 19, fontWeight: 800, color: X.t }}>Olá, {profile.name || "Missão"}</h2>
        <p style={{ fontFamily: "'Outfit'", fontSize: 11, color: X.t2, margin: "1px 0 0" }}>{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 16, fontWeight: 700, color: lv.c }}>{profile.score.toFixed(1)}</div>
        <div style={{ fontFamily: "'Outfit'", fontSize: 9, color: X.t3 }}>{lv.i} {lv.n}</div>
      </div>
    </div>

    {sc && tp?.status !== "closed" && <div className="asu" style={{ background: `linear-gradient(145deg, ${X.s1}, ${X.s2})`, borderRadius: 16, border: `1px solid ${X.brd}`, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <ScoreRing value={sc.ds} max={1} size={64} label="base" />
        <div style={{ flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
            {[{ ok: sc.ex, i: "🏃", l: "Exercício" }, { ok: sc.fr, i: "🐸", l: "Sapo" }, { ok: sc.dn === sc.tt && sc.tt > 0, i: "📋", l: `${sc.dn}/${sc.tt}` }].map(s => (
              <div key={s.l} style={{ textAlign: "center", padding: "4px 2px", borderRadius: 6, background: s.ok ? `${X.g}10` : X.bg }}>
                <div style={{ fontSize: 12 }}>{s.ok ? "✅" : s.i}</div><div style={{ fontSize: 8, color: X.t3 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 2, marginTop: 6 }}>
            {CATS.map(c => <div key={c.id} style={{ flex: 1, height: 4, borderRadius: 2, background: cc.has(c.id) ? c.color : X.brd, opacity: cc.has(c.id) ? 1 : .3 }} />)}
          </div>
        </div>
      </div>
    </div>}

    {tp?.status === "closed" && <div className="asu" style={{ background: `linear-gradient(145deg, ${X.g}06, ${X.p}06)`, borderRadius: 16, border: `1px solid ${X.g}20`, padding: 20, marginBottom: 12, textAlign: "center" }}>
      <div style={{ fontSize: 36, marginBottom: 4 }}>🏆</div>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 26, fontWeight: 700, color: X.g }}>+{(tp.total_score || 0).toFixed(1)}</div>
      <div style={{ fontFamily: "'Outfit'", fontSize: 12, color: X.t2, marginBottom: 6 }}>Dia concluído</div>
      <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
        {tp.had_exercise && <Tag ch="🏃 Exercício" color={X.g} />}
        {tp.completed_frog && <Tag ch="🐸 Sapo" color={X.y} />}
        {tp.completed_all_categories && <Tag ch="⭐ 6/6" color={X.p} />}
      </div>
      <Btn v="ghost" sm onClick={hReopen} icon="refresh" ch="Reabrir dia para edição" />
    </div>}

    <div style={{ display: "flex", gap: 6, marginBottom: 14 }} className="af">
      {!tp && <Btn full onClick={() => { sTarget(today); sShowPlan(true); }} icon="sun" ch="Planejar hoje" />}
      {tp && tp.status === "planned" && <>
        <Btn v="accent" full onClick={() => { sTarget(today); sShowPlan(true); }} icon="edit" ch="Editar plano" />
        <Btn v="success" full onClick={() => sShowClose(true)} icon="lock" ch="Fechar dia" />
      </>}
      {!hasTw && <Btn v={tp ? "secondary" : "accent"} full onClick={() => { sTarget(tw_); sShowPlan(true); }} icon="moon" ch="Planejar amanhã" />}
    </div>

    {planT.length > 0 && tp?.status !== "closed" ? <>
      <h3 style={{ fontFamily: "'Outfit'", fontSize: 13, fontWeight: 700, color: X.t, margin: "0 0 8px" }}>
        Tarefas <span style={{ fontWeight: 400, color: X.t2 }}>({planT.filter(t => t.status === "done").length}/{planT.length})</span>
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {planT.map((t, i) => <div key={t.id} style={{ animationDelay: `${i * 50}ms`, display: "flex", alignItems: "center", gap: 6 }} className="af">
          <span style={{ fontSize: 10, color: X.ac, fontFamily: "'JetBrains Mono'", width: 36, flexShrink: 0, textAlign: "center" }}>{t._time}</span>
          <div style={{ flex: 1 }}><TC task={t} projects={projects} compact isFrog={t.is_frog} onStatus={hStatus} /></div>
        </div>)}
      </div>
    </> : !tp ? <Empty icon="🎯" title="Sem plano para hoje" sub="Planeje seu dia para começar a pontuar" /> : null}

    <PlanModal open={showPlan} onClose={() => sShowPlan(false)} tasks={tasks} projects={projects} plans={plans} onSave={hSavePlan} targetDate={target} addTask={data.addTask} profile={profile} />
    <CloseModal open={showClose} onClose={() => sShowClose(false)} plan={tp} tasks={tasks} onClosePlan={hClose} />
  </div>;
}

// ── TAB: TAREFAS ──
function TabTasks({ data, tst }) {
  const { tasks, projects, addTask, updateTask, deleteTask, addProject, updateProject, deleteProject } = data;
  const [sTF, sSTF] = useState(false); const [sPF, sSPF] = useState(false);
  const [eT, sET] = useState(null); const [eP, sEP] = useState(null);
  const [fC, sFC] = useState("all"); const [fS, sFS] = useState("active"); const [sF, sSF] = useState(false); const [vw, sVw] = useState("tasks");

  const fil = tasks.filter(t => {
    if (fS === "active" && t.status === "done") return false; if (fS === "done" && t.status !== "done") return false;
    if (fC !== "all" && t.category !== fC) return false; return !t.archived_at;
  }).sort((a, b) => cp(b) - cp(a));

  const hAdd = async f => { await addTask(f); tst("Tarefa criada!"); };
  const hEdit = async (id, f) => { await updateTask(id, f); tst("Atualizada!"); };
  const hDel = async id => { if (confirm("Excluir?")) await deleteTask(id); };
  const hStat = async (id, s) => { await updateTask(id, { status: s, completed_at: s === "done" ? new Date().toISOString() : null }); };

  return <div style={{ padding: "12px 12px 96px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }} className="af">
      <h2 style={{ fontFamily: "'Outfit'", fontSize: 19, fontWeight: 800, color: X.t }}>Tarefas</h2>
      <div style={{ display: "flex", gap: 4 }}>
        <Btn v="ghost" sm onClick={() => sSF(!sF)} icon="filter" ch="" />
        <Btn sm onClick={() => { sET(null); sSTF(true); }} icon="plus" ch="Nova" />
      </div>
    </div>
    <div style={{ display: "flex", gap: 2, marginBottom: 12, background: X.bg, borderRadius: 8, padding: 2 }}>
      {[{ id: "tasks", l: "Backlog" }, { id: "projects", l: "Projetos" }].map(v => (
        <button key={v.id} onClick={() => sVw(v.id)} style={{ flex: 1, padding: "7px 0", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "'Outfit'", fontSize: 12, fontWeight: 600,
          background: vw === v.id ? X.s2 : "transparent", color: vw === v.id ? X.t : X.t3 }}>{v.l}</button>
      ))}
    </div>

    {vw === "tasks" ? <>
      {sF && <div style={{ background: X.s1, borderRadius: 9, border: `1px solid ${X.brd}`, padding: 10, marginBottom: 10, display: "flex", flexDirection: "column", gap: 6 }} className="asi">
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {[{ id: "active", l: "Ativas", c: X.ac }, { id: "done", l: "Concluídas", c: X.g }, { id: "all", l: "Todas", c: X.p }].map(o => (
            <button key={o.id} onClick={() => sFS(o.id)} style={{ padding: "3px 9px", borderRadius: 5, border: `1px solid ${fS === o.id ? o.c : X.brd}`,
              background: fS === o.id ? `${o.c}10` : "transparent", color: fS === o.id ? o.c : X.t3, fontFamily: "'Outfit'", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>{o.l}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <button onClick={() => sFC("all")} style={{ padding: "2px 7px", borderRadius: 4, border: `1px solid ${fC === "all" ? X.ac : X.brd}`,
            background: fC === "all" ? X.acG : "transparent", color: fC === "all" ? X.ac : X.t3, fontFamily: "'Outfit'", fontSize: 9, cursor: "pointer", fontWeight: 600 }}>Todas</button>
          {CATS.map(c => <button key={c.id} onClick={() => sFC(c.id)} style={{ padding: "2px 7px", borderRadius: 4, border: `1px solid ${fC === c.id ? c.color : X.brd}`,
            background: fC === c.id ? `${c.color}10` : "transparent", color: fC === c.id ? c.color : X.t3, fontFamily: "'Outfit'", fontSize: 9, cursor: "pointer" }}>{c.icon}</button>)}
        </div>
      </div>}
      {!fil.length ? <Empty icon="✨" title="Nenhuma tarefa" sub="Crie tarefas para seus planos" action={<Btn sm onClick={() => { sET(null); sSTF(true); }} icon="plus" ch="Criar" />} />
        : <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {fil.map((t, i) => <div key={t.id} style={{ animationDelay: `${i * 30}ms` }} className="af">
            <TC task={t} projects={projects} onEdit={t => { sET(t); sSTF(true); }} onDelete={hDel} onStatus={hStat} />
          </div>)}
          <div style={{ textAlign: "center", marginTop: 3 }}><span style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: X.t3 }}>{fil.length}</span></div>
        </div>}
    </> : <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><Btn sm onClick={() => { sEP(null); sSPF(true); }} icon="plus" ch="Novo" /></div>
      {!projects.length ? <Empty icon="📁" title="Nenhum projeto" sub="Organize por contexto" action={<Btn sm onClick={() => { sEP(null); sSPF(true); }} icon="plus" ch="Criar" />} />
        : <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {projects.map((p, i) => { const pt = tasks.filter(t => t.project_id === p.id && !t.archived_at); const pd = pt.filter(t => t.status === "done").length; const pct = pt.length ? pd / pt.length : 0;
            return <div key={p.id} className="af" style={{ animationDelay: `${i * 40}ms`, background: X.card, borderRadius: 10, border: `1px solid ${X.brd}`, padding: "11px 13px", borderLeft: `3px solid ${p.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} /><span style={{ fontFamily: "'Outfit'", fontSize: 13, fontWeight: 600, color: X.t }}>{p.name}</span></div>
                  <span style={{ fontFamily: "'Outfit'", fontSize: 10, color: X.t2 }}>{pd}/{pt.length}</span></div>
                <div style={{ display: "flex", gap: 2 }}>
                  <button onClick={() => { sEP(p); sSPF(true); }} style={{ background: "none", border: "none", color: X.t3, cursor: "pointer", padding: 4 }}><Ic n="edit" s={12} /></button>
                  <button onClick={async () => { if (confirm("Excluir?")) await deleteProject(p.id); }} style={{ background: "none", border: "none", color: X.t3, cursor: "pointer", padding: 4 }}><Ic n="trash" s={12} /></button>
                </div>
              </div>
              <div style={{ height: 3, background: X.brd, borderRadius: 2, marginTop: 6, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct * 100}%`, background: p.color, borderRadius: 2 }} /></div>
            </div>; })}
        </div>}
    </>}
    <TaskForm open={sTF} onClose={() => { sSTF(false); sET(null); }} onSave={f => eT ? hEdit(eT.id, f) : hAdd(f)} task={eT} projects={projects} />
    <ProjForm open={sPF} onClose={() => { sSPF(false); sEP(null); }} onSave={async f => {
      if (eP) await updateProject(eP.id, f); else await addProject(f);
    }} proj={eP} />
  </div>;
}

// ── TAB: MISSÃO ──
function TabMission({ profile, data }) {
  const { tasks, plans } = data;
  const lv = gl(profile.score); const nl = LVL.find(l => l.min > profile.score);
  const lp = nl ? (profile.score - lv.min) / (nl.min - lv.min) : 1;
  const closed = plans.filter(p => p.status === "closed"); const planned = plans.filter(p => p.status === "planned" || p.status === "closed");
  let streak = 0; const dy = new Date();
  for (let i = 0; i < 365; i++) { const d = new Date(dy); d.setDate(d.getDate() - i); if (plans.some(p => p.date === tdy(d) && (p.status === "planned" || p.status === "closed"))) streak++; else break; }
  const frogs = closed.reduce((s, p) => s + (p.completed_frog ? 1 : 0), 0);
  const exDs = closed.reduce((s, p) => s + (p.had_exercise ? 1 : 0), 0);
  const perfDs = closed.reduce((s, p) => s + (p.completed_all_categories ? 1 : 0), 0);
  const totalDone = tasks.filter(t => t.status === "done").length;

  const badges = [
    { c: "first_plan", n: "Primeiro Plano", i: "📋", d: "Criar o primeiro plano", ok: planned.length >= 1 },
    { c: "seven_plans", n: "Semana Forte", i: "📅", d: "7 dias planejados", ok: planned.length >= 7 },
    { c: "thirty_plans", n: "Mês Dedicado", i: "🗓️", d: "30 dias planejados", ok: planned.length >= 30 },
    { c: "first_frog", n: "Primeiro Sapo", i: "🐸", d: "Primeiro sapo concluído", ok: frogs >= 1 },
    { c: "ten_frogs", n: "Caçador de Sapos", i: "🏆", d: "10 sapos concluídos", ok: frogs >= 10 },
    { c: "seven_exercise", n: "Atleta", i: "💪", d: "7 dias com exercício", ok: exDs >= 7 },
    { c: "five_perfect", n: "Perfeccionista", i: "⭐", d: "5 dias 6/6 categorias", ok: perfDs >= 5 },
    { c: "week_streak", n: "Sem Parar", i: "🔥", d: "7 dias consecutivos", ok: streak >= 7 },
  ];

  const cal = Array.from({ length: 35 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (34 - i)); return { date: tdy(d), day: d.getDate(), wd: d.getDay(), plan: plans.find(p => p.date === tdy(d)) }; });

  return <div style={{ padding: "12px 12px 96px" }}>
    <h2 style={{ fontFamily: "'Outfit'", fontSize: 19, fontWeight: 800, color: X.t, margin: "0 0 14px" }} className="af">Missão</h2>
    <div className="asu" style={{ background: `linear-gradient(145deg, ${lv.c}08, ${X.p}06)`, borderRadius: 16, border: `1px solid ${lv.c}20`, padding: 20, marginBottom: 14, textAlign: "center" }}>
      <div style={{ fontSize: 44, marginBottom: 4 }}>{lv.i}</div>
      <div style={{ fontFamily: "'Outfit'", fontSize: 11, fontWeight: 700, color: X.t3, textTransform: "uppercase", letterSpacing: 1.5 }}>Nível {LVL.indexOf(lv) + 1}</div>
      <div style={{ fontFamily: "'Outfit'", fontSize: 22, fontWeight: 800, color: X.t }}>{lv.n}</div>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 28, fontWeight: 700, color: lv.c }}>{profile.score.toFixed(1)}</div>
      <div style={{ fontFamily: "'Outfit'", fontSize: 10, color: X.t3, marginTop: 2, marginBottom: 8 }}>{nl ? `${rnd(nl.min - profile.score, 1)} pts para ${nl.n}` : "Nível máximo!"}</div>
      {nl && <div style={{ height: 6, background: X.bg, borderRadius: 3, overflow: "hidden", maxWidth: 200, margin: "0 auto" }}>
        <div style={{ height: "100%", width: `${lp * 100}%`, background: `linear-gradient(90deg, ${lv.c}, ${X.p})`, borderRadius: 3 }} /></div>}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5, marginBottom: 14 }}>
      {[{ l: "Streak", v: `${streak}d`, i: "🔥", c: X.ac }, { l: "Sapos", v: frogs, i: "🐸", c: X.y }, { l: "Exercício", v: `${exDs}d`, i: "🏃", c: X.g }, { l: "Concluídas", v: totalDone, i: "✅", c: X.p }].map((s, i) => (
        <div key={s.l} className="af" style={{ animationDelay: `${i * 60}ms`, background: X.card, borderRadius: 10, border: `1px solid ${X.brd}`, padding: "8px 4px", textAlign: "center" }}>
          <div style={{ fontSize: 14 }}>{s.i}</div><div style={{ fontFamily: "'JetBrains Mono'", fontSize: 15, fontWeight: 700, color: s.c }}>{s.v}</div><div style={{ fontFamily: "'Outfit'", fontSize: 8, color: X.t3 }}>{s.l}</div>
        </div>
      ))}
    </div>
    <div style={{ marginBottom: 14 }}>
      <h3 style={{ fontFamily: "'Outfit'", fontSize: 12, fontWeight: 700, color: X.t, margin: "0 0 6px" }}>Últimas 5 semanas</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 8, color: X.t3, fontFamily: "'Outfit'" }}>{d}</div>)}
        {Array.from({ length: cal[0]?.wd || 0 }, (_, i) => <div key={`e${i}`} />)}
        {cal.map(d => {
          const s = d.plan?.total_score || 0; const cl = d.plan?.status === "closed"; const pl = d.plan?.status === "planned";
          let bg = X.bg2; if (cl) bg = s >= 1.5 ? `${X.g}50` : s >= .8 ? `${X.g}28` : s > 0 ? `${X.y}22` : `${X.r}18`; else if (pl) bg = `${X.ac}15`;
          return <div key={d.date} style={{ aspectRatio: "1", borderRadius: 3, background: bg, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 8, color: cl ? X.t : X.t3, fontFamily: "'JetBrains Mono'", border: d.date === tdy() ? `1.5px solid ${X.ac}` : "none" }}>{d.day}</div>;
        })}
      </div>
    </div>
    <h3 style={{ fontFamily: "'Outfit'", fontSize: 12, fontWeight: 700, color: X.t, margin: "0 0 6px" }}>Badges <span style={{ fontWeight: 400, color: X.t3 }}>({badges.filter(b => b.ok).length}/{badges.length})</span></h3>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
      {badges.map((b, i) => <div key={b.c} className="af" style={{ animationDelay: `${i * 40}ms`, background: b.ok ? `${X.ac}06` : X.card, borderRadius: 10,
        border: `1px solid ${b.ok ? X.ac + "25" : X.brd}`, padding: 10, opacity: b.ok ? 1 : .35 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}><span style={{ fontSize: 16 }}>{b.i}</span><span style={{ fontFamily: "'Outfit'", fontSize: 11, fontWeight: 600, color: X.t }}>{b.n}</span></div>
        <div style={{ fontFamily: "'Outfit'", fontSize: 9, color: X.t2 }}>{b.d}</div>
      </div>)}
    </div>
  </div>;
}

// ── SETTINGS ──
function Sett({ open, onClose, profile, onSave, onLogout }) {
  const [n, sN] = useState(""); const [pt, sPt] = useState("21:00"); const [st, sSt] = useState("07:00"); const [saving, sSaving] = useState(false);
  useEffect(() => { if (profile && open) { sN(profile.name || ""); sPt(profile.daily_plan_time || "21:00"); sSt(profile.day_start_time || "07:00"); } }, [profile, open]);
  return <Modal open={open} onClose={onClose} title="Configurações" w={350} ch={
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Inp label="Nome" value={n} onChange={sN} />
      <Inp label="Lembrete de planejamento" type="time" value={pt} onChange={sPt} />
      <Inp label="Início do dia" type="time" value={st} onChange={sSt} />
      <Btn onClick={async () => { sSaving(true); await onSave({ name: n, daily_plan_time: pt, day_start_time: st }); sSaving(false); onClose(); }} full ch="Salvar" loading={saving} />
      <hr style={{ border: "none", borderTop: `1px solid ${X.brd}`, margin: "2px 0" }} />
      <Btn v="danger" onClick={onLogout} icon="logout" full ch="Sair" />
    </div>
  } />;
}

// ═══════════════════════════════════════
// ── MAIN APP ──
// ═══════════════════════════════════════
export default function DiaApp() {
  const auth = useAuth();
  const data = useData(auth.user?.id);
  const [tab, sTab] = useState("today"); const [sett, sSett] = useState(false);
  const [toast, sToast] = useState(null); const [confetti, sConfetti] = useState(false);

  useEffect(() => { if (confetti) { const t = setTimeout(() => sConfetti(false), 3000); return () => clearTimeout(t); } }, [confetti]);
  const tst = (m, t = "success") => sToast({ msg: m, type: t });

  // Loading
  if (auth.loading) return <div style={{ minHeight: "100vh", background: X.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ fontSize: 48, animation: "fadeIn 1s infinite alternate" }}>🎯</div>
  </div>;

  // Auth
  if (!auth.user) return <><style>{CSS}</style><AuthScreen onAuth={auth} /></>;

  // Waiting for profile
  if (!auth.profile) return <div style={{ minHeight: "100vh", background: X.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center" }}><div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div><div style={{ color: X.t2, fontFamily: "'Outfit'", fontSize: 13 }}>Carregando perfil...</div></div>
  </div>;

  const tabs = [{ id: "today", i: "⚡", l: "Hoje" }, { id: "tasks", i: "📋", l: "Tarefas" }, { id: "mission", i: "🎯", l: "Missão" }];

  return <div style={{ minHeight: "100vh", background: X.bg, fontFamily: "'Outfit',sans-serif", color: X.t, maxWidth: 480, margin: "0 auto", position: "relative", overflow: "hidden" }}>
    <style>{CSS}</style>
    <Confetti show={confetti} />
    {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => sToast(null)} />}

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderBottom: `1px solid ${X.brd}`,
      background: `${X.s1}ee`, backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ fontSize: 15 }}>🎯</span>
        <span style={{ fontFamily: "'Outfit'", fontSize: 14, fontWeight: 800, color: X.ac, letterSpacing: 3 }}>DIA</span>
      </div>
      <button onClick={() => sSett(true)} style={{ background: X.s3, border: "none", color: X.t2, cursor: "pointer", padding: 5, borderRadius: 7, display: "flex" }}><Ic n="user" s={16} /></button>
    </div>

    {tab === "today" && <TabToday profile={auth.profile} data={data} addScore={auth.addScore} updateProfile={auth.updateProfile} tst={tst} sCf={sConfetti} />}
    {tab === "tasks" && <TabTasks data={data} tst={tst} />}
    {tab === "mission" && <TabMission profile={auth.profile} data={data} />}

    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480,
      background: `${X.s1}f0`, backdropFilter: "blur(12px)", borderTop: `1px solid ${X.brd}`, display: "flex", padding: "3px 0 env(safe-area-inset-bottom, 6px)", zIndex: 100 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => sTab(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "6px 0",
          background: "none", border: "none", cursor: "pointer", color: tab === t.id ? X.ac : X.t3, position: "relative" }}>
          {tab === t.id && <div style={{ position: "absolute", top: -1, width: 20, height: 2, borderRadius: 1, background: X.ac }} />}
          <span style={{ fontSize: 17, transform: tab === t.id ? "scale(1.15)" : "scale(1)", transition: "transform .15s" }}>{t.i}</span>
          <span style={{ fontSize: 9, fontFamily: "'Outfit'", fontWeight: tab === t.id ? 700 : 500 }}>{t.l}</span>
        </button>
      ))}
    </div>

    <Sett open={sett} onClose={() => sSett(false)} profile={auth.profile} onSave={auth.updateProfile} onLogout={auth.signOut} />
  </div>;
}
