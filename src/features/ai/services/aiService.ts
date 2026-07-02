import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/firebase/config';
import { collection, getDocsFromServer } from 'firebase/firestore';
import { calcCurrentAgeWeeks, getLifecycleStage } from '@/lib/birdAge';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const PRIMARY_MODEL = 'gemini-3.5-flash';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

/**
 * Attempts to generate content with the primary model (gemini-3.5-flash).
 * If a 429 rate-limit error is returned, automatically retries with the
 * fallback model (gemini-3.1-flash-lite). All other errors are re-thrown.
 */
async function generateWithFallback(
  prompt: string | any[],
  generationConfig?: object,
  history?: any[]
): Promise<{ text: string, model: string }> {
  const attemptGenerate = async (modelName: string): Promise<{ text: string, model: string }> => {
    const model = genAI.getGenerativeModel({
      model: modelName,
      ...(generationConfig ? { generationConfig } : {}),
    });

    if (history && history.length > 0) {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(prompt as string);
      return { text: result.response.text(), model: modelName };
    } else {
      const result = await model.generateContent(prompt as any);
      return { text: result.response.text(), model: modelName };
    }
  };

  try {
    return await attemptGenerate(PRIMARY_MODEL);
  } catch (err: any) {
    // 429 = RESOURCE_EXHAUSTED (rate limit hit) — try fallback
    const isRateLimit =
      err?.status === 429 ||
      err?.message?.includes('429') ||
      err?.message?.toLowerCase().includes('resource_exhausted') ||
      err?.message?.toLowerCase().includes('quota');

    if (isRateLimit) {
      console.warn(`[AI] ${PRIMARY_MODEL} rate limited. Falling back to ${FALLBACK_MODEL}.`);
      return await attemptGenerate(FALLBACK_MODEL);
    }
    throw err;
  }
}

export class AiService {
  /**
   * Fetches comprehensive farm data and sends it as context to Gemini.
   */
  static async askAssistant(prompt: string, farmId: string, history?: any[]): Promise<{ text: string, model: string }> {
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please configure it in the .env file.");
    }

