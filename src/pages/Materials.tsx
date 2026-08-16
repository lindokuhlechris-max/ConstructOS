import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, CustomSelect } from '../components/ui';
import { Upload, UserCheck, Camera, Package, Search, Filter, Plus, ArrowLeft, ArrowDownToLine, ArrowUpFromLine, AlertCircle, Edit3, Trash2, X, Eye, ShoppingCart, AlertTriangle, Bell, Send, CheckCircle2, Zap, Printer, FileSpreadsheet, Download, Copy, PieChart as PieChartIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
const getCurrencySymbol = (code: string) => {
  const map: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    ZAR: 'R',
    AUD: 'A$',
    CAD: 'C$',
    INR: '₹'
  };
  return map[code] || code;
};

import { MaterialInventory, Reminder } from '../types';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { MaterialDetail } from '../components/MaterialDetail';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { triggerNotification } from '../lib/reminderNotificationService';
import { printMaterialsSummary } from '../lib/pdfPrint';
import { exportMaterialsToCSV, exportMaterialRequestsToCSV } from '../lib/csvExport';
import { generateRequestsPDF, generateCostsPDF } from '../lib/pdfMaterials';

export function Materials({ onBack }: { onBack?: () => void } = {}) {
  const { 
    materials, 
    addMaterial,
    addMaterials, 
    updateMaterial, 
    deleteMaterial, 
    addMaterialReceipt, 
    addMaterialUsage, 
    addReminder, 
    addAuditLog, 
    userRole, 
    projects, 
    currentUserProfile,
    currency,
    setCurrency,
    employees,
    activities
  } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [stockAlertFilter, setStockAlertFilter] = useState<'all' | 'alert_only' | 'normal'>('all');
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'stores' | 'requests' | 'costs' | 'suppliers'>('stores');
  
  // Suppliers State
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  const [supplierForm, setSupplierForm] = useState({ name: '', contactName: '', email: '', phone: '', categories: '', rating: 5, notes: '' });

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name) return;
    const newSup = {
      id: `SUP-${Math.floor(100 + Math.random() * 900)}`,
      name: supplierForm.name,
      contactName: supplierForm.contactName,
      email: supplierForm.email,
      phone: supplierForm.phone,
      categories: supplierForm.categories.split(',').map(s => s.trim()).filter(Boolean),
      rating: Number(supplierForm.rating),
      notes: supplierForm.notes
    };
    setSuppliers([newSup, ...suppliers]);
    setIsAddingSupplier(false);
    setSupplierForm({ name: '', contactName: '', email: '', phone: '', categories: '', rating: 5, notes: '' });
  };

  const handleEditSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? {
      ...editingSupplier,
      categories: typeof editingSupplier.categories === 'string' ? editingSupplier.categories.split(',').map(str => str.trim()).filter(Boolean) : editingSupplier.categories
    } : s));
    setEditingSupplier(null);
  };

  const handleDeleteSupplier = (id: string) => {
    setSupplierToDelete(id);
  };
  
  const confirmDeleteSupplier = () => {
    if (supplierToDelete) {
      setSuppliers(suppliers.filter(s => s.id !== supplierToDelete));
      setEditingSupplier(null);
      setSupplierToDelete(null);
    }
  };

  
  // Material Requests State
  const [isAddingReq, setIsAddingReq] = useState(false);
  const [reqMaterial, setReqMaterial] = useState('');
  const [reqQuantity, setReqQuantity] = useState<number>(10);
  const [reqUnit, setReqUnit] = useState('units');
  const [reqBaseAmount, setReqBaseAmount] = useState<number | ''>('');
  const [reqBaseUnit, setReqBaseUnit] = useState('');
  const [reqType, setReqType] = useState<'Consumable' | 'Non-Consumable'>('Consumable');

  const [reqCost, setReqCost] = useState('');
  const [reqRequestor, setReqRequestor] = useState('');
  const [isCustomBaseUnit, setIsCustomBaseUnit] = useState(false);
  const [isAddCustomBaseUnit, setIsAddCustomBaseUnit] = useState(false);
  const [isEditCustomBaseUnit, setIsEditCustomBaseUnit] = useState(false);
  const [isCustomRequestor, setIsCustomRequestor] = useState(false);

  const [reqDateRequired, setReqDateRequired] = useState('');
  const [reqSupplier, setReqSupplier] = useState('');

  const [reqFilter, setReqFilter] = useState<string>('All');
  const [activityFilter, setActivityFilter] = useState<string>('All');
  const [reqActivityId, setReqActivityId] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  const handleBulkRequestAction = (action: string) => {
    if (selectedRequests.length === 0) return;
    if (action === 'Delete') {
      setRequests(prev => prev.filter(r => !selectedRequests.includes(r.id)));
    } else {
      setRequests(prev => prev.map(r => selectedRequests.includes(r.id) ? { ...r, status: action } : r));
    }
    setSelectedRequests([]);
  };

  const fileInputRefReq = React.useRef<HTMLInputElement>(null);
  const fileInputRefImport = React.useRef<HTMLInputElement>(null);
  
  const handleDownloadTemplate = () => {
    const csvContent = "Name,Category,SKU,Unit,EstimatedQuantity,ReceivedQuantity,UsedQuantity,ReorderLevel,CostPerUnit,Location,Supplier,Type\n" +
                       "Cement,Raw Materials,CEM-01,Bags,100,50,10,20,5.50,Warehouse A,BuildIt,Consumable\n" +
                       "Drill,Tools,DR-01,Item,5,5,0,1,120.00,Tool Crib,ToolCorp,Non-Consumable\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Material_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const importedMaterials = results.data.map((row: any) => ({
          id: crypto.randomUUID(),
          projectId: projects[0]?.id || 'proj-1',
          name: row.Name || 'Unnamed Material',
          category: row.Category || 'Uncategorized',
          sku: row.SKU || '',
          unit: row.Unit || 'Units',
          estimatedQuantity: parseFloat(row.EstimatedQuantity) || 0,
          receivedQuantity: parseFloat(row.ReceivedQuantity) || 0,
          usedQuantity: parseFloat(row.UsedQuantity) || 0,
          reorderLevel: parseFloat(row.ReorderLevel) || 0,
          costPerUnit: parseFloat(row.CostPerUnit) || 0,
          location: row.Location || '',
          supplier: row.Supplier || '',
          type: (row.Type === 'Non-Consumable' ? 'Non-Consumable' : 'Consumable'),
          status: 'In Stock'
        }));
        
        addMaterials(importedMaterials as MaterialInventory[]);
        
        if (fileInputRefImport.current) {
          fileInputRefImport.current.value = '';
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        alert("Failed to parse CSV file. Please make sure it follows the template format.");
      }
    });
  };

  
  const fileInputRefMat = React.useRef<HTMLInputElement>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photos: [...(prev.photos || []), reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };
  
  const handleSaveRequestEdit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Number(editingRequest.quantity) <= 0) {
      alert('Order Quantity must be a positive number.');
      return;
    }
    if (Number(editingRequest.baseAmount) <= 0) {
      alert('Unit Amount must be a positive number.');
      return;
    }
    if (!editingRequest.baseUnit || !editingRequest.baseUnit.trim()) {
      alert('Please specify the Unit.');
      return;
    }
    if (!editingRequest.requestedBy || !editingRequest.requestedBy.trim()) {
      alert('Please specify the Requested By name.');
      return;
    }
    if (!editingRequest.unit || !editingRequest.unit.trim()) {
      alert('Please specify the custom Quantity Unit.');
      return;
    }
    setRequests(requests.map(r => r.id === editingRequest.id ? editingRequest : r));
    setEditingRequest(null);
  };


  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Number(reqQuantity) <= 0) {
      alert('Order Quantity must be a positive number.');
      return;
    }
    if (Number(reqBaseAmount) <= 0) {
      alert('Unit Amount must be a positive number.');
      return;
    }
    if (isCustomBaseUnit && !reqBaseUnit.trim()) {
      alert('Please specify the custom Unit.');
      return;
    }
    if (isCustomRequestor && !reqRequestor.trim()) {
      alert('Please specify the Requested By name.');
      return;
    }
    if (!reqUnit.trim()) {
      alert('Please specify the custom Quantity Unit.');
      return;
    }
    if (!reqMaterial || !reqRequestor) return;
    const newReq = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      material: reqMaterial,
      type: reqType,
      baseAmount: reqBaseAmount ? Number(reqBaseAmount) : '',
      baseUnit: reqBaseUnit,
      quantity: Number(reqQuantity),
      unit: reqUnit,
      status: 'Pending',
      activityId: reqActivityId,
      date: reqDateRequired || new Date().toISOString().split('T')[0],
      requestedBy: reqRequestor,
      price: reqCost,
      supplier: reqSupplier,
      notes: '',
      image: null
    };
    setRequests([newReq, ...requests]);
    setIsAddingReq(false);
    setReqMaterial('');
    setReqQuantity(10);
    setReqUnit('units');
    setReqBaseAmount('');
    setReqBaseUnit('');
    setReqCost('');
    setReqRequestor('');
    setReqType('Consumable');
    setReqDateRequired('');
    setIsCustomBaseUnit(false);
    setIsCustomRequestor(false);
    setReqSupplier('');
  };
  
  // Selection state for Detail View
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialInventory | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDuplicateMaterial, setIsDuplicateMaterial] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialInventory | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<MaterialInventory | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');

  // Quick Threshold Setting State
  const [quickThresholdMat, setQuickThresholdMat] = useState<MaterialInventory | null>(null);
  const [quickThresholdValue, setQuickThresholdValue] = useState<number>(100);

  // Purchase Requisition Modal State
  const [reorderMaterial, setReorderMaterial] = useState<MaterialInventory | null>(null);
  const [reorderForm, setReorderForm] = useState({
    quantity: 100,
    targetDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    supplier: '',
    urgency: 'High' as 'Critical' | 'High' | 'Medium' | 'Low',
    notes: ''
  });
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState('');

  // Add / Edit Form State
  const [formData, setFormData] = useState<Partial<MaterialInventory> & { supplier?: string }>({
    type: 'Consumable' as 'Consumable' | 'Non-Consumable',
    name: '',
    category: 'Panels',
    sku: '',
    unit: 'pcs',
    estimatedQuantity: 1000,
    receivedQuantity: 0,
    usedQuantity: 0,
    reorderLevel: 100,
    location: '',
    supplier: '',
    photos: [] as string[]
  });

  // Calculate Request Stats
  const requestStats = useMemo(() => {
    const consumableCount = requests.filter(r => r.type === 'Consumable').length;
    const nonConsumableCount = requests.filter(r => r.type === 'Non-Consumable').length;
    return [
      { name: 'Consumable', value: consumableCount, color: '#d97706' }, // amber-600
      { name: 'Non-Consumable', value: nonConsumableCount, color: '#2563eb' } // blue-600
    ];
  }, [requests]);

  // Calculate Low Stock / Depleted Materials
  const lowStockMaterials = useMemo(() => {
    return materials.filter(m => {
      const balance = m.receivedQuantity - m.usedQuantity;
      const threshold = m.reorderLevel !== undefined && m.reorderLevel >= 0 
        ? m.reorderLevel 
        : Math.round((m.estimatedQuantity || 100) * 0.1);
      return balance <= threshold;
    });
  }, [materials]);

  // Action Handlers
  const resetForm = () => {
    setFormData({
      type: 'Consumable',
      name: '',
      category: 'Panels',
      photos: [],
      sku: '',
      unit: 'pcs',
      estimatedQuantity: 1000,
      receivedQuantity: 0,
      usedQuantity: 0,
      reorderLevel: 100,
      costPerUnit: undefined,
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
      
      const balance = m.receivedQuantity - m.usedQuantity;
      const threshold = m.reorderLevel !== undefined && m.reorderLevel >= 0 
        ? m.reorderLevel 
        : Math.round((m.estimatedQuantity || 100) * 0.1);
      const isLow = balance <= threshold;

      if (stockAlertFilter === 'alert_only' && !isLow) return false;
      if (stockAlertFilter === 'normal' && isLow) return false;

      return matchesSearch && matchesCategory;
    });
  }, [materials, searchQuery, filterCategory, stockAlertFilter]);

  const handlePrint = () => {
    const activeProject = projects[0];
    const categoryLabel = filterCategory !== 'All' ? `Category: ${filterCategory}` : 'All Categories';
    const alertLabel = stockAlertFilter === 'alert_only' ? 'Below Threshold Alerts' : stockAlertFilter === 'normal' ? 'Normal Stock' : 'All Stock';
    const filterLabel = `${categoryLabel} • ${alertLabel}${searchQuery ? ` • Matching "${searchQuery}"` : ''}`;

    printMaterialsSummary({
      project: activeProject,
      materials: filteredMaterials,
      filterLabel,
      totalMaterialsCount: materials.length
    });
  };

  const handleExportExcel = () => {
    const activeProject = projects[0];
    const suffix = `${filterCategory !== 'All' ? filterCategory.toLowerCase() : 'all'}${stockAlertFilter !== 'all' ? '_' + stockAlertFilter : ''}`;
    exportMaterialsToCSV(filteredMaterials, projects, suffix);
  };

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
    setIsDuplicateMaterial(false);
    setFormData({
      name: '',
      category: 'Panels',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      unit: 'pcs',
      estimatedQuantity: 1000,
      receivedQuantity: 0,
      usedQuantity: 0,
      reorderLevel: 100,
      location: '',
      supplier: ''
    });
    setIsAddModalOpen(true);
  };

  const handleCopyMaterial = (source: MaterialInventory) => {
    setFormData({
      name: `${source.name} (Copy)`,
      category: source.category,
      sku: source.sku ? `${source.sku}-COPY` : `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      unit: source.unit || 'pcs',
      estimatedQuantity: source.estimatedQuantity || 100,
      receivedQuantity: 0,
      usedQuantity: 0,
      reorderLevel: source.reorderLevel !== undefined ? source.reorderLevel : Math.round((source.estimatedQuantity || 100) * 0.1),
      costPerUnit: source.costPerUnit,
      location: source.location || '',
      supplier: ''
    });
    setIsDuplicateMaterial(true);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (material: MaterialInventory) => {
    setEditingMaterial(material);
    if (material.baseUnit && !['Kg', 'm', 'mm', 'liters'].includes(material.baseUnit)) {
      setIsEditCustomBaseUnit(true);
    } else {
      setIsEditCustomBaseUnit(false);
    }
    setFormData({
      name: material.name,
      type: material.type || 'Consumable',
      photos: material.photos || [],
      category: material.category,
      sku: material.sku || '',
      unit: material.unit,
      estimatedQuantity: material.estimatedQuantity,
      receivedQuantity: material.receivedQuantity,
      usedQuantity: material.usedQuantity,
      reorderLevel: material.reorderLevel !== undefined ? material.reorderLevel : Math.round(material.estimatedQuantity * 0.1),
      costPerUnit: material.costPerUnit,
      location: material.location || '',
      supplier: ''
    });
  };

  const handleOpenReorderModal = (material: MaterialInventory) => {
    const balance = material.receivedQuantity - material.usedQuantity;
    const needed = Math.max(1, material.estimatedQuantity - balance);
    
    // Auto-populate the Material Request form
    setReqMaterial(material.name);
    setReqType(material.type);
    setReqQuantity(needed);
    setReqUnit(material.unit);
    setReqBaseAmount(material.baseAmount || '');
    
    // Check if base unit is standard or custom
    const standardUnits = ['Kg', 'm', 'mm', 'liters'];
    if (material.baseUnit && !standardUnits.includes(material.baseUnit)) {
      setIsCustomBaseUnit(true);
      setReqBaseUnit(material.baseUnit);
    } else {
      setIsCustomBaseUnit(false);
      setReqBaseUnit(material.baseUnit || '');
    }

    setReqCost(material.unitCost || material.costPerUnit ? String(material.unitCost || material.costPerUnit) : '');
    setReqSupplier(material.location || '');
    setReqDateRequired(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
    
    // Pre-fill requestor as current user
    setReqRequestor(currentUserProfile?.name || 'Current User');

    // Switch to requests tab and open form
    setActiveTab('requests');
    setIsAddingReq(true);
  };

  const handleBatchGenerateReorders = () => {
    if (lowStockMaterials.length === 0) return;

    let count = 0;
    lowStockMaterials.forEach(m => {
      const balance = m.receivedQuantity - m.usedQuantity;
      const threshold = m.reorderLevel !== undefined && m.reorderLevel > 0 ? m.reorderLevel : Math.round(m.estimatedQuantity * 0.1);
      const needed = Math.max(1, m.estimatedQuantity - balance);

      const reminder: Reminder = {
        id: `REM-MAT-${Math.random().toString(36).substring(2, 9)}`,
        title: `PURCHASE REQUISITION: ${m.name} (${needed} ${m.unit})`,
        description: `Automated Reorder Requisition. Current balance: ${balance} ${m.unit} (Min Threshold: ${threshold} ${m.unit}). Preferred Supplier: ${m.location || 'Standard Vendor'}.`,
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        dueTime: '09:00',
        status: 'Pending',
        priority: balance <= 0 ? 'Critical' : 'High',
        linkedModules: ['Materials', 'Procurement'],
        createdBy: currentUserProfile?.name || 'Site System',
        createdAt: new Date().toISOString()
      };

      addReminder(reminder);
      count++;
    });

    triggerNotification({
      title: `Batch Purchase Requisitions Created (${count})`,
      description: `Generated ${count} high-priority material reorder task reminders for site procurement.`,
      priority: 'Critical',
      reminderId: `batch-reorder-${Date.now()}`,
      link: '/reminders'
    });

    setReorderSuccessMsg(`Successfully dispatched ${count} purchase requisitions to procurement task stream!`);
    setTimeout(() => setReorderSuccessMsg(''), 4500);
  };

  const handleSingleReorderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reorderMaterial) return;

    const balance = reorderMaterial.receivedQuantity - reorderMaterial.usedQuantity;
    const threshold = reorderMaterial.reorderLevel !== undefined && reorderMaterial.reorderLevel > 0 
      ? reorderMaterial.reorderLevel 
      : Math.round(reorderMaterial.estimatedQuantity * 0.1);

    const reminder: Reminder = {
      id: `REM-MAT-${Math.random().toString(36).substring(2, 9)}`,
      title: `REORDER REQUISITION: ${reorderMaterial.name} (${reorderForm.quantity} ${reorderMaterial.unit})`,
      description: `Manual Reorder Requisition. Urgency: ${reorderForm.urgency}. Target Date: ${reorderForm.targetDate}. Balance: ${balance} ${reorderMaterial.unit} (Threshold: ${threshold} ${reorderMaterial.unit}). Notes: ${reorderForm.notes || 'N/A'}. Supplier: ${reorderForm.supplier || 'Standard Vendor'}.`,
      dueDate: reorderForm.targetDate,
      dueTime: '09:00',
      status: 'Pending',
      priority: reorderForm.urgency === 'Critical' ? 'Critical' : reorderForm.urgency === 'High' ? 'High' : 'Medium',
      linkedModules: ['Materials', 'Procurement'],
      createdBy: currentUserProfile?.name || 'Site Supervisor',
      createdAt: new Date().toISOString()
    };

    addReminder(reminder);

    triggerNotification({
      title: `Reorder Requisition: ${reorderMaterial.name}`,
      description: `Ordered ${reorderForm.quantity} ${reorderMaterial.unit} by ${reorderForm.targetDate}. Urgency: ${reorderForm.urgency}.`,
      priority: reorderForm.urgency === 'Critical' ? 'Critical' : 'High',
      reminderId: reminder.id,
      link: '/reminders'
    });

    setReorderMaterial(null);
    setReorderSuccessMsg(`Purchase Requisition for ${reorderForm.quantity} ${reorderMaterial.unit} of ${reorderMaterial.name} sent to task stream!`);
    setTimeout(() => setReorderSuccessMsg(''), 4500);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const balance = formData.receivedQuantity - formData.usedQuantity;
    const thresh = formData.reorderLevel > 0 ? formData.reorderLevel : (formData.estimatedQuantity * 0.1);
    let status: MaterialInventory['status'] = 'In Stock';
    if (balance <= 0) status = 'Out of Stock';
    else if (balance <= thresh) status = 'Low Stock';
    else if (formData.usedQuantity > formData.estimatedQuantity) status = 'Over Estimate';

    const newMat: MaterialInventory = {
      id: `MAT-${Math.floor(100 + Math.random() * 900)}`,
      projectId: projects[0]?.id || '',
      name: formData.name.trim(),
      category: formData.category,
      type: formData.type,
      unit: formData.unit || 'pcs',
      estimatedQuantity: Number(formData.estimatedQuantity) || 0,
      receivedQuantity: Number(formData.receivedQuantity) || 0,
      usedQuantity: Number(formData.usedQuantity) || 0,
      reorderLevel: Number(formData.reorderLevel) || 0,
      status,
      sku: formData.sku.trim() || undefined,
      costPerUnit: formData.costPerUnit,
      photos: formData.photos,
    };

    addMaterial(newMat);
    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: newMat.projectId,
      userId: userRole === 'Manager' ? 'Current User' : 'Current User',
      action: isDuplicateMaterial ? 'Material Duplicated' : 'Material Created',
      details: isDuplicateMaterial 
        ? `Created duplicate material item "${newMat.name}" (${newMat.id})`
        : `Created material item "${newMat.name}" (${newMat.id})`,
      timestamp: new Date().toISOString()
    });

    setIsAddModalOpen(false);
    setIsDuplicateMaterial(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial || !formData.name.trim()) return;

    const balance = formData.receivedQuantity - formData.usedQuantity;
    const thresh = formData.reorderLevel > 0 ? formData.reorderLevel : (formData.estimatedQuantity * 0.1);
    let status: MaterialInventory['status'] = 'In Stock';
    if (balance <= 0) status = 'Out of Stock';
    else if (balance <= thresh) status = 'Low Stock';
    else if (formData.usedQuantity > formData.estimatedQuantity) status = 'Over Estimate';

    const updatedMat: MaterialInventory = {
      ...editingMaterial,
      name: formData.name.trim(),
      category: formData.category,
      type: formData.type,
      unit: formData.unit,
      estimatedQuantity: Number(formData.estimatedQuantity),
      receivedQuantity: Number(formData.receivedQuantity),
      usedQuantity: Number(formData.usedQuantity),
      reorderLevel: Number(formData.reorderLevel),
      status,
      sku: formData.sku.trim() || undefined,
      costPerUnit: formData.costPerUnit,
      photos: formData.photos,
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

  const formatCurrency = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(amount);
  };

  const totalAllocatedBudget = materials.reduce((acc, mat) => acc + (mat.estimatedQuantity * (mat.costPerUnit || 0)), 0);
  const totalConsumedBudget = materials.reduce((acc, mat) => acc + (mat.usedQuantity * (mat.costPerUnit || 0)), 0);
  const totalInventoryValue = materials.reduce((acc, mat) => acc + (Math.max(0, mat.receivedQuantity - mat.usedQuantity) * (mat.costPerUnit || 0)), 0);


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
        onDuplicate={(mat) => {
          handleCopyMaterial(mat);
        }}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 w-full h-full space-y-6 pb-24 relative">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Modules
        </button>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-[#0B5FFF]" />
            Material Inventory & Reorder System
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track site supplies, usage, reorder thresholds, and automated purchase requisitions.</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Print / PDF Export */}
          <Button
            onClick={handlePrint}
            variant="outline"
            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 gap-1.5 rounded-xl px-3.5 py-2 shadow-2xs font-semibold text-xs sm:text-sm"
            title="Print or export clean materials inventory summary as PDF"
          >
            <Printer className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <span>Print</span>
          </Button>

          {/* Export to Excel / CSV */}
          <Button
            onClick={handleDownloadTemplate}
            variant="outline"
            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 gap-1.5 rounded-xl px-3.5 py-2 shadow-2xs font-semibold text-xs sm:text-sm"
            title="Download CSV Template for Importing Materials"
          >
            <Download className="h-4 w-4 text-[#0B5FFF]" />
            <span className="hidden sm:inline">Template</span>
          </Button>
          
          <Button
            onClick={() => fileInputRefImport.current?.click()}
            variant="outline"
            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 gap-1.5 rounded-xl px-3.5 py-2 shadow-2xs font-semibold text-xs sm:text-sm"
            title="Import materials from CSV"
          >
            <Upload className="h-4 w-4 text-[#0B5FFF]" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <input 
            type="file" 
            ref={fileInputRefImport} 
            onChange={handleImportCSV} 
            accept=".csv, .xlsx" 
            className="hidden" 
          />
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 gap-1.5 rounded-xl px-3.5 py-2 shadow-2xs font-semibold text-xs sm:text-sm"
            title="Export clean and formatted Excel list of materials"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export</span>
          </Button>

          <Button 
            onClick={handleOpenAddModal} 
            className="bg-[#0B5FFF] hover:bg-blue-600 text-white gap-1.5 rounded-xl px-4 py-2 shadow-sm font-semibold text-xs sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Material</span>
          </Button>
        </div>
      </div>




      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-px mb-4">
        <button
          onClick={() => setActiveTab('stores')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'stores' 
              ? 'border-[#0B5FFF] text-[#0B5FFF]' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Company Stores
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'requests' 
              ? 'border-[#0B5FFF] text-[#0B5FFF]' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Material Requests
        </button>
        <button
          onClick={() => setActiveTab('costs')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'costs' 
              ? 'border-[#0B5FFF] text-[#0B5FFF]' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Costs
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'suppliers' 
              ? 'border-[#0B5FFF] text-[#0B5FFF]' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Supplier Directory
        </button>
      </div>

      {activeTab === 'stores' ? (
        <>
      
      {/* Success Reorder Toast Message */}
      {reorderSuccessMsg && (
        <div className="p-4 bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg flex items-center justify-between animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{reorderSuccessMsg}</span>
          </div>
          <button onClick={() => setReorderSuccessMsg('')} className="text-white hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Low Stock & Reorder Warning Banner */}
      {lowStockMaterials.length > 0 && (
        <Card className="border-2 border-amber-500/80 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 dark:from-amber-950/40 dark:to-slate-900 shadow-md">
          <CardContent className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-sm">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300">
                    Reorder Threshold Warning
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {lowStockMaterials.length} {lowStockMaterials.length === 1 ? 'item' : 'items'} requiring reorder
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">
                  Site Materials Reached Minimum Stock Thresholds
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {lowStockMaterials.map(mat => {
                    const bal = mat.receivedQuantity - mat.usedQuantity;
                    const thresh = mat.reorderLevel !== undefined && mat.reorderLevel > 0 ? mat.reorderLevel : Math.round(mat.estimatedQuantity * 0.1);
                    return (
                      <span 
                        key={mat.id}
                        onClick={() => handleOpenReorderModal(mat)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer hover:border-amber-500 transition-colors shadow-2xs"
                      >
                        <ShoppingCart className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        {mat.name}: <strong className="text-red-600 dark:text-red-400">{bal} {mat.unit}</strong> (Min: {thresh})
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <Button
                onClick={handleBatchGenerateReorders}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5"
              >
                <Zap className="h-4 w-4" />
                Auto-Generate All Reorders ({lowStockMaterials.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search materials by name, SKU or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full sm:w-auto h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Quick Print & Export action buttons in filter bar */}
              <button
                onClick={handlePrint}
                className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs shrink-0"
                title="Print filtered materials as PDF"
              >
                <Printer className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                <span className="hidden md:inline">Print</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs shrink-0"
                title="Export filtered list to Excel spreadsheet"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden md:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Quick Alert Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Threshold View:</span>
            <button
              onClick={() => setStockAlertFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                stockAlertFilter === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Items ({materials.length})
            </button>
            <button
              onClick={() => setStockAlertFilter('alert_only')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                stockAlertFilter === 'alert_only'
                  ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900 hover:bg-red-100'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 animate-pulse" />
              <span>🚨 Below Threshold Alerts ({lowStockMaterials.length})</span>
            </button>
            <button
              onClick={() => setStockAlertFilter('normal')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                stockAlertFilter === 'normal'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Normal Stock ({materials.length - lowStockMaterials.length})
            </button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase font-semibold text-xs">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">Material</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Estimate</th>
                <th className="px-6 py-4 text-right">User Alert Threshold</th>
                <th className="px-6 py-4 text-right">Received</th>
                <th className="px-6 py-4 text-right">Used</th>
                <th className="px-6 py-4 text-right">Available Balance</th>
                <th className="px-6 py-4 text-right">Est. Cost</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filteredMaterials.map((material) => {
                const balance = material.receivedQuantity - material.usedQuantity;
                const percentUsed = (material.usedQuantity / (material.estimatedQuantity || 1)) * 100;
                const threshold = material.reorderLevel !== undefined && material.reorderLevel >= 0 ? material.reorderLevel : Math.round(material.estimatedQuantity * 0.1);
                
                const isLow = balance <= threshold;

                let status = material.status;
                if (balance <= 0) status = 'Out of Stock';
                else if (isLow) status = 'Low Stock';
                else if (material.usedQuantity > material.estimatedQuantity) status = 'Over Estimate';
                else status = 'In Stock';

                return (
                  <tr 
                    key={material.id} 
                    className={`transition-colors cursor-pointer group ${
                      isLow 
                        ? 'bg-red-50/80 dark:bg-red-950/40 hover:bg-red-100/90 dark:hover:bg-red-900/60 border-l-4 border-l-red-600' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`} 
                    onClick={() => setSelectedMaterial(material)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0B5FFF] group-hover:underline transition-colors flex items-center gap-1.5 flex-wrap">
                        <span>{material.name}</span>
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold py-0 h-4 ${material.type === 'Non-Consumable' ? 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/30' : 'text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30'}`}>
                          {material.type || 'Consumable'}
                        </Badge>
                        {isLow && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-red-600 text-white shadow-2xs animate-pulse">
                            <AlertTriangle className="h-3 w-3" /> LOW STOCK ALERT
                          </span>
                        )}
                      </div>
                      {material.sku && <div className="text-xs text-slate-500 mt-0.5">SKU: {material.sku}</div>}
                      {material.type === 'Non-Consumable' && (material as any).assignments && (material as any).assignments.length > 0 && (() => {
                        const latestAssignment = [...(material as any).assignments].sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime())[0];
                        if (!latestAssignment.returnedDate) {
                          const emp = employees.find(e => e.id === latestAssignment.employeeId);
                          return (
                            <div className="text-[11px] text-[#0B5FFF] mt-1 flex items-center gap-1 font-semibold bg-blue-50 dark:bg-blue-900/20 w-fit px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                              <UserCheck className="h-3 w-3" /> Assigned: {emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown'}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{material.category}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      {material.estimatedQuantity.toLocaleString()} <span className="text-slate-500 text-xs ml-1">{material.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setQuickThresholdMat(material);
                          setQuickThresholdValue(threshold);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800/60 hover:border-amber-500 hover:scale-105 transition-all"
                        title="Click to change user-defined alert threshold"
                      >
                        <span>{threshold.toLocaleString()} {material.unit}</span>
                        <Edit3 className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      {material.receivedQuantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      {material.usedQuantity.toLocaleString()}
                      {percentUsed > 90 && <AlertCircle className="inline ml-1 h-3 w-3 text-red-500" />}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 font-extrabold text-sm shadow-2xs">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0 animate-bounce" />
                          {balance.toLocaleString()} {material.unit}
                        </span>
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {balance.toLocaleString()} <span className="text-slate-500 font-normal text-xs ml-1">{material.unit}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-slate-500 font-medium">
                      {material.unitCost || material.costPerUnit ? `${getCurrencySymbol(currency)} ${(material.unitCost || material.costPerUnit).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-600 text-white shadow-xs">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {balance <= 0 ? 'Out of Stock' : 'Below Threshold'}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`h-8 px-2.5 font-extrabold text-xs shadow-xs gap-1 ${isLow ? 'bg-red-600 hover:bg-red-700 text-white border-red-700 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/50'}`}
                          onClick={() => handleOpenReorderModal(material)}
                          title="Generate Material Request"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Reorder
                        </Button>
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
                          className="h-8 w-8 p-0 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg"
                          onClick={() => handleCopyMaterial(material)}
                          title="Copy / Duplicate Material"
                        >
                          <Copy className="h-3.5 w-3.5" />
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
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    No materials found matching your criteria. Click <strong>"Add Material"</strong> to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

        </>
      ) : activeTab === 'requests' ? (
        <div className="flex flex-col gap-6">
          {/* Requests Summary Dashboard */}
          <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/80 dark:to-slate-900 mb-2 shadow-sm overflow-hidden">
            <CardContent className="p-5 flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="flex flex-col gap-1 w-full md:w-1/3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                    <ShoppingCart className="h-4 w-4" />
                  </span>
                  Requests Summary
                </h2>
                <p className="text-sm text-slate-500">Breakdown of active material requests by type.</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 p-3 rounded-xl flex flex-col">
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Consumables</span>
                    <span className="text-2xl font-black text-amber-700 dark:text-amber-500">{requestStats[0].value}</span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-3 rounded-xl flex flex-col">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Non-Consumable</span>
                    <span className="text-2xl font-black text-blue-700 dark:text-blue-500">{requestStats[1].value}</span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-2/3 h-48 flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={requestStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {requestStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 600 }}
                    />
                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          {isAddingReq && (
            <Card className="p-4 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
              <form onSubmit={handleAddRequest} className="flex flex-col gap-4">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Submit Material Request</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Material Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Cement"
                      value={reqMaterial}
                      onChange={e => setReqMaterial(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Unit (Kg/m/mm) & Amount *</label>
                    <div className="flex gap-2">
                      {!isCustomBaseUnit ? (
                        <select
                          value={reqBaseUnit}
                          onChange={e => {
                            if (e.target.value === 'custom') {
                              setIsCustomBaseUnit(true);
                              setReqBaseUnit('');
                            } else {
                              setReqBaseUnit(e.target.value);
                            }
                          }}
                          required
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                        >
                          <option value="" disabled>Select Unit</option>
                          <option value="Kg">Kg</option>
                          <option value="m">m</option>
                          <option value="mm">mm</option>
                          <option value="liters">liters</option>
                          <option value="custom">Other (Custom)</option>
                        </select>
                      ) : (
                        <div className="flex w-full gap-1">
                          <input
                            type="text"
                            placeholder="Custom Unit"
                            value={reqBaseUnit}
                            onChange={e => setReqBaseUnit(e.target.value)}
                            required
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => { setIsCustomBaseUnit(false); setReqBaseUnit(''); }}
                            className="h-10 px-2 text-slate-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <input
                        type="number"
                        placeholder="Amount (e.g. 5)"
                        value={reqBaseAmount}
                        onChange={e => setReqBaseAmount(e.target.value ? Number(e.target.value) : '')}
                        required
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Quantity & Unit (Custom) *</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Qty (e.g. 5)"
                        min="1"
                        value={reqQuantity}
                        onChange={e => setReqQuantity(Number(e.target.value))}
                        required
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Unit (e.g. bags)"
                        value={reqUnit}
                        onChange={e => setReqUnit(e.target.value)}
                        required
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Requested By *</label>
                    {!isCustomRequestor ? (
                      <select
                        value={reqRequestor}
                        onChange={e => {
                          if (e.target.value === 'custom') {
                            setIsCustomRequestor(true);
                            setReqRequestor('');
                          } else {
                            setReqRequestor(e.target.value);
                          }
                        }}
                        required
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                      >
                        <option value="" disabled>Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`}>{emp.firstName} {emp.lastName} ({emp.position})</option>
                        ))}
                        <option value="custom">Other (Custom)</option>
                      </select>
                    ) : (
                      <div className="flex w-full gap-1">
                        <input
                          type="text"
                          placeholder="Name / Role"
                          value={reqRequestor}
                          onChange={e => setReqRequestor(e.target.value)}
                          required
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => { setIsCustomRequestor(false); setReqRequestor(''); }}
                          className="h-10 px-2 text-slate-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Date Required</label>
                    <input
                      type="date"
                      value={reqDateRequired}
                      onChange={e => setReqDateRequired(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Est. Cost (Optional)</label>
                    <input
                      type="number"
                      placeholder="Cost"
                      value={reqCost}
                      onChange={e => setReqCost(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Supplier (Optional)</label>
                    <input
                      type="text"
                      placeholder="Preferred Supplier"
                      value={reqSupplier}
                      onChange={e => setReqSupplier(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Activity (Optional)</label>
                    <select
                      value={reqActivityId}
                      onChange={e => setReqActivityId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200"
                    >
                      <option value="">No Activity Selected</option>
                      {activities.map(act => (
                        <option key={act.id} value={act.id}>{act.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddingReq(false)} className="rounded-xl text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#0B5FFF] rounded-xl text-xs">
                    Submit Request
                  </Button>
                </div>
              </form>
            </Card>
          )}
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-[#0B5FFF]" />
                Material Requests Directory
              </h3>
              <div className="flex gap-2 items-center flex-wrap">
                <div className="flex gap-1 mr-2">
                  {['All', 'Pending', 'Approved', 'Rejected', 'Delivered'].map(st => (
                    <button
                      key={st}
                      onClick={() => setReqFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        reqFilter === st ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <Button size="sm" onClick={() => exportMaterialRequestsToCSV(requests.filter(r => (reqFilter === 'All' || r.status === reqFilter) && (activityFilter === 'All' || r.activityId === activityFilter)), reqFilter)} variant="outline" className="rounded-xl text-xs gap-1.5 shadow-sm text-slate-700 border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:bg-slate-800">
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                <Button size="sm" onClick={() => generateRequestsPDF(requests.filter(r => (reqFilter === 'All' || r.status === reqFilter) && (activityFilter === 'All' || r.activityId === activityFilter)), projects[0])} variant="outline" className="rounded-xl text-xs gap-1.5 shadow-sm text-slate-700 border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:bg-slate-800">
                  <ArrowDownToLine className="h-4 w-4" /> Download PDF
                </Button>
                <Button size="sm" onClick={() => setIsAddingReq(!isAddingReq)} className="bg-[#0B5FFF] hover:bg-blue-700 text-white rounded-xl text-xs gap-2">
                  <Plus className="h-4 w-4" /> New Request
                </Button>
              </div>
            </div>
            {selectedRequests.length > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800">
                    {selectedRequests.length} selected
                  </Badge>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bulk Actions:</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleBulkRequestAction('Approved')} className="h-8 text-xs bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-slate-900 dark:border-slate-700 dark:text-emerald-400 dark:hover:bg-emerald-950/50">Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkRequestAction('Delivered')} className="h-8 text-xs bg-white text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800 dark:bg-slate-900 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-blue-950/50">Mark Delivered</Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkRequestAction('Rejected')} className="h-8 text-xs bg-white text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800 dark:bg-slate-900 dark:border-slate-700 dark:text-rose-400 dark:hover:bg-rose-950/50">Reject</Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkRequestAction('Delete')} className="h-8 text-xs bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-rose-950/50 dark:hover:text-rose-400">Delete</Button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-[11px] uppercase text-slate-500 font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-4 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                        onChange={(e) => {
                          const filteredIds = requests.filter(r => (reqFilter === 'All' || r.status === reqFilter) && (activityFilter === 'All' || r.activityId === activityFilter)).map(r => r.id);
                          if (e.target.checked) {
                            setSelectedRequests(filteredIds);
                          } else {
                            setSelectedRequests([]);
                          }
                        }}
                        checked={
                          requests.filter(r => (reqFilter === 'All' || r.status === reqFilter) && (activityFilter === 'All' || r.activityId === activityFilter)).length > 0 && 
                          selectedRequests.length === requests.filter(r => (reqFilter === 'All' || r.status === reqFilter) && (activityFilter === 'All' || r.activityId === activityFilter)).length
                        }
                      />
                    </th>
                    <th className="px-5 py-4">Request ID</th>
                    <th className="px-5 py-4">Material</th>
                    <th className="px-5 py-4">Spec / Size</th>
                    <th className="px-5 py-4">Quantity</th>
                    <th className="px-5 py-4">Requested By</th>
                    <th className="px-5 py-4">Date Reqd.</th>
                    <th className="px-5 py-4">Activity</th>
                    <th className="px-5 py-4">Est. Cost</th>
                    <th className="px-5 py-4">Supplier</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {requests.filter(r => (reqFilter === 'All' || r.status === reqFilter) && (activityFilter === 'All' || r.activityId === activityFilter)).map(req => (
                    <tr key={req.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${selectedRequests.includes(req.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}>
                      <td className="px-5 py-4 w-10">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                          checked={selectedRequests.includes(req.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRequests(prev => [...prev, req.id]);
                            } else {
                              setSelectedRequests(prev => prev.filter(id => id !== req.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{req.id}</td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{req.material}</div>
                        <Badge variant="outline" className={`mt-1 ${req.type === 'Consumable' ? 'text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30' : 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/30'}`}>
                          {req.type || 'Consumable'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-sm">{req.baseAmount ? `${req.baseAmount}${req.baseUnit}` : '-'}</td>
                      <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300">{req.quantity} <span className="text-xs font-normal text-slate-500">{req.unit}</span></td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-sm">{req.requestedBy}</td>
                      <td className="px-5 py-4 text-slate-500 text-sm">{req.date}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-sm truncate max-w-[150px]">{activities.find(a => a.id === req.activityId)?.name || <span className="text-slate-400 italic">Unassigned</span>}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-sm">{req.price ? `${req.price}` : '-'}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-sm">{req.supplier || '-'}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1.5 rounded-md flex items-center w-fit gap-1 ${
                          req.status === 'Approved' ? 'text-emerald-700 bg-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50' :
                          req.status === 'Pending' ? 'text-amber-700 bg-amber-100/80 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/50' :
                          req.status === 'Rejected' ? 'text-rose-700 bg-rose-100/80 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50' :
                          'text-blue-700 bg-blue-100/80 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/50'
                        }`}>
                          {req.status === 'Approved' && <CheckCircle2 className="h-3 w-3" />}
                          {req.status === 'Pending' && <AlertCircle className="h-3 w-3" />}
                          {req.status === 'Rejected' && <X className="h-3 w-3" />}
                          {req.status === 'Delivered' && <Package className="h-3 w-3" />}
                          {req.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {req.status === 'Pending' && (
                          <Button 
                             size="sm" 
                             variant="ghost" 
                             onClick={() => setEditingRequest(req)} 
                             className="text-slate-500 hover:text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1 h-8 w-8"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.filter(r => reqFilter === 'All' || r.status === reqFilter).length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-8 text-center text-slate-500 text-sm">
                        No material requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
) : activeTab === 'costs' ? (
        <div className="flex flex-col gap-6">
          {/* Financial Summary Dashboard - Stores */}
          <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/80 dark:to-slate-900 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.02] pointer-events-none">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-48 h-48"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
            </div>
            <CardContent className="p-5 relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </span>
                    Company Stores - Financial Summary
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Cost overview based on allocated estimates and real-time inventory.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button size="sm" onClick={() => generateCostsPDF(materials, requests, projects[0], currency || 'USD')} variant="outline" className="rounded-xl text-xs gap-1.5 shadow-sm text-slate-700 border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:bg-slate-800 h-9">
                    <ArrowDownToLine className="h-4 w-4" /> Download PDF
                  </Button>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <label className="text-xs font-semibold text-slate-500 pl-2">Currency:</label>
                  <select 
                    value={currency || 'USD'} 
                    onChange={(e) => setCurrency && setCurrency(e.target.value as import('../types').CurrencyCode)}
                    className="h-8 px-2 rounded-lg bg-transparent text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="ZAR">ZAR (R)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Estimated Budget</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{currency} {materials.reduce((acc, curr) => acc + (curr.estimatedQuantity * (curr.unitCost || curr.costPerUnit || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs font-medium text-slate-400 mt-1">Based on estimated requirements</p>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Current Inventory Value</p>
                  <p className="text-2xl font-black text-blue-700 dark:text-blue-400 tracking-tight">{currency} {materials.reduce((acc, curr) => {
                    const balance = curr.receivedQuantity - curr.usedQuantity;
                    return acc + (Math.max(0, balance) * (curr.unitCost || curr.costPerUnit || 0));
                  }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs font-medium text-blue-500/70 dark:text-blue-500 mt-1">Value of unused stock on-site</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Total Consumed Costs</p>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">{currency} {materials.reduce((acc, curr) => acc + (curr.usedQuantity * (curr.unitCost || curr.costPerUnit || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs font-medium text-emerald-500/70 dark:text-emerald-500 mt-1">Used materials value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown Chart */}
          <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/80 dark:to-slate-900 shadow-sm overflow-hidden">
            <CardContent className="p-5 relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                      <PieChartIcon className="h-4 w-4" />
                    </span>
                    Spending Distribution
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Cost breakdown by material category based on estimated budget.</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                {materials.reduce((acc, curr) => acc + (curr.estimatedQuantity * (curr.unitCost || curr.costPerUnit || 0)), 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(() => {
                          const categoryMap = new Map();
                          materials.forEach(m => {
                            const cost = m.estimatedQuantity * (m.unitCost || m.costPerUnit || 0);
                            const cat = m.category || 'Uncategorized';
                            categoryMap.set(cat, (categoryMap.get(cat) || 0) + cost);
                          });
                          return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
                        })()}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(() => {
                          const COLORS = ['#0B5FFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
                          const categoryMap = new Map();
                          materials.forEach(m => {
                            const cost = m.estimatedQuantity * (m.unitCost || m.costPerUnit || 0);
                            const cat = m.category || 'Uncategorized';
                            categoryMap.set(cat, (categoryMap.get(cat) || 0) + cost);
                          });
                          const categories = Array.from(categoryMap.entries()).filter(d => d[1] > 0).map(d => d[0]);
                          
                          return categories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ));
                        })()}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${currency || 'USD'} ${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    No budget costs available to chart. Add costs to materials.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Requests - Financial Summary */}
          <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/80 dark:to-slate-900 shadow-sm overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.02] pointer-events-none">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-48 h-48"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
            </div>
            <CardContent className="p-5 relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                      <ShoppingCart className="h-4 w-4" />
                    </span>
                    Material Requests - Cost Summary
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Overview of projected costs for material requisitions.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Estimated Requests Cost</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{currency} {requests.reduce((acc, curr) => acc + (curr.quantity * (Number(curr.price) || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs font-medium text-slate-400 mt-1">Based on estimated unit prices</p>
                </div>
                <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Pending Requests Cost</p>
                  <p className="text-2xl font-black text-amber-700 dark:text-amber-400 tracking-tight">{currency} {requests.filter(r => r.status === 'Pending').reduce((acc, curr) => acc + (curr.quantity * (Number(curr.price) || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs font-medium text-amber-500/70 dark:text-amber-500 mt-1">Awaiting approval</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Approved/Delivered Cost</p>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">{currency} {requests.filter(r => r.status === 'Approved' || r.status === 'Delivered').reduce((acc, curr) => acc + (curr.quantity * (Number(curr.price) || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs font-medium text-emerald-500/70 dark:text-emerald-500 mt-1">Committed spend</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : activeTab === 'suppliers' ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
               <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Supplier Directory
               </h3>
               <Button size="sm" onClick={() => setIsAddingSupplier(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs gap-2 shadow-sm">
                 <Plus className="h-4 w-4" /> Add Supplier
               </Button>
            </div>

            {suppliers.map(sup => (
              <Card key={sup.id} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{sup.name}</h4>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{sup.id}</div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md text-xs font-bold border border-amber-200 dark:border-amber-900">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      {sup.rating.toFixed(1)}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2 mt-2">
                    {sup.contactName && (
                      <div className="flex items-center gap-2 text-xs">
                        <UserCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600 dark:text-slate-300">{sup.contactName}</span>
                      </div>
                    )}
                    {sup.email && (
                      <div className="flex items-center gap-2 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        <a href={`mailto:${sup.email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 truncate">{sup.email}</a>
                      </div>
                    )}
                    {sup.phone && (
                      <div className="flex items-center gap-2 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <a href={`tel:${sup.phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 truncate">{sup.phone}</a>
                      </div>
                    )}
                    
                    {sup.categories.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {sup.categories.map((cat, idx) => (
                          <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {sup.notes && (
                       <p className="text-xs text-slate-500 pt-2 mt-2 line-clamp-2">
                         {sup.notes}
                       </p>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                     <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDeleteSupplier(sup.id)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 h-8 w-8 p-0 flex items-center justify-center rounded-lg"
                        title="Delete Supplier"
                     >
                        <Trash2 className="h-4 w-4" />
                     </Button>
                     <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setEditingSupplier(sup)}
                        className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 h-8 text-xs font-semibold px-3 rounded-lg border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50"
                     >
                        <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit Supplier
                     </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {suppliers.length === 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                </div>
                <h3 className="text-slate-800 dark:text-slate-200 font-bold mb-1">No Suppliers Found</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">You haven't added any suppliers to your directory yet. Keep track of vendors, ratings, and contacts here.</p>
                <Button onClick={() => setIsAddingSupplier(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm">
                  <Plus className="h-4 w-4 mr-2" /> Add Your First Supplier
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
      {/* Editing Supplier Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Edit3 className="h-5 w-5 text-indigo-600" /> Edit Supplier
                </CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingSupplier(null)} className="rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </CardHeader>
            <form onSubmit={handleEditSupplier}>
              <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 ml-1">Supplier / Company Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Holcim Cements"
                      value={editingSupplier.name}
                      onChange={e => setEditingSupplier({...editingSupplier, name: e.target.value})}
                      required
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 ml-1">Contact Name</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={editingSupplier.contactName}
                        onChange={e => setEditingSupplier({...editingSupplier, contactName: e.target.value})}
                        className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 ml-1">Rating (1-5)</label>
                      <input
                        type="number"
                        placeholder="4.5"
                        min="1" max="5" step="0.1"
                        value={editingSupplier.rating}
                        onChange={e => setEditingSupplier({...editingSupplier, rating: Number(e.target.value)})}
                        className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs font-semibold text-amber-600 dark:text-amber-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 ml-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="contact@example.com"
                        value={editingSupplier.email}
                        onChange={e => setEditingSupplier({...editingSupplier, email: e.target.value})}
                        className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 ml-1">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={editingSupplier.phone}
                        onChange={e => setEditingSupplier({...editingSupplier, phone: e.target.value})}
                        className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 ml-1">Categories (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Cement, Concrete"
                      value={typeof editingSupplier.categories === 'string' ? editingSupplier.categories : editingSupplier.categories.join(', ')}
                      onChange={e => setEditingSupplier({...editingSupplier, categories: e.target.value})}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 ml-1">Notes / Payment Terms</label>
                    <textarea
                      placeholder="e.g. Reliable for bulk deliveries. Net 30 terms."
                      rows={3}
                      value={editingSupplier.notes}
                      onChange={e => setEditingSupplier({...editingSupplier, notes: e.target.value})}
                      className="w-full px-3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs resize-none"
                    />
                  </div>
              </CardContent>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between gap-2 rounded-b-xl">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleDeleteSupplier(editingSupplier.id)}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:hover:bg-rose-950/30 font-semibold"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete Supplier
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingSupplier(null)}>Cancel</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2">
                     Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Floating Action Button for Add Material */}
      <button
        onClick={handleOpenAddModal}
        className="fixed bottom-6 right-6 z-40 bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-full p-4 shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        title="Add New Material"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add / Duplicate Material Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-[615px] shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {isDuplicateMaterial ? (
                    <>
                      <Copy className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <span>Duplicate & Edit Material</span>
                    </>
                  ) : (
                    <>
                      <Package className="h-5 w-5 text-[#0B5FFF]" />
                      <span>Add New Material</span>
                    </>
                  )}
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isDuplicateMaterial
                    ? 'Adjust minor differences (dimensions, grade, supplier, SKU, threshold) and create duplicate item'
                    : 'Register a new supply item into site inventory'}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsDuplicateMaterial(false);
                }} 
                className="rounded-full"
              >
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </CardHeader>
            <form onSubmit={handleAddSubmit}>
              <CardContent className="p-6 space-y-4">
                {isDuplicateMaterial && (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-2">
                    <Copy className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Duplicating material:</strong> Initial stock and usage are reset to 0. Update the name, SKU, or category as needed for minor variations.
                    </div>
                  </div>
                )}

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
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Material Type</label>
                    <select
                      value={formData.type || 'Consumable'}
                      onChange={e => setFormData({ ...formData, type: e.target.value as 'Consumable' | 'Non-Consumable' })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    >
                      <option value="Consumable">Consumable</option>
                      <option value="Non-Consumable">Non-Consumable</option>
                    </select>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Unit (Kg/m/mm) & Amount *</label>
                    <div className="flex gap-2">
                      {!isAddCustomBaseUnit ? (
                        <select
                          value={formData.baseUnit}
                          onChange={e => {
                            if (e.target.value === 'custom') {
                              setIsAddCustomBaseUnit(true);
                              setFormData({ ...formData, baseUnit: '' });
                            } else {
                              setFormData({ ...formData, baseUnit: e.target.value });
                            }
                          }}
                          className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                        >
                          <option value="" disabled>Select Unit</option>
                          <option value="Kg">Kg</option>
                          <option value="m">m</option>
                          <option value="mm">mm</option>
                          <option value="liters">liters</option>
                          <option value="custom">Other (Custom)</option>
                        </select>
                      ) : (
                        <div className="flex w-full gap-1">
                          <input
                            type="text"
                            placeholder="Custom Unit"
                            value={formData.baseUnit}
                            onChange={e => setFormData({ ...formData, baseUnit: e.target.value })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => { setIsAddCustomBaseUnit(false); setFormData({ ...formData, baseUnit: '' }); }}
                            className="h-10 px-2 text-slate-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <input
                        type="number"
                        placeholder="Amount (e.g. 5)"
                        value={formData.baseAmount || ''}
                        onChange={e => setFormData({ ...formData, baseAmount: Number(e.target.value) || 0 })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quantity & Unit (Custom) *</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        min="0"
                        value={formData.estimatedQuantity}
                        onChange={e => setFormData({ ...formData, estimatedQuantity: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                      />
                      <input
                        type="text"
                        placeholder="units"
                        value={formData.unit}
                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                      />
                    </div>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Minimum Stock Threshold (Reorder Level)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 100"
                      value={formData.reorderLevel}
                      onChange={e => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[11px] text-slate-500">Triggers reorder warnings when balance drops.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cost per Unit (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{getCurrencySymbol(currency)}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.costPerUnit || ''}
                        onChange={e => setFormData({ ...formData, costPerUnit: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Material Photos</label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRefMat.current?.click()}
                      className="h-8 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Camera className="h-3.5 w-3.5 mr-1.5" />
                      Capture Photo
                    </Button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      ref={fileInputRefMat} 
                      className="hidden" 
                      onChange={handlePhotoCapture} 
                    />
                  </div>
                  {formData.photos && formData.photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                      {formData.photos.map((photo, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 group">
                          <img src={photo} alt={`Material capture ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 flex items-center justify-center"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsDuplicateMaterial(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#0B5FFF] hover:bg-blue-600 text-white font-semibold">
                  {isDuplicateMaterial ? 'Create Duplicate Material' : 'Save Material'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Material Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-[615px] shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
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
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Material Type</label>
                    <select
                      value={formData.type || 'Consumable'}
                      onChange={e => setFormData({ ...formData, type: e.target.value as 'Consumable' | 'Non-Consumable' })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    >
                      <option value="Consumable">Consumable</option>
                      <option value="Non-Consumable">Non-Consumable</option>
                    </select>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Minimum Stock Threshold (Reorder Level)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 100"
                      value={formData.reorderLevel}
                      onChange={e => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[11px] text-slate-500">Triggers reorder warnings when balance drops.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cost per Unit (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{getCurrencySymbol(currency)}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.costPerUnit || ''}
                        onChange={e => setFormData({ ...formData, costPerUnit: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Material Photos</label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRefMat.current?.click()}
                      className="h-8 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Camera className="h-3.5 w-3.5 mr-1.5" />
                      Capture Photo
                    </Button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      ref={fileInputRefMat} 
                      className="hidden" 
                      onChange={handlePhotoCapture} 
                    />
                  </div>
                  {formData.photos && formData.photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                      {formData.photos.map((photo, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 group">
                          <img src={photo} alt={`Material capture ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 flex items-center justify-center"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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

      {/* Purchase Requisition Modal */}
      {reorderMaterial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-[615px] shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <CardHeader className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-extrabold flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <ShoppingCart className="h-5 w-5 text-amber-600" /> Dispatch Purchase Requisition
                </CardTitle>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Item: <strong className="underline">{reorderMaterial.name}</strong> ({reorderMaterial.id})
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setReorderMaterial(null)} className="rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </CardHeader>

            <form onSubmit={handleSingleReorderSubmit}>
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <div>
                    Current Stock: <strong>{reorderMaterial.receivedQuantity - reorderMaterial.usedQuantity} {reorderMaterial.unit}</strong>
                  </div>
                  <div>
                    Min Threshold: <strong>{reorderMaterial.reorderLevel || Math.round(reorderMaterial.estimatedQuantity * 0.1)} {reorderMaterial.unit}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quantity to Order *</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="1"
                        value={reorderForm.quantity}
                        onChange={e => setReorderForm({ ...reorderForm, quantity: Number(e.target.value) })}
                        className="w-full h-10 px-3 pr-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                        {reorderMaterial.unit}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Required By Date *</label>
                    <input
                      type="date"
                      required
                      value={reorderForm.targetDate}
                      onChange={e => setReorderForm({ ...reorderForm, targetDate: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Urgency Level</label>
                    <select
                      value={reorderForm.urgency}
                      onChange={e => setReorderForm({ ...reorderForm, urgency: e.target.value as any })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    >
                      <option value="Critical">Critical (Immediate Stop Risk)</option>
                      <option value="High">High (Needed within 48h)</option>
                      <option value="Medium">Medium (Standard Replenishment)</option>
                      <option value="Low">Low (Future Buffer)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Preferred Supplier</label>
                    <input
                      type="text"
                      placeholder="e.g. Holcim / Macsteel"
                      value={reorderForm.supplier}
                      onChange={e => setReorderForm({ ...reorderForm, supplier: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Requisition Notes & Specs</label>
                  <textarea
                    rows={2}
                    placeholder="Specify grade, site delivery drop zone, or urgency reasons..."
                    value={reorderForm.notes}
                    onChange={e => setReorderForm({ ...reorderForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setReorderMaterial(null)}>Cancel</Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold gap-1.5">
                  <Send className="h-4 w-4" /> Send Requisition
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Quick Alert Threshold Setting Modal */}
      {quickThresholdMat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <CardHeader className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-extrabold flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-5 w-5 text-amber-600" /> Set User-Defined Alert Threshold
                </CardTitle>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Item: <strong>{quickThresholdMat.name}</strong> ({quickThresholdMat.unit})
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setQuickThresholdMat(null)} className="rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </CardHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const updated = {
                ...quickThresholdMat,
                reorderLevel: Number(quickThresholdValue)
              };
              updateMaterial(updated);
              if (selectedMaterial?.id === updated.id) {
                setSelectedMaterial(updated);
              }
              setQuickThresholdMat(null);
            }}>
              <CardContent className="p-6 space-y-4">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Available Balance:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {quickThresholdMat.receivedQuantity - quickThresholdMat.usedQuantity} {quickThresholdMat.unit}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Estimate:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {quickThresholdMat.estimatedQuantity} {quickThresholdMat.unit}
                    </strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                    Alert Threshold Quantity ({quickThresholdMat.unit}) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      value={quickThresholdValue}
                      onChange={e => setQuickThresholdValue(Number(e.target.value))}
                      className="w-full h-11 px-3 pr-16 rounded-xl border-2 border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-500 text-amber-900 dark:text-amber-200"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-700 dark:text-amber-400">
                      {quickThresholdMat.unit}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    When available balance drops to or below <strong className="text-red-600">{quickThresholdValue} {quickThresholdMat.unit}</strong>, the item will be highlighted in RED with low stock alerts.
                  </p>
                </div>

                {/* Live Preview Indicator */}
                <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  (quickThresholdMat.receivedQuantity - quickThresholdMat.usedQuantity) <= quickThresholdValue
                    ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300'
                }`}>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    {(quickThresholdMat.receivedQuantity - quickThresholdMat.usedQuantity) <= quickThresholdValue
                      ? '⚠️ ALERT TRIGGERED: Balance is below this proposed threshold!'
                      : '✅ Healthy: Balance is above this proposed threshold.'}
                  </span>
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setQuickThresholdMat(null)}>Cancel</Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold">
                  Save Threshold Parameter
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}


      {/* Add Supplier Modal */}
      {isAddingSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Plus className="h-5 w-5 text-indigo-600" /> Add New Supplier
                </CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsAddingSupplier(false)} className="rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </CardHeader>
            <form onSubmit={handleAddSupplier}>
              <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 ml-1">Supplier / Company Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Holcim Cements"
                      value={supplierForm.name}
                      onChange={e => setSupplierForm({...supplierForm, name: e.target.value})}
                      required
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 ml-1">Contact Name</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={supplierForm.contactName}
                        onChange={e => setSupplierForm({...supplierForm, contactName: e.target.value})}
                        className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 ml-1">Rating (1-5)</label>
                      <input
                        type="number"
                        placeholder="4.5"
                        min="1" max="5" step="0.1"
                        value={supplierForm.rating}
                        onChange={e => setSupplierForm({...supplierForm, rating: Number(e.target.value)})}
                        className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs font-semibold text-amber-600 dark:text-amber-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 ml-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="contact@example.com"
                        value={supplierForm.email}
                        onChange={e => setSupplierForm({...supplierForm, email: e.target.value})}
                        className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 ml-1">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={supplierForm.phone}
                        onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})}
                        className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 ml-1">Categories (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Cement, Concrete"
                      value={supplierForm.categories}
                      onChange={e => setSupplierForm({...supplierForm, categories: e.target.value})}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 ml-1">Notes / Payment Terms</label>
                    <textarea
                      placeholder="e.g. Reliable for bulk deliveries. Net 30 terms."
                      rows={3}
                      value={supplierForm.notes}
                      onChange={e => setSupplierForm({...supplierForm, notes: e.target.value})}
                      className="w-full px-3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs resize-none"
                    />
                  </div>
              </CardContent>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setIsAddingSupplier(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2">
                   Add Supplier
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {supplierToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl border-rose-200 dark:border-rose-900 animate-in fade-in zoom-in-95 overflow-hidden">
            <CardHeader className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900 flex flex-row items-center gap-3 pb-4">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-full text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-rose-900 dark:text-rose-100">
                  Delete Supplier
                </CardTitle>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">This action cannot be undone.</p>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Are you sure you want to permanently remove this supplier? All associated contact details and ratings will be lost.
              </p>
            </CardContent>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSupplierToDelete(null)} className="font-semibold">Cancel</Button>
              <Button type="button" onClick={confirmDeleteSupplier} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                 Delete Supplier
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
