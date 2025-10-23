import { Injectable, Logger } from '@nestjs/common';
import { EgressClient } from 'livekit-server-sdk';
import {
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
} from 'livekit-server-sdk';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  RecordingResult,
  RecordingItem,
  EgressState,
  StartRecordingInput,
} from './recording.dto';

@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name);

  private readonly lkHost = process.env.LK_HOST!;
  private readonly lkApiKey = process.env.LK_API_KEY!;
  private readonly lkApiSecret = process.env.LK_API_SECRET!;

  private readonly region = process.env.AWS_REGION || 'eu-west-3';
  private readonly bucket = process.env.S3_BUCKET_NAME!;
  private readonly prefix = process.env.S3_PREFIX || 'recordings/';
  private readonly awsAccessKey = process.env.AWS_ACCESS_KEY_ID!;
  private readonly awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY!;

  private readonly egress = new EgressClient(
    this.lkHost,
    this.lkApiKey,
    this.lkApiSecret,
  );

  // Force l’usage des clés de .env (évite ~/.aws/credentials)
  private readonly s3 = new S3Client({
    region: this.region,
    credentials: {
      accessKeyId: this.awsAccessKey,
      secretAccessKey: this.awsSecretKey,
    },
  });

  private safeRoom(roomName: string) {
    return roomName.replace(/[:]/g, '_');
  }

  private urlCache = new Map<string, { url: string; expiry: number }>();

  private async signedUrlOrUndefined(key: string): Promise<string | undefined> {
    try {
      // Vérifier le cache (URLs valides 50 minutes)
      const cached = this.urlCache.get(key);
      if (cached && Date.now() < cached.expiry) {
        return cached.url;
      }

      // Générer nouvelle URL signée avec headers CORS pour streaming
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentType: 'audio/mp4',
        ResponseCacheControl: 'no-cache',
      });

      const url = await getSignedUrl(this.s3, command, {
        expiresIn: 3600,
      });

      // Mettre en cache (expiry = maintenant + 50 minutes)
      this.urlCache.set(key, {
        url,
        expiry: Date.now() + 50 * 60 * 1000,
      });

      return url;
    } catch {
      return undefined;
    }
  }

  /**
   * Démarre un enregistrement audio-only (par défaut) vers S3.
   * - Si `participantIdentity` est fourni → Participant Egress (cible unique)
   * - Sinon → Room Composite Egress.
   */
  async startRecording(input: StartRecordingInput): Promise<RecordingResult> {
    const { roomName, audioOnly = true, participantIdentity } = input;

    const safe = this.safeRoom(roomName);
    const ts = new Date().toISOString().replace(/[:]/g, '-');

    // OGG (léger). Pour compat Safari, remplace par MP4:
    // fileType: EncodedFileType.MP4, fileKey = `${...}.mp4`
    const fileKey = `${this.prefix}${safe}/${ts}.mp4`;

    const fileOutput = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath: fileKey,
      output: {
        case: 's3',
        value: new S3Upload({
          bucket: this.bucket,
          region: this.region,
          accessKey: this.awsAccessKey,
          secret: this.awsSecretKey,
        }),
      },
    });

    let info: any;
    if (participantIdentity) {
      // Cible uniquement le commercial (ex: "commercial-10")
      info = await this.egress.startParticipantEgress(
        roomName,
        participantIdentity,
        { file: fileOutput }, // EncodedOutputs
        { screenShare: false },
      );
    } else {
      // Room composite (n’enregistre que ce qui est publié)
      info = await this.egress.startRoomCompositeEgress(
        roomName,
        fileOutput, // <- le paramètre "output" requis
        { audioOnly }, // options
      );
    }

    this.logger.log(
      `Recording started: egressId=${info.egressId} room=${roomName} key=${fileKey}`,
    );

    const url = await this.signedUrlOrUndefined(fileKey);

    return {
      egressId: info.egressId,
      roomName,
      status: String(info.status),
      s3Key: fileKey,
      url,
    };
  }

  async stopRecording(egressId: string): Promise<boolean> {
    try {
      await this.egress.stopEgress(egressId);
      return true;
    } catch (e: any) {
      this.logger.warn(`stopRecording(${egressId}): ${e?.message || e}`);
      // Si déjà FAILED/STOPPED, on considère OK pour l’UI
      return false;
    }
  }

  async listRecordings(roomName: string): Promise<RecordingItem[]> {
    const safe = this.safeRoom(roomName);
    const prefix = `${this.prefix}${safe}/`;

    const out: RecordingItem[] = [];

    const resp = await this.s3.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      }),
    );

    for (const obj of resp.Contents || []) {
      if (!obj.Key) continue;
      out.push({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        url: await this.signedUrlOrUndefined(obj.Key),
      });
    }

    // tri décroissant par date
    out.sort(
      (a, b) =>
        (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0),
    );

    return out;
  }

  async egressState(egressId: string): Promise<EgressState> {
    const list = await this.egress.listEgress({ egressId });
    const info: any = list[0];
    if (!info) {
      return { egressId, status: 'UNKNOWN' };
    }
    return {
      egressId: info.egressId || info.id,
      status: String(info.status),
      roomName: info.roomName,
      error: info.error,
    };
  }

  /**
   * Génère une URL optimisée pour le streaming audio
   */
  async getStreamingUrl(key: string): Promise<string> {
    try {
      // URL avec headers optimisés pour streaming
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentType: 'audio/mp4',
        ResponseContentDisposition: 'inline',
      });

      return await getSignedUrl(this.s3, command, {
        expiresIn: 7200, // 2h pour streaming
      });
    } catch (error) {
      this.logger.error(`Erreur génération URL streaming: ${error.message}`);
      throw error;
    }
  }
}
