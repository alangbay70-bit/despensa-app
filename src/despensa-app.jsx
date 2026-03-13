import { Html5Qrcode } from "html5-qrcode";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase config ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://fdrdjysueupvgltvjjho.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcmRqeXN1ZXVwdmdsdHZqamhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjM1MTMsImV4cCI6MjA4ODgzOTUxM30.W5O-YWfAwoJzaoxYoReRDX2tiM_4vqVSEZYWOjqKCos";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FREE_LIMIT = 20;

// ── MercadoPago config ────────────────────────────────────────────────────────
const MP_PUBLIC_KEY = "TEST-229045b1-91e4-4a3a-9f90-2db010bea093";
const MP_ACCESS_TOKEN = "TEST-7631958493074722-031121-257234f78fe8a294a6e0fc2b91cd41d5-132726135";

// ── Static data ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "fridge", label: "Refrigerador", icon: "🧊", color: "#4FC3F7" },
  { id: "pantry", label: "Alacena", icon: "🫙", color: "#FFB74D" },
  { id: "freezer", label: "Congelador", icon: "❄️", color: "#81D4FA" },
  { id: "fruits", label: "Frutas y Verduras", icon: "🥬", color: "#AED581" },
];

const RECIPES_DB = [
  {
    id: 1, name: "Arroz con Pollo", time: "35 min", difficulty: "Fácil", servings: 4,
    ingredients: [
      { qty: 2, unit: "tazas", name: "Arroz" }, { qty: 4, unit: "piezas", name: "Pollo (muslos)" },
      { qty: 1, unit: "pza", name: "Cebolla mediana" }, { qty: 3, unit: "dientes", name: "Ajo" },
      { qty: 2, unit: "pzas", name: "Tomates" }, { qty: 2, unit: "cdas", name: "Aceite de oliva" },
      { qty: 1, unit: "cdita", name: "Sal" },
    ],
    steps: ["Sofreír cebolla y ajo en aceite hasta transparentar", "Agregar pollo troceado y dorar por 8 min", "Añadir tomate picado y cocinar 5 min", "Incorporar arroz y revolver", "Cubrir con agua (doble del arroz) y cocinar 20 min a fuego bajo"],
    emoji: "🍗", tags: ["Familiar", "Proteína"], mealType: "🍽️ Comida",
  },
  {
    id: 2, name: "Pasta con Salsa de Tomate", time: "20 min", difficulty: "Muy fácil", servings: 2,
    ingredients: [
      { qty: 250, unit: "g", name: "Pasta" }, { qty: 3, unit: "pzas", name: "Tomates" },
      { qty: 2, unit: "dientes", name: "Ajo" }, { qty: 0.5, unit: "pza", name: "Cebolla" },
      { qty: 1, unit: "cda", name: "Aceite de oliva" }, { qty: 1, unit: "cdita", name: "Sal" },
    ],
    steps: ["Hervir pasta en agua con sal hasta al dente (8-10 min)", "Sofreír ajo y cebolla en aceite por 3 min", "Agregar tomate troceado y cocinar 10 min", "Licuar o dejar la salsa rústica al gusto", "Mezclar con pasta y servir"],
    emoji: "🍝", tags: ["Rápido", "Vegetariano"], mealType: "🍽️ Comida",
  },
  {
    id: 3, name: "Huevos Revueltos con Espinacas", time: "10 min", difficulty: "Muy fácil", servings: 2,
    ingredients: [
      { qty: 4, unit: "pzas", name: "Huevos" }, { qty: 1, unit: "taza", name: "Espinacas" },
      { qty: 1, unit: "diente", name: "Ajo" }, { qty: 1, unit: "cda", name: "Aceite de oliva" },
      { qty: 0.5, unit: "cdita", name: "Sal" },
    ],
    steps: ["Sofreír ajo picado en aceite por 1 min", "Agregar espinacas y saltear 2 min hasta marchitar", "Batir huevos con sal y verter sobre la sartén", "Revolver constantemente a fuego medio-bajo", "Retirar cuando estén apenas cuajados"],
    emoji: "🥚", tags: ["Desayuno", "Rápido"], mealType: "🌅 Desayuno",
  },
  {
    id: 4, name: "Quesadillas", time: "15 min", difficulty: "Fácil", servings: 2,
    ingredients: [
      { qty: 4, unit: "pzas", name: "Tortillas de maíz" }, { qty: 150, unit: "g", name: "Queso Oaxaca" },
      { qty: 1, unit: "pza", name: "Tomate" }, { qty: 0.5, unit: "pza", name: "Cebolla" },
    ],
    steps: ["Picar tomate y cebolla finamente", "Calentar comal o sartén a fuego medio", "Colocar tortilla, agregar queso desebrado y doblar", "Voltear a los 2 min hasta que el queso derrita", "Acompañar con salsa de tomate o guacamole"],
    emoji: "🧀", tags: ["Rápido", "Snack"], mealType: "🌙 Cena",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getDaysToExpiry(expiryDate) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(expiryDate) - today) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ days }) {
  if (days < 0) return <span style={{ background: "#FF5252", color: "white", padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>Caducado</span>;
  if (days <= 2) return <span style={{ background: "#FF5252", color: "white", padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>¡{days}d!</span>;
  if (days <= 5) return <span style={{ background: "#FF9800", color: "white", padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>{days}d</span>;
  if (days <= 10) return <span style={{ background: "#FFC107", color: "#333", padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>{days}d</span>;
  return <span style={{ background: "#E8F5E9", color: "#388E3C", padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>{days}d</span>;
}

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputStyle = {
    width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)", borderRadius: "14px", color: "#F5E6D0",
    fontSize: "15px", boxSizing: "border-box", outline: "none", marginTop: "8px",
  };

  const handleSubmit = async () => {
    setError(""); setSuccess(""); setLoading(true);
    if (!email || !password) { setError("Por favor llena todos los campos."); setLoading(false); return; }
    try {
      if (mode === "register") {
        const { error: e } = await supabase.auth.signUp({ email, password });
        if (e) throw e;
        setSuccess("¡Cuenta creada! Revisa tu correo para confirmar.");
      } else {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
        onAuth(data.user);
      }
    } catch (e) {
      setError(e.message || "Ocurrió un error. Intenta de nuevo.");
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0F0F1A", minHeight: "100vh", maxWidth: "480px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", color: "#F5E6D0" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>

      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div style={{ fontSize: "56px", marginBottom: "12px" }}>🧺</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "32px", fontWeight: "900", margin: 0, background: "linear-gradient(135deg, #FF8C42, #FFD580)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Despensa App
        </h1>
        <p style={{ color: "#B0A090", marginTop: "8px", fontSize: "14px" }}>Tu despensa inteligente</p>
      </div>

      <div style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "28px 24px" }}>
        {/* Tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "rgba(255,255,255,0.05)", borderRadius: "14px", padding: "4px", marginBottom: "24px" }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
              style={{ padding: "10px", background: mode === m ? "linear-gradient(135deg, #FF8C42, #FFB74D)" : "transparent", border: "none", borderRadius: "10px", color: mode === m ? "#1A1A2E" : "#B0A090", fontWeight: "700", fontSize: "14px", cursor: "pointer", transition: "all 0.2s" }}>
              {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ color: "#B0A090", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Correo electrónico</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" style={inputStyle} />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ color: "#B0A090", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Contraseña</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" style={inputStyle}
            onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>

        {error && <div style={{ background: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.3)", borderRadius: "12px", padding: "12px", color: "#FF5252", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}
        {success && <div style={{ background: "rgba(174,213,129,0.1)", border: "1px solid rgba(174,213,129,0.3)", borderRadius: "12px", padding: "12px", color: "#AED581", fontSize: "13px", marginBottom: "16px" }}>{success}</div>}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "16px", background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #FF8C42, #FFB74D)", border: "none", borderRadius: "16px", color: loading ? "#666" : "#1A1A2E", fontSize: "16px", fontWeight: "800", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Cargando..." : mode === "login" ? "Entrar →" : "Crear cuenta →"}
        </button>
      </div>

      <p style={{ color: "#666", fontSize: "12px", marginTop: "24px", textAlign: "center" }}>
        Plan gratuito incluye hasta {FREE_LIMIT} productos · Sin tarjeta de crédito
      </p>
    </div>
  );
}

// ── Add Product Modal ─────────────────────────────────────────────────────────
function AddProductModal({ onClose, onAdd, currentCount, isPremium }) {
  const [form, setForm] = useState({ name: "", emoji: "🛒", category: "fridge", quantity: 1, unit: "pzas", expiry: "", price: "" });
  const emojis = ["🥛","🥚","🧀","🍗","🥩","🐟","🥬","🍅","🧅","🧄","🫘","🍚","🍝","🫒","🧈","🍞","🫙","🥫"];
  const atLimit = !isPremium && currentCount >= FREE_LIMIT;

  if (atLimit) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#1A1A2E", borderRadius: "24px 24px 0 0", padding: "36px 24px 48px", width: "100%", maxWidth: "480px", textAlign: "center" }}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>🔒</div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#F5E6D0", margin: "0 0 10px" }}>Límite alcanzado</h3>
        <p style={{ color: "#B0A090", fontSize: "14px", marginBottom: "24px" }}>El plan gratuito permite hasta <strong style={{ color: "#FFB74D" }}>{FREE_LIMIT} productos</strong>. Actualiza a Premium para agregar ilimitados.</p>
        <button onClick={onClose} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #FF8C42, #FFB74D)", border: "none", borderRadius: "16px", color: "#1A1A2E", fontSize: "16px", fontWeight: "800", cursor: "pointer", marginBottom: "10px" }}>
          ⭐ Ver Plan Premium
        </button>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#B0A090", fontSize: "14px", cursor: "pointer" }}>Cerrar</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#1A1A2E", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: "480px", animation: "slideUp 0.3s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ color: "#F5E6D0", fontSize: "20px", fontFamily: "'Playfair Display', serif", margin: 0 }}>Agregar Producto</h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#F5E6D0", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: "16px" }}>✕</button>
        </div>

        {!isPremium && (
          <div style={{ background: "rgba(255,183,77,0.08)", border: "1px solid rgba(255,183,77,0.2)", borderRadius: "12px", padding: "10px 14px", marginBottom: "16px", fontSize: "12px", color: "#FFB74D" }}>
            {currentCount}/{FREE_LIMIT} productos usados en plan gratuito
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={{ color: "#B0A090", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Emoji</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
            {emojis.map(e => (
              <button key={e} onClick={() => setForm({...form, emoji: e})}
                style={{ fontSize: "20px", background: form.emoji === e ? "rgba(255,180,100,0.3)" : "rgba(255,255,255,0.05)", border: form.emoji === e ? "2px solid #FFB74D" : "2px solid transparent", borderRadius: "10px", padding: "6px", cursor: "pointer", transition: "all 0.15s" }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ color: "#B0A090", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Nombre</label>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej. Leche entera"
            style={{ width: "100%", marginTop: "8px", padding: "12px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#F5E6D0", fontSize: "15px", boxSizing: "border-box", outline: "none" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={{ color: "#B0A090", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Cantidad</label>
            <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
              style={{ width: "100%", marginTop: "8px", padding: "12px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#F5E6D0", fontSize: "15px", boxSizing: "border-box", outline: "none" }} />
          </div>
          <div>
            <label style={{ color: "#B0A090", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Unidad</label>
            <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
              style={{ width: "100%", marginTop: "8px", padding: "12px 14px", background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#F5E6D0", fontSize: "15px", boxSizing: "border-box", outline: "none" }}>
              {["pzas","kg","g","L","ml","bot","caja","bolsa","cabeza","lata"].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ color: "#B0A090", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Categoría</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setForm({...form, category: cat.id})}
                style={{ padding: "10px", background: form.category === cat.id ? `${cat.color}30` : "rgba(255,255,255,0.05)", border: `2px solid ${form.category === cat.id ? cat.color : "transparent"}`, borderRadius: "10px", color: "#F5E6D0", fontSize: "13px", cursor: "pointer", transition: "all 0.15s" }}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ color: "#B0A090", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Fecha de caducidad <span style={{ color: "#666", fontWeight: "400", textTransform: "none", letterSpacing: 0 }}>(opcional)</span></label>
          <input type="date" value={form.expiry} onChange={e => setForm({...form, expiry: e.target.value})}
            style={{ width: "100%", marginTop: "8px", padding: "12px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#F5E6D0", fontSize: "15px", boxSizing: "border-box", outline: "none" }} />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ color: "#B0A090", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Precio estimado <span style={{ color: "#666", fontWeight: "400", textTransform: "none", letterSpacing: 0 }}>(opcional, para calcular ahorro)</span></label>
          <div style={{ position: "relative", marginTop: "8px" }}>
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#B0A090", fontSize: "15px", fontWeight: "600" }}>$</span>
            <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0.00"
              style={{ width: "100%", padding: "12px 14px 12px 28px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#F5E6D0", fontSize: "15px", boxSizing: "border-box", outline: "none" }} />
          </div>
        </div>

        <button onClick={() => { if (form.name) { onAdd(form); onClose(); } }}
          style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #FF8C42, #FFB74D)", border: "none", borderRadius: "14px", color: "#1A1A2E", fontSize: "16px", fontWeight: "800", cursor: "pointer" }}>
          ✓ Agregar al Inventario
        </button>
      </div>
    </div>
  );
}

// ── Recipe Modal ──────────────────────────────────────────────────────────────
function RecipeModal({ recipe, onClose, products, onUpdateProduct }) {
  const [servings, setServings] = useState(recipe.servings || 2);
  const [cooked, setCooked] = useState(false);
  const [deducted, setDeducted] = useState([]);
  const baseServings = recipe.servings || 2;

  const scaleIngredient = (ing) => {
    if (typeof ing === "object" && ing.qty) {
      const scaled = (ing.qty / baseServings) * servings;
      return `${Math.round(scaled * 10) / 10} ${ing.unit} de ${ing.name}`;
    }
    return ing;
  };

  const handleCook = () => {
    if (!products || !onUpdateProduct) return;
    const deductions = [];
    recipe.ingredients.forEach(ing => {
      if (typeof ing !== "object" || !ing.qty) return;
      const scaledQty = (ing.qty / baseServings) * servings;
      const match = products.find(p => p.name.toLowerCase().includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(p.name.toLowerCase()));
      if (match) {
        const newQty = Math.max(0, parseFloat(match.quantity) - scaledQty);
        onUpdateProduct(match.id, { quantity: Math.round(newQty * 10) / 10 });
        deductions.push({ name: match.name, emoji: match.emoji, restado: Math.round(scaledQty * 10) / 10, unit: ing.unit });
      }
    });
    setDeducted(deductions);
    setCooked(true);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", padding: "20px", overflowY: "auto" }}>
      <div style={{ background: "#1A1A2E", borderRadius: "24px", padding: "28px 24px", width: "100%", maxWidth: "440px", animation: "fadeIn 0.2s ease", margin: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "56px", marginBottom: "8px" }}>{recipe.emoji}</div>
          <h2 style={{ color: "#F5E6D0", fontFamily: "'Playfair Display', serif", fontSize: "22px", margin: "0 0 10px" }}>{recipe.name}</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            <span style={{ background: "rgba(255,183,77,0.15)", color: "#FFB74D", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>⏱ {recipe.time}</span>
            <span style={{ background: "rgba(129,212,74,0.15)", color: "#AED581", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>⚡ {recipe.difficulty}</span>
            {recipe.mealType && <span style={{ background: "rgba(79,195,247,0.15)", color: "#4FC3F7", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>{recipe.mealType}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "10px 20px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={() => setServings(Math.max(1, servings - 1))} style={{ background: "rgba(255,140,66,0.2)", border: "none", color: "#FF8C42", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: "18px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#FFB74D" }}>{servings}</div>
              <div style={{ fontSize: "11px", color: "#B0A090", letterSpacing: "1px" }}>COMENSALES</div>
            </div>
            <button onClick={() => setServings(servings + 1)} style={{ background: "rgba(255,140,66,0.2)", border: "none", color: "#FF8C42", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: "18px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>
        </div>

        <div style={{ marginBottom: "18px" }}>
          <h4 style={{ color: "#B0A090", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>Ingredientes</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {recipe.ingredients.map((ing, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", color: "#F5E6D0", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#FF8C42", fontWeight: "700", fontSize: "16px" }}>·</span>{scaleIngredient(ing)}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <h4 style={{ color: "#B0A090", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>Preparación</h4>
          {recipe.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "10px", alignItems: "flex-start" }}>
              <span style={{ background: "linear-gradient(135deg, #FF8C42, #FFB74D)", color: "#1A1A2E", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", flexShrink: 0 }}>{i + 1}</span>
              <span style={{ color: "#D0C0B0", fontSize: "14px", lineHeight: "1.5", paddingTop: "2px" }}>{step}</span>
            </div>
          ))}
        </div>

        {/* Botón cocinar */}
        {!cooked ? (
          <button onClick={handleCook}
            style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #FF8C42, #FFB74D)", border: "none", borderRadius: "14px", color: "#1A1A2E", fontSize: "15px", fontWeight: "800", cursor: "pointer", marginBottom: "10px" }}>
            🍳 ¡Voy a preparar esta receta!
          </button>
        ) : (
          <div style={{ background: "rgba(174,213,129,0.1)", border: "1px solid rgba(174,213,129,0.3)", borderRadius: "14px", padding: "14px", marginBottom: "10px" }}>
            <div style={{ color: "#AED581", fontWeight: "700", fontSize: "14px", marginBottom: "8px" }}>✅ ¡Ingredientes descontados del inventario!</div>
            {deducted.length > 0 ? deducted.map((d, i) => (
              <div key={i} style={{ color: "#D0C0B0", fontSize: "13px", marginBottom: "4px" }}>
                {d.emoji} {d.name} → −{d.restado} {d.unit}
              </div>
            )) : (
              <div style={{ color: "#B0A090", fontSize: "13px" }}>No se encontraron coincidencias en tu inventario.</div>
            )}
          </div>
        )}

        <button onClick={onClose} style={{ width: "100%", padding: "14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", color: "#F5E6D0", fontSize: "15px", fontWeight: "600", cursor: "pointer" }}>Cerrar</button>
      </div>
    </div>
  );
}

// ── MercadoPago Checkout ──────────────────────────────────────────────────────
const MP_LINKS = {
  monthly: "https://www.mercadopago.com.mx/subscriptions/checkout?preapproval_plan_id=cb22be3122454b5eb1c892b0f9379f90",
  annual: "https://www.mercadopago.com.mx/subscriptions/checkout?preapproval_plan_id=392bc8a4acb04a1a8ea743a7f40b59d1",
};

function CheckoutMP({ plan, userEmail, onBack, onSuccess }) {
  const handlePay = () => {
    window.open(MP_LINKS[plan.id], "_blank");
    onSuccess();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: "#F5E6D0", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: "16px" }}>←</button>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", margin: 0 }}>Pago seguro</h2>
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "18px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: "700", fontSize: "15px" }}>Despensa Premium {plan?.name}</div>
            <div style={{ color: "#B0A090", fontSize: "13px", marginTop: "4px" }}>
              Facturado {plan?.id === "annual" ? "anualmente" : "mensualmente"}
            </div>
            {userEmail && <div style={{ color: "#B0A090", fontSize: "12px", marginTop: "2px" }}>{userEmail}</div>}
          </div>
          <div style={{ fontWeight: "800", fontSize: "18px", color: "#FFB74D" }}>{plan?.total}</div>
        </div>
      </div>

      <div style={{ background: "rgba(0,158,227,0.06)", border: "1px solid rgba(0,158,227,0.2)", borderRadius: "14px", padding: "14px 16px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <span style={{ fontSize: "18px" }}>ℹ️</span>
        <div style={{ fontSize: "12px", color: "#B0A090", lineHeight: "1.5" }}>
          Serás redirigido a MercadoPago para completar tu suscripción de forma segura. Puedes cancelar en cualquier momento.
        </div>
      </div>

      <button onClick={handlePay}
        style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #009EE3, #00C4FF)", border: "none", borderRadius: "16px", color: "white", fontSize: "16px", fontWeight: "800", cursor: "pointer", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
        💳 Pagar con MercadoPago
      </button>

      <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "12px" }}>
        {["Visa", "Mastercard", "OXXO", "SPEI"].map(m => (
          <span key={m} style={{ color: "#666", fontSize: "11px", fontWeight: "600" }}>{m}</span>
        ))}
      </div>
      <p style={{ color: "#555", fontSize: "11px", textAlign: "center", marginTop: "10px" }}>
        🔒 Pago seguro · Cancela cuando quieras
      </p>
    </div>
  );
}

// ── Household Modal ───────────────────────────────────────────────────────────
function HouseholdModal({ household, members, userId, onCreateHousehold, onJoinHousehold, onLeaveHousehold, onClose }) {
  const [view, setView] = useState(household ? "detail" : "home");
  const [houseName, setHouseName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [currentHousehold, setCurrentHousehold] = useState(household);

  const handleCreate = async () => {
    if (!houseName.trim()) { setMsg("Escribe un nombre para tu hogar."); return; }
    setLoading(true);
    const hh = await onCreateHousehold(houseName.trim());
    if (hh) { setCurrentHousehold(hh); setView("detail"); setMsg(""); }
    else setMsg("Error al crear el hogar. Intenta de nuevo.");
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { setMsg("Escribe el código de invitación."); return; }
    setLoading(true);
    const result = await onJoinHousehold(joinCode.trim());
    if (result.ok) { setView("detail"); setMsg(""); }
    else setMsg(result.msg);
    setLoading(false);
  };

  const handleLeave = async () => {
    setLoading(true);
    await onLeaveHousehold();
    setCurrentHousehold(null);
    setLoading(false);
    onClose();
  };

  const hh = currentHousehold || household;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#1A1A2E", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: "480px", animation: "slideUp 0.3s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ color: "#F5E6D0", fontSize: "20px", fontFamily: "'Playfair Display', serif", margin: 0 }}>🏠 Hogar compartido</h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#F5E6D0", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: "16px" }}>✕</button>
        </div>

        {/* Sin hogar - opciones */}
        {!hh && view === "home" && (
          <div>
            <p style={{ color: "#B0A090", fontSize: "14px", marginBottom: "20px", lineHeight: "1.6" }}>Comparte tu inventario con hasta 4 personas más. Todos verán y podrán editar los mismos productos.</p>
            <button onClick={() => setView("create")} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #FF8C42, #FFB74D)", border: "none", borderRadius: "14px", color: "#1A1A2E", fontSize: "15px", fontWeight: "800", cursor: "pointer", marginBottom: "10px" }}>
              🏠 Crear mi hogar
            </button>
            <button onClick={() => setView("join")} style={{ width: "100%", padding: "16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", color: "#F5E6D0", fontSize: "15px", fontWeight: "600", cursor: "pointer" }}>
              🔗 Unirme a un hogar existente
            </button>
          </div>
        )}

        {/* Crear hogar */}
        {view === "create" && (
          <div>
            <label style={{ color: "#B0A090", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Nombre del hogar</label>
            <input value={houseName} onChange={e => setHouseName(e.target.value)} placeholder="Ej: Casa García, Familia López..."
              style={{ width: "100%", padding: "14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#F5E6D0", fontSize: "15px", outline: "none", marginTop: "8px", marginBottom: "16px" }} />
            {msg && <div style={{ color: "#FF5252", fontSize: "13px", marginBottom: "12px" }}>{msg}</div>}
            <button onClick={handleCreate} disabled={loading} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #FF8C42, #FFB74D)", border: "none", borderRadius: "14px", color: "#1A1A2E", fontSize: "15px", fontWeight: "800", cursor: "pointer", marginBottom: "10px" }}>
              {loading ? "Creando..." : "✓ Crear hogar"}
            </button>
            <button onClick={() => { setView("home"); setMsg(""); }} style={{ width: "100%", padding: "14px", background: "none", border: "none", color: "#B0A090", fontSize: "14px", cursor: "pointer" }}>← Regresar</button>
          </div>
        )}

        {/* Unirse a hogar */}
        {view === "join" && (
          <div>
            <label style={{ color: "#B0A090", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Código de invitación</label>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Ej: AB12CD"
              style={{ width: "100%", padding: "14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#F5E6D0", fontSize: "18px", fontWeight: "700", outline: "none", marginTop: "8px", marginBottom: "16px", letterSpacing: "4px", textTransform: "uppercase", textAlign: "center" }} />
            {msg && <div style={{ color: "#FF5252", fontSize: "13px", marginBottom: "12px" }}>{msg}</div>}
            <button onClick={handleJoin} disabled={loading} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #FF8C42, #FFB74D)", border: "none", borderRadius: "14px", color: "#1A1A2E", fontSize: "15px", fontWeight: "800", cursor: "pointer", marginBottom: "10px" }}>
              {loading ? "Uniéndome..." : "🔗 Unirme al hogar"}
            </button>
            <button onClick={() => { setView("home"); setMsg(""); }} style={{ width: "100%", padding: "14px", background: "none", border: "none", color: "#B0A090", fontSize: "14px", cursor: "pointer" }}>← Regresar</button>
          </div>
        )}

        {/* Detalle del hogar activo */}
        {hh && (view === "detail" || view === "home") && (
          <div>
            <div style={{ background: "rgba(174,213,129,0.08)", border: "1px solid rgba(174,213,129,0.2)", borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ fontWeight: "800", fontSize: "17px", color: "#AED581", marginBottom: "6px" }}>🏠 {hh.name}</div>
              <div style={{ color: "#B0A090", fontSize: "13px", marginBottom: "12px" }}>{(members?.length || 0) + 1} de 5 miembros</div>
              {hh.owner_id === userId && (
                <div>
                  <div style={{ color: "#B0A090", fontSize: "12px", marginBottom: "6px", fontWeight: "600" }}>CÓDIGO DE INVITACIÓN</div>
                  <div style={{ background: "#0F0F1A", borderRadius: "10px", padding: "12px", textAlign: "center", letterSpacing: "6px", fontSize: "22px", fontWeight: "800", color: "#FFB74D" }}>{hh.invite_code}</div>
                  <div style={{ color: "#B0A090", fontSize: "11px", textAlign: "center", marginTop: "6px" }}>Comparte este código con tu familia</div>
                </div>
              )}
            </div>
            <button onClick={handleLeave} disabled={loading}
              style={{ width: "100%", padding: "14px", background: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.2)", borderRadius: "14px", color: "#FF5252", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
              {loading ? "..." : hh.owner_id === userId ? "🗑️ Disolver hogar" : "🚪 Salir del hogar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [paymentStep, setPaymentStep] = useState("plans");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [shoppingList, setShoppingList] = useState([
    { id: 1, name: "Tortillas", qty: "1 kg", checked: false, auto: false },
    { id: 2, name: "Aguacate", qty: "3 pzas", checked: false, auto: false },
  ]);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecipes, setAiRecipes] = useState([]);
  const [aiError, setAiError] = useState("");
  const [mealType, setMealType] = useState("");
  const [dinerType, setDinerType] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [household, setHousehold] = useState(null);
  const [householdMembers, setHouseholdMembers] = useState([]);
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [showExpiryAlert, setShowExpiryAlert] = useState(false);
  const [expiryAlertProducts, setExpiryAlertProducts] = useState([]);

  // ── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load household ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setHousehold(null); setHouseholdMembers([]); return; }
    // Buscar si el usuario tiene hogar (como dueño o miembro)
    const loadHousehold = async () => {
      const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
      if (profile?.household_id) {
        const { data: hh } = await supabase.from("households").select("*").eq("id", profile.household_id).single();
        setHousehold(hh);
        const { data: members } = await supabase.from("household_members").select("user_id").eq("household_id", profile.household_id);
        setHouseholdMembers(members || []);
      }
    };
    loadHousehold();
  }, [user]);

  // ── Load products from Supabase ──────────────────────────────────────────
  useEffect(() => {
    if (!user) { setProducts([]); return; }
    setLoadingProducts(true);
    const loadProducts = async () => {
      const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
      let query = supabase.from("products").select("*").order("created_at", { ascending: false });
      if (profile?.household_id) {
        // Cargar productos del hogar completo
        query = query.eq("household_id", profile.household_id);
      } else {
        query = query.eq("user_id", user.id);
      }
      const { data, error } = await query;
      if (!error && data) setProducts(data);
      setLoadingProducts(false);
    };
    loadProducts();
  }, [user, household]);

  // ── Expiry alert on load ─────────────────────────────────────────────────
  useEffect(() => {
    if (!products.length) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const alertDays = 3;
    const expiring = products.filter(p => {
      if (!p.expiry) return false;
      const days = Math.ceil((new Date(p.expiry) - today) / (1000 * 60 * 60 * 24));
      return days <= alertDays;
    }).sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
    if (expiring.length > 0) {
      setExpiryAlertProducts(expiring);
      setShowExpiryAlert(true);
    }
  }, [products]);

  // ── Load user plan ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("plan").eq("id", user.id).single()
      .then(({ data }) => { if (data?.plan === "premium") setIsPremium(true); });
  }, [user]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addProduct = async (form) => {
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
    const newProduct = {
      user_id: user.id,
      household_id: profile?.household_id || null,
      name: form.name || "Producto",
      category: form.category || "pantry",
      quantity: Number(form.quantity) || 1,
      unit: form.unit || "pza",
      expiry: form.expiry || null,
      emoji: form.emoji || "📦",
      price: form.price ? parseFloat(form.price) : null
    };
    const { data, error } = await supabase.from("products").insert(newProduct).select().single();
    if (!error && data) setProducts(prev => [data, ...prev]);
  };

  const createHousehold = async (name) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: hh, error: hhError } = await supabase.from("households").insert({ name, owner_id: user.id, invite_code: code }).select().single();
    console.log("CREATE HOUSEHOLD:", { hh, hhError });
    if (hhError || !hh) return null;
    const { error: profError } = await supabase.from("profiles").update({ household_id: hh.id }).eq("id", user.id);
    console.log("UPDATE PROFILE:", { profError });
    const { error: prodError } = await supabase.from("products").update({ household_id: hh.id }).eq("user_id", user.id);
    console.log("UPDATE PRODUCTS:", { prodError });
    setHousehold(hh);
    return hh;
  };

  const joinHousehold = async (code) => {
    const { data: hh, error } = await supabase.from("households").select("*").eq("invite_code", code.trim().toUpperCase()).single();
    if (error || !hh) return { ok: false, msg: "Código inválido. Verifica e intenta de nuevo." };
    const members = await supabase.from("household_members").select("user_id").eq("household_id", hh.id);
    if ((members.data?.length || 0) >= 4) return { ok: false, msg: "Este hogar ya tiene el máximo de 5 miembros." };
    await supabase.from("household_members").insert({ household_id: hh.id, user_id: user.id });
    await supabase.from("profiles").update({ household_id: hh.id }).eq("id", user.id);
    await supabase.from("products").update({ household_id: hh.id }).eq("user_id", user.id);
    setHousehold(hh);
    return { ok: true };
  };

  const leaveHousehold = async () => {
    if (!household) return;
    if (household.owner_id === user.id) {
      // Dueño disuelve el hogar: quitar household_id a todos
      await supabase.from("profiles").update({ household_id: null }).eq("household_id", household.id);
      await supabase.from("products").update({ household_id: null }).eq("household_id", household.id);
      await supabase.from("households").delete().eq("id", household.id);
    } else {
      await supabase.from("household_members").delete().eq("household_id", household.id).eq("user_id", user.id);
      await supabase.from("profiles").update({ household_id: null }).eq("id", user.id);
      await supabase.from("products").update({ household_id: null }).eq("user_id", user.id);
    }
    setHousehold(null); setHouseholdMembers([]);
  };

  const removeProduct = async (id) => {
    await supabase.from("products").delete().eq("id", id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateProduct = async (id, updates) => {
    const { error } = await supabase.from("products").update(updates).eq("id", id);
    if (!error) setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setProducts([]); setIsPremium(false);
  };

  const redeemCoupon = async () => {
    setCouponError(""); setCouponSuccess(""); setCouponLoading(true);
    const code = couponCode.trim().toUpperCase();
    if (!code) { setCouponError("Por favor ingresa un código."); setCouponLoading(false); return; }
    try {
      // Buscar cupón
      const { data: coupon, error: fetchError } = await supabase
        .from("coupons").select("*").eq("code", code).single();
      if (fetchError || !coupon) { setCouponError("Código inválido. Verifica e intenta de nuevo."); setCouponLoading(false); return; }
      if (coupon.used_by) { setCouponError("Este código ya fue utilizado."); setCouponLoading(false); return; }
      // Calcular fecha de vencimiento
      let expiresAt = null;
      if (coupon.duration_months) {
        const d = new Date();
        d.setMonth(d.getMonth() + coupon.duration_months);
        expiresAt = d.toISOString();
      }
      // Actualizar perfil del usuario
      await supabase.from("profiles").update({ plan: "premium", plan_expires_at: expiresAt }).eq("id", user.id);
      // Marcar cupón como usado
      await supabase.from("coupons").update({ used_by: user.id, used_at: new Date().toISOString() }).eq("code", code);
      setIsPremium(true);
      setCouponSuccess(coupon.duration_months ? `¡Cupón aplicado! Tienes ${coupon.duration_months} meses de Premium gratis. 🎉` : "¡Cupón aplicado! Tienes acceso Premium indefinido. 🎉");
    } catch (e) {
      setCouponError("Ocurrió un error. Intenta de nuevo.");
    }
    setCouponLoading(false);
  };

  const MEAL_TYPES = [
    { id: "", label: "Cualquiera", icon: "🍽️" }, { id: "Desayuno", label: "Desayuno", icon: "🌅" },
    { id: "Comida", label: "Comida", icon: "☀️" }, { id: "Cena", label: "Cena", icon: "🌙" },
    { id: "Postre", label: "Postre", icon: "🍮" }, { id: "Snack", label: "Snack", icon: "🥨" },
  ];
  const DINER_TYPES = [
    { id: "", label: "Todos", icon: "👨‍👩‍👧" }, { id: "Bebé (6-12 meses)", label: "Bebé", icon: "👶" },
    { id: "Niños", label: "Niños", icon: "🧒" }, { id: "Diabético", label: "Diabético", icon: "💉" },
    { id: "Vegetariano", label: "Vegetariano", icon: "🥗" }, { id: "Vegano", label: "Vegano", icon: "🌱" },
    { id: "Sin gluten", label: "Sin gluten", icon: "🌾" }, { id: "Deportista", label: "Deportista", icon: "💪" },
  ];

  const expiringSoon = products.filter(p => getDaysToExpiry(p.expiry) <= 5 && getDaysToExpiry(p.expiry) >= 0);
  const expired = products.filter(p => getDaysToExpiry(p.expiry) < 0);
  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const autoSuggestions = [
    ...expired.map(p => ({ id: `auto-${p.id}`, name: p.name, qty: `${p.quantity} ${p.unit}`, checked: false, auto: true, reason: "Caducado" })),
    ...expiringSoon.map(p => ({ id: `soon-${p.id}`, name: p.name, qty: `${p.quantity} ${p.unit}`, checked: false, auto: true, reason: `Caduca en ${getDaysToExpiry(p.expiry)}d` })),
  ];

  const addToShoppingList = (item) => {
    if (!shoppingList.find(s => s.name === item.name)) setShoppingList(prev => [...prev, { ...item, id: Date.now() }]);
  };
  const toggleShoppingItem = (id) => setShoppingList(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const removeShoppingItem = (id) => setShoppingList(prev => prev.filter(i => i.id !== id));

  const scannerRef = useRef(null);

  const startScanner = async () => {
    setScanLoading(true);
    setScanResult(null);
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          await html5QrCode.stop();
          setScanLoading(false);
          lookupBarcode(decodedText);
        },
        () => {}
      );
    } catch (e) {
      setScanLoading(false);
      setScanResult({ error: "No se pudo acceder a la cámara. Verifica los permisos." });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch (e) {}
      scannerRef.current = null;
    }
  };

  const lookupBarcode = async (barcode) => {
    setScanLoading(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const name = p.product_name_es || p.product_name_mx || p.product_name || p.generic_name_es || p.generic_name || p.abbreviated_product_name || "";
        setScanResult({ name, needsName: !name, barcode, emoji: "📦", category: "pantry", quantity: 1, unit: "pza", expiry: "" });
      } else {
        setScanResult({ name: "", needsName: true, barcode, emoji: "📦", category: "pantry", quantity: 1, unit: "pza", expiry: "" });
      }
    } catch (e) {
      setScanResult({ name: "", needsName: true, barcode, emoji: "📦", category: "pantry", quantity: 1, unit: "pza", expiry: "" });
    }
    setScanLoading(false);
  };


  const PLANS = [
    { id: "monthly", name: "Mensual", price: "$49", period: "/mes", total: "$49/mes", color: "#FFB74D", popular: false },
    { id: "annual", name: "Anual", price: "$29", period: "/mes", total: "$349/año", color: "#FF8C42", popular: true, saving: "Ahorra 40%" },
  ];
  const PREMIUM_FEATURES = [
    { icon: "♾️", title: "Productos ilimitados", desc: "Sin límite en tu inventario" },
    { icon: "🔔", title: "Alertas de caducidad", desc: "Notificaciones push diarias" },
    { icon: "✨", title: "Recetas con IA ilimitadas", desc: "Sin restricciones de uso" },
    { icon: "🛒", title: "Lista de compras auto", desc: "Se actualiza sola" },
    { icon: "📷", title: "Escáner de código de barras", desc: "Agrega productos al instante" },
    { icon: "👨‍👩‍👧", title: "Modo familiar", desc: "Hasta 5 usuarios por cuenta" },
    { icon: "📊", title: "Estadísticas de ahorro", desc: "Mide cuánto dinero ahorras" },
    { icon: "☁️", title: "Sincronización en la nube", desc: "Accede desde cualquier dispositivo" },
  ];

  const getMatchScore = (recipe) => {
    const available = products.map(p => p.name.toLowerCase());
    const ingredientNames = recipe.ingredients.map(ing => typeof ing === "object" ? ing.name : ing);
    const matched = ingredientNames.filter(ing => available.some(a => a.includes(ing.toLowerCase()) || ing.toLowerCase().includes(a)));
    return { ...recipe, matched, score: matched.length / ingredientNames.length };
  };
  const sortedRecipes = RECIPES_DB.map(getMatchScore).sort((a, b) => b.score - a.score);

  const fetchAIRecipes = async () => {
    setAiLoading(true); setAiError(""); setAiRecipes([]);
    const ingredientList = products.map(p => `${p.name} (${p.quantity} ${p.unit})`).join(", ");
    const mealFilter = mealType ? `para ${mealType}` : "";
    const dinerFilter = dinerType ? `apta para ${dinerType}` : "";
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1500,
          messages: [{ role: "user", content: `Tengo estos ingredientes en casa: ${ingredientList}. Sugiere 3 recetas creativas ${mealFilter} ${dinerFilter} que pueda hacer con ellos. Responde SOLO con un JSON array (sin texto extra ni backticks) con este formato exacto: [{"name":"nombre","time":"X min","difficulty":"Facil","emoji":"🍽️","servings": 2,"mealType": "${mealType || 'Comida'}","dinerType": "${dinerType || ''}","ingredients": [{"qty": 1, "unit": "taza", "name": "Arroz"}],"steps":["paso detallado 1","paso detallado 2"],"tags":["tag1"]}]` }]
        })
      });
      const data = await response.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setAiRecipes(parsed.map((r, i) => ({ ...r, id: 100 + i, matched: r.ingredients.map(i => i.name || i), score: 1 })));
    } catch (e) { setAiError("No se pudieron cargar recetas. Intenta de nuevo."); }
    setAiLoading(false);
  };

  const tabs = [
    { id: "home", icon: "🏠", label: "Inicio" }, { id: "inventory", icon: "📦", label: "Inventario" },
    { id: "recipes", icon: "🍳", label: "Recetas" }, { id: "shopping", icon: "🛒", label: "Compras" },
    { id: "premium", icon: "⭐", label: "Premium" },
  ];

  // ── Loading / Auth gates ──────────────────────────────────────────────────
  if (authLoading) return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0F0F1A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#F5E6D0", fontSize: "18px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap');`}</style>
      <span style={{ animation: "pulse 1s infinite" }}>🧺 Cargando...</span>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );

  if (!user) return <AuthScreen onAuth={setUser} />;

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0F0F1A", minHeight: "100vh", maxWidth: "480px", margin: "0 auto", position: "relative", color: "#F5E6D0", paddingBottom: "80px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(245,230,208,0.3); }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
        @keyframes slideUp { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }
        @keyframes fadeIn { from { opacity:0; transform: scale(0.95); } to { opacity:1; transform: scale(1); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "20px 20px 0", position: "sticky", top: 0, background: "#0F0F1A", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: activeTab === "inventory" ? "14px" : "0" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#B0A090", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "600" }}>Mi</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: "900", margin: 0, background: "linear-gradient(135deg, #FF8C42, #FFD580)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Despensa {isPremium && <span style={{ fontSize: "16px" }}>⭐</span>}
            </h1>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => setShowScanner(true)} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "10px 14px", color: "#F5E6D0", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>📷</button>
            <button onClick={() => setShowAddModal(true)} style={{ background: "linear-gradient(135deg, #FF8C42, #FFB74D)", border: "none", borderRadius: "16px", padding: "10px 18px", color: "#1A1A2E", fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>+ Agregar</button>
            {isPremium && <button onClick={() => setShowHouseholdModal(true)} style={{ background: household ? "rgba(174,213,129,0.15)" : "rgba(255,255,255,0.07)", border: `1px solid ${household ? "rgba(174,213,129,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: "12px", padding: "8px 12px", color: household ? "#AED581" : "#B0A090", fontSize: "12px", cursor: "pointer" }}>{household ? "🏠 Hogar" : "🏠"}</button>}
            <button onClick={handleSignOut} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "8px 12px", color: "#B0A090", fontSize: "12px", cursor: "pointer" }}>Salir</button>
          </div>
        </div>
        {activeTab === "inventory" && (
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="🔍  Buscar producto..."
            style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", color: "#F5E6D0", fontSize: "14px", outline: "none", marginBottom: "4px" }} />
        )}
      </div>

      {/* HOME TAB */}
      {activeTab === "home" && (
        <div style={{ padding: "20px" }}>
          {/* Plan badge */}
          {!isPremium && (
            <div style={{ background: "rgba(255,183,77,0.08)", border: "1px solid rgba(255,183,77,0.2)", borderRadius: "14px", padding: "10px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#FFB74D", fontSize: "13px", fontWeight: "600" }}>🆓 Plan Gratuito · {products.length}/{FREE_LIMIT} productos</span>
              <button onClick={() => setActiveTab("premium")} style={{ background: "linear-gradient(135deg, #FF8C42, #FFB74D)", border: "none", borderRadius: "10px", padding: "6px 12px", color: "#1A1A2E", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>⭐ Premium</button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            {[
              { label: "Total productos", value: products.length, icon: "📦", color: "#4FC3F7" },
              { label: "Por caducar", value: expiringSoon.length, icon: "⚠️", color: "#FF9800" },
              { label: "Caducados", value: expired.length, icon: "🚫", color: "#FF5252" },
              { label: "Recetas posibles", value: sortedRecipes.filter(r => r.score >= 0.5).length, icon: "🍳", color: "#AED581" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "18px", padding: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>{stat.icon}</div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: "12px", color: "#B0A090", marginTop: "4px", fontWeight: "500" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* SAVINGS CARD */}
          {(() => {
            const withPrice = products.filter(p => p.price && p.price > 0);
            const saved = withPrice.filter(p => !p.expiry || getDaysToExpiry(p.expiry) >= 0);
            const totalSaved = saved.reduce((sum, p) => sum + (parseFloat(p.price) * parseFloat(p.quantity || 1)), 0);
            const wasted = withPrice.filter(p => p.expiry && getDaysToExpiry(p.expiry) < 0);
            const totalWasted = wasted.reduce((sum, p) => sum + (parseFloat(p.price) * parseFloat(p.quantity || 1)), 0);
            const hasData = withPrice.length > 0;
            return (
              <div style={{ background: hasData ? "linear-gradient(135deg, rgba(174,213,129,0.08), rgba(255,183,77,0.06))" : "rgba(255,255,255,0.03)", border: `1px solid ${hasData ? "rgba(174,213,129,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: "18px", padding: "18px", marginBottom: "24px" }}>
                {hasData ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                      <span style={{ fontSize: "22px" }}>💰</span>
                      <span style={{ color: "#F5E6D0", fontWeight: "700", fontSize: "15px" }}>Ahorro estimado</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div style={{ background: "rgba(174,213,129,0.08)", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: "#AED581" }}>${totalSaved.toFixed(0)} <span style={{ fontSize: "11px", fontWeight: "600" }}>MXN</span></div>
                        <div style={{ fontSize: "11px", color: "#B0A090", marginTop: "3px" }}>En inventario activo</div>
                      </div>
                      <div style={{ background: "rgba(255,82,82,0.06)", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: totalWasted > 0 ? "#FF5252" : "#B0A090" }}>${totalWasted.toFixed(0)} <span style={{ fontSize: "11px", fontWeight: "600" }}>MXN</span></div>
                        <div style={{ fontSize: "11px", color: "#B0A090", marginTop: "3px" }}>Desperdiciado</div>
                      </div>
                    </div>
                    <div style={{ marginTop: "10px", fontSize: "11px", color: "#666", textAlign: "center" }}>{withPrice.length} de {products.length} productos con precio registrado</div>
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "28px" }}>💰</span>
                    <div>
                      <div style={{ color: "#F5E6D0", fontWeight: "700", fontSize: "14px" }}>Registra tus ahorros</div>
                      <div style={{ color: "#B0A090", fontSize: "12px", marginTop: "2px" }}>Agrega el precio al crear o editar productos para ver cuánto dinero ahorras evitando desperdicios.</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {(expiringSoon.length > 0 || expired.length > 0) && (
            <div style={{ background: "linear-gradient(135deg, rgba(255,82,82,0.1), rgba(255,152,0,0.1))", border: "1px solid rgba(255,152,0,0.2)", borderRadius: "18px", padding: "16px", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "20px" }}>🚨</span>
                <span style={{ fontWeight: "700", fontSize: "15px", color: "#FFB74D" }}>Atención requerida</span>
              </div>
              {[...expired.slice(0,2), ...expiringSoon.slice(0,3)].map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px" }}>{p.emoji} {p.name}</span>
                  <ExpiryBadge days={getDaysToExpiry(p.expiry)} />
                </div>
              ))}
            </div>
          )}

          {loadingProducts ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#B0A090" }}>Cargando tu despensa...</div>
          ) : (
            <div style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", margin: 0 }}>Cocina hoy</h2>
                <button onClick={() => setActiveTab("recipes")} style={{ background: "none", border: "none", color: "#FF8C42", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>Ver más →</button>
              </div>
              {sortedRecipes.slice(0, 2).map(recipe => (
                <div key={recipe.id} onClick={() => setSelectedRecipe(recipe)}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", padding: "16px", marginBottom: "12px", cursor: "pointer", display: "flex", gap: "14px", alignItems: "center" }}>
                  <div style={{ fontSize: "44px" }}>{recipe.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>{recipe.name}</div>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ color: "#B0A090", fontSize: "12px" }}>⏱ {recipe.time}</span>
                      <span style={{ color: "#B0A090", fontSize: "12px" }}>⚡ {recipe.difficulty}</span>
                    </div>
                    <div style={{ background: "rgba(174,213,129,0.1)", borderRadius: "20px", padding: "3px 10px", display: "inline-block" }}>
                      <span style={{ color: "#AED581", fontSize: "12px", fontWeight: "600" }}>{recipe.matched.length}/{recipe.ingredients.length} ingredientes ✓</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div style={{ padding: "12px 20px 20px" }}>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "8px" }}>
            <button onClick={() => setActiveCategory("all")}
              style={{ flexShrink: 0, padding: "8px 16px", background: activeCategory === "all" ? "linear-gradient(135deg, #FF8C42, #FFB74D)" : "rgba(255,255,255,0.07)", border: "none", borderRadius: "20px", color: activeCategory === "all" ? "#1A1A2E" : "#F5E6D0", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
              Todos ({products.length})
            </button>
            {CATEGORIES.map(cat => {
              const count = products.filter(p => p.category === cat.id).length;
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  style={{ flexShrink: 0, padding: "8px 16px", background: activeCategory === cat.id ? `${cat.color}30` : "rgba(255,255,255,0.07)", border: `2px solid ${activeCategory === cat.id ? cat.color : "transparent"}`, borderRadius: "20px", color: activeCategory === cat.id ? cat.color : "#F5E6D0", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                  {cat.icon} {cat.label} ({count})
                </button>
              );
            })}
          </div>
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#B0A090" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🫙</div>
              <p>No hay productos en esta categoría</p>
            </div>
          ) : (
            filteredProducts.map(product => {
              const days = getDaysToExpiry(product.expiry);
              const cat = CATEGORIES.find(c => c.id === product.category);
              return (
                <div key={product.id} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${days <= 2 ? "rgba(255,82,82,0.3)" : days <= 5 ? "rgba(255,152,0,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: "16px", padding: "14px 16px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ fontSize: "32px" }}>{product.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "700", fontSize: "15px", marginBottom: "3px" }}>{product.name}</div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ background: `${cat?.color}20`, color: cat?.color, padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" }}>{cat?.icon} {cat?.label}</span>
                      <span style={{ color: "#B0A090", fontSize: "12px" }}>{product.quantity} {product.unit}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                    <ExpiryBadge days={days} />
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => setEditingProduct(product)} style={{ background: "rgba(255,183,77,0.1)", border: "none", color: "#FFB74D", borderRadius: "8px", padding: "4px 8px", fontSize: "12px", cursor: "pointer" }}>✏️ Editar</button>
                      <button onClick={() => removeProduct(product.id)} style={{ background: "rgba(255,82,82,0.1)", border: "none", color: "#FF5252", borderRadius: "8px", padding: "4px 8px", fontSize: "12px", cursor: "pointer" }}>Quitar</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* RECIPES TAB */}
      {activeTab === "recipes" && (
        <div style={{ padding: "20px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", margin: "0 0 6px" }}>Recetas sugeridas</h2>
            <p style={{ color: "#B0A090", fontSize: "13px", margin: 0 }}>Basadas en tu inventario actual</p>
          </div>
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontSize: "11px", color: "#B0A090", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "600", marginBottom: "8px" }}>Tipo de comida</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {MEAL_TYPES.map(m => (
                <button key={m.id} onClick={() => setMealType(m.id)}
                  style={{ padding: "7px 14px", background: mealType === m.id ? "rgba(255,140,66,0.25)" : "rgba(255,255,255,0.06)", border: `2px solid ${mealType === m.id ? "#FF8C42" : "transparent"}`, borderRadius: "20px", color: mealType === m.id ? "#FF8C42" : "#D0C0B0", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", color: "#B0A090", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "600", marginBottom: "8px" }}>Tipo de comensal</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {DINER_TYPES.map(d => (
                <button key={d.id} onClick={() => setDinerType(d.id)}
                  style={{ padding: "7px 14px", background: dinerType === d.id ? "rgba(206,147,216,0.25)" : "rgba(255,255,255,0.06)", border: `2px solid ${dinerType === d.id ? "#CE93D8" : "transparent"}`, borderRadius: "20px", color: dinerType === d.id ? "#CE93D8" : "#D0C0B0", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                  {d.icon} {d.label}
                </button>
              ))}
            </div>
          </div>
          {isPremium ? (
            <button onClick={fetchAIRecipes} disabled={aiLoading}
              style={{ width: "100%", marginBottom: "20px", padding: "14px", background: aiLoading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #1A1A4E, #2D1B69)", border: "1px solid rgba(138,43,226,0.4)", borderRadius: "16px", color: aiLoading ? "#B0A090" : "#D4A8FF", fontSize: "14px", fontWeight: "700", cursor: aiLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {aiLoading ? <><span style={{ animation: "pulse 1s infinite" }}>✨</span> Generando recetas con IA...</> : <><span>✨</span> Generar recetas con IA</>}
            </button>
          ) : (
            <div onClick={() => setActiveTab("premium")}
              style={{ width: "100%", marginBottom: "20px", padding: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,183,77,0.25)", borderRadius: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "22px" }}>✨</span>
                <div>
                  <div style={{ color: "#F5E6D0", fontWeight: "700", fontSize: "14px" }}>Recetas con IA</div>
                  <div style={{ color: "#B0A090", fontSize: "12px" }}>Exclusivo Premium</div>
                </div>
              </div>
              <span style={{ background: "linear-gradient(135deg, #FF8C42, #FFB74D)", color: "#1A1A2E", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "800", whiteSpace: "nowrap" }}>⭐ Activar</span>
            </div>
          )}
          {aiError && <div style={{ color: "#FF5252", fontSize: "13px", textAlign: "center", marginBottom: "16px" }}>{aiError}</div>}
          {aiRecipes.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ background: "linear-gradient(135deg, #8A2BE2, #D4A8FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: "800", fontSize: "14px" }}>✨ GENERADAS POR IA</span>
              </div>
              {aiRecipes.map(recipe => (
                <div key={recipe.id} onClick={() => setSelectedRecipe(recipe)}
                  style={{ background: "linear-gradient(135deg, rgba(26,26,78,0.8), rgba(45,27,105,0.5))", border: "1px solid rgba(138,43,226,0.3)", borderRadius: "18px", padding: "16px", marginBottom: "12px", cursor: "pointer", display: "flex", gap: "14px", alignItems: "center" }}>
                  <div style={{ fontSize: "44px" }}>{recipe.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>{recipe.name}</div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span style={{ color: "#B0A090", fontSize: "12px" }}>⏱ {recipe.time}</span>
                      <span style={{ color: "#B0A090", fontSize: "12px" }}>⚡ {recipe.difficulty}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: "11px", color: "#B0A090", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "600", marginBottom: "12px" }}>Recetas base</div>
          {sortedRecipes.map(recipe => (
            <div key={recipe.id} onClick={() => setSelectedRecipe(recipe)}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", padding: "16px", marginBottom: "12px", cursor: "pointer", display: "flex", gap: "14px", alignItems: "center", opacity: recipe.score < 0.3 ? 0.5 : 1 }}>
              <div style={{ fontSize: "44px" }}>{recipe.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>{recipe.name}</div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ color: "#B0A090", fontSize: "12px" }}>⏱ {recipe.time}</span>
                  <span style={{ color: "#B0A090", fontSize: "12px" }}>⚡ {recipe.difficulty}</span>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {recipe.tags.map(tag => (<span key={tag} style={{ background: "rgba(255,255,255,0.07)", color: "#D0C0B0", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>{tag}</span>))}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "800", color: recipe.score >= 0.8 ? "#AED581" : recipe.score >= 0.5 ? "#FFB74D" : "#FF7043" }}>{Math.round(recipe.score * 100)}%</div>
                <div style={{ fontSize: "10px", color: "#B0A090" }}>match</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SHOPPING TAB */}
      {activeTab === "shopping" && (
        <div style={{ padding: "20px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", margin: "0 0 6px" }}>Lista de compras</h2>
            <p style={{ color: "#B0A090", fontSize: "13px", margin: 0 }}>Productos sugeridos y tu lista personal</p>
          </div>
          {autoSuggestions.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", color: "#B0A090", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "600", marginBottom: "12px" }}>Sugerencias automáticas</div>
              {autoSuggestions.map(item => (
                <div key={item.id} style={{ background: "rgba(255,152,0,0.06)", border: "1px solid rgba(255,152,0,0.15)", borderRadius: "14px", padding: "12px 16px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "14px" }}>{item.name}</div>
                    <div style={{ color: "#FF9800", fontSize: "12px" }}>{item.reason}</div>
                  </div>
                  <button onClick={() => addToShoppingList(item)} style={{ background: "rgba(255,152,0,0.2)", border: "none", color: "#FF9800", borderRadius: "10px", padding: "6px 12px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>+ Agregar</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: "11px", color: "#B0A090", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "600", marginBottom: "12px" }}>Mi lista</div>
          {shoppingList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#B0A090" }}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>🛒</div>
              <p>Tu lista está vacía</p>
            </div>
          ) : (
            shoppingList.map(item => (
              <div key={item.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "12px 16px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
                <button onClick={() => toggleShoppingItem(item.id)} style={{ width: 22, height: 22, borderRadius: "6px", border: `2px solid ${item.checked ? "#AED581" : "rgba(255,255,255,0.2)"}`, background: item.checked ? "#AED581" : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                  {item.checked && "✓"}
                </button>
                <div style={{ flex: 1, opacity: item.checked ? 0.5 : 1 }}>
                  <div style={{ fontWeight: "600", fontSize: "14px", textDecoration: item.checked ? "line-through" : "none" }}>{item.name}</div>
                  <div style={{ color: "#B0A090", fontSize: "12px" }}>{item.qty}</div>
                </div>
                <button onClick={() => removeShoppingItem(item.id)} style={{ background: "rgba(255,82,82,0.1)", border: "none", color: "#FF5252", borderRadius: "8px", padding: "4px 8px", fontSize: "12px", cursor: "pointer" }}>✕</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* PREMIUM TAB */}
      {activeTab === "premium" && (
        <div style={{ padding: "20px" }}>
          {isPremium ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>⭐</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", margin: "0 0 8px", background: "linear-gradient(135deg, #FFD700, #FF8C42)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>¡Eres Premium!</h2>
              <p style={{ color: "#B0A090" }}>Tienes acceso a todas las funciones sin límites.</p>
            </div>
          ) : (
            <>
              {paymentStep === "plans" && (
                <>
                  <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", margin: "0 0 8px", background: "linear-gradient(135deg, #FFD700, #FF8C42)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Despensa Premium</h2>
                    <p style={{ color: "#B0A090", fontSize: "14px" }}>Desbloquea todo el potencial de tu despensa</p>
                  </div>
                  <div style={{ marginBottom: "24px" }}>
                    {PREMIUM_FEATURES.map(f => (
                      <div key={f.title} style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "16px" }}>
                        <span style={{ fontSize: "22px", flexShrink: 0 }}>{f.icon}</span>
                        <div>
                          <div style={{ fontWeight: "700", fontSize: "14px", marginBottom: "2px" }}>{f.title}</div>
                          <div style={{ color: "#B0A090", fontSize: "13px" }}>{f.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                    {PLANS.map(plan => (
                      <div key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                        style={{ background: selectedPlan === plan.id ? `${plan.color}15` : "rgba(255,255,255,0.04)", border: `2px solid ${selectedPlan === plan.id ? plan.color : "rgba(255,255,255,0.08)"}`, borderRadius: "18px", padding: "20px 16px", cursor: "pointer", position: "relative", textAlign: "center", transition: "all 0.2s" }}>
                        {plan.popular && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #FF8C42, #FFD700)", color: "#1A1A2E", fontSize: "10px", fontWeight: "800", padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>MÁS POPULAR</div>}
                        <div style={{ fontWeight: "800", fontSize: "15px", marginBottom: "8px", color: plan.color }}>{plan.name}</div>
                        <div style={{ fontSize: "28px", fontWeight: "900", color: "#F5E6D0", lineHeight: 1 }}>{plan.price}</div>
                        <div style={{ color: "#B0A090", fontSize: "12px", marginBottom: "8px" }}>{plan.period}</div>
                        {plan.saving && <div style={{ background: "rgba(174,213,129,0.15)", color: "#AED581", fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "10px" }}>{plan.saving}</div>}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => selectedPlan && setPaymentStep("checkout")} disabled={!selectedPlan}
                    style={{ width: "100%", padding: "16px", background: selectedPlan ? "linear-gradient(135deg, #FF8C42, #FFB74D)" : "rgba(255,255,255,0.08)", border: "none", borderRadius: "16px", color: selectedPlan ? "#1A1A2E" : "#666", fontSize: "16px", fontWeight: "800", cursor: selectedPlan ? "pointer" : "not-allowed" }}>
                    {selectedPlan ? `Continuar con plan ${PLANS.find(p=>p.id===selectedPlan)?.name} →` : "Selecciona un plan"}
                  </button>

                  {/* CUPÓN */}
                  <div style={{ marginTop: "28px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "20px" }}>
                    <div style={{ textAlign: "center", marginBottom: "14px" }}>
                      <span style={{ fontSize: "22px" }}>🎟️</span>
                      <div style={{ fontWeight: "700", fontSize: "15px", color: "#F5E6D0", marginTop: "4px" }}>¿Tienes un cupón?</div>
                      <div style={{ color: "#B0A090", fontSize: "12px", marginTop: "2px" }}>Ingresa tu código para activar Premium gratis</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value); setCouponError(""); setCouponSuccess(""); }}
                        onKeyDown={e => e.key === "Enter" && redeemCoupon()}
                        placeholder="Ej. BETA-DESP-A1B2"
                        style={{ flex: 1, padding: "12px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", color: "#F5E6D0", fontSize: "14px", outline: "none", letterSpacing: "1px" }}
                      />
                      <button onClick={redeemCoupon} disabled={couponLoading}
                        style={{ padding: "12px 18px", background: couponLoading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #FF8C42, #FFB74D)", border: "none", borderRadius: "12px", color: couponLoading ? "#666" : "#1A1A2E", fontWeight: "800", fontSize: "14px", cursor: couponLoading ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                        {couponLoading ? "..." : "Aplicar"}
                      </button>
                    </div>
                    {couponError && <div style={{ marginTop: "10px", background: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.3)", borderRadius: "10px", padding: "10px 12px", color: "#FF5252", fontSize: "13px" }}>{couponError}</div>}
                    {couponSuccess && <div style={{ marginTop: "10px", background: "rgba(174,213,129,0.1)", border: "1px solid rgba(174,213,129,0.3)", borderRadius: "10px", padding: "10px 12px", color: "#AED581", fontSize: "13px" }}>{couponSuccess}</div>}
                  </div>
                </>
              )}
              {paymentStep === "checkout" && (
                <CheckoutMP
                  plan={PLANS.find(p => p.id === selectedPlan)}
                  userEmail={user?.email}
                  onBack={() => setPaymentStep("plans")}
                  onSuccess={() => setPaymentStep("success")}
                />
              )}
              {paymentStep === "success" && (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: "72px", marginBottom: "16px" }}>🎉</div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", margin: "0 0 8px", background: "linear-gradient(135deg, #FFD700, #FF8C42)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>¡Pago exitoso!</h2>
                  <p style={{ color: "#B0A090", marginBottom: "12px" }}>Bienvenido a Despensa Premium</p>
                  <button onClick={() => { setIsPremium(true); setPaymentStep("plans"); setActiveTab("home"); }}
                    style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #FF8C42, #FFB74D)", border: "none", borderRadius: "16px", color: "#1A1A2E", fontSize: "16px", fontWeight: "800", cursor: "pointer" }}>
                    ¡Empezar ahora! →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SCANNER MODAL */}
      {showScanner && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <button onClick={() => { stopScanner(); setShowScanner(false); setScanResult(null); setScanLoading(false); }}
            style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", fontSize: "18px" }}>✕</button>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h3 style={{ color: "white", fontFamily: "'Playfair Display', serif", fontSize: "22px", margin: "0 0 8px" }}>Escáner de Código de Barras</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>Apunta la cámara al código del producto</p>
          </div>
          {!scanResult ? (
            <div style={{ width: "100%", maxWidth: "300px", marginBottom: "20px" }}>
              <div id="qr-reader" style={{ width: "100%", borderRadius: "16px", overflow: "hidden", border: "2px solid rgba(255,183,77,0.4)" }} />
            </div>
          ) : (
            <div style={{ width: "100%", maxWidth: "300px", background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
              {scanResult.error ? (
                <div style={{ textAlign: "center", color: "#FF5252", fontSize: "13px" }}>{scanResult.error}</div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "40px", marginBottom: "6px" }}>{scanResult.emoji}</div>
                  {scanResult.needsName ? (
                    <>
                      <div style={{ color: "#FFB74D", fontWeight: "700", fontSize: "13px", marginBottom: "10px" }}>⚠️ Producto no encontrado en la base de datos.<br/>Escribe el nombre manualmente:</div>
                      <input
                        autoFocus
                        value={scanResult.name}
                        onChange={e => setScanResult({ ...scanResult, name: e.target.value, needsName: !e.target.value.trim() })}
                        placeholder="Nombre del producto..."
                        style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,183,77,0.5)", borderRadius: "10px", color: "white", fontSize: "14px", outline: "none", textAlign: "center" }}
                      />
                    </>
                  ) : (
                    <>
                      <div style={{ color: "#AED581", fontWeight: "800", fontSize: "15px", marginBottom: "4px" }}>✓ Producto detectado</div>
                      <input
                        value={scanResult.name}
                        onChange={e => setScanResult({ ...scanResult, name: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "700", outline: "none", textAlign: "center" }}
                      />
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", marginTop: "4px" }}>Puedes editar el nombre si es necesario</div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          {!scanResult ? (
            <button onClick={startScanner} disabled={scanLoading}
              style={{ padding: "16px 40px", background: scanLoading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #FF8C42, #FFB74D)", border: "none", borderRadius: "16px", color: scanLoading ? "#666" : "#1A1A2E", fontSize: "16px", fontWeight: "800", cursor: scanLoading ? "not-allowed" : "pointer" }}>
              {scanLoading ? "Iniciando cámara..." : "📷 Iniciar escáner"}
            </button>
          ) : (
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => { setScanResult(null); setScanLoading(false); }} style={{ padding: "14px 24px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "14px", color: "white", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>Volver a escanear</button>
              {!scanResult.error && (
                <button
                  disabled={!scanResult.name?.trim()}
                  onClick={() => { addProduct({ ...scanResult }); stopScanner(); setShowScanner(false); setScanResult(null); setActiveTab("inventory"); }}
                  style={{ padding: "14px 24px", background: scanResult.name?.trim() ? "linear-gradient(135deg, #FF8C42, #FFB74D)" : "rgba(255,255,255,0.1)", border: "none", borderRadius: "14px", color: scanResult.name?.trim() ? "#1A1A2E" : "#666", fontSize: "14px", fontWeight: "800", cursor: scanResult.name?.trim() ? "pointer" : "not-allowed" }}>
                  ✓ Agregar al inventario
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* EXPIRY ALERT MODAL */}
      {showExpiryAlert && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#1A1A2E", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: "480px", animation: "slideUp 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "32px", marginBottom: "6px" }}>⏰</div>
                <h3 style={{ color: "#F5E6D0", fontSize: "20px", fontFamily: "'Playfair Display', serif", margin: 0 }}>
                  Productos por caducar
                </h3>
                <p style={{ color: "#B0A090", fontSize: "13px", margin: "4px 0 0" }}>
                  {expiryAlertProducts.length} producto{expiryAlertProducts.length > 1 ? "s requieren" : " requiere"} tu atención
                </p>
              </div>
              <button onClick={() => setShowExpiryAlert(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#F5E6D0", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: "16px", flexShrink: 0 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px", maxHeight: "240px", overflowY: "auto" }}>
              {expiryAlertProducts.map(p => {
                const days = Math.ceil((new Date(p.expiry) - new Date().setHours(0,0,0,0)) / (1000*60*60*24));
                const isExpired = days < 0;
                const isToday = days === 0;
                const bg = isExpired ? "rgba(255,82,82,0.08)" : days <= 1 ? "rgba(255,82,82,0.06)" : "rgba(255,152,0,0.06)";
                const border = isExpired ? "rgba(255,82,82,0.25)" : days <= 1 ? "rgba(255,82,82,0.2)" : "rgba(255,152,0,0.2)";
                const badgeColor = isExpired ? "#FF5252" : days <= 1 ? "#FF5252" : "#FF9800";
                const badgeText = isExpired ? "Caducado" : isToday ? "¡Hoy!" : `${days}d`;
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: bg, border: `1px solid ${border}`, borderRadius: "12px", padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "22px" }}>{p.emoji}</span>
                      <div>
                        <div style={{ color: "#F5E6D0", fontWeight: "700", fontSize: "14px" }}>{p.name}</div>
                        <div style={{ color: "#B0A090", fontSize: "12px" }}>{p.quantity} {p.unit}</div>
                      </div>
                    </div>
                    <span style={{ background: badgeColor, color: "white", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "800", flexShrink: 0 }}>{badgeText}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button onClick={() => setShowExpiryAlert(false)}
                style={{ padding: "14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", color: "#F5E6D0", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
                Ignorar
              </button>
              <button onClick={() => { setShowExpiryAlert(false); setActiveTab("inventory"); }}
                style={{ padding: "14px", background: "linear-gradient(135deg, #FF8C42, #FFB74D)", border: "none", borderRadius: "14px", color: "#1A1A2E", fontSize: "14px", fontWeight: "800", cursor: "pointer" }}>
                Ver inventario →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px", background: "rgba(15,15,26,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "10px 12px 18px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)" }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const hasBadge = (tab.id === "shopping" && autoSuggestions.length > 0) || (tab.id === "premium" && !isPremium);
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", position: "relative", padding: "4px" }}>
              <div style={{ position: "relative" }}>
                <span style={{ fontSize: "20px", filter: isActive ? "none" : "grayscale(50%)", opacity: isActive ? 1 : 0.5, transition: "all 0.2s" }}>{tab.icon}</span>
                {hasBadge && <span style={{ position: "absolute", top: -4, right: -4, background: "#FF5252", borderRadius: "50%", width: "10px", height: "10px", border: "2px solid #0F0F1A" }} />}
              </div>
              <span style={{ fontSize: "10px", fontWeight: isActive ? "700" : "500", color: isActive ? (tab.id === "premium" ? "#FFD700" : "#FFB74D") : "#B0A090", letterSpacing: "0.5px" }}>{tab.label}</span>
              {isActive && <div style={{ width: "20px", height: "2px", background: tab.id === "premium" ? "linear-gradient(90deg, #FFD700, #FF8C42)" : "linear-gradient(90deg, #FF8C42, #FFB74D)", borderRadius: "2px" }} />}
            </button>
          );
        })}
      </div>

      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} onAdd={addProduct} currentCount={products.length} isPremium={isPremium} />}
      {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} products={products} onUpdateProduct={updateProduct} />}

      {/* HOUSEHOLD MODAL */}
      {showHouseholdModal && (
        <HouseholdModal
          household={household}
          members={householdMembers}
          userId={user?.id}
          onCreateHousehold={createHousehold}
          onJoinHousehold={joinHousehold}
          onLeaveHousehold={leaveHousehold}
          onClose={() => setShowHouseholdModal(false)}
        />
      )}}}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#1A1A2E", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: "480px", animation: "slideUp 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#F5E6D0", fontSize: "20px", fontFamily: "'Playfair Display', serif", margin: 0 }}>
                {editingProduct.emoji} Editar producto
              </h3>
              <button onClick={() => setEditingProduct(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#F5E6D0", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>

            {/* Nombre */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#B0A090", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Nombre del producto</label>
              <input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                placeholder="Nombre del producto"
                style={{ width: "100%", marginTop: "8px", padding: "12px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#F5E6D0", fontSize: "15px", outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Precio */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#B0A090", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Precio estimado <span style={{ color: "#666", fontWeight: "400", textTransform: "none", letterSpacing: 0 }}>(opcional)</span></label>
              <div style={{ position: "relative", marginTop: "8px" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#B0A090", fontSize: "15px", fontWeight: "600" }}>$</span>
                <input type="number" value={editingProduct.price || ""} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} placeholder="0.00"
                  style={{ width: "100%", padding: "12px 14px 12px 28px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#F5E6D0", fontSize: "15px", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Cantidad actual */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#B0A090", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Cantidad actual</label>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <input type="number" value={editingProduct.quantity} onChange={e => setEditingProduct({...editingProduct, quantity: e.target.value})}
                  style={{ flex: 1, padding: "12px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#F5E6D0", fontSize: "15px", outline: "none" }} />
                <select value={editingProduct.unit} onChange={e => setEditingProduct({...editingProduct, unit: e.target.value})}
                  style={{ flex: 1, padding: "12px 14px", background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#F5E6D0", fontSize: "15px", outline: "none" }}>
                  {["pzas","kg","g","L","ml","bot","caja","bolsa","cabeza","lata"].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Registrar salida */}
            <div style={{ background: "rgba(255,82,82,0.06)", border: "1px solid rgba(255,82,82,0.15)", borderRadius: "14px", padding: "14px", marginBottom: "16px" }}>
              <label style={{ color: "#FF8A80", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Registrar salida (restar)</label>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <input type="number" placeholder="Cantidad usada" id="salidaInput"
                  style={{ flex: 1, padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,82,82,0.2)", borderRadius: "12px", color: "#F5E6D0", fontSize: "15px", outline: "none" }} />
                <button onClick={() => {
                  const salida = parseFloat(document.getElementById("salidaInput").value);
                  if (!isNaN(salida) && salida > 0) {
                    const nueva = Math.max(0, parseFloat(editingProduct.quantity) - salida);
                    setEditingProduct({...editingProduct, quantity: nueva});
                    document.getElementById("salidaInput").value = "";
                  }
                }} style={{ padding: "12px 16px", background: "rgba(255,82,82,0.2)", border: "none", borderRadius: "12px", color: "#FF5252", fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>
                  − Restar
                </button>
              </div>
            </div>

            {/* Cambiar categoría */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: "#B0A090", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Ubicación</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setEditingProduct({...editingProduct, category: cat.id})}
                    style={{ padding: "10px", background: editingProduct.category === cat.id ? `${cat.color}30` : "rgba(255,255,255,0.05)", border: `2px solid ${editingProduct.category === cat.id ? cat.color : "transparent"}`, borderRadius: "10px", color: "#F5E6D0", fontSize: "13px", cursor: "pointer" }}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => {
              updateProduct(editingProduct.id, { name: editingProduct.name, quantity: editingProduct.quantity, unit: editingProduct.unit, category: editingProduct.category, expiry: editingProduct.expiry || null, price: editingProduct.price ? parseFloat(editingProduct.price) : null });
              setEditingProduct(null);
            }} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #FF8C42, #FFB74D)", border: "none", borderRadius: "14px", color: "#1A1A2E", fontSize: "16px", fontWeight: "800", cursor: "pointer" }}>
              ✓ Guardar cambios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
