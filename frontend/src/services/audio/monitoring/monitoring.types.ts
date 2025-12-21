/**
 * Types for Audio Monitoring Service
 */

export interface TokenResponse {
  serverUrl: string
  participantToken: string
  roomName: string
  participantName: string
}

export interface MonitoringSession {
  id: string
  userId: number
  userType: string
  roomName: string
  status: string
  startedAt: string
  supervisorId: number
}

export interface ActiveRoom {
  roomName: string
  numParticipants: number
  createdAt: string
  participantNames: string[]
}

export interface StopMonitoringInput {
  sessionId: string
}

export interface ConnectionDetails {
  serverUrl: string
  participantToken: string
  roomName: string
  participantName: string
}

export interface LiveKitRoom {
  connect: (serverUrl: string, token: string) => Promise<void>
  disconnect: () => Promise<void>
  localParticipant: {
    identity: string
    publishTrack: (track: MediaStreamTrack) => Promise<void>
    tracks?: Map<string, any>
  }
  participants?: Map<string, any>
  on: (event: string, callback: (...args: any[]) => void) => void
}
