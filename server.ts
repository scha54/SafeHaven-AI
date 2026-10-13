import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
    ai = null;
  }
}

// API Health / Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!ai,
    model: 'gemini-3.8-flash',
    region: 'JAPAC (Manila Basin Simulation)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Fallback incident analyzer
function generateRuleBasedIncidentAnalysis(payload: any) {
  const { title = '', description = '', category = 'flood', peopleAffected = 0, vulnerabilities = [] } = payload;
  const text = `${title} ${description}`.toLowerCase();

  let severity = 'Medium';
  let urgency = 'Elevated';
  let confidence = 0.88;
  const damageIndicators: string[] = [];
  const populationRisks: string[] = [];
  const recommendedActions: string[] = [];
  const missingInfo: string[] = [];

  if (text.includes('chest') || text.includes('roof') || text.includes('trap') || text.includes('submerged') || text.includes('sweep') || text.includes('critical') || peopleAffected > 10) {
    severity = 'Critical';
    urgency = 'Immediate Life Threat';
  } else if (text.includes('waist') || text.includes('knee') || text.includes('rising') || text.includes('elderly') || text.includes('medical') || text.includes('infant')) {
    severity = 'High';
    urgency = 'Urgent Response Needed';
  }

  if (text.includes('submerge') || text.includes('water') || text.includes('flood')) {
    damageIndicators.push('Ground-level inundation and restricted vehicle access');
  }
  if (text.includes('power') || text.includes('electric') || text.includes('blackout')) {
    damageIndicators.push('Electrical grid interruption / energized flood hazard');
  }
  if (text.includes('structural') || text.includes('wall') || text.includes('collapse')) {
    damageIndicators.push('Compromised physical shelter integrity');
  }
  if (damageIndicators.length === 0) {
    damageIndicators.push('Roadway water accumulation requiring high-clearance assets');
  }

  if (vulnerabilities.length > 0) {
    populationRisks.push(`Vulnerable groups present (${vulnerabilities.join(', ')}): heightened hypothermia, mobility constraints, and panic risk.`);
  } else {
    populationRisks.push('Potential isolation if floodwaters crest before extraction.');
  }

  if (peopleAffected > 0) {
    populationRisks.push(`Estimated ${peopleAffected} individuals facing rising water exposure.`);
  }

  recommendedActions.push('Dispatch shallow-draft rescue boat or high-water rescue truck.');
  recommendedActions.push('Verify primary ingress route against reported bridge and road closures.');
  recommendedActions.push('Pre-notify receiving evacuation shelter for intake capacity.');

  missingInfo.push('Confirm current vertical water depth and rate of rise.');
  missingInfo.push('Verify exact number of minors, seniors, or bedridden patients.');

  return {
    incidentSummary: `Automated assessment of ${category} report: ${description.slice(0, 140)}...`,
    detectedHazardType: category.toUpperCase(),
    severity,
    confidenceScore: confidence,
    urgency,
    observedFacts: [
      `Distress report lodged citing: "${title}"`,
      `Reported population affected: ${peopleAffected || 'Unspecified'}`,
      `Reported vulnerability tags: ${vulnerabilities.length ? vulnerabilities.join(', ') : 'None explicitly specified'}`,
    ],
    modelInferences: [
      `Primary transit corridors in immediate grid cell are likely impassable to standard 2WD vehicles.`,
      `Secondary threat of water contamination and debris impact if current increases.`,
    ],
    visibleDamageIndicators: damageIndicators,
    potentialPopulationRisks: populationRisks,
    recommendedNextActions: recommendedActions,
    missingInformation: missingInfo,
    humanVerificationRequired: true,
    isFallback: true,
    fallbackReason: !ai ? 'Gemini API key not configured or in offline demo mode' : undefined,
  };
}

