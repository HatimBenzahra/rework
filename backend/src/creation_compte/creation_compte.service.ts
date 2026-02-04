import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  CreerUtilisateurInput,
  ReponseCreationUtilisateur,
  RoleUtilisateur,
} from './creation_compte.dto';

@Injectable()
export class CreationCompteService {
  private readonly logger = new Logger(CreationCompteService.name);

  private readonly KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL!;
  private readonly REALM = process.env.KEYCLOAK_REALM!;
  private readonly ROLE_TO_GROUP: Record<RoleUtilisateur, string> = {
    [RoleUtilisateur.DIRECTEUR]: 'Prospection-Directeur',
    [RoleUtilisateur.MANAGER]: 'Prospection-Manager',
    [RoleUtilisateur.COMMERCIAL]: 'Prospection-Commercial',
  };

  async creerCompteProWin(
    input: CreerUtilisateurInput,
    adminToken: string,
  ): Promise<ReponseCreationUtilisateur> {
    try {
      // 1. Generate random password
      const password = this.genererMotDePasseAleatoire();

      // 3. Create user in Keycloak
      const userId = await this.creerUtilisateurKeycloak(adminToken, {
        email: input.email,
        firstName: input.prenom,
        lastName: input.nom,
        password,
      });

      // 4. Assign group based on role
      await this.assignerUtilisateurAuGroupe(
        adminToken,
        userId,
        this.ROLE_TO_GROUP[input.role],
      );

      this.logger.log(
        `✅ User ${input.email} created with role ${input.role}`,
      );

      return { success: true, password, userId };
    } catch (error: any) {
      this.logger.error(`❌ Failed to create user: ${error.message}`);

      if (error.response?.status === 409) {
        throw new BadRequestException(
          'Un utilisateur avec cet email existe déjà',
        );
      }

      throw new BadRequestException(
        error.message || 'Erreur lors de la création du compte',
      );
    }
  }



  private genererMotDePasseAleatoire(length = 12): string {
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    return Array.from(crypto.randomBytes(length))
      .map((byte) => chars[byte % chars.length])
      .join('');
  }

  private async creerUtilisateurKeycloak(
    token: string,
    user: {
      email: string;
      firstName: string;
      lastName: string;
      password: string;
    },
  ): Promise<string> {
    const response = await axios.post(
      `${this.KEYCLOAK_BASE_URL}/admin/realms/${this.REALM}/users`,
      {
        username: user.email,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        enabled: true,
        emailVerified: true,
        credentials: [
          {
            type: 'password',
            value: user.password,
            temporary: false,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // Get user ID from Location header
    const location = response.headers.location;
    return location.split('/').pop();
  }

  private async assignerUtilisateurAuGroupe(
    token: string,
    userId: string,
    groupName: string,
  ): Promise<void> {
    // Les groupes Prospection-* sont des sous-groupes de /Prospection
    // D'abord trouver le groupe parent "Prospection"
    const groupsResponse = await axios.get(
      `${this.KEYCLOAK_BASE_URL}/admin/realms/${this.REALM}/groups?search=Prospection`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const parentGroup = groupsResponse.data.find(
      (g: any) => g.name === 'Prospection',
    );
    if (!parentGroup) {
      throw new Error('Groupe parent Prospection non trouvé dans Keycloak');
    }

    // Récupérer les sous-groupes
    const childrenResponse = await axios.get(
      `${this.KEYCLOAK_BASE_URL}/admin/realms/${this.REALM}/groups/${parentGroup.id}/children`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const group = childrenResponse.data.find(
      (g: any) => g.name === groupName,
    );
    if (!group) {
      throw new Error(`Groupe ${groupName} non trouvé dans Keycloak`);
    }

    // Assigner l'utilisateur au groupe
    await axios.put(
      `${this.KEYCLOAK_BASE_URL}/admin/realms/${this.REALM}/users/${userId}/groups/${group.id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }
}
