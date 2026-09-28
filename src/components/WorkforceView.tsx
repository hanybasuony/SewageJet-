import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  ShieldCheck, 
  Phone, 
  Wrench, 
  Award, 
  Truck, 
  Edit3, 
  Trash2,
  HardHat
} from 'lucide-react';
import { Worker, WorkerRole } from '../types/sewage';

interface WorkforceViewProps {
  workers: Worker[];
  onAddWorker: (worker: Worker) => void;
  onUpdateWorker: (worker: Worker) => void;
  onDeleteWorker: (id: string) => void;
}

export const WorkforceView: React.FC<WorkforceViewProps> = ({
  workers,
  onAddWorker,
  onUpdateWorker,
  onDeleteWorker
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [presenceFilter, setPresenceFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  useEffect(() => {
    if (!showAddModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAddModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  const [formData, setFormData] = useState<Partial<Worker>>({
    name: '',
    role: 'laborer',
    roleNameAr: 'عامل تطهير ونزول مطابق مدرب',
    phone: '',
    presentToday: true,
    safetyCertifications: ['شهادة سلامة الأماكن المغلقة OSHA'],
    skills: ['تطهير يدوي', 'مهمات الوقاية'],
  });

  const filteredWorkers = workers.filter(w => {
    const matchesSearch = w.name.includes(searchTerm) ||
                          w.phone.includes(searchTerm) ||
                          w.roleNameAr.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || w.role === roleFilter;
    const matchesPresence = presenceFilter === 'all' || 
                            (presenceFilter === 'present' && w.presentToday) ||
                            (presenceFilter === 'absent' && !w.presentToday);
    return matchesSearch && matchesRole && matchesPresence;
  });

  const handleToggleAttendance = (id: string) => {
    const worker = workers.find(w => w.id === id);
    if (worker) {
      onUpdateWorker({
        ...worker,
        presentToday: !worker.presentToday,
      });
    }
  };

  const handleOpenAdd = () => {
    setEditingWorker(null);
    setFormData({
      name: '',
      role: 'laborer',
      roleNameAr: 'عامل تطهير ونزول مطابق مدرب',
      phone: '',
      presentToday: true,
      safetyCertifications: ['شهادة سلامة الأماكن المغلقة OSHA', 'مهمات الوقاية الشخصية PPE'],
      skills: ['تطهير مطابق', 'فرد خراطيم'],
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (w: Worker) => {
    setEditingWorker(w);
    setFormData({ ...w });
    setShowAddModal(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('يرجى كتابة اسم العامل / الكادر');
      return;
    }

    if (editingWorker) {
      onUpdateWorker({
        ...editingWorker,
        ...formData,
      } as Worker);
    } else {
      const newWorker: Worker = {
        id: `w-${Date.now()}`,
        name: formData.name || 'كادر جديد',
        role: (formData.role as WorkerRole) || 'laborer',
        roleNameAr: formData.roleNameAr || 'عامل ميداني',
        phone: formData.phone || '01000000000',
        presentToday: formData.presentToday !== undefined ? formData.presentToday : true,
        safetyCertifications: formData.safetyCertifications || ['دخول أماكن مغلقة'],
        skills: formData.skills || ['تشغيل ميداني'],
      };
      onAddWorker(newWorker);
    }
    setShowAddModal(false);
  };

  const presentCount = workers.filter(w => w.presentToday).length;
  const driversCount = workers.filter(w => w.role === 'driver' && w.presentToday).length;
  const techsCount = workers.filter(w => w.role === 'technician' && w.presentToday).length;
  const laborersCount = workers.filter(w => w.role === 'laborer' && w.presentToday).length;

  return (
    <div className="space-y-6">
      
      {/* Header and Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Users className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-black text-white">إدارة الموارد البشرية والعمالة الميدانية (Human Resources & Crews)</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              تسجيل الحضور اليومي للعمالة والفنيين وسائقي المعدات، وتوثيق شهادات واعتمادات السلامة لدخول الأماكن المغلقة (Confined Spaces).
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 fill-slate-950" />
            <span>تسجيل فرد جديد</span>
          </button>
        </div>

        {/* Daily Attendance Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">إجمالي الحضور اليوم:</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{presentCount} / {workers.length}</span>
          </div>
          <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">السائقين المتاحين:</span>
            <span className="text-lg font-black text-amber-400 font-mono">{driversCount} سائق</span>
          </div>
          <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">الفنيين والمشغلين:</span>
            <span className="text-lg font-black text-cyan-400 font-mono">{techsCount} فني</span>
          </div>
          <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">عمال التطهير والنزول:</span>
            <span className="text-lg font-black text-purple-400 font-mono">{laborersCount} عامل</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الوظيفة أو الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-850 border border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-850 border border-slate-700 rounded-xl px-3 py-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 whitespace-nowrap">الوظيفة:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all">كافة الأدوار</option>
              <option value="driver">سائق معدات ثقيلة</option>
              <option value="technician">فني تشغيل / CCTV</option>
              <option value="laborer">عامل تطهير ونزول</option>
              <option value="supervisor">مهندس / مشرف تشغيل</option>
              <option value="safety_officer">مسؤول سلامة صحة مهنية HSE</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-850 border border-slate-700 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 whitespace-nowrap">حالة الحضور:</span>
            <select
              value={presenceFilter}
              onChange={(e) => setPresenceFilter(e.target.value)}
              className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all">الجميع</option>
              <option value="present">الحاضرون اليوم فقط</option>
              <option value="absent">الغائبون</option>
            </select>
          </div>
        </div>

      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map((worker) => (
          <div 
            key={worker.id}
            className={`bg-slate-900 border rounded-2xl p-5 shadow-lg space-y-3 transition-all ${worker.presentToday ? 'border-slate-800' : 'border-rose-950/60 opacity-70'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm ${worker.presentToday ? 'bg-gradient-to-tr from-cyan-600 to-blue-700' : 'bg-slate-800 text-slate-500'}`}>
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{worker.name}</h3>
                  <span className="text-[11px] text-cyan-400/90 font-medium block">
                    {worker.roleNameAr}
                  </span>
                </div>
              </div>

              {/* Attendance Toggle Button */}
              <button
                onClick={() => handleToggleAttendance(worker.id)}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  worker.presentToday 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
                title="تبديل حالة الحضور اليومي"
              >
                {worker.presentToday ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                <span>{worker.presentToday ? 'حاضر' : 'غائب'}</span>
              </button>
            </div>

            {/* Phone & Assigned Machinery */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                {worker.phone || '010-000-0000'}
              </span>
              {worker.assignedEquipmentCode && (
                <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded font-mono border border-slate-700 text-[10px]">
                  معدة: {worker.assignedEquipmentCode}
                </span>
              )}
            </div>

            {/* Certifications & Skills */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold block">شهادات الأمان والسلامة:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {worker.safetyCertifications.map((cert, cIdx) => (
                  <span key={cIdx} className="bg-slate-850 border border-slate-750 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    {cert}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-1.5 border-t border-slate-800/80">
              <button
                onClick={() => handleOpenEdit(worker)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="تعديل بيانات العامل"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`هل أنت متأكد من حذف ${worker.name}؟`)) {
                    onDeleteWorker(worker.id);
                  }
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="حذف"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Add / Edit Worker Modal */}
      {showAddModal && (
        <div 
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                {editingWorker ? `تعديل بيانات: ${editingWorker.name}` : 'تسجيل كادر بشري جديد'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white font-sans focus:outline-none focus:border-emerald-500"
                  placeholder="مثال: أحمد عبد الله الرفاعي"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">الدور الوظيفي *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const role = e.target.value as WorkerRole;
                      let roleNameAr = 'عامل تطهير ونزول مطابق مدرب';
                      if (role === 'driver') roleNameAr = 'سائق معدات ثقيلة ونافورة';
                      if (role === 'technician') roleNameAr = 'فني تشغيل خراطيم وضغط عالي';
                      if (role === 'supervisor') roleNameAr = 'مهندس إشراف وتشغيل ميداني';
                      if (role === 'safety_officer') roleNameAr = 'مسؤول سلامة وصحة مهنية HSE';
                      setFormData({ ...formData, role, roleNameAr });
                    }}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="driver">سائق معدات ثقيلة</option>
                    <option value="technician">فني تشغيل خراطيم / CCTV</option>
                    <option value="laborer">عامل تطهير ونزول مطابق</option>
                    <option value="supervisor">مهندس / مشرف تشغيل</option>
                    <option value="safety_officer">مسؤول سلامة وصحة مهنية</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="01012345678"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">المعدة المسندة (اختياري)</label>
                <input
                  type="text"
                  value={formData.assignedEquipmentCode || ''}
                  onChange={(e) => setFormData({ ...formData, assignedEquipmentCode: e.target.value })}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="مثال: JET-01 أو GRAB-01"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">شهادات السلامة المعتمدة (مفصولة بفاصلة)</label>
                <input
                  type="text"
                  value={formData.safetyCertifications?.join(' ، ')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    safetyCertifications: e.target.value.split('،').map(s => s.trim()).filter(Boolean) 
                  })}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="دخول أماكن مغلقة OSHA ، فحص أجهزة غازات Multi-gas ، إسعافات"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="presentCheck"
                  checked={formData.presentToday}
                  onChange={(e) => setFormData({ ...formData, presentToday: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="presentCheck" className="text-white font-semibold cursor-pointer">
                  تسجيل حاضر في وردية اليوم
                </label>
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
                  {editingWorker ? 'حفظ التعديلات' : 'تسجيل الكادر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
