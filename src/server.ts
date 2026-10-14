import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { config } from './config/env.js';
import { ensureSystemRoles } from './modules/role/role.service.js';

/** Turns the usual listen failures into something you can act on. */
function describeListenError(err: NodeJS.ErrnoException): string {
  switch (err.code) {
    case 'EADDRINUSE':
      return `Port ${config.port} is already in use — stop the other server, or set PORT to a free port.`;
    case 'EACCES':
      return `Port ${config.port} needs elevated privileges — use a port above 1023.`;
    default:
      return `Could not start the server: ${err.message}`;
  }
}

async function main(): Promise<void> {
  await connectDB();
  await ensureSystemRoles();

  const server = app.listen(config.port, () => {
    console.log(`Server listening on http://localhost:${config.port} (${config.env})`);
  });

  // Without this, a busy port dies as an uncaught exception with a bare stack trace.
  server.on('error', (err: NodeJS.ErrnoException) => {
    console.error(describeListenError(err));
    process.exit(1);
  });

  let shuttingDown = false;

  const shutdown = (reason: string, exitCode = 0): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${reason} — shutting down...`);

    // A hung keep-alive connection must not hold the process (and the port) open.
    setTimeout(() => process.exit(exitCode || 1), 10_000).unref();

    server.close(() => {
      disconnectDB()
        .then(() => process.exit(exitCode))
        .catch((err: unknown) => {
          console.error('Error during shutdown:', err);
          process.exit(1);
        });
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  /**
   * The net for errors that never touch a request: a background callback, a stray
   * promise, a library bug. Errors raised inside a route don't arrive here —
   * asyncHandler already routes those to errorHandler as a normal HTTP response.
   */
  const onFatal =
    (label: string) =>
    (err: unknown): void => {
      console.error(`${label}:`, err);

      if (config.isProduction) {
        // Process state is no longer trustworthy. Stop taking traffic and exit
        // non-zero so the process manager starts a clean one in its place.
        shutdown(label, 1);
        return;
      }

      // In development the watcher only reloads on a file change, never after a
      // crash — so staying up saves a manual restart. Restart if state looks off.
      console.error('Server left running (development). Restart it if behaviour looks wrong.');
    };

  process.on('uncaughtException', onFatal('Uncaught exception'));
  process.on('unhandledRejection', onFatal('Unhandled promise rejection'));
}

main().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
