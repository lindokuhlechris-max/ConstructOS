import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './ui';
import { ResourceAllocation } from '../types';
import { useAppContext } from '../context/AppContext';
import { Package, Truck, Plus, CheckCircle, Trash2 } from 'lucide-react';

interface ResourceAllocationViewProps {
  projectId: string;
}

export function ResourceAllocationView({ projectId }: ResourceAllocationViewProps) {
  const { allocations, addAllocation, updateAllocation, deleteAllocation, userRole } = useAppContext();
  
  const projectAllocations = useMemo(() => 
    allocations.filter(a => a.projectId === projectId),
  [allocations, projectId]);

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<ResourceAllocation>>({
    resourceType: 'Equipment',
    name: '',
    quantity: 1,
    unit: '',
    status: 'Allocated',
    assignedDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    assignedTo: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.quantity || !formData.status || !formData.assignedDate) return;

    addAllocation({
      id: `RES-${Date.now()}`,
      projectId,
      resourceType: formData.resourceType as 'Material' | 'Equipment',
      name: formData.name,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      status: formData.status as any,
      assignedDate: formData.assignedDate,
      expectedReturnDate: formData.expectedReturnDate,
      assignedTo: formData.assignedTo,
      notes: formData.notes
    });

    setIsAdding(false);
    setFormData({
      resourceType: 'Equipment',
      name: '',
      quantity: 1,
      unit: '',
      status: 'Allocated',
      assignedDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: '',
      assignedTo: '',
      notes: ''
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'In Use': return <Badge variant="success" className="text-[10px]">In Use</Badge>;
      case 'Allocated': return <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">Allocated</Badge>;
      case 'Depleted': return <Badge variant="danger" className="text-[10px]">Depleted</Badge>;
      case 'Returned': return <Badge variant="outline" className="text-[10px]">Returned</Badge>;
      default: return <Badge variant="default" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <Card className="flex flex-col h-full border border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-xl flex items-center gap-2">
          <Package className="h-5 w-5 text-[#0B5FFF]" />
          Resource Allocation
        </CardTitle>
        {userRole === 'Manager' && !isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm" className="h-8 text-xs gap-1.5 bg-[#0B5FFF]">
            <Plus className="h-3.5 w-3.5" /> Assign Resource
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[600px]">
        {isAdding && (
          <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 mb-2 flex flex-col gap-4">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">New Allocation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Type</label>
                <select
                  value={formData.resourceType}
                  onChange={(e) => setFormData({ ...formData, resourceType: e.target.value as any })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                >
                  <option value="Equipment">Equipment</option>
                  <option value="Material">Material</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Name / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Excavator, Cement"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                  />
                </div>
                {formData.resourceType === 'Material' && (
                  <div className="w-24">
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Unit</label>
                    <input
                      type="text"
                      placeholder="e.g. m³, bags"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Assigned To (Task/Team)</label>
                <input
                  type="text"
                  placeholder="e.g. Earthworks"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Date Assigned</label>
                <input
                  type="date"
                  required
                  value={formData.assignedDate}
                  onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                />
              </div>

              {formData.resourceType === 'Equipment' && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Expected Return</label>
                  <input
                    type="date"
                    value={formData.expectedReturnDate}
                    onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-[#0B5FFF]">Save Allocation</Button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-3">
          {projectAllocations.length === 0 && !isAdding && (
            <div className="text-center p-8 text-sm text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No resources allocated to this project yet.
            </div>
          )}
          
          {projectAllocations.map(allocation => (
            <div key={allocation.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-300 transition-colors gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${allocation.resourceType === 'Equipment' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40'}`}>
                  {allocation.resourceType === 'Equipment' ? <Truck className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{allocation.name}</span>
                    {getStatusBadge(allocation.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                    <span>
                      Qty: {allocation.quantity} {allocation.unit || ''}
                    </span>
                    {allocation.assignedTo && (
                      <span className="flex items-center gap-1">
                         To: {allocation.assignedTo}
                      </span>
                    )}
                    <span>
                      Since: {allocation.assignedDate}
                    </span>
                    {allocation.expectedReturnDate && allocation.status !== 'Returned' && (
                      <span className="text-orange-600 dark:text-orange-400">
                        Return: {allocation.expectedReturnDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {userRole === 'Manager' && (
                <div className="flex items-center gap-2 sm:self-center self-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-end">
                  {allocation.status !== 'Returned' && allocation.status !== 'Depleted' && (
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => updateAllocation({...allocation, status: allocation.resourceType === 'Equipment' ? 'Returned' : 'Depleted'})}
                       className="h-8 text-xs gap-1"
                       title={allocation.resourceType === 'Equipment' ? "Mark Returned" : "Mark Depleted"}
                     >
                       <CheckCircle className="h-3.5 w-3.5" />
                       {allocation.resourceType === 'Equipment' ? 'Return' : 'Deplete'}
                     </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteAllocation(allocation.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    title="Delete Allocation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
