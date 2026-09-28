export type ManholeStatus = 'cleaned' | 'in_progress' | 'needs_cleaning' | 'critical';
export type LineStatus = 'flushed' | 'in_progress' | 'needs_flushing' | 'critical';
export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'breakdown';
export type EquipmentType = 'jetting' | 'grab' | 'vacuum' | 'cctv' | 'rodding';
export type WorkerRole = 'driver' | 'technician' | 'laborer' | 'supervisor' | 'safety_officer';

export interface Manhole {
  id: string;
  code: string; // e.g. MH-101
  depth: number; // in meters (e.g. 2.5, 4.8)
  diameter: number; // in mm (e.g. 1000, 1200)
  location: string; // الحي - الشارع
  zone: string; // المنطقة
  coordinates: {
    lat: number;
    lng: number;
    x: number; // relative map coordinates 0-100%
    y: number;
  };
  siltLevelPercent: number; // 0-100%
  status: ManholeStatus;
  coverType: string; // دكتايل، خرساني، إلخ
  lastCleanedDate?: string;
  notes?: string;
}

export interface Pipeline {
  id: string;
  code: string; // e.g. LINE-101-102
  fromManholeCode: string;
  toManholeCode: string;
  length: number; // in meters
  diameter: number; // in mm (200, 300, 500, 800)
  material: string; // خرسانة مسلحة، فخار، HDPE
  slopePercent: number; // e.g. 0.4%
  blockagePercent: number; // 0-100%
  sedimentType: string; // دهون، رمال، جذور
  recommendedMethod: string; // نافورة ضغط عالي، كباش، تسليك ميكانيكي
  status: LineStatus;
  lastFlushedDate?: string;
  notes?: string;
}

export interface Equipment {
  id: string;
  code: string; // JET-01, GRAB-01, VAC-01, CCTV-01, ROD-01
  name: string;
  type: EquipmentType;
  typeNameAr: string;
  licensePlate: string;
  status: EquipmentStatus;
  technicalSpecs: {
    operatingPressureBar?: number;
    tankCapacityM3?: number;
    maxPipeDiameterMm?: number;
    craneCapacityKg?: number;
    maxDepthMeters?: number;
    cableLengthMeters?: number;
  };
  dailyCapacityNorm: string; // معدل الإنتاجية المعياري اليومي
  dailyCapacityValue: number; // قيمة رقمية للعمليات
  capacityUnit: string; // متر طولي / مطبق
  assignedDriver?: string;
  fuelLevelPercent: number;
  totalRunningHours: number;
  lastMaintenanceDate: string;
}

export interface Worker {
  id: string;
  name: string;
  role: WorkerRole;
  roleNameAr: string;
  phone: string;
  presentToday: boolean;
  assignedEquipmentCode?: string;
  safetyCertifications: string[];
  skills: string[];
}

export interface CrewAssignment {
  crewName: string;
  assignedEquipment: string;
  equipmentType?: string;
  supervisor: string;
  driver?: string;
  technician?: string;
  laborersCount: number;
  targetArea: string;
  workZone?: string;
  assignedManholeCodes: string[];
  assignedLineCodes: string[];
  specificTasks: string[];
  estimatedDurationHours?: number;
}

export interface DailyPlan {
  planId: string;
  date: string;
  planTitle: string;
  executiveSummary: string;
  totalTargetManholes: number;
  totalTargetLinearMeters: number;
  estimatedTotalHours?: number;
  crews: CrewAssignment[];
  safetyInstructions: string[];
  operationalNotes?: string[];
  status: 'draft' | 'approved' | 'in_execution' | 'completed';
  createdAt: string;
}

export interface FieldLogEntry {
  id: string;
  date: string;
  shift: 'صباحي' | 'مسائي' | 'ليلي';
  crewName: string;
  equipmentCode: string;
  cleanedManholes: {
    manholeCode: string;
    actualDepth: number;
    siltRemovedM3: number;
    gasReading: string; // H2S 0ppm, CO 0ppm
  }[];
  flushedLines: {
    lineCode: string;
    flushedLengthMeters: number;
    jettingPressureBar: number;
    resultCondition: string; // ممتاز / سالك تماماً
  }[];
  equipmentRunningHours: number;
  dieselConsumedLiters: number;
  issuesEncountered: string[];
  supervisorName: string;
  timestamp: string;
}

export interface EngineeringReport {
  reportTitle: string;
  overallEvaluationGrade: string;
  completionRateManholes: number;
  completionRateLines: number;
  estimatedSludgeRemovedM3: number;
  executiveSummary: string;
  equipmentAnalysis: {
    equipmentName: string;
    productivityRate: string;
    operatingEfficiency: string;
    remarks?: string;
  }[];
  keyAchievements: string[];
  challengesAndObstacles: string[];
  strategicRecommendations: string[];
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'new' | 'assigned' | 'in_progress' | 'resolved';

export interface IncidentTicket {
  id: string;
  ticketNumber: string; // e.g. TKT-2026-104
  reporterName: string;
  reporterPhone: string;
  reporterRole: 'مواطن / خط ساخن 125' | 'فني ميداني' | 'مراقب شبكات' | 'غرفة العمليات المركزية';
  location: string;
  zone: string;
  issueType: 'طفح مياه صرف في الشارع' | 'انسداد خط انحدار' | 'هبوط أو كسر غطاء مطبق' | 'انبعاث غازات ورائحة كريهة' | 'تراكم مياه أمطار / سيول';
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  targetManholeCode?: string;
  targetLineCode?: string;
  photoUrl?: string;
  gpsCoordinates?: {
    lat: number;
    lng: number;
  };
  recommendedAction?: string;
  assignedEquipmentCode?: string;
  assignedCrew?: string;
  reportedAt: string;
  resolvedAt?: string;
}
