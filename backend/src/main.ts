import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration CORS pour permettre les requêtes du frontend et tablettes
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:3000',
      'http://192.168.1.50:5173',
      'http://192.168.1.50:5174',
      'http://192.168.1.50:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(
    `🚀 Backend running on http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `🌐 Network access: http://192.168.1.50:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📊 GraphQL Playground: http://192.168.1.50:${process.env.PORT ?? 3000}/graphql`,
  );
}
void bootstrap();
