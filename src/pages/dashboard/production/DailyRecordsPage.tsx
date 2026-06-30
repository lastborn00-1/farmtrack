import { useState } from 'react';
import { useDailyRecords } from '@/features/production/hooks/useDailyRecords';
import { useBatches } from '@/features/farm/hooks/useBatches';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DailyRecordForm } from '@/features/production/components/DailyRecordForm';

export default function DailyRecordsPage() {
  const { records, isLoading, addRecord, updateRecord } = useDailyRecords();
  const { batches, isLoading: batchesLoading } = useBatches();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || batchesLoading) {
    return <div>Loading daily records...</div>;
  }

  const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

  const handleAddRecord = async (data: any) => {
    setIsSubmitting(true);
    try {
      await addRecord(data);
      setIsAddOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRecord = async (data: any) => {
    if (!editingRecord?.id) return;
    setIsSubmitting(true);
    try {
      await updateRecord({
        id: editingRecord.id,
        prevMortality: editingRecord.mortality || 0,
        prevCulling: editingRecord.culling || 0,
        ...data,
      });
      setEditingRecord(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Daily Farm Records</h2>
          <p className="text-muted-foreground">Log mortality, feed, and water consumption</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Log Daily Record
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Mortality</TableHead>
                <TableHead>Culls</TableHead>
                <TableHead>Feed Consumed (kg)</TableHead>
                <TableHead>Water (L)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {format(new Date(record.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{record.batchName}</TableCell>
                    <TableCell className={record.mortality > 0 ? "text-red-500 font-medium" : ""}>
                      {record.mortality}
                    </TableCell>
                    <TableCell>{record.culling}</TableCell>
                    <TableCell>{record.actualFeedConsumedKg}</TableCell>
                    <TableCell>{record.waterConsumptionLitres}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRecord(record)}
                      >
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Daily Record</DialogTitle>
          </DialogHeader>
          <DailyRecordForm batches={batches} onSubmit={handleAddRecord} isLoading={isSubmitting} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Daily Record</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <DailyRecordForm
              batches={batches}
              initialData={editingRecord}
              onSubmit={handleEditRecord}
              isLoading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
