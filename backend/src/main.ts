import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';

async function bootstrap() {
  // Configuration HTTPS avec certificats auto-signés
  const httpsOptions = {
    key: fs.readFileSync('./ssl/key.pem'),
    cert: fs.readFileSync('./ssl/cert.pem'),
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });
  const allowedOrigins = process.env.VITE_FRONTEND_URL?.split(',') || [
    'https://localhost:5173',
    'https://192.168.1.107:5173',
  ];
  // Configuration CORS pour permettre les requêtes du frontend et tablettes
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
