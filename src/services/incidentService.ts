import { IncidentTicket, TicketStatus } from '../types/sewage';

const BROADCAST_CHANNEL_NAME = 'sewage_incidents_channel';

// BroadcastChannel for cross-tab / cross-window instant sync
let channel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this environment');
}

export const incidentService = {
  // Fetch all incidents from server
  async getAll(): Promise<IncidentTicket[]> {
    try {
      const response = await fetch('/api/incidents');
      if (!response.ok) throw new Error('Failed to fetch from server');
      const data = await response.json();
      if (data.success && Array.isArray(data.tickets)) {
        return data.tickets;
      }
      return [];
    } catch (err) {
      console.warn('Could not fetch incidents from server, using local fallback', err);
      const saved = localStorage.getItem('sewage_incident_tickets');
      return saved ? JSON.parse(saved) : [];
    }
  },

  // Send incident from mobile device to central system
  async sendReport(ticketData: Partial<IncidentTicket>): Promise<IncidentTicket> {
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const createdTicket = data.ticket as IncidentTicket;

      // Broadcast to other tabs/screens immediately
      if (channel) {
        channel.postMessage({ type: 'NEW_INCIDENT', ticket: createdTicket });
      }

      return createdTicket;
    } catch (err) {
      console.warn('Offline or server error, creating local ticket and broadcasting', err);
      const ticketNumber = `TKT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const now = new Date();
      const localTicket: IncidentTicket = {
        id: `tkt-${Date.now()}`,
        ticketNumber,
        reporterName: ticketData.reporterName || 'فني ميداني',
        reporterPhone: ticketData.reporterPhone || '01000000000',
        reporterRole: ticketData.reporterRole || 'مراقب شبكات',
        location: ticketData.location || 'موقع ميداني',
        zone: ticketData.zone || 'القطاع الأوسط',
        issueType: ticketData.issueType || 'طفح مياه صرف في الشارع',
        description: ticketData.description || '',
        priority: ticketData.priority || 'critical',
        status: 'new',
        targetManholeCode: ticketData.targetManholeCode,
        targetLineCode: ticketData.targetLineCode,
        photoUrl: ticketData.photoUrl,
        gpsCoordinates: ticketData.gpsCoordinates,
        recommendedAction: ticketData.recommendedAction,
        reportedAt: `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`,
      };

      if (channel) {
        channel.postMessage({ type: 'NEW_INCIDENT', ticket: localTicket });
      }

      return localTicket;
    }
  },

  // Update status on server
  async updateStatus(id: string, updates: Partial<IncidentTicket>): Promise<void> {
    try {
      await fetch(`/api/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (channel) {
        channel.postMessage({ type: 'UPDATE_INCIDENT', id, updates });
      }
    } catch (e) {
      console.warn('Failed to update status on server', e);
    }
  },

  // Delete on server
  async delete(id: string): Promise<void> {
    try {
      await fetch(`/api/incidents/${id}`, {
        method: 'DELETE',
      });

      if (channel) {
        channel.postMessage({ type: 'DELETE_INCIDENT', id });
      }
    } catch (e) {
      console.warn('Failed to delete on server', e);
    }
  },

  // Listen to remote changes
  subscribe(onMessage: (msg: any) => void): () => void {
    if (!channel) return () => {};
    const handler = (event: MessageEvent) => {
      onMessage(event.data);
    };
    channel.addEventListener('message', handler);
    return () => {
      channel?.removeEventListener('message', handler);
    };
  }
};