// Multimodal Incident Intake Analyzer
app.post('/api/gemini/analyze-incident', async (req, res) => {
  const {
    title,
    description,
    category,
    location,
    peopleAffected,
    vulnerabilities,
    imageBase64,
    mimeType,
  } = req.body;

  if (!ai) {
    const fallbackResult = generateRuleBasedIncidentAnalysis(req.body);
    return res.json(fallbackResult);
  }

  try {
    const systemPrompt = `You are the lead intelligence analyst of SafeHaven AI, a disaster response command center operating in the JAPAC region (typhoons, storm surges, and riverine floods).
Evaluate the incoming distress report with high analytical rigor.
Distinguish strictly between OBSERVED FACTS (directly observable evidence in the text or image) and MODEL INFERENCES (probabilistic hypotheses that require field verification).
Never invent casualties or claim an unverified building has collapsed without visual proof.
Return ONLY valid JSON matching the requested schema.`;

    const userTextPrompt = `Disaster Report Details:
- Title: ${title || 'Untitled'}
- Category: ${category || 'Flood'}
- Reporter Description: ${description || 'No description provided'}
- Location: ${location ? `${location.lat}, ${location.lng} (${location.name || 'Coords'})` : 'Unknown'}
- People Affected Estimate: ${peopleAffected || 'Unspecified'}
- Vulnerability Indicators: ${Array.isArray(vulnerabilities) ? vulnerabilities.join(', ') : 'None'}
${imageBase64 ? 'An image from the scene is attached. Analyze visible water depth relative to vehicles/structures, flood current, physical damage, and accessibility barriers.' : 'No image provided. Rely on structured text extraction and geospatial threat modeling.'}`;

    let contentsPayload: any;
    if (imageBase64 && mimeType) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          { text: userTextPrompt },
        ],
      };
    } else {
      contentsPayload = userTextPrompt;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contentsPayload,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            incidentSummary: {
              type: Type.STRING,
              description: 'Concise 2-sentence summary of the incident and critical stakes.',
            },
            detectedHazardType: {
              type: Type.STRING,
              description: 'Primary hazard category e.g. FLASH_FLOOD, STRUCTURAL_COLLAPSE, ELECTRICAL_HAZARD, STORM_SURGE.',
            },
            severity: {
              type: Type.STRING,
              description: 'Must be one of: Critical, High, Medium, Low',
            },
            confidenceScore: {
              type: Type.NUMBER,
              description: 'Confidence score between 0.0 and 1.0',
            },
            urgency: {
              type: Type.STRING,
              description: 'Urgency classification e.g. Immediate Life Threat, Urgent (Within 1 hr), Elevated, Routine',
            },
            observedFacts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Concrete, directly verified facts from the image or citizen statement.',
            },
            modelInferences: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Model-derived deductions requiring field verification by human operator.',
            },
            visibleDamageIndicators: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Visible physical damage indicators (e.g., water above tire line, downed wires).',
            },
            potentialPopulationRisks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Risks to residents (hypothermia, rapid water rise, lack of clean water).',
            },
            recommendedNextActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Top 3 actionable recommendations for emergency operations center.',
            },
            missingInformation: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Critical unknowns that dispatchers should attempt to clarify.',
            },
            humanVerificationRequired: {
              type: Type.BOOLEAN,
              description: 'Always true for life-safety critical operations.',
            },
          },
          required: [
            'incidentSummary',
            'detectedHazardType',
            'severity',
            'confidenceScore',
            'urgency',
            'observedFacts',
            'modelInferences',
            'visibleDamageIndicators',
            'potentialPopulationRisks',
            'recommendedNextActions',
            'missingInformation',
            'humanVerificationRequired',
          ],
        },
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return res.json({
      ...parsed,
      isFallback: false,
    });
  } catch (error: any) {
    console.error('Gemini incident analysis failed, utilizing robust fallback:', error?.message);
    const fallbackResult = generateRuleBasedIncidentAnalysis(req.body);
    return res.json({
      ...fallbackResult,
      fallbackReason: `Gemini API query error: ${error?.message || 'Unknown'}. Reverted safely to rule-based parser.`,
    });
  }
});

