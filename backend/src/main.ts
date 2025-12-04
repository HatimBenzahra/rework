import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  // Fix: Explicitly type the variable so it can be an object or undefined
  let httpsOptions: { key: Buffer; cert: Buffer } | undefined = undefined;

  // On active le HTTPS local seulement si les fichiers existent (Mode Dev)
  if (fs.existsSync('./ssl/key.pem') && fs.existsSync('./ssl/cert.pem')) {
    httpsOptions = {
      key: fs.readFileSync('./ssl/key.pem'),
      cert: fs.readFileSync('./ssl/cert.pem'),
    };
  }

  const app = await NestFactory.create(AppModule, {
    httpsOptions, // Sera 'undefined' en prod -> NestJS démarrera en HTTP simple
  });
  const allowedOrigins = process.env.VITE_FRONTEND_URL?.split(',') || [
    'https://localhost:5173',
    'https://192.168.1.107:5173',
  ];
  // Configuration CORS pour permettre les requêtes du front
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Proxy WebSocket pour LiveKit
  // Permet de convertir WSS (Front) -> WS (LiveKit)
  app.use(
    '/livekit-proxy',
    createProxyMiddleware({
      target: process.env.LK_HOST || 'http://100.68.221.26:7880', // URL du serveur LiveKit
      ws: true, // Active le support WebSocket
      changeOrigin: true,
      pathRewrite: {
        '^/livekit-proxy': '', // Enlever le préfixe lors du transfert
      },
      // @ts-ignore - Type mismatch in library but valid option
      onProxyReqWs: (proxyReq, req, socket) => {
         console.log('🔌 WebSocket Proxy Connection:', req.url);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy Error:', err);
      }
    }),
  );

  await app.listen(3000, '0.0.0.0');
}
void bootstrap();
