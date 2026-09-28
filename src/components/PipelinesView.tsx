import React, { useState, useEffect } from 'react';
import { 
  GitCommit, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Edit3, 
  Trash2, 
  Wrench, 
  Droplet,
  Compass
} from 'lucide-react';
import { Pipeline, LineStatus, Manhole } from '../types/sewage';

interface PipelinesViewProps {
  pipelines: Pipeline[];
  manholes: Manhole[];
  onAddPipeline: (pipeline: Pipeline) => void;
  onUpdatePipeline: (pipeline: Pipeline) => void;
  onDeletePipeline: (id: string) => void;
}

export const PipelinesView: React.FC<PipelinesViewProps> = ({
  pipelines,
  manholes,
  onAddPipeline,
  onUpdatePipeline,
  onDeletePipeline
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [diameterFilter, setDiameterFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLine, setEditingLine] = useState<Pipeline | null>(null);

  useEffect(() => {
    if (!showAddModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAddModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  const [formData, setFormData] = useState<Partial<Pipeline>>({
    code: '',
    fromManholeCode: 'MH-101',
    toManholeCode: 'MH-102',
    length: 60,
    diameter: 300,
    material: 'فخار لعابي Vitrified Clay',
    slopePercent: 0.35,
    blockagePercent: 50,
    sedimentType: 'رواسب رملية وحصوية',
    recommendedMethod: 'نافورة ضغط عالي (Jetting 180 bar)',
    status: 'needs_flushing',
    notes: '',
  });

  const filteredPipelines = pipelines.filter(p => {
    const matchesSearch = p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.fromManholeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.toManholeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.sedimentType.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesDiameter = diameterFilter === 'all' ||
                            (diameterFilter === 'large' && p.diameter >= 400) ||
                            (diameterFilter === 'standard' && p.diameter < 400);
    return matchesSearch && matchesStatus && matchesDiameter;
  });

  const handleOpenAdd = () => {
    setEditingLine(null);
    setFormData({
      code: `LINE-${Math.floor(Math.random() * 800 + 100)}`,
      fromManholeCode: manholes[0]?.code || 'MH-101',
      toManholeCode: manholes[1]?.code || 'MH-102',
      length: 65,
      diameter: 300,
      material: 'فخار لعابي Vitrified Clay',
      slopePercent: 0.35,
      blockagePercent: 60,
      sedimentType: 'رواسب رملية وحصوية',
      recommendedMethod: 'نافورة ضغط عالي (Jetting 180 bar)',
      status: 'needs_flushing',
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (line: Pipeline) => {
    setEditingLine(line);
    setFormData({ ...line });
    setShowAddModal(true);
  };

  const calculateRecommendedMethod = (diameter: number, blockage: number, sediment: string) => {
    if (sediment.includes('جذور') || (sediment.includes('شحوم') && blockage >= 70)) {
      return 'تسليك وتمليس ميكانيكي (Rodding Winch) يتبعه غسيل نافورة';
    }
    if (diameter >= 400) {
      return 'سيارة نافورة ضغط عالي (220 bar) بفوهة نفاثة ثقيلة';
    }
    return 'نافورة ضغط عالي (Jetting 180 bar)';
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.length || !formData.diameter) {
      alert('يرجى استكمال الحقول الأساسية (الكود، الطول، القطر)');
      return;
    }

    const calculatedMethod = calculateRecommendedMethod(
      Number(formData.diameter) || 300,
      Number(formData.blockagePercent) || 50,
      formData.sedimentType || 'رواسب رملية'
    );

    if (editingLine) {
      onUpdatePipeline({
        ...editingLine,
        ...formData,
        recommendedMethod: calculatedMethod,
      } as Pipeline);
    } else {
      const newLine: Pipeline = {
        id: `pipe-${Date.now()}`,
        code: formData.code || 'LINE-NEW',
        fromManholeCode: formData.fromManholeCode || 'MH-101',
        toManholeCode: formData.toManholeCode || 'MH-102',
        length: Number(formData.length) || 50,
        diameter: Number(formData.diameter) || 300,
        material: formData.material || 'فخار لعابي',
        slopePercent: Number(formData.slopePercent) || 0.3,
        blockagePercent: Number(formData.blockagePercent) || 50,
        sedimentType: formData.sedimentType || 'رواسب رملية',
        recommendedMethod: calculatedMethod,
        status: (formData.status as LineStatus) || 'needs_flushing',
        notes: formData.notes || '',
        lastFlushedDate: formData.status === 'flushed' ? new Date().toISOString().slice(0, 10) : undefined,
      };
      onAddPipeline(newLine);
    }
    setShowAddModal(false);
  };

  const getStatusBadge = (status: LineStatus) => {
    switch (status) {
      case 'flushed':
        return <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> تم التمليس</span>;
      case 'in_progress':
        return <span className="bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> جاري التمليس</span>;
      case 'critical':
        return <span className="bg-rose-950 text-rose-300 border border-rose-800/60 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> سدد حرج</span>;
      default:
        return <span className="bg-amber-950 text-amber-300 border border-amber-800/60 text-[11px] px-2.5 py-0.5 rounded-full font-bold">يحتاج تمليس</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <GitCommit className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-black text-white">إدارة خطوط ومواسير الصرف الصحي (Sewer Pipelines)</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              تسجيل ومتابعة أطوال وأقطار الخطوط ونسب الانسداد ونوعية الرواسب لتحديد ضغط النافورة ورؤوس التمليس المناسبة.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 fill-slate-950" />
            <span>تسجيل خط انحدار جديد</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث بكود الخط أو كود المطبق الرابط..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-850 border border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
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
              <option value="all">كافة الخطوط ({pipelines.length})</option>
              <option value="critical">انسداد حرج</option>
              <option value="needs_flushing">بحاجة لتمليس</option>
              <option value="in_progress">جاري التمليس</option>
              <option value="flushed">تم التمليس</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-850 border border-slate-700 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 whitespace-nowrap">القطر الاسمي:</span>
            <select
              value={diameterFilter}
              onChange={(e) => setDiameterFilter(e.target.value)}
              className="w-full bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all">جميع الأقطار</option>
              <option value="large">أقطار كبيرة (&gt;= 400مم - خطوط رئيسية)</option>
              <option value="standard">أقطار عادية (&lt; 400مم - خطوط فرعية)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Pipelines Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-850 text-slate-300 border-b border-slate-800">
                <th className="p-3.5 font-bold">كود الخط ومساره</th>
                <th className="p-3.5 font-bold">الطول والقطر</th>
                <th className="p-3.5 font-bold">مادة الماسورة والميل</th>
                <th className="p-3.5 font-bold">نسبة الانسداد ونوع الترسيب</th>
                <th className="p-3.5 font-bold">طريقة التمليس الهندسية</th>
                <th className="p-3.5 font-bold">الحالة</th>
                <th className="p-3.5 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredPipelines.map((line) => {
                const isLarge = line.diameter >= 400;
                return (
                  <tr key={line.id} className="hover:bg-slate-850/60 transition-colors">
                    
                    {/* Code & Path */}
                    <td className="p-3.5">
                      <div className="font-mono font-black text-white text-sm">
                        {line.code}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-slate-400">
                        <span className="text-cyan-300 font-bold">{line.fromManholeCode}</span>
                        <span>←</span>
                        <span className="text-amber-300 font-bold">{line.toManholeCode}</span>
                      </div>
                    </td>

                    {/* Length & Diameter */}
                    <td className="p-3.5">
                      <div className="font-bold text-white">
                        الطول: <span className="text-amber-400 font-mono">{line.length} م.ط</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono">
                        القطر: <span className={isLarge ? 'text-purple-400 font-bold' : ''}>Ø{line.diameter} مم</span>
                      </div>
                    </td>

                    {/* Material & Slope */}
                    <td className="p-3.5">
                      <div className="text-slate-200 font-medium">{line.material}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        الانحدار: {line.slopePercent}%
                      </div>
                    </td>

                    {/* Blockage Level */}
                    <td className="p-3.5 min-w-[150px]">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                        <span className="text-slate-400">الانسداد:</span>
                        <span className={`font-bold ${line.blockagePercent >= 60 ? 'text-rose-400' : line.blockagePercent >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {line.blockagePercent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            line.blockagePercent >= 60 
                              ? 'bg-rose-500' 
                              : line.blockagePercent >= 40 
                              ? 'bg-amber-500' 
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${line.blockagePercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {line.sedimentType}
                      </span>
                    </td>

                    {/* Recommended Cleaning Method */}
                    <td className="p-3.5">
                      <div className="text-cyan-300 font-bold text-[11px] leading-tight">
                        {line.recommendedMethod}
                      </div>
                      {line.notes && (
                        <span className="text-[10px] text-slate-500 block mt-1">
                          {line.notes}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      {getStatusBadge(line.status)}
                      {line.lastFlushedDate && (
                        <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                          آخر تمليس: {line.lastFlushedDate}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(line)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                          title="تعديل بيانات الخط"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف الخط ${line.code}؟`)) {
                              onDeletePipeline(line.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="حذف الخط"
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

          {filteredPipelines.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs">
              لا توجد خطوط مواسير مطابقة لمعايير البحث.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Pipeline Modal */}
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
                {editingLine ? `تعديل بيانات الخط: ${editingLine.code}` : 'تسجيل خط انحدار جديد'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">كود الخط *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  placeholder="مثال: LINE-105-106"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">المطبق البداية (From)</label>
                  <select
                    value={formData.fromManholeCode}
                    onChange={(e) => setFormData({ ...formData, fromManholeCode: e.target.value })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  >
                    {manholes.map(m => (
                      <option key={m.id} value={m.code}>{m.code} - {m.location}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">المطبق النهاية (To)</label>
                  <select
                    value={formData.toManholeCode}
                    onChange={(e) => setFormData({ ...formData, toManholeCode: e.target.value })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  >
                    {manholes.map(m => (
                      <option key={m.id} value={m.code}>{m.code} - {m.location}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">طول الخط بالأمتار (Length) *</label>
                  <input
                    type="number"
                    step="1"
                    min="5"
                    max="500"
                    required
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">القطر الاسمي بالملليمتر (Diameter) *</label>
                  <select
                    value={formData.diameter}
                    onChange={(e) => setFormData({ ...formData, diameter: parseInt(e.target.value) || 300 })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  >
                    <option value={200}>200 مم (فرعي 8 بوصة)</option>
                    <option value={250}>250 مم (10 بوصة)</option>
                    <option value={300}>300 مم (12 بوصة)</option>
                    <option value={400}>400 مم (16 بوصة)</option>
                    <option value={500}>500 مم (20 بوصة)</option>
                    <option value={600}>600 مم (24 بوصة)</option>
                    <option value={800}>800 مم (رئيسي 32 بوصة)</option>
                    <option value={1000}>1000 مم (مجمع رئيسي)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">مادة صنع الماسورة (Material)</label>
                  <select
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="خرسانة مسلحة RC">خرسانة مسلحة RC</option>
                    <option value="فخار لعابي Vitrified Clay">فخار لعابي Vitrified Clay</option>
                    <option value="بولي إيثيلين HDPE">بولي إيثيلين HDPE</option>
                    <option value="ألياف زجاجية GRP">ألياف زجاجية GRP</option>
                    <option value="بلاستيك uPVC">بلاستيك uPVC</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">نسبة الانسداد (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.blockagePercent}
                    onChange={(e) => setFormData({ ...formData, blockagePercent: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">نوع الرواسب المسببة للانسداد</label>
                <select
                  value={formData.sedimentType}
                  onChange={(e) => setFormData({ ...formData, sedimentType: e.target.value })}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="رواسب رملية وحصوية">رواسب رملية وحصوية</option>
                  <option value="شحوم ودهون مطاعم متصلبة">شحوم ودهون مطاعم متصلبة</option>
                  <option value="حمأة طينية ثقيلة">حمأة طينية ثقيلة</option>
                  <option value="جذور أشجار متغلغلة">جذور أشجار متغلغلة</option>
                  <option value="مخلفات بناء صلبة">مخلفات بناء صلبة</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">حالة الخط</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as LineStatus })}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="needs_flushing">بحاجة لتمليس</option>
                  <option value="critical">انسداد حرج</option>
                  <option value="in_progress">جاري التمليس</option>
                  <option value="flushed">تم التمليس بالكامل</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">ملاحظات تشغيلية</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                  placeholder="ملاحظات حول التدفق، الميول، أو الضغوط المطلوبة..."
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
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2 rounded-xl cursor-pointer"
                >
                  {editingLine ? 'حفظ التعديلات' : 'إضافة الخط'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
