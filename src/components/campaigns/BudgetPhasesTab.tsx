
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useCampaignBudget } from '@/hooks/useCampaignBudget';
import { toast } from 'sonner';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { CampaignPhase } from '@/types/data';
import { useIsMobile } from '@/hooks/use-mobile';

interface BudgetPhasesTabProps {
  campaignId: string;
}

export default function BudgetPhasesTab({ campaignId }: BudgetPhasesTabProps) {
  const {
    phases,
    loading,
    submitting,
    createPhase,
    updatePhase,
    deletePhase
  } = useCampaignBudget(campaignId);
  
  const [isNewPhaseDialogOpen, setIsNewPhaseDialogOpen] = useState(false);
  const [newPhaseData, setNewPhaseData] = useState({
    phaseNumber: 0,
    budgetAmount: 0,
    isActive: false
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [phaseToDelete, setPhaseToDelete] = useState<CampaignPhase | null>(null);
  const isMobile = useIsMobile();

  // Handle phase activation
  const handleActivationToggle = async (phase: CampaignPhase, newActiveState: boolean) => {
    try {
      await updatePhase(phase.id, { isActive: newActiveState });
    } catch (error) {
      console.error('Error updating phase activation:', error);
    }
  };

  // Handle new phase submission
  const handleNewPhaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPhaseData.budgetAmount <= 0) {
      return toast.error('Budget amount must be greater than zero');
    }
    
    try {
      await createPhase({
        campaignId,
        phaseNumber: newPhaseData.phaseNumber,
        budgetAmount: newPhaseData.budgetAmount,
        isActive: newPhaseData.isActive
      });
      
      // Reset form and close dialog
      setNewPhaseData({
        phaseNumber: 0,
        budgetAmount: 0,
        isActive: false
      });
      setIsNewPhaseDialogOpen(false);
    } catch (error) {
      console.error('Error creating phase:', error);
    }
  };

  // Handle delete confirmation
  const confirmDelete = async () => {
    if (!phaseToDelete) return;
    
    try {
      await deletePhase(phaseToDelete.id);
      setPhaseToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting phase:', error);
    }
  };

  // Calculate next phase number
  const getNextPhaseNumber = () => {
    if (phases.length === 0) return 1;
    return Math.max(...phases.map(p => p.phaseNumber)) + 1;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Loading budget phases...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Budget Phases</h3>
        <Button 
          onClick={() => {
            setNewPhaseData({
              ...newPhaseData,
              phaseNumber: getNextPhaseNumber()
            });
            setIsNewPhaseDialogOpen(true);
          }}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Phase
        </Button>
      </div>
      
      {phases.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center gap-2">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <h3 className="font-semibold text-lg">No Budget Phases</h3>
              <p className="text-muted-foreground">
                This campaign doesn't have any budget phases yet. Add a phase to define budget allocation.
              </p>
              <Button 
                onClick={() => {
                  setNewPhaseData({
                    ...newPhaseData,
                    phaseNumber: 1
                  });
                  setIsNewPhaseDialogOpen(true);
                }}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Phase
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phase</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {phases.map((phase) => (
                    <TableRow key={phase.id}>
                      <TableCell>Phase {phase.phaseNumber}</TableCell>
                      <TableCell>₹{phase.budgetAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Switch 
                          checked={phase.isActive}
                          onCheckedChange={(checked) => handleActivationToggle(phase, checked)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPhaseToDelete(phase);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Phase Dialog */}
      <Dialog open={isNewPhaseDialogOpen} onOpenChange={setIsNewPhaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Budget Phase</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNewPhaseSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phaseNumber" className="text-sm font-medium">
                Phase Number
              </label>
              <Input
                id="phaseNumber"
                type="number"
                value={newPhaseData.phaseNumber}
                onChange={(e) => setNewPhaseData({...newPhaseData, phaseNumber: parseInt(e.target.value)})}
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="budgetAmount" className="text-sm font-medium">
                Budget Amount (₹)
              </label>
              <Input
                id="budgetAmount"
                type="number"
                value={newPhaseData.budgetAmount}
                onChange={(e) => setNewPhaseData({...newPhaseData, budgetAmount: parseFloat(e.target.value)})}
                min="0"
                step="100"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={newPhaseData.isActive}
                onCheckedChange={(checked) => setNewPhaseData({...newPhaseData, isActive: checked})}
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active
              </label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewPhaseDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Phase'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Budget Phase</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete Phase {phaseToDelete?.phaseNumber}?
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete Phase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
