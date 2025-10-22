import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LiveKitService } from './livekit.service';
import {
  MonitoringSession,
  MonitoringStatus,
  StartMonitoringInput,
  LiveKitConnectionDetails,
  ActiveRoom,
} from './audio-monitoring.dto';

@Injectable()
export class AudioMonitoringService {
  private readonly logger = new Logger(AudioMonitoringService.name);
  private activeSessions: Map<string, MonitoringSession> = new Map();

  constructor(
    private prisma: PrismaService, // prêt si tu veux persister plus tard
    private liveKit: LiveKitService,
  ) {}

  private roomNameFor(commercialId: number) {
    return `room:commercial:${commercialId}`;
  }

  /**
   * Démarre une session d'écoute : retourne un token SUBSCRIBER (superviseur).
   */
  async startMonitoring(
    input: StartMonitoringInput,
  ): Promise<LiveKitConnectionDetails> {
    const { commercialId, supervisorId, roomName } = input;
    const finalRoomName = roomName || this.roomNameFor(commercialId);

    await this.liveKit.createOrJoinRoom(finalRoomName);

    const supConn = await this.liveKit.generateConnectionDetails(
      finalRoomName,
      `supervisor-${supervisorId}`,
      'subscriber',
    );

    const session: MonitoringSession = {
      id: `session-${Date.now()}`,
      commercialId,
      roomName: finalRoomName,
      status: MonitoringStatus.ACTIVE,
      startedAt: new Date(),
      supervisorId,
      participantToken: supConn.participantToken, // string (plus de Promise<string>)
    };

    this.activeSessions.set(session.id, session);
    this.logger.log(
      `Monitoring started for commercial ${commercialId} in ${finalRoomName}`,
    );

    return supConn;
  }

  /**
   * Stoppe une session d'écoute; éjecte le superviseur (optionnel).
   */
  async stopMonitoring(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      this.logger.warn(`Monitoring session ${sessionId} already stopped or not found`);
      return true; // Considérer comme succès si déjà arrêtée
    }

    session.status = MonitoringStatus.STOPPED;
    session.endedAt = new Date();

    try {
      await this.liveKit.disconnectParticipant(
        session.roomName,
        `supervisor-${session.supervisorId}`,
      );
    } catch {
      // ignore si déjà parti
    }

    this.activeSessions.delete(sessionId);
    this.logger.log(`Monitoring stopped for session ${sessionId}`);
    return true;
  }

  async getActiveSessions(): Promise<MonitoringSession[]> {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Liste fiable des rooms "actives" depuis LiveKit (pas une Map mémoire).
   */
  async getActiveRooms(): Promise<ActiveRoom[]> {
    const rooms = await this.liveKit.listRoomsWithParticipants();
    const active: ActiveRoom[] = [];

    for (const r of rooms) {
      const commercials = r.participants.filter((id) =>
        id.startsWith('commercial-'),
      );
      if (commercials.length > 0) {
        active.push({
          roomName: r.roomName,
          numParticipants: r.participants.length,
          createdAt: r.createdAt,
          participantNames: r.participants,
        });
      }
    }

    active.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return active;
  }

  /**
   * Génère un token PUBLISHER pour le commercial (micro ON côté client).
   */
  async generateCommercialToken(
    commercialId: number,
    roomName?: string,
  ): Promise<LiveKitConnectionDetails> {
    const finalRoomName = roomName || this.roomNameFor(commercialId);

    await this.liveKit.createOrJoinRoom(finalRoomName);

    const conn = await this.liveKit.generateConnectionDetails(
      finalRoomName,
      `commercial-${commercialId}`,
      'publisher',
    );

    this.logger.log(
      `Commercial token generated for commercial ${commercialId} (room ${finalRoomName})`,
    );
    return conn; // participantToken est bien un string
  }

  /**
   * Optionnel : heartbeat no-op (tu peux le garder pour compat)
   */
  async updateCommercialHeartbeat(_commercialId: number): Promise<boolean> {
    return true;
  }
}
