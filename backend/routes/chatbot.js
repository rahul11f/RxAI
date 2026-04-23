const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { DRUGS, INTERACTIONS } = require('../models/drugDatabase');
const router = express.Router();

// Build drug context string for the AI
const DRUG_SUMMARY = DRUGS.map(d =>
  `${d.name} (${d.class}): ${d.min}-${d.max}mg, freq: ${d.freq.join('/')}, pregnancy: ${d.pregnancy}`
).join('\n');

const INTERACTION_SUMMARY = INTERACTIONS.map(i => {
  const a = DRUGS.find(d => d.id === i.drugA)?.name;
  const b = DRUGS.find(d => d.id === i.drugB)?.name;
  return `${a} + ${b}: ${i.severity} — ${i.effect.slice(0, 100)}`;
}).join('\n');

const SYSTEM_PROMPT = `You are RxAI Medical Assistant — an AI-powered clinical pharmacology expert integrated into the RxAI Prescription Validation System, a B.Tech Final Year Project by Group 132, BBD University Lucknow (Supervisor: Ms. Kratika Chandra).

## YOUR EXPERTISE
You have deep knowledge in:
- Clinical pharmacology and drug mechanisms of action
- Drug-drug, drug-food, and drug-disease interactions
- Dosage calculations, pharmacokinetics, half-lives
- Adverse drug reactions and side effect profiles
- Prescription validation and medication safety
- Indian healthcare context and brand names
- The RxAI project's technical implementation

## OUR DRUG DATABASE (30 drugs)
${DRUG_SUMMARY}

## KNOWN INTERACTIONS IN OUR SYSTEM (8 interactions)
${INTERACTION_SUMMARY}

## RESPONSE GUIDELINES
- Be thorough but concise — answer in 2-5 paragraphs
- Use **bold** for drug names, doses, and critical warnings
- Use 🚨 for dangerous interactions or overdose warnings
- Use ⚕️ for medical disclaimers
- For drug info questions: cover mechanism, indications, side effects, monitoring
- For interaction questions: cover mechanism, clinical effect, and management
- For dosage questions: give specific numbers from our database when available
- For "what is X for" questions: explain indications and mechanism clearly
- For project questions: explain the OCR pipeline (Tesseract LSTM), NER (Fuse.js fuzzy matching + regex), validation logic (dosage range + interaction check), and confidence scoring
- Always end medication-specific responses with: ⚕️ *This information is for educational purposes. Always consult your prescribing doctor or pharmacist before changing your medication.*

## WHAT YOU MUST NEVER DO
- Never diagnose a specific patient's condition
- Never tell someone to change their dose without doctor consultation
- Never dismiss a serious drug interaction concern
- Never provide information about illegal drug use`;

// POST /api/chatbot/message
router.post('/message', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      console.log('⚠️  Anthropic API key not set — using fallback responses');
      return res.json({ reply: fallback(message), model: 'fallback', fallback: true });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Build conversation
    const messages = history.slice(-14).map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content }));
    messages.push({ role: 'user', content: message });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const reply = response.content[0]?.text || 'Unable to generate response. Please try again.';
    res.json({ reply, model: response.model, inputTokens: response.usage?.input_tokens, outputTokens: response.usage?.output_tokens });

  } catch (err) {
    console.error('Chatbot error:', err.message);
    // Return fallback instead of error so UI doesn't break
    res.json({ reply: fallback(req.body.message), model: 'fallback', fallback: true, error: err.message });
  }
});

