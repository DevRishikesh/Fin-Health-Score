// ================= CONFIGURATION =================
const API_KEY = "AIzaSyBigtTCRiqpG_HpXX5xsdUBakeP1sOwD9A";

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("result.html")) {
    initResultPage();
  } else {
    initFormPage();
  }
});

// ================= PAGE 1: FORM =================
function initFormPage() {
  const form = document.getElementById("finForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = document.getElementById("analyzeBtn");
    const loader = document.getElementById("btnLoader");
    const btnText = document.querySelector(".btn-text");

    btn.disabled = true;
    loader.style.display = "inline-block";
    btnText.textContent = "Generating Report...";

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    for (let k in data) {
      if (k.startsWith("income") || k.startsWith("fix") || k.startsWith("var") || k.startsWith("asset")) {
        data[k] = Number(data[k]) || 0;
      }
    }

    const health = calculateHealthScore(data);
    const personality = detectPersonality(data, health.score);

    try {
      const model = await findFlashModel();
      const ai = await callGemini(model, data, health, personality);

      localStorage.setItem("finData", JSON.stringify({
        raw: data,
        health,
        personality,
        ai
      }));

      window.location.href = "result.html";
    } catch (err) {
      alert(err.message || "Something went wrong");
      btn.disabled = false;
      loader.style.display = "none";
      btnText.textContent = "Analyze My Finances";
    }
  });
}

// ================= PAGE 2: RESULT =================
function initResultPage() {
  const raw = localStorage.getItem("finData");
  if (!raw) return (window.location.href = "index.html");

  const data = JSON.parse(raw);
  const d = data.raw;

  animateValue(document.getElementById("scoreNum"), 0, data.health.score, 1500);
  updateScoreRing(data.health.score);

  document.getElementById("persTitle").textContent = data.personality.title;
  document.getElementById("persDesc").textContent = data.personality.desc;

  const parser = typeof marked !== "undefined" ? marked.parse : t => t;
  document.getElementById("swotContainer").innerHTML = parser(data.ai.swot);
  document.getElementById("actionContainer").innerHTML = parser(data.ai.actions);

  generateAlerts(d);
  generateVisualBar(d);
  generateBenchmarks(d);
  generateSavingsTarget(d);
}

// ================= ALERTS =================
function generateAlerts(d) {
  const income = d.income_self + d.income_spouse;
  if (income <= 0) return;

  const emi = d.fix_home_emi + d.fix_other_emi;
  const fixed = d.fix_rent + emi + d.fix_food + d.fix_utils + d.fix_transport + d.fix_medical;
  const variable = d.var_subs + d.var_entertainment + d.var_lifestyle + d.var_travel + d.var_misc;

  const savings = income - (fixed + variable);
  const savingsRate = (savings / income) * 100;
  const emiRate = (emi / income) * 100;
  const emergencyMonths = fixed > 0 ? (d.asset_fund / fixed) : 0;

  const c = document.getElementById("alertContainer");
  if (!c) return;
  c.innerHTML = "";

  if (emiRate > 40) c.innerHTML += `<div class="alert-card alert-danger">High EMI burden (${emiRate.toFixed(0)}%)</div>`;
  if (savingsRate < 10) c.innerHTML += `<div class="alert-card alert-danger">Very low savings (${savingsRate.toFixed(0)}%)</div>`;
  if (emergencyMonths < 3) c.innerHTML += `<div class="alert-card alert-warning">Emergency fund too low</div>`;
  if (c.innerHTML === "") c.innerHTML = `<div class="alert-card alert-success">No critical financial risks detected</div>`;
}

// ================= SPENDING DNA (FIXED) =================
function generateVisualBar(d) {
  const income = d.income_self + d.income_spouse;
  if (income <= 0) return;

  const fixed = d.fix_rent + d.fix_home_emi + d.fix_other_emi + d.fix_food + d.fix_utils + d.fix_transport + d.fix_medical;
  const variable = d.var_subs + d.var_entertainment + d.var_lifestyle + d.var_travel + d.var_misc;
  const savings = Math.max(0, income - (fixed + variable));

  let n = (fixed / income) * 100;
  let w = (variable / income) * 100;
  let s = (savings / income) * 100;

  const total = n + w + s || 1;
  const fn = (n / total) * 100;
  const fw = (w / total) * 100;
  const fs = (s / total) * 100;

  document.getElementById("barNeeds").style.width = `${fn}%`;
  document.getElementById("barWants").style.width = `${fw}%`;
  document.getElementById("barSavings").style.width = `${fs}%`;

  document.querySelector("#legendNeeds strong").textContent = `${Math.round(n)}%`;
  document.querySelector("#legendWants strong").textContent = `${Math.round(w)}%`;
  document.querySelector("#legendSavings strong").textContent = `${Math.round(s)}%`;
}

