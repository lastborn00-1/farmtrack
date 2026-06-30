import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import type { AiReport } from '../types';

export function useAiReports() {
  const { activeFarm } = useAuthStore();
  const [reports, setReports] = useState<AiReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeFarm?.farmId) {
      setReports([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'farms', activeFarm.farmId, 'aiReports'),
      orderBy('generatedAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as AiReport[];
      
      setReports(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching AI reports:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [activeFarm?.farmId]);

  const markAsRead = async (reportId: string) => {
    if (!activeFarm?.farmId) return;
    try {
      await updateDoc(doc(db, 'farms', activeFarm.farmId, 'aiReports', reportId), {
        isRead: true
      });
    } catch (error) {
      console.error('Failed to mark report as read:', error);
    }
  };

  const hasUnreadReport = reports.some(r => !r.isRead);

  return {
    reports,
    isLoading,
    hasUnreadReport,
    markAsRead
  };
}
