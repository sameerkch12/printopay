import { createServer } from 'http';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';
import { createApp } from './app';
import { startExpiredDocumentCleanup } from './services/documentCleanup.service';
import { saveErrorLog } from './services/errorLog.service';
import { startKeepAlive } from './services/keepAlive.service';
import { initRealtime } from './services/realtime.service';

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const server = createServer(app);
  initRealtime(server);
  await startExpiredDocumentCleanup();
  const keepAliveTimer = startKeepAlive();

  server.listen(env.PORT, () => {
    console.log(`PrintoPay API running on port ${env.PORT}`);
  });

  let shuttingDown = false;

  const shutdown = async (signal: string, exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`${signal} received, shutting down`);
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
    }

    const forceExit = setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(exitCode);
    }, 10_000);
    forceExit.unref();

    server.close(async () => {
      try {
        await disconnectDatabase();
      } finally {
        clearTimeout(forceExit);
        process.exit(exitCode);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  const fatalShutdown = async (event: 'unhandledRejection' | 'uncaughtException', reason: unknown) => {
    if (shuttingDown) return;

    const error = reason instanceof Error ? reason : new Error(String(reason));
    console.error(event, error);

    try {
      await saveErrorLog({
        source: 'backend',
        severity: 'fatal',
        message: error.message,
        stack: error.stack,
        metadata: { event },
      });
    } catch (logError) {
      console.error('Failed to save fatal error log', logError);
    }

    await shutdown(event, 1);
  };

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection', reason);
    fatalShutdown('unhandledRejection', reason).catch(() => process.exit(1));
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception', error);
    fatalShutdown('uncaughtException', error).catch(() => process.exit(1));
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
