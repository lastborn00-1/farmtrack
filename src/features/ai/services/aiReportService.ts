import { db } from '@/firebase/config';
import { collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import type { AiReport, AiReportType } from '../types';
import { differenceInDays, subDays } from 'date-fns';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export class AiReportService {
  /**
   * Checks if a new report should be generated based on the last generated report.
   * Runs silently on dashboard load.
   */
  static async checkAndGenerateReports(farmId: string): Promise<void> {
    try {
      const reportsRef = collection(db, 'farms', farmId, 'aiReports');
      const q = query(reportsRef, orderBy('generatedAt', 'desc'), limit(1));
      const snap = await getDocs(q);

      const now = new Date();
      let lastReportDate = subDays(now, 30); // Default to 30 days ago if no reports
      
      if (!snap.empty) {
        const lastReport = snap.docs[0].data() as AiReport;
        lastReportDate = new Date(lastReport.generatedAt);
      }

      const daysSinceLastReport = differenceInDays(now, lastReportDate);

      // Determine report type to generate
      let typeToGenerate: AiReportType | null = null;
      if (daysSinceLastReport >= 30) {
        typeToGenerate = 'MONTHLY';
      } else if (daysSinceLastReport >= 14) {
        typeToGenerate = 'BIWEEKLY';
      } else if (daysSinceLastReport >= 3) { // Generating every 3-4 days (Weekly snapshot)
        typeToGenerate = 'WEEKLY';
      }

      if (typeToGenerate) {
        await this.generateAndSaveReport(farmId, typeToGenerate);
      }
    } catch (error) {
      console.error('Failed to check and generate AI reports:', error);
    }
  }

  /**
   * Generates a new report and saves it to Firestore
   */
  private static async generateAndSaveReport(farmId: string, type: AiReportType): Promise<void> {
    if (!apiKey) return;

    try {
      // 1. Fetch comprehensive farm data
      const [batchesSnap, eggsSnap, financeSnap, dailyRecordsSnap, vaccinesSnap, vaccinationsSnap] = await Promise.all([
        getDocs(collection(db, 'farms', farmId, 'batches')),
        getDocs(collection(db, 'farms', farmId, 'eggProductions')),
        getDocs(collection(db, 'farms', farmId, 'transactions')),
        getDocs(collection(db, 'farms', farmId, 'dailyRecords')),
        getDocs(collection(db, 'farms', farmId, 'vaccines')),
        getDocs(collection(db, 'farms', farmId, 'vaccinations')),
      ]);

      const batches = batchesSnap.docs.map(d => d.data());
      
      // Filter records based on report type (e.g. last 30 days for monthly)
      const daysToLookBack = type === 'MONTHLY' ? 30 : type === 'BIWEEKLY' ? 14 : 7;
      const cutoffDate = subDays(new Date(), daysToLookBack).toISOString();

      const eggRecords = eggsSnap.docs
        .map(d => d.data())
        .filter(r => r.date >= cutoffDate);
        
      const transactions = financeSnap.docs
        .map(d => d.data())
        .filter(t => t.date >= cutoffDate);

      const dailyRecords = dailyRecordsSnap.docs
        .map(d => d.data())
        .filter(r => r.date >= cutoffDate);

      const now = new Date();
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
      const pendingVaccines = [...vaccinesSnap.docs, ...vaccinationsSnap.docs]
        .map(d => d.data())
        .filter(v => v.status === 'Pending' && (new Date(v.scheduledDate).getTime() - now.getTime()) <= fourteenDaysMs);

      // Calculate Metrics
      const totalBirds = batches.reduce((s, b) => s + (b.currentQuantity || 0), 0);
      const mortalityTotal = dailyRecords.reduce((s, r) => s + (r.mortality || 0), 0);
      const eggsTotal = eggRecords.reduce((s, r) => s + (r.totalEggs || 0), 0);
      const revenue = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
      const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

      // 2. Build the AI Prompt
      const context = `
You are PoultryPro AI, an expert farm management advisor.
Generate a ${type} intelligence report for a commercial poultry farm.
Use Markdown formatting. Use emojis sparingly but effectively.
Format your output with clear headers:
- 📊 Executive Summary
- 📈 Production & Forecasting
- 💉 Health & Vaccination Advisory
- 💰 Financial Insights (Values are in ₦)
- 💡 Recommendations

Farm Data (Last ${daysToLookBack} days):
- Total Birds: ${totalBirds}
- Eggs Collected: ${eggsTotal}
- Total Mortality: ${mortalityTotal}
- Revenue: ₦${revenue}
- Expenses: ₦${expenses}

Active Batches:
${batches.map(b => `- ${b.batchName}: ${b.currentQuantity} birds, ${b.currentAgeWeeks} weeks old, ${b.breedName}`).join('\n')}

Upcoming Vaccinations (Next 14 Days or Overdue):
${pendingVaccines.length > 0 ? pendingVaccines.map(v => `- ${v.vaccineName} for batch ${v.batchName} (Scheduled: ${v.scheduledDate.split('T')[0]}, Method: ${v.administrationMethod})`).join('\n') : 'None scheduled.'}

Instructions:
1. Analyze production efficiency based on the age of the active batches (e.g., 30-week birds should be at 90%+ production).
2. Forecast egg production for the next 2 weeks based on the current age curve of the flocks.
3. Analyze profitability (Revenue vs Expenses). Give advice on minimizing loss (e.g. feed management, culling unproductive birds).
4. Review the "Upcoming Vaccinations" list. Alert the farmer if they have vaccines due soon. Suggest the best vaccination practices and medications to use for these specific vaccines, explicitly mentioning common brands or medications used in Nigeria (e.g., Lasota, specific Gumboro strains).
5. Do not include raw JSON or code blocks. Speak directly to the farmer in a professional, encouraging tone.
`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(context);
      const reportContent = await result.response.text();

      // 3. Save to Firestore
      const report: AiReport = {
        farmId,
        type,
        generatedAt: new Date().toISOString(),
        content: reportContent,
        metrics: {
          totalBirds,
          eggsTotal,
          mortalityTotal,
          revenue,
          expenses,
        },
        isRead: false,
      };

      await addDoc(collection(db, 'farms', farmId, 'aiReports'), report);

    } catch (error) {
      console.error('Error generating AI report:', error);
    }
  }

  /**
   * Fetches the user's report history
   */
  static async getReports(farmId: string): Promise<AiReport[]> {
    const reportsRef = collection(db, 'farms', farmId, 'aiReports');
    const q = query(reportsRef, orderBy('generatedAt', 'desc'), limit(20));
    const snap = await getDocs(q);
    
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AiReport));
  }
}
