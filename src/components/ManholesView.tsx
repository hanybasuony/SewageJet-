import React, { useState, useEffect } from 'react';
import { 
  CircleDot, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Compass, 
  Layers, 
  Edit3, 
  Trash2,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { Manhole, ManholeStatus } from '../types/sewage';

interface ManholesViewProps {
  manholes: Manhole[];
  onAddManhole: (manhole: Manhole) => void;
  onUpdateManhole: (manhole: Manhole) => void;
  onDeleteManhole: (id: string) => void;
}

export const ManholesView: React.FC<ManholesViewProps> = ({
  manholes,
  onAddManhole,
  onUpdateManhole,
  onDeleteManhole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [depthFilter, setDepthFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingManhole, setEditingManhole] = useState<Manhole | null>(null);

  useEffect(() => {
    if (!showAddModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAddModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  // Form State
  const [formData, setFormData] = useState<Partial<Manhole>>({
    code: '',
    depth: 2.5,
    diameter: 1000,
    location: '',
    zone: 'القطاع الأوسط - حي الزهور',
    siltLevelPercent: 50,
    status: 'needs_cleaning',
    coverType: 'حديد دكتايل فئة D400',
    notes: '',
  });

  // Filtered List
  const filteredManholes = manholes.filter(m => {
    const matchesSearch = m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.location.includes(searchTerm) ||
                          m.zone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesDepth = depthFilter === 'all' || 
                         (depthFilter === 'deep' && m.depth >= 3.5) ||
                         (depthFilter === 'shallow' && m.depth < 3.5);
    return matchesSearch && matchesStatus && matchesDepth;
  });

  const handleOpenAdd = () => {
    setEditingManhole(null);
    setFormData({
      code: `MH-${Math.floor(Math.random() * 800 + 100)}`,
      depth: 2.8,
      diameter: 1000,
      location: '',
      zone: 'القطاع الأوسط - حي الزهور',
      siltLevelPercent: 60,
      status: 'needs_cleaning',
      coverType: 'حديد دكتايل فئة D400',
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (mh: Manhole) => {
    setEditingManhole(mh);
    setFormData({ ...mh });
    setShowAddModal(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.depth || !formData.diameter) {
      alert('يرجى ملء جميع الحقول الأساسية (الكود، العمق، القطر)');
      return;
    }

    if (editingManhole) {
      onUpdateManhole({
        ...editingManhole,
        ...formData,
      } as Manhole);
    } else {
      const newMh: Manhole = {
        id: `mh-${Date.now()}`,
        code: formData.code || 'MH-NEW',
        depth: Number(formData.depth),
        diameter: Number(formData.diameter),
        location: formData.location || 'شارع رئيسي',
        zone: formData.zone || 'القطاع الأوسط',
        coordinates: {
          lat: 30.045,
          lng: 31.235,
          x: Math.floor(Math.random() * 70 + 15),
          y: Math.floor(Math.random() * 70 + 15),
        },
        siltLevelPercent: Number(formData.siltLevelPercent) || 50,
        status: (formData.status as ManholeStatus) || 'needs_cleaning',
        coverType: formData.coverType || 'حديد دكتايل',
        notes: formData.notes || '',
        lastCleanedDate: formData.status === 'cleaned' ? new Date().toISOString().slice(0, 10) : undefined,
      };
      onAddManhole(newMh);
    }
    setShowAddModal(false);
  };

  const getStatusBadge = (status: ManholeStatus) => {
    switch (status) {
      case 'cleaned':
        return <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> تم التطهير</span>;
      case 'in_progress':
        return <span className="bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> جاري العمل</span>;
      case 'critical':
        return <span className="bg-rose-950 text-rose-300 border border-rose-800/60 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> ترسيب حرج</span>;
      default:
        return <span className="bg-amber-950 text-amber-300 border border-amber-800/60 text-[11px] px-2.5 py-0.5 rounded-full font-bold">بحاجة لتطهير</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <CircleDot className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-black text-white">قاعدة بيانات مطابق الصرف الصحي (Manholes Database)</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              تسجيل ومتابعة أعماق وأقطار ونسب الترسيب للمطابق وموقعها الجغرافي لتحديد الحاجة لكباش التطهير أو طلمبات الكسح.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-cyan-600 hover:bg-cyan-700 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل مطبق جديد</span>
          </button>
        </div>

        {/* Filters and Search Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث برقم المطبق، الشارع، أو الحي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-850 border border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-850 border border-slate-700 rounded-xl px-3 py-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 whitespace-nowrap">الحالة:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all">كافة الحالات ({manholes.length})</option>
              <option value="critical">حرجة فقط</option>
              <option value="needs_cleaning">بحاجة لتطهير</option>
              <option value="in_progress">جاري العمل</option>
              <option value="cleaned">تم التطهير</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-850 border border-slate-700 rounded-xl px-3 py-1.5">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 whitespace-nowrap">العمق:</span>
            <select
              value={depthFilter}
              onChange={(e) => setDepthFilter(e.target.value)}
              className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all">جميع الأعماق</option>
              <option value="deep">مطابق عميقة (&gt; 3.5م - تتطلب كباش)</option>
              <option value="shallow">مطابق عادية (&lt; 3.5م)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Manholes Data Grid Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-850 text-slate-300 border-b border-slate-800">
                <th className="p-3.5 font-bold">كود المطبق</th>
                <th className="p-3.5 font-bold">العمق والقطر</th>
                <th className="p-3.5 font-bold">الموقع الجغرافي والحي</th>
                <th className="p-3.5 font-bold">نسبة الترسيب والحمأة</th>
                <th className="p-3.5 font-bold">الآلية الموصى بها</th>
                <th className="p-3.5 font-bold">حالة المطبق</th>
                <th className="p-3.5 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredManholes.map((mh) => {
                const isDeep = mh.depth >= 3.5;
                return (
                  <tr key={mh.id} className="hover:bg-slate-850/60 transition-colors">
                    
                    {/* Code & Cover */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-white text-sm bg-slate-800 px-2 py-1 rounded border border-slate-700">
                          {mh.code}
                        </span>
                        {isDeep && (
                          <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-bold" title="مطبق عميق يتطلب ونش كباش ومهمات دخول الأماكن المغلقة">
                            عميق
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-1">{mh.coverType}</span>
                    </td>

                    {/* Depth & Diameter */}
                    <td className="p-3.5">
                      <div className="font-bold text-white">
                        العمق: <span className={isDeep ? 'text-amber-400 font-black' : 'text-slate-200'}>{mh.depth} م</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        القطر: {mh.diameter} مم
                      </div>
                    </td>

                    {/* Location */}
                    <td className="p-3.5">
                      <div className="flex items-start gap-1 text-slate-200 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{mh.location}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 pr-4 mt-0.5 font-mono">
                        {mh.zone}
                      </div>
                    </td>

                    {/* Silt Level with Gauge */}
                    <td className="p-3.5 min-w-[140px]">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                        <span className="text-slate-400">منسوب الرواسب:</span>
                        <span className={`font-bold ${mh.siltLevelPercent >= 70 ? 'text-rose-400' : mh.siltLevelPercent >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {mh.siltLevelPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            mh.siltLevelPercent >= 70 
                              ? 'bg-rose-500' 
                              : mh.siltLevelPercent >= 40 
                              ? 'bg-amber-500' 
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${mh.siltLevelPercent}%` }}
                        />
                      </div>
                    </td>

                    {/* Recommended Machinery */}
                    <td className="p-3.5">
                      {isDeep ? (
                        <div className="text-amber-300 font-semibold text-[11px] flex items-center gap-1">
                          <span>كباش تطهير (Grab) + كسح</span>
                        </div>
                      ) : (
                        <div className="text-cyan-300 font-semibold text-[11px] flex items-center gap-1">
                          <span>نافورة ضغط عالي + شفط</span>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-500 block">
                        {mh.notes || 'تطهير وقائي دوري'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      {getStatusBadge(mh.status)}
                      {mh.lastCleanedDate && (
                        <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                          آخر تطهير: {mh.lastCleanedDate}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(mh)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                          title="تعديل بيانات المطبق"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف المطبق ${mh.code}؟`)) {
                              onDeleteManhole(mh.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="حذف المطبق"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredManholes.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs">
              لا توجد مطابق مطابقة لمعايير البحث الحالية.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
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
                {editingManhole ? `تعديل بيانات المطبق: ${editingManhole.code}` : 'تسجيل مطبق صرف صحي جديد'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">كود المطبق *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                    placeholder="مثال: MH-106"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">العمق بالمتر (Depth) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="15"
                    required
                    value={formData.depth}
                    onChange={(e) => setFormData({ ...formData, depth: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">القطر بالملليمتر (Diameter) *</label>
                  <input
                    type="number"
                    step="50"
                    min="600"
                    max="3000"
                    required
                    value={formData.diameter}
                    onChange={(e) => setFormData({ ...formData, diameter: parseInt(e.target.value) || 1000 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">نسبة الترسيب والحمأة (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.siltLevelPercent}
                    onChange={(e) => setFormData({ ...formData, siltLevelPercent: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">الموقع الجغرافي (الشارع والتقاطع)</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500 font-sans"
                  placeholder="مثال: شارع التحرير - تقاطع شارع النادي"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">الحي / المنطقة (Zone)</label>
                  <input
                    type="text"
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">نوع الغطاء (Cover)</label>
                  <select
                    value={formData.coverType}
                    onChange={(e) => setFormData({ ...formData, coverType: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="حديد دكتايل فئة D400">حديد دكتايل فئة D400</option>
                    <option value="خرساني مسلح ثقيل">خرساني مسلح ثقيل</option>
                    <option value="مركب Composite GRP">مركب Composite GRP</option>
                    <option value="حديد زهر رمادي">حديد زهر رمادي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">حالة المطبق التشغيلية</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ManholeStatus })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500 font-semibold"
                >
                  <option value="needs_cleaning">بحاجة لتطهير</option>
                  <option value="critical">ترسيب حرج (أولوية قصوى)</option>
                  <option value="in_progress">جاري العمل والتطهير</option>
                  <option value="cleaned">تم التطهير بالكامل</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">ملاحظات فنية ومعوقات ميدانية</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  placeholder="مثال: ترسبات حجرية، وجود كسر في درجات السلم، إلخ..."
                />
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
                  className="bg-cyan-600 hover:bg-cyan-700 text-slate-950 font-bold px-5 py-2 rounded-xl cursor-pointer"
                >
                  {editingManhole ? 'حفظ التعديلات' : 'إضافة المطبق'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