// Intelligent rule-based fallback using our drug database
function fallback(q) {
  const lower = (q || '').toLowerCase();

  // Drug lookup
  const mentionedDrug = DRUGS.find(d =>
    lower.includes(d.name.toLowerCase()) ||
    d.brands.some(b => lower.includes(b.toLowerCase()))
  );

  if (mentionedDrug) {
    const d = mentionedDrug;
    if (lower.includes('side effect') || lower.includes('adverse')) {
      return `**${d.name} — Side Effects:**\n\n${d.sideEffects.map((s,i) => `${i+1}. ${s}`).join('\n')}\n\n**Monitoring:** ${d.monitoring.join(', ')}\n\n${d.criticalNote ? `⚠️ **Critical:** ${d.criticalNote}\n\n` : ''}⚕️ *Always consult your doctor or pharmacist.*`;
    }
    if (lower.includes('what is') || lower.includes('used for') || lower.includes('indication')) {
      return `**${d.name}** (${d.class})\n\n**Mechanism:** ${d.mechanism}\n\n**Used for:**\n${d.indications.map((i,n) => `${n+1}. ${i}`).join('\n')}\n\n**Dose:** ${d.min}-${d.max}mg, max ${d.maxDaily}mg/day • **Frequency:** ${d.freq.join('/')} • **Half-life:** ${d.halfLife}\n\n⚕️ *Always consult your doctor or pharmacist.*`;
    }
    if (lower.includes('food') || lower.includes('eat') || lower.includes('drink')) {
      return `**${d.name} — Food & Drink Interactions:**\n\n${d.foodInteractions.join('\n\n')}\n\n⚕️ *Always consult your doctor or pharmacist.*`;
    }
    if (lower.includes('dose') || lower.includes('dosage') || lower.includes('how much')) {
      return `**${d.name} — Dosage Information:**\n\n• **Standard dose:** ${d.min}–${d.max}mg per dose\n• **Maximum daily dose:** ${d.maxDaily}mg\n• **Frequency:** ${d.freq.join(' / ')}\n• **Pregnancy category:** ${d.pregnancy}\n• **Half-life:** ${d.halfLife}\n\n⚕️ *Doses must be prescribed by your doctor based on your specific condition.*`;
    }
    if (lower.includes('avoid') || lower.includes('contraindic')) {
      return `**${d.name} — Contraindications:**\n\n${d.contraindications.map((c,i) => `${i+1}. ${c}`).join('\n')}\n\n⚕️ *Always consult your doctor or pharmacist.*`;
    }
    // General info
    return `**${d.name}** (${d.class})\n\n**Mechanism:** ${d.mechanism}\n\n**Dose:** ${d.min}-${d.max}mg ${d.freq.join('/')} • Max: ${d.maxDaily}mg/day\n\n**Common side effects:** ${d.sideEffects.slice(0,4).join(', ')}\n\n**Food interaction:** ${d.foodInteractions[0]}\n\n**Monitoring:** ${d.monitoring.slice(0,3).join(', ')}\n\n⚕️ *Always consult your doctor or pharmacist.*`;
  }

  // Interaction check
  if (lower.includes('interaction') || lower.includes('together') || lower.includes('combine')) {
    const inter = INTERACTIONS.find(i => {
      const a = DRUGS.find(d => d.id === i.drugA)?.name.toLowerCase();
      const b = DRUGS.find(d => d.id === i.drugB)?.name.toLowerCase();
      return lower.includes(a) && lower.includes(b);
    });
    if (inter) {
      const a = DRUGS.find(d => d.id === inter.drugA)?.name;
      const b = DRUGS.find(d => d.id === inter.drugB)?.name;
      return `🚨 **${inter.severity.toUpperCase()} Drug Interaction: ${a} + ${b}**\n\n**Mechanism:** ${inter.mechanism}\n\n**Clinical Effect:** ${inter.effect}\n\n**Management:** ${inter.management}\n\n${inter.clinicalPearl ? `💡 **Clinical Pearl:** ${inter.clinicalPearl}\n\n` : ''}⚕️ *Always consult your doctor or pharmacist before combining medications.*`;
    }
  }

  if (lower.includes('miss') || lower.includes('forgot')) {
    return '**Missed Dose Guidelines:**\n\n1. Take it as soon as you remember\n2. If it\'s almost time for your next dose — **skip the missed dose** (do NOT double up)\n3. Resume your regular schedule\n4. For critical drugs (Warfarin, insulin, anti-epileptics) — contact your doctor\n5. Set phone alarms to prevent future missed doses\n\n⚕️ *Always consult your doctor or pharmacist for specific guidance.*';
  }
  if (lower.includes('pregnan')) {
    return '**Pregnancy Safety Categories (FDA):**\n\n• **Category A** — Adequate studies show no fetal risk (e.g., Levothyroxine, folic acid)\n• **Category B** — Animal studies show no risk; no adequate human studies (e.g., Paracetamol, Amoxicillin, Metformin)\n• **Category C** — Animal studies show adverse effects; benefit may outweigh risk (e.g., Omeprazole, Ciprofloxacin)\n• **Category D** — Evidence of human fetal risk, but benefits may justify use (e.g., Aspirin, Warfarin, Lisinopril)\n• **Category X** — CONTRAINDICATED in pregnancy (e.g., Atorvastatin, Warfarin, Insulin Glargine at high doses)\n\n⚕️ *Always inform your doctor if pregnant or planning pregnancy before any medication.*';
  }
  if (lower.includes('rxai') || lower.includes('project') || lower.includes('how does') || lower.includes('pipeline')) {
    return '**RxAI Validation Pipeline (B.Tech Project — Group 132, BBD University):**\n\n1. **OCR (Tesseract.js LSTM)** — Extracts text from prescription images. 93% accuracy for printed, 81% for handwritten.\n2. **NER** — Fuse.js fuzzy matching + regex extracts drug names, dosages (mg/mcg), frequencies (OD/BD/TDS), durations.\n3. **Drug Validation** — Each extracted drug is checked against our 30-drug clinical database for:\n   - Dosage range (min, max, max daily)\n   - Frequency appropriateness\n   - Pregnancy category warnings\n4. **Interaction Checker** — All drug pairs checked against 8 known interactions (severity: minor → contraindicated)\n5. **Confidence Scoring** — Weighted ensemble score considering NER confidence, dosage validity, and interaction severity.\n6. **AI Chatbot** — Anthropic Claude API with full medical system prompt and our drug database context.\n\nTarget accuracy: 89% | Processing time: <10 seconds';
  }

  return 'I\'m RxAI Medical Assistant. I can help you with:\n\n• **Drug information** — mechanism, indications, side effects\n• **Drug interactions** — ask about any two medications\n• **Dosage guidance** — safe ranges for any drug in our database\n• **Food interactions** — what to eat or avoid with your medication\n• **Missed dose advice** — what to do if you forget\n• **How RxAI works** — our AI validation pipeline\n\nPlease ask a specific question about a medication for detailed information.\n\n⚕️ *Educational information only — always consult your healthcare provider.*';
}

module.exports = router;
