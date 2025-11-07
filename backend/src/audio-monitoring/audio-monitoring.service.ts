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

  private roomNameFor(userId: number, userType: string) {
    return `room:${userType.toLowerCase()}:${userId}`;
  }

  /**
   * Démarre une session d'écoute : retourne un token SUBSCRIBER (superviseur).
   */
  async startMonitoring(
    input: StartMonitoringInput,
  ): Promise<LiveKitConnectionDetails> {
    const { userId, userType, supervisorId, roomName } = input;
    const finalRoomName = roomName || this.roomNameFor(userId, userType);

    // Nettoyer les sessions en double du même superviseur pour le même utilisateur
    const existingSessions = Array.from(this.activeSessions.values()).filter(
      (s) =>
        s.userId === userId &&
        s.userType === userType &&
        s.supervisorId === supervisorId,
    );

    for (const session of existingSessions) {
      this.logger.warn(`Cleaning up duplicate session: ${session.id}`);
      this.activeSessions.delete(session.id);
    }

    await this.liveKit.createOrJoinRoom(finalRoomName);

    const supConn = await this.liveKit.generateConnectionDetails(
      finalRoomName,
      `supervisor-${supervisorId}`,
      'subscriber',
    );

    const session: MonitoringSession = {
      id: `session-${Date.now()}`,
      userId,
      userType,
      roomName: finalRoomName,
      status: MonitoringStatus.ACTIVE,
      startedAt: new Date(),
      supervisorId,
      participantToken: supConn.participantToken,
    };

    this.activeSessions.set(session.id, session);
    this.logger.log(
      `Monitoring started for ${userType} ${userId} in ${finalRoomName}`,
    );

    return supConn;
  }

  /**
   * Stoppe une session d'écoute; éjecte le superviseur (optionnel).
   */
  async stopMonitoring(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      this.logger.warn(
        `Monitoring session ${sessionId} already stopped or not found`,
      );
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
    // Nettoyer les sessions fantômes avant de retourner la liste
    await this.cleanupGhostSessions();
    return Array.from(this.activeSessions.values());
  }

  /**
   * Nettoie les sessions où l'utilisateur cible n'est plus dans la room
   */
  private async cleanupGhostSessions(): Promise<void> {
    const rooms = await this.liveKit.listRoomsWithParticipants();
    const sessionsToDelete: string[] = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      // Trouver la room correspondante
      const room = rooms.find((r) => r.roomName === session.roomName);

      if (!room) {
        // La room n'existe plus du tout
        this.logger.warn(
          `Ghost session detected: room ${session.roomName} doesn't exist anymore`,
        );
        sessionsToDelete.push(sessionId);
        continue;
      }

      // Vérifier si l'utilisateur cible est dans la room
      const expectedParticipant = `${session.userType.toLowerCase()}-${session.userId}`;
      const userIsPresent = room.participants.some(
        (p) => p === expectedParticipant,
      );

      if (!userIsPresent) {
        this.logger.warn(
          `Ghost session detected: ${expectedParticipant} not in ${session.roomName}`,
        );
        sessionsToDelete.push(sessionId);
      }
    }

    // Supprimer toutes les sessions fantômes
    for (const sessionId of sessionsToDelete) {
      this.activeSessions.delete(sessionId);
      this.logger.log(`Ghost session ${sessionId} cleaned up`);
    }
  }

  /**
   * Liste fiable des rooms "actives" depuis LiveKit (pas une Map mémoire).
   */
  async getActiveRooms(): Promise<ActiveRoom[]> {
    const rooms = await this.liveKit.listRoomsWithParticipants();
    const active: ActiveRoom[] = [];

    for (const r of rooms) {
      // Détecter les commerciaux et managers en ligne
      const users = r.participants.filter(
        (id) => id.startsWith('commercial-') || id.startsWith('manager-'),
      );
      if (users.length > 0) {
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
    const finalRoomName =
      roomName || this.roomNameFor(commercialId, 'commercial');

    await this.liveKit.createOrJoinRoom(finalRoomName);

    const conn = await this.liveKit.generateConnectionDetails(
      finalRoomName,
      `commercial-${commercialId}`,
      'publisher',
    );

    this.logger.log(
      `Commercial token generated for commercial ${commercialId} (room ${finalRoomName})`,
    );
    return conn;
  }

  /**
   * Génère un token PUBLISHER pour le manager (micro ON côté client).
   */
  async generateManagerToken(
    managerId: number,
    roomName?: string,
  ): Promise<LiveKitConnectionDetails> {
    const finalRoomName = roomName || this.roomNameFor(managerId, 'manager');

    await this.liveKit.createOrJoinRoom(finalRoomName);

    const conn = await this.liveKit.generateConnectionDetails(
      finalRoomName,
      `manager-${managerId}`,
      'publisher',
    );

    this.logger.log(
      `Manager token generated for manager ${managerId} (room ${finalRoomName})`,
    );
    return conn;
  }
}
