import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NavigationTabs, TabType } from './components/NavigationTabs';
import { DashboardView } from './components/DashboardView';
import { SmartDispatcher } from './components/SmartDispatcher';
import { ManholesView } from './components/ManholesView';
import { PipelinesView } from './components/PipelinesView';
import { EquipmentView } from './components/EquipmentView';
import { WorkforceView } from './components/WorkforceView';
import { DailyLoggingView } from './components/DailyLoggingView';
import { NetworkMapView } from './components/NetworkMapView';
import { EngineeringReportsView } from './components/EngineeringReportsView';
import { MobileReportingView } from './components/MobileReportingView';
import { StandaloneMobilePortal } from './components/StandaloneMobilePortal';
import { QRCodeModal } from './components/QRCodeModal';
import { SmartAlertNotifications, CriticalAlert } from './components/SmartAlertNotifications';
import { incidentService } from './services/incidentService';
import { QrCode } from 'lucide-react';

import { 
  initialManholes, 
  initialPipelines, 
  initialEquipment, 
  initialWorkers, 
  initialFieldLogs, 
  samplePlan,
  initialIncidentTickets
} from './data/mockData';
import { 
  Manhole, 
  Pipeline, 
  Equipment, 
  Worker, 
  FieldLogEntry, 
  DailyPlan,
  IncidentTicket,
  TicketStatus
} from './types/sewage';

