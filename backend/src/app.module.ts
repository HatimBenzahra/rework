import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { DirecteurModule } from './directeur/directeur.module';
import { ManagerModule } from './manager/manager.module';
import { CommercialModule } from './commercial/commercial.module';
import { ZoneModule } from './zone/zone.module';
import { ImmeubleModule } from './immeuble/immeuble.module';
import { StatisticModule } from './statistic/statistic.module';
import { PorteModule } from './porte/porte.module';
import { AudioMonitoringModule } from './audio-monitoring/audio-monitoring.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
    }),
    DirecteurModule,
    ManagerModule,
    CommercialModule,
    ZoneModule,
    ImmeubleModule,
    StatisticModule,
    PorteModule,
    AudioMonitoringModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
