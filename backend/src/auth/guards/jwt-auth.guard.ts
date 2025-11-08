import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma.service';
import axios from 'axios';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL;
  private readonly REALM = process.env.KEYCLOAK_REALM;
  private readonly CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID as string;
  private readonly CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET as string;

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const ctx = gqlContext.getContext();
    const request = ctx.req;

    // Extraire le token du header Authorization
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Token manquant');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Token invalide');
    }

    try {
      // Valider le token avec Keycloak
      const decodedToken = await this.validateTokenWithKeycloak(token);

      // Extraire les groupes/rôles
      const groups = this.extractGroups(decodedToken);
      const role = this.mapGroupToRole(groups);

      // Récupérer l'ID de la base de données selon le rôle
      const userId = await this.getUserIdByEmailAndRole(
        decodedToken.email,
        role,
      );

      // Attacher les informations utilisateur au contexte
      request.user = {
        sub: decodedToken.sub,
        email: decodedToken.email,
        groups,
        role,
        id: userId, // ID de la base de données
      };

      this.logger.debug(
        `✅ Utilisateur authentifié: ${request.user.email} (${request.user.role}) - ID: ${userId}`,
      );

      return true;
    } catch (error) {
      this.logger.error('❌ Erreur validation token:', error.message);
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }

  private async validateTokenWithKeycloak(token: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('client_id', this.CLIENT_ID);
    params.append('client_secret', this.CLIENT_SECRET);
    params.append('token', token);

    try {
      const response = await axios.post(
        `${this.KEYCLOAK_BASE_URL}/realms/${this.REALM}/protocol/openid-connect/token/introspect`,
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      if (!response.data.active) {
        throw new UnauthorizedException('Token expiré');
      }

      return response.data;
    } catch (error) {
      throw new UnauthorizedException('Impossible de valider le token');
    }
  }

  private extractGroups(decodedToken: any): string[] {
    return (
      decodedToken.groups ||
      decodedToken.realm_access?.roles ||
      decodedToken.resource_access?.[this.CLIENT_ID]?.roles ||
      []
    );
  }

  private mapGroupToRole(groups: string[]): string {
    const groupToRoleMap = {
      'Prospection-Admin': 'admin',
      'Prospection-Directeur': 'directeur',
      'Prospection-Manager': 'manager',
      'Prospection-Commercial': 'commercial',
    };

    for (const group of groups) {
      if (groupToRoleMap[group]) {
        return groupToRoleMap[group];
      }
    }

    throw new UnauthorizedException('Aucun rôle autorisé');
  }

  /**
   * Récupère l'ID de la base de données selon l'email et le rôle
   */
  private async getUserIdByEmailAndRole(
    email: string,
    role: string,
  ): Promise<number> {
    try {
      switch (role) {
        case 'commercial': {
          const commercial = await this.prisma.commercial.findUnique({
            where: { email },
            select: { id: true },
          });
          if (!commercial) {
            throw new UnauthorizedException(
              'Commercial introuvable dans la base',
            );
          }
          return commercial.id;
        }

        case 'manager': {
          const manager = await this.prisma.manager.findUnique({
            where: { email },
            select: { id: true },
          });
          if (!manager) {
            throw new UnauthorizedException('Manager introuvable dans la base');
          }
          return manager.id;
        }

        case 'directeur': {
          const directeur = await this.prisma.directeur.findUnique({
            where: { email },
            select: { id: true },
          });
          if (!directeur) {
            throw new UnauthorizedException(
              'Directeur introuvable dans la base',
            );
          }
          return directeur.id;
        }

        case 'admin': {
          // Pour les admins, on retourne 0 (pas d'ID spécifique)
          return 0;
        }

        default:
          throw new UnauthorizedException('Rôle non reconnu');
      }
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors de la récupération de l'ID utilisateur:`,
        error,
      );
      throw error;
    }
  }
}
