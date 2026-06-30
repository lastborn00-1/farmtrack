export type AiReportType = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface AiReport {
  id?: string;
  farmId: string;
  type: AiReportType;
  generatedAt: string; // ISO string
  content: string; // Markdown content
  metrics: {
    totalBirds: number;
    eggsTotal: number;
    mortalityTotal: number;
    revenue?: number;
    expenses?: number;
  };
  isRead: boolean;
}
