import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  Gauge, 
  Clock, 
  Fuel, 
  Calendar, 
  Wrench, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  Edit3, 
  Camera, 
  Layers
} from 'lucide-react';
import { Equipment, EquipmentStatus, EquipmentType } from '../types/sewage';

interface EquipmentViewProps {
  equipment: Equipment[];
  onAddEquipment: (equipment: Equipment) => void;
  onUpdateEquipment: (equipment: Equipment) => void;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({
  equipment,
  onAddEquipment,
  onUpdateEquipment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);

  useEffect(() => {
    if (!showAddModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAddModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  const [formData, setFormData] = useState<Partial<Equipment>>({
    code: '',
    name: '',
    type: 'jetting',
    typeNameAr: 'سيارة نافورة ضغط عالي (High Pressure Jetting)',
    licensePlate: '',
    status: 'available',
    dailyCapacityNorm: '450 متر طولي خطوط/يوم',
    dailyCapacityValue: 450,
    capacityUnit: 'متر طولي',
    assignedDriver: '',
    fuelLevelPercent: 85,
    totalRunningHours: 500,
    lastMaintenanceDate: new Date().toISOString().slice(0, 10),
    technicalSpecs: {
      operatingPressureBar: 200,
      tankCapacityM3: 8,
      maxPipeDiameterMm: 600,
      cableLengthMeters: 150,
    },
  });

  const filteredEquipment = equipment.filter(e => {
    const matchesSearch = e.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.name.includes(searchTerm) ||
                          e.licensePlate.includes(searchTerm) ||
                          (e.assignedDriver && e.assignedDriver.includes(searchTerm));
    const matchesType = typeFilter === 'all' || e.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: `JET-0${equipment.length + 1}`,
      name: '',
      type: 'jetting',
      typeNameAr: 'سيارة نافورة ضغط عالي (High Pressure Jetting)',
      licensePlate: '',
      status: 'available',
      dailyCapacityNorm: '450 متر طولي/يوم',
      dailyCapacityValue: 450,
      capacityUnit: 'متر طولي',
      assignedDriver: '',
      fuelLevelPercent: 90,
      totalRunningHours: 120,
      lastMaintenanceDate: new Date().toISOString().slice(0, 10),
      technicalSpecs: {
        operatingPressureBar: 200,
        tankCapacityM3: 8,
        maxPipeDiameterMm: 600,
      },
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: Equipment) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowAddModal(true);
  };

  const handleQuickStatusChange = (id: string, newStatus: EquipmentStatus) => {
    const item = equipment.find(e => e.id === id);
    if (item) {
      onUpdateEquipment({
        ...item,
        status: newStatus,
      });
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      alert('يرجى إدخال كود المعدة واسمها');
      return;
    }

    if (editingItem) {
      onUpdateEquipment({
        ...editingItem,
        ...formData,
      } as Equipment);
    } else {
      const newEq: Equipment = {
        id: `eq-${Date.now()}`,
        code: formData.code || 'EQ-NEW',
        name: formData.name || 'معدة جديدة',
        type: (formData.type as EquipmentType) || 'jetting',
        typeNameAr: formData.typeNameAr || 'سيارة نافورة ضغط عالي',
        licensePlate: formData.licensePlate || 'غير محدد',
        status: (formData.status as EquipmentStatus) || 'available',
        technicalSpecs: formData.technicalSpecs || {},
        dailyCapacityNorm: formData.dailyCapacityNorm || '400 متر/يوم',
        dailyCapacityValue: Number(formData.dailyCapacityValue) || 400,
        capacityUnit: formData.capacityUnit || 'متر طولي',
        assignedDriver: formData.assignedDriver || '',
        fuelLevelPercent: Number(formData.fuelLevelPercent) || 80,
        totalRunningHours: Number(formData.totalRunningHours) || 0,
        lastMaintenanceDate: formData.lastMaintenanceDate || new Date().toISOString().slice(0, 10),
      };
      onAddEquipment(newEq);
    }
    setShowAddModal(false);
  };

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'available':
        return <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> جاهزة ومتاحة</span>;
      case 'in_use':
        return <span className="bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1"><Activity className="w-3 h-3" /> قيد التشغيل الميداني</span>;
      case 'maintenance':
        return <span className="bg-amber-950 text-amber-300 border border-amber-800/60 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1"><Wrench className="w-3 h-3" /> صيانة دورية</span>;
      case 'breakdown':
        return <span className="bg-rose-950 text-rose-300 border border-rose-800/60 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> عطل طارئ</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Truck className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-black text-white">أسطول الآليات والمعدات الثقيلة (Heavy Equipment Fleet)</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              متابعة سيارات النافورة (Jetting)، كباش التطهير للمطابق العميقة (Grab)، سيارات الكسح، كاميرات الفحص CCTV، وآلات التمليس الميكانيكي.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 fill-slate-950" />
            <span>إضافة آلية للأسطول</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث باسم المعدة أو الكود أو اللوحة أو السائق..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-850 border border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-850 border border-slate-700 rounded-xl px-3 py-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 whitespace-nowrap">النوع:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all">كافة الأنواع ({equipment.length})</option>
              <option value="jetting">سيارات نافورة (Jetting)</option>
              <option value="grab">كباش تطهير مطابق (Grab)</option>
              <option value="vacuum">سيارات وطلمبات كسح (Vacuum)</option>
              <option value="cctv">روبوت فحص تلفزيوني (CCTV)</option>
              <option value="rodding">آلات تمليس ميكانيكي (Rodding)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-850 border border-slate-700 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 whitespace-nowrap">الحالة الفنية:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all">كافة الحالات</option>
              <option value="available">جاهزة ومتاحة</option>
              <option value="in_use">قيد التشغيل الميداني</option>
              <option value="maintenance">صيانة</option>
              <option value="breakdown">أعطال طارئة</option>
            </select>
          </div>

        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEquipment.map((item) => (
          <div 
            key={item.id} 
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl space-y-4 relative flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-400 text-sm bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {item.code}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      لوحة: {item.licensePlate}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm mt-1">{item.name}</h3>
                  <span className="text-[11px] text-cyan-400/90 font-medium block">
                    {item.typeNameAr}
                  </span>
                </div>

                <div>{getStatusBadge(item.status)}</div>
              </div>

              {/* Technical Specs Box */}
              <div className="mt-3.5 bg-slate-850/80 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  المواصفات والقدرات الهندسية:
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  {item.technicalSpecs.operatingPressureBar && (
                    <div className="flex items-center gap-1 font-mono">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                      <span>الضغط: {item.technicalSpecs.operatingPressureBar} بار</span>
                    </div>
                  )}
                  {item.technicalSpecs.tankCapacityM3 && (
                    <div className="flex items-center gap-1 font-mono">
                      <span>الخزان: {item.technicalSpecs.tankCapacityM3} م³</span>
                    </div>
                  )}
                  {item.technicalSpecs.craneCapacityKg && (
                    <div className="flex items-center gap-1 font-mono">
                      <span>الحمولة: {item.technicalSpecs.craneCapacityKg} كجم</span>
                    </div>
                  )}
                  {item.technicalSpecs.maxDepthMeters && (
                    <div className="flex items-center gap-1 font-mono">
                      <span>العمق الأقصى: {item.technicalSpecs.maxDepthMeters} م</span>
                    </div>
                  )}
                  {item.technicalSpecs.cableLengthMeters && (
                    <div className="flex items-center gap-1 font-mono">
                      <span>طول الخرطوم/الكابل: {item.technicalSpecs.cableLengthMeters} م</span>
                    </div>
                  )}
                  {item.technicalSpecs.maxPipeDiameterMm && (
                    <div className="flex items-center gap-1 font-mono">
                      <span>أقصى قطر: Ø{item.technicalSpecs.maxPipeDiameterMm} مم</span>
                    </div>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">معدل الإنتاجية المعياري:</span>
                  <span className="font-bold text-emerald-400">{item.dailyCapacityNorm}</span>
                </div>
              </div>

              {/* Driver and Operational Health */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 block">السائق المسؤول:</span>
                  <span className="font-semibold text-white truncate block">{item.assignedDriver || 'غير مسند'}</span>
                </div>

                <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 space-y-0.5 font-mono">
                  <span className="text-[10px] text-slate-500 block">ساعات التشغيل:</span>
                  <span className="font-semibold text-cyan-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.totalRunningHours} ساعة
                  </span>
                </div>
              </div>

              {/* Fuel Level */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-amber-400" />
                    مستوى الوقود:
                  </span>
                  <span className="font-bold text-amber-400">{item.fuelLevelPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all" 
                    style={{ width: `${item.fuelLevelPercent}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Bottom Actions: Quick Status Change */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleQuickStatusChange(item.id, 'available')}
                  className={`text-[10px] px-2 py-1 rounded cursor-pointer ${item.status === 'available' ? 'bg-emerald-950 text-emerald-300 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                  title="تعيين كجاهزة"
                >
                  جاهزة
                </button>
                <button
                  onClick={() => handleQuickStatusChange(item.id, 'in_use')}
                  className={`text-[10px] px-2 py-1 rounded cursor-pointer ${item.status === 'in_use' ? 'bg-cyan-950 text-cyan-300 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                  title="تعيين كقيد التشغيل"
                >
                  تشغيل
                </button>
                <button
                  onClick={() => handleQuickStatusChange(item.id, 'breakdown')}
                  className={`text-[10px] px-2 py-1 rounded cursor-pointer ${item.status === 'breakdown' ? 'bg-rose-950 text-rose-300 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                  title="تسجيل عطل مفاجئ (لاختبار إعادة الجدولة التلقائية)"
                >
                  عطل
                </button>
              </div>

              <button
                onClick={() => handleOpenEdit(item)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                title="تعديل المواصفات"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Add / Edit Machinery Modal */}
      {showAddModal && (
        <div 
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                {editingItem ? `تعديل بيانات المعدة: ${editingItem.code}` : 'إضافة معدة/آلية جديدة للأسطول'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">كود المعدة *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="مثال: JET-03"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">نوع الآلية *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const type = e.target.value as EquipmentType;
                      let typeNameAr = 'سيارة نافورة ضغط عالي';
                      let norm = '450 متر/يوم';
                      if (type === 'grab') { typeNameAr = 'كباش تطهير مطابق'; norm = '10 مطابق/يوم'; }
                      if (type === 'vacuum') { typeNameAr = 'سيارة كسح وشفط حمأة'; norm = '48 م3/يوم'; }
                      if (type === 'cctv') { typeNameAr = 'كاميرا فحص تلفزيوني CCTV'; norm = '350 متر/يوم'; }
                      if (type === 'rodding') { typeNameAr = 'آلة تمليس وتسليك ميكانيكي'; norm = '250 متر/يوم'; }
                      setFormData({ ...formData, type, typeNameAr, dailyCapacityNorm: norm });
                    }}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="jetting">سيارة نافورة ضغط عالي (Jetting)</option>
                    <option value="grab">كباش تطهير مطابق (Grab)</option>
                    <option value="vacuum">سيارة كسح وشفط (Vacuum)</option>
                    <option value="cctv">كاميرا فحص تلفزيوني (CCTV)</option>
                    <option value="rodding">آلة تمليس ميكانيكي (Rodding)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">اسم وتفاصيل المعدة *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 font-sans"
                  placeholder="مثال: سيارة نافورة مان 220 بار - خزان 10م3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">رقم اللوحة المرورية</label>
                  <input
                    type="text"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="مثال: ق ن ر 3514"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">السائق المسؤول</label>
                  <input
                    type="text"
                    value={formData.assignedDriver}
                    onChange={(e) => setFormData({ ...formData, assignedDriver: e.target.value })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 font-sans"
                    placeholder="اسم السائق المعتمد"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">معدل الإنتاجية المعياري اليومي</label>
                  <input
                    type="text"
                    value={formData.dailyCapacityNorm}
                    onChange={(e) => setFormData({ ...formData, dailyCapacityNorm: e.target.value })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">الحالة التشغيلية</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EquipmentStatus })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="available">جاهزة ومتاحة</option>
                    <option value="in_use">قيد التشغيل الميداني</option>
                    <option value="maintenance">صيانة</option>
                    <option value="breakdown">عطل طارئ</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2 rounded-xl font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold px-5 py-2 rounded-xl cursor-pointer"
                >
                  {editingItem ? 'حفظ التعديل' : 'إضافة الآلية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
