const express = require('express');
const { DRUGS, INTERACTIONS } = require('../models/drugDatabase');

const drugsRouter   = express.Router();
const interRouter   = express.Router();
const healthRouter  = express.Router();

// ── DRUGS ─────────────────────────────────────────────────────────
drugsRouter.get('/', (req, res) => {
  const { q, category, pregnancy } = req.query;
  let results = DRUGS;
  if (q) {
    const l = q.toLowerCase();
    results = results.filter(d =>
      d.name.toLowerCase().includes(l) ||
      d.class.toLowerCase().includes(l) ||
      d.brands.some(b => b.toLowerCase().includes(l)) ||
      d.indications.some(i => i.toLowerCase().includes(l))
    );
  }
  if (category)  results = results.filter(d => d.category === category);
  if (pregnancy) results = results.filter(d => d.pregnancy === pregnancy.toUpperCase());
  res.json({ count: results.length, data: results });
});

drugsRouter.get('/:id', (req, res) => {
  const drug = DRUGS.find(d => d.id === parseInt(req.params.id));
  drug ? res.json({ data: drug }) : res.status(404).json({ error: 'Drug not found' });
});

// ── INTERACTIONS ──────────────────────────────────────────────────
interRouter.get('/', (req, res) => {
  const { drugA, drugB } = req.query;
  const enriched = INTERACTIONS.map(i => ({
    ...i,
    drugAName: DRUGS.find(d => d.id === i.drugA)?.name,
    drugBName: DRUGS.find(d => d.id === i.drugB)?.name,
  }));

  if (!drugA || !drugB) return res.json({ count: enriched.length, data: enriched });

  const aId = parseInt(drugA), bId = parseInt(drugB);
  if (aId === bId) return res.json({ found: false, message: 'Same drug selected' });

  const match = enriched.find(i =>
    (i.drugA === aId && i.drugB === bId) || (i.drugA === bId && i.drugB === aId)
  );
  if (!match) return res.json({ found: false, message: 'No known interaction between these drugs in our database.' });
  res.json({ found: true, data: match });
});

interRouter.post('/check-multiple', (req, res) => {
  const { drugIds } = req.body;
  if (!Array.isArray(drugIds)) return res.status(400).json({ error: 'drugIds array required' });
  const found = [];
  for (let i = 0; i < drugIds.length; i++) {
    for (let j = i + 1; j < drugIds.length; j++) {
      const m = INTERACTIONS.find(x =>
        (x.drugA === drugIds[i] && x.drugB === drugIds[j]) ||
        (x.drugA === drugIds[j] && x.drugB === drugIds[i])
      );
      if (m) found.push({
        ...m,
        drugAName: DRUGS.find(d => d.id === m.drugA)?.name,
        drugBName: DRUGS.find(d => d.id === m.drugB)?.name,
      });
    }
  }
  res.json({ count: found.length, data: found });
});

// ── HEALTH METRICS ────────────────────────────────────────────────
const METRICS = [
  { id:1, userId:1, type:'bp_systolic',  value:120, unit:'mmHg', recordedAt:'2024-11-20T08:00:00Z', notes:'Morning reading' },
  { id:2, userId:1, type:'bp_diastolic', value:80,  unit:'mmHg', recordedAt:'2024-11-20T08:00:00Z', notes:'Morning reading' },
  { id:3, userId:1, type:'blood_glucose',value:105, unit:'mg/dL',recordedAt:'2024-11-20T07:30:00Z', notes:'Fasting' },
  { id:4, userId:1, type:'weight',       value:72,  unit:'kg',   recordedAt:'2024-11-19T09:00:00Z', notes:'' },
  { id:5, userId:1, type:'bp_systolic',  value:118, unit:'mmHg', recordedAt:'2024-11-19T08:00:00Z', notes:'' },
  { id:6, userId:1, type:'bp_diastolic', value:78,  unit:'mmHg', recordedAt:'2024-11-19T08:00:00Z', notes:'' },
  { id:7, userId:1, type:'blood_glucose',value:98,  unit:'mg/dL',recordedAt:'2024-11-18T07:30:00Z', notes:'Fasting' },
];

healthRouter.get('/', (req, res) => {
  const { type } = req.query;
  const data = type ? METRICS.filter(m => m.type === type) : METRICS;
  res.json({ count: data.length, data });
});

healthRouter.post('/', (req, res) => {
  const { type, value, unit, notes } = req.body;
  if (!type || value === undefined) return res.status(400).json({ error: 'type and value required' });
  const metric = { id: Date.now(), userId: 1, type, value: parseFloat(value), unit: unit || '', notes: notes || '', recordedAt: new Date().toISOString() };
  METRICS.push(metric);
  res.status(201).json({ data: metric });
});

module.exports = { drugsRouter, interRouter, healthRouter };