export default function App() {
  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Persistent States
  const [manholes, setManholes] = useState<Manhole[]>(() => {
    const saved = localStorage.getItem('sewage_manholes');
    return saved ? JSON.parse(saved) : initialManholes;
  });

  const [pipelines, setPipelines] = useState<Pipeline[]>(() => {
    const saved = localStorage.getItem('sewage_pipelines');
    return saved ? JSON.parse(saved) : initialPipelines;
  });

  const [equipment, setEquipment] = useState<Equipment[]>(() => {
    const saved = localStorage.getItem('sewage_equipment');
    return saved ? JSON.parse(saved) : initialEquipment;
  });

  const [workers, setWorkers] = useState<Worker[]>(() => {
    const saved = localStorage.getItem('sewage_workers');
    return saved ? JSON.parse(saved) : initialWorkers;
  });

  const [fieldLogs, setFieldLogs] = useState<FieldLogEntry[]>(() => {
    const saved = localStorage.getItem('sewage_logs');
    return saved ? JSON.parse(saved) : initialFieldLogs;
  });

  const [currentPlan, setCurrentPlan] = useState<DailyPlan | null>(() => {
    const saved = localStorage.getItem('sewage_plan');
    return saved ? JSON.parse(saved) : samplePlan;
  });

  const [incidentTickets, setIncidentTickets] = useState<IncidentTicket[]>(() => {
    const saved = localStorage.getItem('sewage_incident_tickets');
    return saved ? JSON.parse(saved) : initialIncidentTickets;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('sewage_manholes', JSON.stringify(manholes));
  }, [manholes]);

  useEffect(() => {
    localStorage.setItem('sewage_pipelines', JSON.stringify(pipelines));
  }, [pipelines]);

  useEffect(() => {
    localStorage.setItem('sewage_equipment', JSON.stringify(equipment));
  }, [equipment]);

  useEffect(() => {
    localStorage.setItem('sewage_workers', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('sewage_logs', JSON.stringify(fieldLogs));
  }, [fieldLogs]);

  useEffect(() => {
    if (currentPlan) {
      localStorage.setItem('sewage_plan', JSON.stringify(currentPlan));
    }
  }, [currentPlan]);

  useEffect(() => {
    localStorage.setItem('sewage_incident_tickets', JSON.stringify(incidentTickets));
  }, [incidentTickets]);

  // Standalone Mobile Screen Mode
  const [isStandaloneMobile, setIsStandaloneMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.location.search.includes('view=mobile') || window.location.hash.includes('mobile');
    }
    return false;
  });

  // Real-time synchronization: sync mobile reports to central program
  useEffect(() => {
    // 1. Initial fetch from Express API
    incidentService.getAll().then(serverList => {
      if (serverList && serverList.length > 0) {
        setIncidentTickets(serverList);
      }
    });

    // 2. BroadcastChannel cross-window instant notification
    const unsubscribe = incidentService.subscribe((msg) => {
      if (msg.type === 'NEW_INCIDENT') {
        const newTkt: IncidentTicket = msg.ticket;
        setIncidentTickets(prev => [newTkt, ...prev.filter(t => t.id !== newTkt.id)]);
        
        // Immediate network impact
        if (newTkt.targetManholeCode) {
          setManholes(mPrev => mPrev.map(m => m.code === newTkt.targetManholeCode ? {
            ...m,
            status: 'critical',
            siltLevelPercent: Math.max(m.siltLevelPercent, 88),
          } : m));
        }

        if (newTkt.targetLineCode) {
          setPipelines(pPrev => pPrev.map(p => p.code === newTkt.targetLineCode ? {
            ...p,
            status: 'critical',
            blockagePercent: Math.max(p.blockagePercent, 85),
          } : p));
        }
      }
    });

    // 3. Periodic polling every 3.5s for real-time mobile entries
    const pollInterval = setInterval(() => {
      incidentService.getAll().then(serverList => {
        if (serverList && serverList.length > 0) {
          setIncidentTickets(serverList);
        }
      });
    }, 3500);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  // Global ESC key handler to close windows/modals or return from standalone mobile
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showQrModal) {
          setShowQrModal(false);
        } else if (isStandaloneMobile) {
          setIsStandaloneMobile(false);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('view');
            window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
          }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showQrModal, isStandaloneMobile]);

  // Handlers for Manholes
  const handleAddManhole = (newMh: Manhole) => {
    setManholes(prev => [newMh, ...prev]);
  };

  const handleUpdateManhole = (updatedMh: Manhole) => {
    setManholes(prev => prev.map(m => m.id === updatedMh.id ? updatedMh : m));
  };

  const handleDeleteManhole = (id: string) => {
    setManholes(prev => prev.filter(m => m.id !== id));
  };

  // Handlers for Pipelines
  const handleAddPipeline = (newLine: Pipeline) => {
    setPipelines(prev => [newLine, ...prev]);
  };

  const handleUpdatePipeline = (updatedLine: Pipeline) => {
    setPipelines(prev => prev.map(p => p.id === updatedLine.id ? updatedLine : p));
  };

  const handleDeletePipeline = (id: string) => {
    setPipelines(prev => prev.filter(p => p.id !== id));
  };

  // Handlers for Equipment
  const handleAddEquipment = (newEq: Equipment) => {
    setEquipment(prev => [newEq, ...prev]);
  };

  const handleUpdateEquipment = (updatedEq: Equipment) => {
    setEquipment(prev => prev.map(e => e.id === updatedEq.id ? updatedEq : e));
  };

  // Handlers for Workers
  const handleAddWorker = (newWorker: Worker) => {
    setWorkers(prev => [newWorker, ...prev]);
  };

  const handleUpdateWorker = (updatedWorker: Worker) => {
    setWorkers(prev => prev.map(w => w.id === updatedWorker.id ? updatedWorker : w));
  };

  const handleDeleteWorker = (id: string) => {
    setWorkers(prev => prev.filter(w => w.id !== id));
  };

  // Handlers for Field Execution Logging
  const handleAddLogEntry = (entry: FieldLogEntry) => {
    setFieldLogs(prev => [entry, ...prev]);
  };

  const handleUpdateManholeFromLog = (code: string, depth: number) => {
    setManholes(prev => prev.map(m => {
      if (m.code === code) {
        return {
          ...m,
          status: 'cleaned',
          siltLevelPercent: 15,
          lastCleanedDate: new Date().toISOString().slice(0, 10),
        };
      }
      return m;
    }));
  };

  const handleUpdatePipelineFromLog = (code: string, flushedMeters: number) => {
    setPipelines(prev => prev.map(p => {
      if (p.code === code) {
        return {
          ...p,
          status: 'flushed',
          blockagePercent: 10,
          lastFlushedDate: new Date().toISOString().slice(0, 10),
        };
      }
      return p;
    }));
  };

  // Handlers for Incident Tickets (Mobile & Citizens 125)
  const handleAddIncidentTicket = (ticket: IncidentTicket) => {
    setIncidentTickets(prev => [ticket, ...prev]);

    // Direct synchronization: if ticket is critical or sewage overflow, update the manhole/line immediately
    if (ticket.targetManholeCode) {
      setManholes(prev => prev.map(m => {
        if (m.code === ticket.targetManholeCode) {
          return {
            ...m,
            status: 'critical',
            siltLevelPercent: Math.max(m.siltLevelPercent, 88),
          };
        }
        return m;
      }));
    }

    if (ticket.targetLineCode) {
      setPipelines(prev => prev.map(p => {
        if (p.code === ticket.targetLineCode) {
          return {
            ...p,
            status: 'critical',
            blockagePercent: Math.max(p.blockagePercent, 85),
          };
        }
        return p;
      }));
    }
  };

  const handleUpdateTicketStatus = (
    id: string, 
    newStatus: TicketStatus, 
    assignedEquipment?: string, 
    assignedCrew?: string
  ) => {
    setIncidentTickets(prev => prev.map(t => {
      if (t.id === id) {
        const updated = {
          ...t,
          status: newStatus,
          assignedEquipmentCode: assignedEquipment || t.assignedEquipmentCode,
          assignedCrew: assignedCrew || t.assignedCrew,
          resolvedAt: newStatus === 'resolved' ? new Date().toISOString().slice(0, 16) : t.resolvedAt,
        };

        if (newStatus === 'resolved') {
          if (t.targetManholeCode) {
            setManholes(mPrev => mPrev.map(m => {
              if (m.code === t.targetManholeCode) {
                return {
                  ...m,
                  status: 'cleaned',
                  siltLevelPercent: 12,
                  lastCleanedDate: new Date().toISOString().slice(0, 10),
                };
              }
              return m;
            }));
          }
          if (t.targetLineCode) {
            setPipelines(pPrev => pPrev.map(p => {
              if (p.code === t.targetLineCode) {
                return {
                  ...p,
                  status: 'flushed',
                  blockagePercent: 10,
                  lastFlushedDate: new Date().toISOString().slice(0, 10),
                };
              }
              return p;
            }));
          }
        }

        return updated;
      }
      return t;
    }));
  };

  const handleDeleteIncidentTicket = (id: string) => {
    setIncidentTickets(prev => prev.filter(t => t.id !== id));
  };

  // Reset to initial baseline
  const handleResetData = () => {
    if (confirm('هل ترغب في إعادة تعيين كافة البيانات واستعادة بيانات الشبكة النموذجية؟')) {
      localStorage.clear();
      setManholes(initialManholes);
      setPipelines(initialPipelines);
      setEquipment(initialEquipment);
      setWorkers(initialWorkers);
      setFieldLogs(initialFieldLogs);
      setCurrentPlan(samplePlan);
      setIncidentTickets(initialIncidentTickets);
      setActiveTab('dashboard');
    }
  };

  const criticalManholesCount = manholes.filter(m => m.status === 'critical' || m.siltLevelPercent >= 70).length;
  const criticalLinesCount = pipelines.filter(p => p.status === 'critical' || p.blockagePercent >= 60).length;
  const activeTicketsCount = incidentTickets.filter(t => t.status !== 'resolved').length;

  // Handle quick alert action to navigate or direct crew
  const handleNavigateFromAlert = (type: 'manhole' | 'pipeline', code: string) => {
    if (type === 'manhole') {
      setActiveTab('map');
    } else {
      setActiveTab('map');
    }
  };

  const handleDispatchFromAlert = (alert: CriticalAlert) => {
    setActiveTab('dispatcher');
  };

  // If in standalone mobile field mode, render the dedicated mobile web app!
  if (isStandaloneMobile) {
    return (
      <StandaloneMobilePortal
        manholes={manholes}
        pipelines={pipelines}
        onBackToDesktop={() => {
          setIsStandaloneMobile(false);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('view');
            window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
          }
        }}
        onTicketSubmitted={(ticket) => {
          handleAddIncidentTicket(ticket);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Smart Critical Alerts System */}
      <SmartAlertNotifications
        manholes={manholes}
        pipelines={pipelines}
        onNavigateToElement={handleNavigateFromAlert}
        onDispatchQuickAction={handleDispatchFromAlert}
      />

      {/* System Header */}
      <Header
        manholes={manholes}
        pipelines={pipelines}
        equipment={equipment}
        workers={workers}
        currentPlan={currentPlan}
        onOpenQuickPlan={() => setActiveTab('dispatcher')}
        onOpenMobileReport={() => setActiveTab('mobile')}
        onOpenStandaloneMobile={() => setIsStandaloneMobile(true)}
        onOpenQrModal={() => setShowQrModal(true)}
        onResetData={handleResetData}
        onPrintReport={() => {
          setActiveTab('reports');
          setTimeout(() => window.print(), 300);
        }}
      />

      {/* Main Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        criticalManholesCount={criticalManholesCount}
        criticalLinesCount={criticalLinesCount}
        hasActivePlan={!!currentPlan}
        activeTicketsCount={activeTicketsCount}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            manholes={manholes}
            pipelines={pipelines}
            equipment={equipment}
            workers={workers}
            currentPlan={currentPlan}
            fieldLogs={fieldLogs}
            incidentTickets={incidentTickets}
            onNavigateTab={setActiveTab}
            onOpenDispatcher={() => setActiveTab('dispatcher')}
            onOpenQrModal={() => setShowQrModal(true)}
          />
        )}

        {activeTab === 'dispatcher' && (
          <SmartDispatcher
            manholes={manholes}
            pipelines={pipelines}
            equipment={equipment}
            workers={workers}
            currentPlan={currentPlan}
            incidentTickets={incidentTickets}
            onPlanUpdated={setCurrentPlan}
          />
        )}

        {activeTab === 'mobile' && (
          <MobileReportingView
            tickets={incidentTickets}
            manholes={manholes}
            pipelines={pipelines}
            equipment={equipment}
            onAddTicket={handleAddIncidentTicket}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onDeleteTicket={handleDeleteIncidentTicket}
            onNavigateToMap={(mhCode) => setActiveTab('map')}
            onNavigateToDispatcher={() => setActiveTab('dispatcher')}
            onOpenStandaloneMobile={() => setIsStandaloneMobile(true)}
          />
        )}

        {activeTab === 'manholes' && (
          <ManholesView
            manholes={manholes}
            onAddManhole={handleAddManhole}
            onUpdateManhole={handleUpdateManhole}
            onDeleteManhole={handleDeleteManhole}
          />
        )}

        {activeTab === 'pipelines' && (
          <PipelinesView
            pipelines={pipelines}
            manholes={manholes}
            onAddPipeline={handleAddPipeline}
            onUpdatePipeline={handleUpdatePipeline}
            onDeletePipeline={handleDeletePipeline}
          />
        )}

        {activeTab === 'equipment' && (
          <EquipmentView
            equipment={equipment}
            onAddEquipment={handleAddEquipment}
            onUpdateEquipment={handleUpdateEquipment}
          />
        )}

        {activeTab === 'workforce' && (
          <WorkforceView
            workers={workers}
            onAddWorker={handleAddWorker}
            onUpdateWorker={handleUpdateWorker}
            onDeleteWorker={handleDeleteWorker}
          />
        )}

        {activeTab === 'logging' && (
          <DailyLoggingView
            fieldLogs={fieldLogs}
            manholes={manholes}
            pipelines={pipelines}
            equipment={equipment}
            onAddLogEntry={handleAddLogEntry}
            onUpdateManholeStatus={handleUpdateManholeFromLog}
            onUpdatePipelineStatus={handleUpdatePipelineFromLog}
          />
        )}

        {activeTab === 'map' && (
          <NetworkMapView
            manholes={manholes}
            pipelines={pipelines}
            equipment={equipment}
            incidentTickets={incidentTickets}
            onOpenMobileReport={() => setActiveTab('mobile')}
          />
        )}

        {activeTab === 'reports' && (
          <EngineeringReportsView
            manholes={manholes}
            pipelines={pipelines}
            equipment={equipment}
            workers={workers}
            currentPlan={currentPlan}
            fieldLogs={fieldLogs}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>منظومة إدارة وتخطيط أعمال تطهير وتمليس شبكات الصرف الصحي &copy; {new Date().getFullYear()}</span>
          <span className="font-mono text-[11px] text-slate-400">SewageJet AI v2.4 (مُحدّث بالمعدات الهيدروليكية والميكانيكية)</span>
        </div>
      </footer>

      {/* Floating Quick QR Code Scanner Button (Always accessible) */}
      <div className="fixed bottom-6 left-6 z-40 no-print">
        <button
          onClick={() => setShowQrModal(true)}
          className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5 shadow-2xl shadow-amber-500/40 border-2 border-amber-300 transition-all cursor-pointer hover:scale-105 active:scale-95 group"
          title="فتح ومسح كود QR بكاميرا الهاتف لإرسال البلاغات الميدانية"
        >
          <div className="p-1.5 rounded-xl bg-slate-950 text-amber-400 shadow-md">
            <QrCode className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="text-right leading-tight hidden sm:block">
            <span className="block font-black text-xs text-slate-950">رمز QR للموبايل</span>
            <span className="block text-[10px] text-slate-950/80 font-bold">امسح بالكاميرا لفتح البلاغات 📱</span>
          </div>
        </button>
      </div>

      {/* Global Real Scannable QR Code Modal */}
      <QRCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />

    </div>
  );
}
