import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, CustomSelect } from '../components/ui';
import { Package, Search, Filter, Plus, ArrowDownToLine, ArrowUpFromLine, AlertCircle, Edit3, Trash2, X, Eye } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { MaterialInventory } from '../types';
import { MaterialDetail } from '../components/MaterialDetail';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

export function Materials() {
  const { materials, addMaterial, updateMaterial, deleteMaterial, addMaterialReceipt, addMaterialUsage, userRole, projects } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Selection state for Detail View
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialInventory | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialInventory | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<MaterialInventory | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');

  // Add / Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Panels',
    sku: '',
    unit: 'pcs',
    estimatedQuantity: 1000,
    receivedQuantity: 0,
    usedQuantity: 0,
    location: '',
    supplier: ''
  });

  // Action Handlers
  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Panels',
      sku: '',
      unit: 'pcs',
      estimatedQuantity: 1000,
      receivedQuantity: 0,
      usedQuantity: 0,
      location: '',
      supplier: ''
    });
  };

  const categories = ['All', 'Panels', 'Structural', 'Concrete', 'Steel', 'Cement', 'Aggregates', 'Piping', 'Electrical', 'General'];

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'All' || m.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [materials, searchQuery, filterCategory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Low Stock': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Out of Stock': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Over Estimate': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      category: 'Panels',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      unit: 'pcs',
      estimatedQuantity: 1000,
      receivedQuantity: 0,
      usedQuantity: 0,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (material: MaterialInventory) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      category: material.category,
      sku: material.sku || '',
      unit: material.unit,
      estimatedQuantity: material.estimatedQuantity,
      receivedQuantity: material.receivedQuantity,
      usedQuantity: material.usedQuantity,
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const balance = formData.receivedQuantity - formData.usedQuantity;
    let status: MaterialInventory['status'] = 'In Stock';
    if (balance <= 0) status = 'Out of Stock';
    else if (balance < formData.estimatedQuantity * 0.1) status = 'Low Stock';
    else if (formData.usedQuantity > formData.estimatedQuantity) status = 'Over Estimate';

    const newMat: MaterialInventory = {
      id: `MAT-${Math.floor(100 + Math.random() * 900)}`,
      projectId: projects[0]?.id || '',
      name: formData.name.trim(),
      category: formData.category,
      unit: formData.unit || 'pcs',
      estimatedQuantity: Number(formData.estimatedQuantity) || 0,
      receivedQuantity: Number(formData.receivedQuantity) || 0,
      usedQuantity: Number(formData.usedQuantity) || 0,
      status,
      sku: formData.sku.trim() || undefined,
    };

    addMaterial(newMat);
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial || !formData.name.trim()) return;

    const balance = formData.receivedQuantity - formData.usedQuantity;
    let status: MaterialInventory['status'] = 'In Stock';
    if (balance <= 0) status = 'Out of Stock';
    else if (balance < formData.estimatedQuantity * 0.1) status = 'Low Stock';
    else if (formData.usedQuantity > formData.estimatedQuantity) status = 'Over Estimate';

    const updatedMat: MaterialInventory = {
      ...editingMaterial,
      name: formData.name.trim(),
      category: formData.category,
      unit: formData.unit,
      estimatedQuantity: Number(formData.estimatedQuantity),
      receivedQuantity: Number(formData.receivedQuantity),
      usedQuantity: Number(formData.usedQuantity),
      status,
      sku: formData.sku.trim() || undefined,
    };

    updateMaterial(updatedMat);
    if (selectedMaterial?.id === updatedMat.id) {
      setSelectedMaterial(updatedMat);
    }
    setEditingMaterial(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingMaterial) {
      deleteMaterial(deletingMaterial.id);
      if (selectedMaterial?.id === deletingMaterial.id) {
        setSelectedMaterial(null);
      }
      setDeletingMaterial(null);
    }
  };

  const handleReceive = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const quantity = Number(form.get('quantity'));
    
    if (quantity > 0 && selectedMaterialId) {
      addMaterialReceipt({
        id: `REC-${Math.random().toString(36).substr(2, 9)}`,
        materialId: selectedMaterialId,
        date: new Date().toISOString(),
        quantity,
        receivedBy: userRole === 'Manager' ? 'Current User' : 'Current User',
        notes: form.get('notes') as string,
        supplier: form.get('supplier') as string,
        deliveryNoteNumber: form.get('deliveryNote') as string,
      });
      setIsReceiptModalOpen(false);
      setSelectedMaterialId('');
    }
  };

  const handleUse = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const quantity = Number(form.get('quantity'));
    
    if (quantity > 0 && selectedMaterialId) {
      addMaterialUsage({
        id: `USE-${Math.random().toString(36).substr(2, 9)}`,
        materialId: selectedMaterialId,
        date: new Date().toISOString(),
        quantity,
        recordedBy: userRole === 'Manager' ? 'Current User' : 'Current User',
        notes: form.get('notes') as string,
      });
      setIsUsageModalOpen(false);
      setSelectedMaterialId('');
    }
  };

  // If a material is selected, render MaterialDetail view
  if (selectedMaterial) {
    const liveMat = materials.find(m => m.id === selectedMaterial.id) || selectedMaterial;
    return (
      <MaterialDetail 
        material={liveMat}
        onClose={() => setSelectedMaterial(null)}
        onDelete={(id) => {
          deleteMaterial(id);
          setSelectedMaterial(null);
        }}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 w-full h-full space-y-6 pb-24 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-[#0B5FFF]" />
            Material Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track site supplies, usage, and project estimates.</p>
        </div>
        <Button 
          onClick={handleOpenAddModal} 
          className="bg-[#0B5FFF] hover:bg-blue-600 text-white gap-2 rounded-xl px-4 py-2 shadow-sm font-semibold self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Material</span>
        </Button>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full sm:w-auto h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase font-semibold text-xs">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">Material</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Estimate</th>
                <th className="px-6 py-4 text-right">Received</th>
                <th className="px-6 py-4 text-right">Used</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filteredMaterials.map((material) => {
                const balance = material.receivedQuantity - material.usedQuantity;
                const percentUsed = (material.usedQuantity / (material.estimatedQuantity || 1)) * 100;
                let status = material.status;
                if (balance <= 0) status = 'Out of Stock';
                else if (balance < material.estimatedQuantity * 0.1) status = 'Low Stock';
                else if (material.usedQuantity > material.estimatedQuantity) status = 'Over Estimate';
                else status = 'In Stock';

                return (
                  <tr key={material.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group" onClick={() => setSelectedMaterial(material)}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0B5FFF] group-hover:underline transition-colors flex items-center gap-1.5">
                        {material.name}
                      </div>
                      {material.sku && <div className="text-xs text-slate-500 mt-0.5">SKU: {material.sku}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{material.category}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      {material.estimatedQuantity.toLocaleString()} <span className="text-slate-500 text-xs ml-1">{material.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      {material.receivedQuantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      {material.usedQuantity.toLocaleString()}
                      {percentUsed > 90 && <AlertCircle className="inline ml-1 h-3 w-3 text-red-500" />}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                      {balance.toLocaleString()} <span className="text-slate-500 font-normal text-xs ml-1">{material.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-2.5 border-blue-200 hover:bg-blue-50 text-[#0B5FFF] dark:border-blue-900/50 dark:hover:bg-blue-950/30 font-medium"
                          onClick={() => setSelectedMaterial(material)}
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-2 border-green-200 hover:bg-green-50 text-green-700 dark:border-green-900/50 dark:hover:bg-green-900/20 dark:text-green-400"
                          onClick={() => { setSelectedMaterialId(material.id); setIsReceiptModalOpen(true); }}
                        >
                          <ArrowDownToLine className="h-3 w-3 mr-1" />
                          Receive
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2 border-amber-200 hover:bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:hover:bg-amber-900/20 dark:text-amber-400"
                          onClick={() => { setSelectedMaterialId(material.id); setIsUsageModalOpen(true); }}
                        >
                          <ArrowUpFromLine className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-600 hover:text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg"
                          onClick={() => handleOpenEditModal(material)}
                          title="Edit Material"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-slate-200 dark:border-slate-700 rounded-lg"
                          onClick={() => setDeletingMaterial(material)}
                          title="Delete Material"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No materials found matching your criteria. Click <strong>"Add Material"</strong> to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Floating Action Button for Add Material */}
      <button
        onClick={handleOpenAddModal}
        className="fixed bottom-6 right-6 z-40 bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-full p-4 shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        title="Add New Material"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add Material Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#0B5FFF]" /> Add New Material
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Register a new supply item into site inventory</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsAddModalOpen(false)} className="rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </CardHeader>
            <form onSubmit={handleAddSubmit}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Material Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ready-Mix Concrete Grade 30"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                    <CustomSelect
                      value={formData.category}
                      onChange={val => setFormData({ ...formData, category: val })}
                      options={['Panels', 'Structural', 'Concrete', 'Steel', 'Cement', 'Aggregates', 'Piping', 'Electrical', 'General']}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                      customPlaceholder="Enter custom material category..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">SKU / Material Code</label>
                    <input
                      type="text"
                      placeholder="e.g. MAT-101"
                      value={formData.sku}
                      onChange={e => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Estimated Requirement</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.estimatedQuantity}
                      onChange={e => setFormData({ ...formData, estimatedQuantity: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Unit of Measure</label>
                    <input
                      type="text"
                      placeholder="e.g. pcs, m³, m, tons"
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Initial Received Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.receivedQuantity}
                      onChange={e => setFormData({ ...formData, receivedQuantity: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Initial Used Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.usedQuantity}
                      onChange={e => setFormData({ ...formData, usedQuantity: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#0B5FFF] hover:bg-blue-600 text-white font-semibold">Save Material</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Material Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-[#0B5FFF]" /> Edit Material
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">{editingMaterial.id} - {editingMaterial.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingMaterial(null)} className="rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </CardHeader>
            <form onSubmit={handleEditSubmit}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Material Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                    <CustomSelect
                      value={formData.category}
                      onChange={val => setFormData({ ...formData, category: val })}
                      options={['Panels', 'Structural', 'Concrete', 'Steel', 'Cement', 'Aggregates', 'Piping', 'Electrical', 'General']}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                      customPlaceholder="Enter custom material category..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">SKU / Material Code</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={e => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Estimated Requirement</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.estimatedQuantity}
                      onChange={e => setFormData({ ...formData, estimatedQuantity: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Unit of Measure</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Received Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.receivedQuantity}
                      onChange={e => setFormData({ ...formData, receivedQuantity: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Used Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.usedQuantity}
                      onChange={e => setFormData({ ...formData, usedQuantity: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setEditingMaterial(null)}>Cancel</Button>
                <Button type="submit" className="bg-[#0B5FFF] hover:bg-blue-600 text-white font-semibold">Update Material</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingMaterial)}
        title="Delete Material"
        itemName={deletingMaterial?.name || ''}
        message="Are you sure you want to delete this material? This will remove the item and its tracked stock records from site inventory."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingMaterial(null)}
        confirmLabel="Delete Material"
      />

      {/* Receive Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg">Receive Material</CardTitle>
              <p className="text-sm text-slate-500">
                {materials.find(m => m.id === selectedMaterialId)?.name}
              </p>
            </CardHeader>
            <form onSubmit={handleReceive}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quantity Received</label>
                  <div className="relative">
                    <input name="quantity" type="number" min="0.01" step="0.01" required className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      {materials.find(m => m.id === selectedMaterialId)?.unit}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Supplier</label>
                  <input name="supplier" type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Delivery Note Number</label>
                  <input name="deliveryNote" type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Notes (Optional)</label>
                  <textarea name="notes" className="w-full h-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]" />
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => { setIsReceiptModalOpen(false); setSelectedMaterialId(''); }}>Cancel</Button>
                <Button type="submit" className="bg-[#0B5FFF] hover:bg-blue-600 text-white font-semibold">Record Receipt</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Usage Modal */}
      {isUsageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg">Record Material Usage</CardTitle>
              <p className="text-sm text-slate-500">
                {materials.find(m => m.id === selectedMaterialId)?.name}
              </p>
            </CardHeader>
            <form onSubmit={handleUse}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quantity Used</label>
                  <div className="relative">
                    <input name="quantity" type="number" min="0.01" step="0.01" required className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      {materials.find(m => m.id === selectedMaterialId)?.unit}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Notes (Optional)</label>
                  <textarea name="notes" className="w-full h-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]" />
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => { setIsUsageModalOpen(false); setSelectedMaterialId(''); }}>Cancel</Button>
                <Button type="submit" className="bg-[#0B5FFF] hover:bg-blue-600 text-white font-semibold">Record Usage</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