// Multilingual Emergency Alert Generator
app.post('/api/gemini/generate-alert', async (req, res) => {
  const {
    templateType,
    area,
    hazard,
    urgency,
    recommendedAction,
    shelterOrFacility,
    language = 'English',
    targetAudience = 'General Public',
    customNotes = '',
  } = req.body;

  if (!ai) {
    // High quality multilingual emergency templates
    const templates: Record<string, string> = {
      English: `[EMERGENCY ADVISORY - SAFEHAVEN AI]\nArea: ${area}\nHazard: ${hazard} (${urgency})\nAction: ${recommendedAction}.\nSafe Evacuation Point: ${shelterOrFacility}.\nInstructions: Move to higher ground immediately. Do not attempt to walk or drive through flowing water. Keep emergency radios tuned for updates.\nIssued by Emergency Operations Center. Simulation Notice: Testing Only.`,
      Filipino: `[BABALA SA KALIGTASAN - SAFEHAVEN AI]\nLugar: ${area}\nPanganib: ${hazard} (${urgency})\nKilos: ${recommendedAction}.\nLigtas na Evacuation Center: ${shelterOrFacility}.\nMga Tagubilin: Lumikas agad sa mataas na lugar. Huwag lumusong o magmaneho sa rumaragasang baha. Panatilihing nakikinig sa mga opisyal na anunsyo.\nIpinatupad ng Emergency Operations Center. Paunawa: Pagsasanay lamang.`,
      'Bahasa Indonesia': `[PERINGATAN DARURAT - SAFEHAVEN AI]\nWilayah: ${area}\nBahaya: ${hazard} (${urgency})\nTindakan: ${recommendedAction}.\nLokasi Pengungsian Aman: ${shelterOrFacility}.\nInstruksi: Segera mengungsi ke tempat yang lebih tinggi. Hindari melintasi genangan banjir atau aliran air deras. Simak terus arahan resmi tim siaga bencana.\nDikeluarkan oleh Posko Darurat Bencana. Catatan Simulasi: Hanya Uji Coba.`,
      Thai: `[ประกาศเตือนภัยฉุกเฉิน - SAFEHAVEN AI]\nพื้นที่: ${area}\nภัยพิบัติ: ${hazard} (${urgency})\nการปฏิบัติ: ${recommendedAction}\nจุดอพยพที่ปลอดภัย: ${shelterOrFacility}\nคำแนะนำ: โปรดอพยพขึ้นสู่ที่สูงทันที ห้ามเดินหรือขับขี่ยานพาหนะฝ่ากระแสน้ำเชี่ยว ติดตามข่าวสารจากศูนย์บัญชาการสถานการณ์ฉุกเฉินอย่างต่อเนื่อง\nออกประกาศโดย: ศูนย์บัญชาการเหตุฉุกเฉิน (โหมดจำลองสถานการณ์)`,
      Japanese: `【緊急避難情報 - SAFEHAVEN AI】\n対象地域: ${area}\n警戒事象: ${hazard}（緊急度: ${urgency}）\n推奨行動: ${recommendedAction}\n指定緊急避難場所: ${shelterOrFacility}\n行動指針: 直ちに高台または指定避難所へ避難してください。冠水道路の歩行や車両進入は極めて危険です。防災無線の最新情報をご確認ください。\n発信元: 災害対策本部（訓練・シミュレーション用配信）`,
      Hindi: `[आपातकालीन चेतावनी - SAFEHAVEN AI]\nक्षेत्र: ${area}\nखतरा: ${hazard} (${urgency})\nकार्रवाई: ${recommendedAction}\nसुरक्षित आश्रय स्थल: ${shelterOrFacility}\nनिर्देश: तुरंत ऊंचे स्थानों पर जाएं। बहते बाढ़ के पानी में पैदल या गाड़ी से जाने का प्रयास न करें। आपातकालीन प्रसारण पर नज़र रखें।\nजारीकर्ता: आपातकालीन संचालन केंद्र (सिमुलेशन मोड).`,
    };

    const draft = templates[language] || templates['English'];
    return res.json({
      language,
      headline: `${urgency.toUpperCase()} - ${hazard} ADVISORY FOR ${area}`,
      content: draft,
      characterCount: draft.length,
      smsOptimizedContent: draft.slice(0, 158),
      keySafetyInstructions: [
        'Move to designated safe shelter without delay',
        'Avoid flooded roads and submerged power infrastructure',
        'Carry critical medications and personal identification',
      ],
      isFallback: true,
      approvalStatus: 'DRAFT_PENDING_REVIEW',
    });
  }

  try {
    const prompt = `You are the chief communications officer at a disaster management center in Asia-Pacific.
Draft an urgent, authoritative, compassionate, and culturally appropriate emergency alert in the requested language: "${language}".

Parameters:
- Area: ${area}
- Hazard: ${hazard}
- Urgency: ${urgency}
- Required Action: ${recommendedAction}
- Verified Shelter/Facility: ${shelterOrFacility}
- Target Audience: ${targetAudience}
- Notes: ${customNotes}

Guidelines:
1. Provide a crisp headline, full broadcast message, an SMS-compatible version under 160 characters, and 3 key bullet points.
2. Preserve exact geographical place names without distorting them.
3. Include standard safety guidance (do not drive through flood waters, bring emergency supplies).
4. End with an explicit note that this message was prepared in SafeHaven AI Command Center and requires human authorization before broadcast.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            language: { type: Type.STRING },
            headline: { type: Type.STRING },
            content: { type: Type.STRING },
            smsOptimizedContent: { type: Type.STRING },
            keySafetyInstructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['language', 'headline', 'content', 'smsOptimizedContent', 'keySafetyInstructions'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      ...parsed,
      isFallback: false,
      approvalStatus: 'DRAFT_PENDING_REVIEW',
    });
  } catch (err: any) {
    console.error('Gemini alert generation error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to generate alert' });
  }
});

// Mount Vite or serve static
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[SafeHaven AI] Server running at http://0.0.0.0:${port}`);
    console.log(`[SafeHaven AI] Gemini AI status: ${ai ? 'ACTIVE' : 'OFFLINE / DEMO FALLBACK'}`);
  });
}

startServer().catch((err) => {
  console.error('[SafeHaven AI] Failed to start server:', err);
});
