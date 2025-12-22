import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LiveKitService } from './livekit.service';
import {
  MonitoringSession,
  MonitoringStatus,
  StartMonitoringInput,
  LiveKitConnectionDetails,
  ActiveRoom,
} from './audio-monitoring.dto';

type TargetMeta = {
  id: number;
  type: 'COMMERCIAL' | 'MANAGER';
  managerId?: number | null;
  directeurId?: number | null;
};

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

  private normalizeUserType(userType: string): TargetMeta['type'] {
    const normalized = userType?.toUpperCase();
    if (normalized === 'COMMERCIAL' || normalized === 'MANAGER') {
      return normalized;
    }
    throw new ForbiddenException(`Unsupported user type`);
  }

  private async getTargetMeta(
    userId: number,
    rawUserType: string,
  ): Promise<TargetMeta> {
    const type = this.normalizeUserType(rawUserType);

    switch (type) {
      case 'COMMERCIAL': {
        const commercial = await this.prisma.commercial.findUnique({
          where: { id: userId },
          select: { id: true, managerId: true, directeurId: true },
        });
        if (!commercial) {
          throw new NotFoundException('Commercial not found');
        }
        return {
          id: commercial.id,
          type,
          managerId: commercial.managerId,
          directeurId: commercial.directeurId,
        };
      }

      case 'MANAGER': {
        const manager = await this.prisma.manager.findUnique({
          where: { id: userId },
          select: { id: true, directeurId: true },
        });
        if (!manager) {
          throw new NotFoundException('Manager not found');
        }
        return {
          id: manager.id,
          type,
          directeurId: manager.directeurId,
        };
      }
    }
  }

  private async getTargetFromRoomName(
    roomName: string,
  ): Promise<TargetMeta | null> {
    const parts = roomName.split(':');
    if (parts.length !== 3 || parts[0] !== 'room') {
      return null;
    }

    const [, userType, userIdStr] = parts;
    const userId = Number(userIdStr);
    if (!Number.isFinite(userId)) {
      return null;
    }

    try {
      return await this.getTargetMeta(userId, userType);
    } catch (error) {
      this.logger.debug(
        `Unable to resolve target for room ${roomName}: ${error.message}`,
      );
      return null;
    }
  }

  private canViewRoom(
    target: TargetMeta,
    viewerId: number,
    viewerRole: string,
  ): boolean {
    if (viewerRole === 'admin') {
      return true;
    }

    if (viewerRole === 'directeur') {
      if (target.type === 'MANAGER') {
        return target.directeurId === viewerId;
      }
      if (target.type === 'COMMERCIAL') {
        return target.directeurId === viewerId;
      }
    }

    if (viewerRole === 'manager') {
      if (target.type === 'MANAGER') {
        return target.id === viewerId;
      }
      if (target.type === 'COMMERCIAL') {
        return target.managerId === viewerId;
      }
    }

    if (viewerRole === 'commercial') {
      return target.type === 'COMMERCIAL' && target.id === viewerId;
    }

    return false;
  }

  private ensureMonitoringPermission(
    target: TargetMeta,
    supervisorId: number,
    supervisorRole: string,
  ) {
    // Admin peut tout monitorer
    if (supervisorRole === 'admin') {
      return;
    }

    // Seuls admin et directeur peuvent monitorer
    if (supervisorRole !== 'directeur') {
      throw new ForbiddenException(
        'Only admins and directeurs can monitor users',
      );
    }

    // Directeur peut monitorer ses commerciaux
    if (target.type === 'COMMERCIAL') {
      if (target.directeurId === supervisorId) {
        return;
      }
      throw new ForbiddenException('Cannot monitor this commercial');
    }

    // Directeur peut monitorer ses managers
    if (target.type === 'MANAGER') {
      if (target.directeurId === supervisorId) {
        return;
      }
      throw new ForbiddenException('Cannot monitor this manager');
    }
  }

  private validateRoomName(roomName: string | undefined, target: TargetMeta) {
    const expected = this.roomNameFor(target.id, target.type);
    if (roomName && roomName !== expected) {
      throw new ForbiddenException('Invalid room name for this user');
    }
    return expected;
  }

  /**
   * Démarre une session d'écoute : retourne un token SUBSCRIBER (superviseur).
   */
  async startMonitoring(
    input: StartMonitoringInput,
    currentUser: { id: number; role: string },
  ): Promise<LiveKitConnectionDetails> {
    const supervisorId = currentUser.id;

    const target = await this.getTargetMeta(input.userId, input.userType);
    this.ensureMonitoringPermission(target, supervisorId, currentUser.role);

    const finalRoomName = this.validateRoomName(input.roomName, target);

    // Nettoyer les sessions en double du même superviseur pour le même utilisateur
    const existingSessions = Array.from(this.activeSessions.values()).filter(
      (s) =>
        s.userId === target.id &&
        s.userType === target.type &&
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
      userId: target.id,
      userType: target.type,
      roomName: finalRoomName,
      status: MonitoringStatus.ACTIVE,
      startedAt: new Date(),
      supervisorId,
      participantToken: supConn.participantToken,
    };

    this.activeSessions.set(session.id, session);
    this.logger.log(
      `Monitoring started for ${target.type} ${target.id} in ${finalRoomName}`,
    );

    return supConn;
  }

  /**
   * Stoppe une session d'écoute; éjecte le superviseur (optionnel).
   */
  async stopMonitoring(
    sessionId: string,
    currentUser: { id: number; role: string },
  ): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      this.logger.warn(
        `Monitoring session ${sessionId} already stopped or not found`,
      );
      return true; // Considérer comme succès si déjà arrêtée
    }

    if (
      currentUser.role !== 'admin' &&
      session.supervisorId !== currentUser.id
    ) {
      throw new ForbiddenException('Cannot stop this monitoring session');
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

  async getActiveSessions(currentUser: {
    id: number;
    role: string;
  }): Promise<MonitoringSession[]> {
    // Nettoyer les sessions fantômes avant de retourner la liste
    await this.cleanupGhostSessions();
    const sessions = Array.from(this.activeSessions.values());

    if (currentUser.role === 'admin') {
      return sessions;
    }

    const visibleSessions: MonitoringSession[] = [];

    for (const session of sessions) {
      // Toujours voir ses propres sessions
      if (session.supervisorId === currentUser.id) {
        visibleSessions.push(session);
        continue;
      }

      try {
        const target = await this.getTargetMeta(
          session.userId,
          session.userType,
        );
        if (this.canViewRoom(target, currentUser.id, currentUser.role)) {
          visibleSessions.push(session);
        }
      } catch {
        // Ignore sessions dont la cible n'existe plus
      }
    }

    return visibleSessions;
  }

  /**
   * Nettoie les sessions où l'utilisateur cible n'est plus dans la room
   */
  private async cleanupGhostSessions(): Promise<void> {
    const rooms = await this.liveKit.listRoomsWithParticipants();
    const sessionsToDelete: string[] = [];

    this.logger.debug(
      `🔍 Vérification des sessions fantômes (${this.activeSessions.size} session(s) active(s))`,
    );

    for (const [sessionId, session] of this.activeSessions.entries()) {
      // Trouver la room correspondante
      const room = rooms.find((r) => r.roomName === session.roomName);

      if (!room) {
        // La room n'existe plus du tout
        this.logger.warn(
          `👻 Ghost session détectée: room ${session.roomName} n'existe plus (Session: ${sessionId}, User: ${session.userType}-${session.userId})`,
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
          `👻 Ghost session détectée: ${expectedParticipant} NOT IN ${session.roomName}`,
        );
        this.logger.warn(
          `   ❌ Participant attendu: "${expectedParticipant}" | Participants présents: [${room.participants.join(', ')}]`,
        );
        this.logger.warn(
          `   📊 Session ID: ${sessionId} | User Type: ${session.userType} | User ID: ${session.userId}`,
        );
        sessionsToDelete.push(sessionId);
      } else {
        this.logger.debug(
          `✅ Session valide: ${expectedParticipant} présent dans ${session.roomName}`,
        );
      }
    }

    // Supprimer toutes les sessions fantômes
    if (sessionsToDelete.length > 0) {
      this.logger.log(
        `🧹 Nettoyage de ${sessionsToDelete.length} session(s) fantôme(s)`,
      );
      for (const sessionId of sessionsToDelete) {
        this.activeSessions.delete(sessionId);
        this.logger.log(`   🗑️ Session ${sessionId} supprimée`);
      }
    }
  }

  /**
   * Liste fiable des rooms "actives" depuis LiveKit (pas une Map mémoire).
   */
  async getActiveRooms(currentUser: {
    id: number;
    role: string;
  }): Promise<ActiveRoom[]> {
    const rooms = await this.liveKit.listRoomsWithParticipants();
    const active: ActiveRoom[] = [];

    for (const r of rooms) {
      // Autoriser uniquement les rooms dont l'utilisateur peut surveiller l'owner
      if (currentUser.role !== 'admin') {
        const target = await this.getTargetFromRoomName(r.roomName);
        if (!target) {
          continue;
        }
        if (!this.canViewRoom(target, currentUser.id, currentUser.role)) {
          continue;
        }
      }

      active.push({
        roomName: r.roomName,
        numParticipants: r.participants.length,
        createdAt: r.createdAt,
        participantNames: r.participants,
      });
    }

    active.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return active;
  }

  /**
   * Génère un token PUBLISHER pour le commercial (micro ON côté client).
   */
  async generateCommercialToken(
    requestedCommercialId: number | undefined,
    roomName: string | undefined,
    currentUser?: { id: number; role: string },
  ): Promise<LiveKitConnectionDetails> {
    if (!currentUser) {
      throw new ForbiddenException('Authentication required');
    }

    if (currentUser.role !== 'commercial') {
      throw new ForbiddenException('Only commercials can generate this token');
    }

    if (requestedCommercialId && requestedCommercialId !== currentUser.id) {
      this.logger.warn(
        `⚠️ Commercial ${currentUser.id} attempted to request a token for ${requestedCommercialId}`,
      );
    }

    const target: TargetMeta = {
      id: currentUser.id,
      type: 'COMMERCIAL',
    };

    const finalRoomName = this.validateRoomName(roomName, target);

    this.logger.log(
      `🎤 [COMMERCIAL-${currentUser.id}] Génération token PUBLISHER (room: ${finalRoomName})`,
    );

    await this.liveKit.createOrJoinRoom(finalRoomName);

    const conn = await this.liveKit.generateConnectionDetails(
      finalRoomName,
      `commercial-${currentUser.id}`,
      'publisher',
    );

    this.logger.log(
      `✅ [COMMERCIAL-${currentUser.id}] Token généré - Identity: commercial-${currentUser.id} - ServerUrl: ${conn.serverUrl}`,
    );
    return conn;
  }

  /**
   * Génère un token PUBLISHER pour le manager (micro ON côté client).
   */
  async generateManagerToken(
    requestedManagerId: number | undefined,
    roomName: string | undefined,
    currentUser?: { id: number; role: string },
  ): Promise<LiveKitConnectionDetails> {
    if (!currentUser) {
      throw new ForbiddenException('Authentication required');
    }

    if (currentUser.role !== 'manager') {
      throw new ForbiddenException('Only managers can generate this token');
    }

    if (requestedManagerId && requestedManagerId !== currentUser.id) {
      this.logger.warn(
        `Manager ${currentUser.id} attempted to request a token for ${requestedManagerId}`,
      );
    }

    const target: TargetMeta = {
      id: currentUser.id,
      type: 'MANAGER',
    };

    const finalRoomName = this.validateRoomName(roomName, target);

    await this.liveKit.createOrJoinRoom(finalRoomName);

    const conn = await this.liveKit.generateConnectionDetails(
      finalRoomName,
      `manager-${currentUser.id}`,
      'publisher',
    );

    this.logger.log(
      `Manager token generated for manager ${currentUser.id} (room ${finalRoomName})`,
    );
    return conn;
  }

  /**
   * Log les événements audio du frontend (microphone coupé, erreurs, etc.)
   */
  async logAudioEvent(
    eventType: string,
    message: string,
    details: string | undefined,
    currentUser?: { id: number; role: string },
  ): Promise<boolean> {
    if (!currentUser) {
      return false;
    }

    const userInfo = `[${currentUser.role.toUpperCase()}-${currentUser.id}]`;

    switch (eventType) {
      case 'MICROPHONE_MUTED':
        this.logger.warn(`🔇 ${userInfo} MICROPHONE MUTED: ${message}`);
        break;
      case 'MICROPHONE_UNMUTED':
        this.logger.log(`🔊 ${userInfo} MICROPHONE UNMUTED: ${message}`);
        break;
      case 'MICROPHONE_ENDED':
        this.logger.error(`❌ ${userInfo} MICROPHONE ENDED: ${message}`);
        break;
      case 'TRACK_UNPUBLISHED':
        this.logger.warn(`📤 ${userInfo} TRACK UNPUBLISHED: ${message}`);
        break;
      case 'CONNECTION_ERROR':
        this.logger.error(`❌ ${userInfo} CONNECTION ERROR: ${message}`);
        if (details) {
          this.logger.error(`   Details: ${details}`);
        }
        break;
      case 'WEBSOCKET_FAILED':
        this.logger.error(`🔌 ${userInfo} WEBSOCKET FAILED: ${message}`);
        if (details) {
          this.logger.error(`   Details: ${details}`);
        }
        break;
      default:
        this.logger.debug(`📊 ${userInfo} ${eventType}: ${message}`);
        if (details) {
          this.logger.debug(`   Details: ${details}`);
        }
    }

    return true;
  }
}