// ================= BENCHMARK =================
 function generateBenchmarks(d) {
  const income = d.income_self + d.income_spouse;
  if (income <= 0) return;

  const emi = d.fix_home_emi + d.fix_other_emi;
  const fixed =
    d.fix_rent + emi +
    d.fix_food + d.fix_utils + d.fix_transport + d.fix_medical;

  const needsRatio = (fixed / income) * 100;
  const emiRatio = (emi / income) * 100;

  // ---- STATUS LOGIC ----
  const needsStatus =
    needsRatio <= 50 ? "🟢 Good" :
    needsRatio <= 65 ? "🟡 Warning" :
    "🔴 Danger";

  const emiStatus =
    emiRatio <= 30 ? "🟢 Good" :
    emiRatio <= 40 ? "🟡 Warning" :
    "🔴 Danger";

  const insuranceStatus =
    d.prot_health === "yes" ? "🟢 Covered" : "🔴 Missing";

  const tbody = document.getElementById("benchmarkBody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td>Needs</td>
      <td>&lt; 50%</td>
      <td>${needsRatio.toFixed(0)}%</td>
      <td>${needsStatus}</td>
    </tr>
    <tr>
      <td>EMI</td>
      <td>&lt; 30%</td>
      <td>${emiRatio.toFixed(0)}%</td>
      <td>${emiStatus}</td>
    </tr>
    <tr>
      <td>Insurance</td>
      <td>Yes</td>
      <td>${d.prot_health === "yes" ? "Yes" : "No"}</td>
      <td>${insuranceStatus}</td>
    </tr>
  `;
}


// ================= SAVINGS TARGET =================
function generateSavingsTarget(d) {
  const income = d.income_self + d.income_spouse;
  const fixed = d.fix_rent + d.fix_home_emi + d.fix_other_emi + d.fix_food + d.fix_utils + d.fix_transport + d.fix_medical;
  const variable = d.var_subs + d.var_entertainment + d.var_lifestyle + d.var_travel + d.var_misc;
  const current = income - (fixed + variable);
  const target = income * 0.2;

  const el = document.getElementById("targetText");
  if (!el) return;

  el.innerHTML =
    current < target
      ? `Increase savings by <strong>₹${Math.ceil(target - current).toLocaleString()}</strong> per month`
      : `You are saving <strong>₹${Math.ceil(current - target).toLocaleString()}</strong> above the target`;
}

// ================= PDF =================
function downloadPDF() {
  window.print();
}

// ================= UTILS =================
function updateScoreRing(score) {
  const ring = document.getElementById("scoreRing");
  const color = score > 75 ? "#10b981" : score > 50 ? "#f59e0b" : "#ef4444";
  ring.style.background = `conic-gradient(${color} ${score}%, #1f2937 0%)`;
}

function animateValue(el, start, end, duration) {
  let startTime = null;
  function step(ts) {
    if (!startTime) startTime = ts;
    const p = Math.min((ts - startTime) / duration, 1);
    el.textContent = Math.floor(p * (end - start) + start);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ================= AI =================
async function findFlashModel() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
  const json = await res.json();
  const m = json.models.find(x => x.name.includes("flash"));
  return m ? m.name.replace("models/", "") : "gemini-1.5-flash";
}

async function callGemini(model, d, health) {
  const income = d.income_self + d.income_spouse;
  const fixed = d.fix_rent + d.fix_home_emi + d.fix_other_emi + d.fix_food + d.fix_utils + d.fix_transport + d.fix_medical;
  const variable = d.var_subs + d.var_entertainment + d.var_lifestyle + d.var_travel + d.var_misc;
  const savings = income - (fixed + variable);
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const emiRate = income > 0 ? ((d.fix_home_emi + d.fix_other_emi) / income) * 100 : 0;

  const prompt = `
You are a Certified Financial Planner working for a premium fintech platform.

Analyze objectively and concisely.

STRENGTHS
- Max 3 bullets

WEAKNESSES
- Max 2 bullets

OPPORTUNITIES
- Max 2 bullets

THREATS
- Max 2 bullets

|||SECTION|||

ACTION PLAN
1. One clear financial action
2. One clear financial action
3. One clear financial action

DATA:
Income ₹${income}
Fixed ₹${fixed}
Variable ₹${variable}
Savings ₹${savings}
Savings Rate ${savingsRate.toFixed(1)}%
EMI ${emiRate.toFixed(1)}%
Score ${health.score}/100
`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  const json = await res.json();
  const text = json.candidates[0].content.parts[0].text;

  let swot = text;
  let actions = "• No actions generated.";

  if (text.includes("|||SECTION|||")) {
    const p = text.split("|||SECTION|||");
    swot = p[0].trim();
    actions = p[1].trim();
  }

  return { swot, actions };
}

// ================= CORE LOGIC =================
function calculateHealthScore(d) {
  const income = d.income_self + d.income_spouse;
  if (income <= 0) return { score: 0 };

  const fixed = d.fix_rent + d.fix_home_emi + d.fix_other_emi + d.fix_food + d.fix_utils + d.fix_transport + d.fix_medical;
  const variable = d.var_subs + d.var_entertainment + d.var_lifestyle + d.var_travel + d.var_misc;
  const savingsRate = ((income - fixed - variable) / income) * 100;
  const fixedRatio = (fixed / income) * 100;
  const emiRatio = ((d.fix_home_emi + d.fix_other_emi) / income) * 100;

  let score = 0;
  if (savingsRate >= 30) score += 40;
  else if (savingsRate >= 20) score += 30;
  else if (savingsRate >= 10) score += 20;
  else if (savingsRate > 0) score += 10;

  if (fixedRatio <= 50) score += 20;
  else if (fixedRatio <= 65) score += 10;

  if (emiRatio <= 30) score += 20;
  else if (emiRatio <= 40) score += 10;

  if (d.prot_health === "yes") score += 10;
  if (d.prot_life === "yes") score += 10;

  return { score: Math.min(100, score) };
}

function detectPersonality(d, score) {
  const income = d.income_self + d.income_spouse;
  const wants = d.var_entertainment + d.var_lifestyle + d.var_subs;

  if (score > 80 && d.mindset_risk === "high") return { title: "The Wealth Accelerator", desc: "High growth with discipline." };
  if (wants > income * 0.4) return { title: "The Lifestyle Lavish", desc: "High discretionary spending." };
  if (score < 40) return { title: "The Paycheck Survivor", desc: "Needs stabilization." };
  return { title: "The Balancer", desc: "Healthy financial balance." };
}