    try {
      // Fetch houses, batches, and egg records for full context directly from server to avoid stale cache
      const [housesSnap, batchesSnap, eggsSnap, feedSnap, dailyRecordsSnap, vaccinesSnap, vaccinationsSnap] = await Promise.all([
        getDocsFromServer(collection(db, 'farms', farmId, 'houses')),
        getDocsFromServer(collection(db, 'farms', farmId, 'batches')),
        getDocsFromServer(collection(db, 'farms', farmId, 'eggProductions')),
        getDocsFromServer(collection(db, 'farms', farmId, 'feedLogs')),
        getDocsFromServer(collection(db, 'farms', farmId, 'dailyRecords')),
        getDocsFromServer(collection(db, 'farms', farmId, 'vaccines')),
        getDocsFromServer(collection(db, 'farms', farmId, 'vaccinations')),
      ]);

      const houses = housesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const rawBatches = batchesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const batches = rawBatches.map(b => {
        if (b.status === 'BROODING' || b.status === 'GROWING' || b.status === 'LAYING') {
          const age = calcCurrentAgeWeeks(b.arrivalDate, b.currentAgeWeeks);
          const stage = getLifecycleStage(age.totalWeeks);
          let newStatus = b.status;
          if (stage === 'Brooding') newStatus = 'BROODING';
          else if (stage === 'Growing' || stage === 'Pre-Lay') newStatus = 'GROWING';
          else if (stage === 'Laying' || stage === 'Late Lay' || stage === 'End of Lay') newStatus = 'LAYING';
          return { ...b, status: newStatus };
        }
        return b;
      });
      const eggRecords = eggsSnap.docs.map(d => d.data()) as any[];
      const feedLogs = feedSnap.docs.map(d => d.data()) as any[];
      const dailyRecords = dailyRecordsSnap.docs.map(d => d.data()) as any[];
      const vaccinations = [...vaccinesSnap.docs, ...vaccinationsSnap.docs].map(d => d.data()) as any[];

      const now = new Date();
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
      const pendingVaccines = vaccinations.filter(v => v.status === 'Pending' && (new Date(v.scheduledDate).getTime() - now.getTime()) <= fourteenDaysMs);

      // Compute derived stats
      const totalBirds = batches.reduce((s: number, b: any) => s + (b.currentQuantity || 0), 0);
      const layingBirds = batches.filter(b => b.status === 'LAYING').reduce((s: number, b: any) => s + (b.currentQuantity || 0), 0);
      const totalMortality = dailyRecords.reduce((s: number, r: any) => s + (r.mortality || 0), 0);
      const recentEggs = eggRecords
        .sort((a: any, b: any) => (b.date > a.date ? 1 : -1))
        .slice(0, 7);

      const currentHour = now.getHours();
      const timeContext = currentHour < 16 
        ? "It is currently before 4 PM. The farmer may not have logged today's eggs yet, so do not assume 0 eggs means a drop in production today." 
        : "It is late in the day. If today's eggs are 0, it might be an issue.";

      const context = `
You are PoultryPro AI — an expert poultry farm management assistant.
You are helping the owner of a commercial poultry farm. Be concise, practical, and knowledgeable.
Always answer directly. Avoid unnecessary preambles. If asked about vaccines, give specific advice applicable to Nigeria.

=== CURRENT FARM STATUS ===

Houses (${houses.length} total):
${houses.map((h: any) => {
  const pop = batches.filter((b: any) => b.houseId === h.id && ['BROODING', 'GROWING', 'LAYING'].includes(b.status)).reduce((s: number, b: any) => s + (b.currentQuantity || 0), 0);
  return `  - ${h.name}: Type=${h.houseType || 'Unknown'}, Capacity=${h.capacity || 0}, Current Population=${pop} birds, Status=${h.status}`;
}).join('\n') || '  None recorded.'}

Batches (${batches.length} total):
${batches.map((b: any) => {
  let age = b.currentAgeWeeks || 0;
  if (b.arrivalDate) {
    const weeksSinceArrival = Math.floor((now.getTime() - new Date(b.arrivalDate).getTime()) / (1000 * 3600 * 24 * 7));
    age += Math.max(0, weeksSinceArrival);
  }
  return `  - ${b.batchName} [${b.batchCode}]: Breed=${b.breedName || 'Unknown'}, House=${b.houseName || 'Unknown'}, Current Birds=${b.currentQuantity || 0}, Age=${age} weeks, Status=${b.status}, Cumulative Mortality=${b.cumulativeMortality || 0}`;
}).join('\n') || '  None recorded.'}

Total Birds on Farm: ${totalBirds}
Laying Birds on Farm: ${layingBirds} (Use this for expected egg calculations, NOT total birds)
Total Cumulative Mortality: ${totalMortality}

Time Context: ${timeContext}

Upcoming Vaccinations (Next 14 Days or Overdue):
${pendingVaccines.length > 0 ? pendingVaccines.map(v => `  - ${v.vaccineName} for batch ${v.batchName} (Scheduled: ${v.scheduledDate.split('T')[0]}, Method: ${v.administrationMethod})`).join('\n') : '  None scheduled.'}

Recent Egg Production (last 7 records):
${recentEggs.map((e: any) => `  - ${e.date}: ${e.totalEggs || 0} eggs (${e.totalCrates || 0} crates), Batch: ${e.batchName || 'N/A'}`).join('\n') || '  No egg records yet.'}

Recent Feed Logs (last 5):
${feedLogs.slice(-5).map((f: any) => `  - ${f.date}: ${f.quantity || 0} ${f.unit || 'kg'} of ${f.feedType || 'feed'}, House: ${f.houseName || 'N/A'}`).join('\n') || '  No feed logs yet.'}

=== USER QUESTION ===
"${prompt}"
`;

      const responseText = await generateWithFallback(context, undefined, history);
      return responseText;

    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      throw new Error(error?.message || "Failed to get a response from the AI. Please try again.");
    }
  }

  /**
   * Analyzes the immediate dashboard metrics to provide a quick 1-sentence insight.
   * Only called when alert conditions are active (mortality, low stock, vaccines due, etc).
   */
  static async getDashboardInsight(metrics: any): Promise<string> {
    if (!apiKey) {
      throw new Error("Gemini API key is missing.");
    }

    try {
      const context = `
You are PoultryPro AI — a poultry farm assistant.
Based on today's farm metrics below, write ONE short, direct, and actionable sentence for the farm owner.
Be specific about the numbers. No greetings, no bullet points.

Today's Metrics:
- Total Birds: ${metrics.totalBirds}
- Laying Birds: ${metrics.layingBirds} (Use THIS for expected egg calculations)
- Active Houses: ${metrics.activeHouses}
- Eggs Collected Today: ${metrics.todayEggs}
- Mortalities Today: ${metrics.todayMortality}
- Low Stock Items: ${metrics.lowStockCount}
- Upcoming Vaccinations (within 3 days): ${metrics.upcomingVaccinesCount}
`;

      const responseText = await generateWithFallback(context);
      return responseText.text.trim();

    } catch (error) {
      console.error("AI Insight Error:", error);
      return "Monitor your flock closely and ensure feed and water are adequate today.";
    }
  }

  /**
   * Analyzes an image of a sick bird and returns a diagnosis and suggested treatment.
   */
  static async analyzeDiseaseImage(base64Data: string, mimeType: string): Promise<{ diagnosis: string, medication: string, dosage: string }> {
    if (!apiKey) {
      throw new Error("Gemini API key is missing.");
    }

    try {
      const imagePrompt = `
You are PoultryPro AI, an avian health assistant for poultry farmers in Nigeria.
Inspect the visible signs in this poultry image and provide a cautious, practical farm-health assessment.
Do not refuse just because diagnosis cannot be confirmed from an image. If signs are unclear, state the most likely possibilities and what to check next.
Recommend common Nigerian poultry medicines or supportive care when appropriate, such as Amprolium/Toltrazuril for suspected coccidiosis, Tylosin/Doxycycline products for respiratory signs, multivitamins/electrolytes/probiotics for stress or poor appetite.
Do not claim certainty and remind that a veterinarian/lab test should confirm serious disease.
Respond ONLY with a valid JSON object in this exact format:
{
  "diagnosis": "Tentative diagnosis or visible concern",
  "medication": "Recommended medicine or supportive product",
  "dosage": "Suggested label-safe dosage or instruction"
}
Do not include markdown backticks or any other text.
      `;

      const result = await generateWithFallback(
        [
          imagePrompt,
          { inlineData: { data: base64Data, mimeType } }
        ],
        { responseMimeType: 'application/json' }
      );
      const cleanText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}');
      return JSON.parse(jsonStart >= 0 && jsonEnd >= 0 ? cleanText.slice(jsonStart, jsonEnd + 1) : cleanText);

    } catch (error: any) {
      console.error("AI Image Analysis Error:", error);
      throw new Error(error?.message || "Failed to analyze the image. Please try again.");
    }
  }
}
