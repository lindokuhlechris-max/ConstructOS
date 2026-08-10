import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../ui';
import { Package, Plus, AlertTriangle, ArrowLeft, ArrowDownRight, ArrowUpRight, CheckCircle2, Upload, Edit3, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { RemindersWidget } from '../RemindersWidget';

interface MaterialItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  unitCost: number;
  location: string;
  status: 'In Stock' | 'Low Stock' | 'Critical Stock';
}

const initialMaterials: MaterialItem[] = [];

export function MaterialModule({ onBack }: { onBack: () => void }) {
  const { addMaterial, setMaterials, projects } = useAppContext();
  const [items, setItems] = useState<MaterialItem[]>(initialMaterials);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<string>('All');

  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Concrete');
  const [newStock, setNewStock] = useState<number>(100);
  const [newUnit, setNewUnit] = useState('tons');
  const [newCost, setNewCost] = useState<number>(50);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length <= 1) return;
      
      const newItems: MaterialItem[] = [];
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (columns.length >= 5) {
          const stock = parseFloat(columns[2]) || 0;
          const cost = parseFloat(columns[4]) || 0;
          const item: MaterialItem = {
            id: `MAT-${Math.floor(1000 + Math.random() * 9000)}-${i}`,
            name: columns[0],
            category: columns[1] || 'General',
            currentStock: stock,
            unit: columns[3] || 'units',
            reorderLevel: Math.floor(stock * 0.3),
            unitCost: cost,
            location: 'Imported',
            status: stock < 30 ? 'Low Stock' : 'In Stock',
          };
          newItems.push(item);
          addMaterial({
            id: item.id,
            projectId: projects[0]?.id || '',
            name: item.name,
            category: item.category,
            unit: item.unit,
            estimatedQuantity: stock * 2,
            receivedQuantity: stock,
            usedQuantity: 0,
            status: 'In Stock',
          });
        }
      }
      
      if (newItems.length > 0) {
        setItems(prev => [...newItems, ...prev]);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const matId = `MAT-${Math.floor(100 + Math.random() * 900)}`;
    const newItem: MaterialItem = {
      id: matId,
      name: newName,
      category: newCategory,
      currentStock: Number(newStock),
      unit: newUnit,
      reorderLevel: Math.floor(Number(newStock) * 0.3),
      unitCost: Number(newCost),
      location: 'Main Yard',
      status: Number(newStock) < 30 ? 'Low Stock' : 'In Stock',
    };

    setItems([newItem, ...items]);
    addMaterial({
      id: matId,
      projectId: projects[0]?.id || '',
      name: newName,
      category: newCategory,
      unit: newUnit,
      estimatedQuantity: Number(newStock) * 2,
      receivedQuantity: Number(newStock),
      usedQuantity: 0,
      status: 'In Stock',
    });

    setIsAdding(false);
    setNewName('');
  };

  const handleAdjustStock = (id: string, amount: number) => {
    setMaterials(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updatedStock = Math.max(0, item.currentStock + amount);
          let newStatus: MaterialItem['status'] = 'In Stock';
          if (updatedStock < item.reorderLevel * 0.5) newStatus = 'Critical Stock';
          else if (updatedStock < item.reorderLevel) newStatus = 'Low Stock';

          return { ...item, currentStock: updatedStock, status: newStatus };
        }
        return item;
      })
    );
  };

  const filtered = items.filter(m => {
    if (filter === 'All') return true;
    return m.status === filter;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Material Management</h1>
            <p className="text-slate-500 text-sm">Track raw items, stock levels, reorder thresholds, and site usage.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleBulkImport}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2 rounded-xl">
            <Upload className="h-4 w-4" /> Bulk Import
          </Button>
          <Button onClick={() => setIsAdding(!isAdding)} className="gap-2 bg-[#0B5FFF] rounded-xl">
            <Plus className="h-4 w-4" /> Add Material
          </Button>
        </div>
      </div>

      <RemindersWidget moduleName="Materials" />

      {isAdding && (
        <Card className="p-4 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
          <form onSubmit={handleAddMaterial} className="flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Add New Material Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Material Name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
              />
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
              >
                <option value="Concrete">Concrete</option>
                <option value="Steel">Steel</option>
                <option value="Cement">Cement</option>
                <option value="Aggregates">Aggregates</option>
                <option value="Piping">Piping</option>
                <option value="Masonry">Masonry</option>
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Initial Stock"
                  value={newStock}
                  onChange={e => setNewStock(Number(e.target.value))}
                  className="h-10 w-full px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
                <input
                  type="text"
                  placeholder="Unit (m³, tons, bags)"
                  value={newUnit}
                  onChange={e => setNewUnit(e.target.value)}
                  className="h-10 w-24 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0B5FFF] rounded-xl text-xs">
                Save Material
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{items.length}</div>
            <div className="text-xs text-slate-500">Tracked Materials</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{items.filter(m => m.status === 'In Stock').length}</div>
            <div className="text-xs text-slate-500">Optimal Stock Level</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{items.filter(m => m.status !== 'In Stock').length}</div>
            <div className="text-xs text-slate-500">Low / Critical Alerts</div>
          </div>
        </Card>
      </div>

      {/* Table / List */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-sm">Site Inventory Directory</h3>
          <div className="flex gap-1">
            {['All', 'In Stock', 'Low Stock', 'Critical Stock'].map(st => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  filter === st ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase text-slate-500 font-bold">
              <tr>
                <th className="px-4 py-3">ID & Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock Level</th>
                <th className="px-4 py-3">Reorder Point</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Stock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                    <div className="text-xs font-mono text-slate-400">{item.id} • {item.location}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                  </td>
                  <td className="px-4 py-3 font-bold text-base">
                    {item.currentStock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {item.reorderLevel} {item.unit}
                  </td>
                  <td className="px-4 py-3">
                    {item.status === 'In Stock' && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md">In Stock</span>
                    )}
                    {item.status === 'Low Stock' && (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md">Low Stock</span>
                    )}
                    {item.status === 'Critical Stock' && (
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-md">Critical</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdjustStock(item.id, -10)}
                        className="h-8 px-2 text-xs text-slate-600"
                        title="Deduct 10 units"
                      >
                        <ArrowDownRight className="h-3.5 w-3.5 text-rose-500 mr-1" /> Use 10
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdjustStock(item.id, 50)}
                        className="h-8 px-2 text-xs text-slate-600"
                        title="Add 50 units"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 mr-1" /> Receive 50
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
