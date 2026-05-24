import https from 'https';
import { env } from '../config/env';

export function startKeepAlive() {
  if (!env.KEEP_ALIVE_URL) {
    return null;
  }
  const keepAliveUrl = env.KEEP_ALIVE_URL;

  const ping = () => {
    const req = https.get(keepAliveUrl, (res) => {
      res.resume();
      console.log(`Keep-alive hit ${keepAliveUrl} with status code: ${res.statusCode}`);
    });

    req.on('error', (error) => {
      console.error(`Keep-alive error: ${error.message}`);
    });

    req.setTimeout(15_000, () => {
      req.destroy(new Error('Keep-alive request timed out'));
    });
  };

  ping();
  const timer = setInterval(ping, env.KEEP_ALIVE_INTERVAL_MS);
  timer.unref();

  return timer;
}
