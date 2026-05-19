import { createServer } from 'http';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';
import { createApp } from './app';
import { initRealtime } from './services/realtime.service';

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const server = createServer(app);
  initRealtime(server);

  server.listen(env.PORT, () => {
    console.log(`Printtary API running on port ${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
