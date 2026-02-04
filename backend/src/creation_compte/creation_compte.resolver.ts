import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CreationCompteService } from './creation_compte.service';
import { CreerUtilisateurInput, ReponseCreationUtilisateur } from './creation_compte.dto';
import { CreationCompteGuard } from './creation_compte.guard';

@Resolver()
export class CreationCompteResolver {
  constructor(private readonly creationCompteService: CreationCompteService) {}

  @Mutation(() => ReponseCreationUtilisateur)
  @UseGuards(CreationCompteGuard)
  async creerUtilisateurProWin(
    @Args('input') input: CreerUtilisateurInput,
    @Context() context: any,
  ): Promise<ReponseCreationUtilisateur> {
    const adminToken = context.req.user.token;
    return this.creationCompteService.creerCompteProWin(input, adminToken);
  }
}
