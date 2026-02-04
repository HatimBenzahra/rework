import { Module } from '@nestjs/common';
import { CreationCompteResolver } from './creation_compte.resolver';
import { CreationCompteService } from './creation_compte.service';

@Module({
  providers: [CreationCompteResolver, CreationCompteService],
  exports: [CreationCompteService],
})
export class CreationCompteModule {}
