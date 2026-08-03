import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const bootstrapMocks = vi.hoisted(() => ({
  app: vi.fn(),
  closeRedisClient: vi.fn(),
  createSessionStore: vi.fn(),
  destroyRedisClient: vi.fn(),
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
  validateEnv: vi.fn(),
}));

vi.mock('@/app', () => ({ default: bootstrapMocks.app }));
vi.mock('@controllers/index.controller', () => ({ IndexController: {} }));
vi.mock('@utils/logger', () => ({ logger: bootstrapMocks.logger }));
vi.mock('@utils/redis', () => ({
  closeRedisClient: bootstrapMocks.closeRedisClient,
  destroyRedisClient: bootstrapMocks.destroyRedisClient,
}));
vi.mock('@utils/session-store', () => ({ createSessionStore: bootstrapMocks.createSessionStore }));
vi.mock('@utils/validateEnv', () => ({ default: bootstrapMocks.validateEnv }));
vi.mock('./controllers/health.controller', () => ({ HealthController: {} }));
vi.mock('./controllers/user.controller', () => ({ UserController: {} }));

import { startServer } from './server';

const SHUTDOWN_GRACE_PERIOD_MS = 10_000;
const SIGNALS = ['SIGINT', 'SIGTERM'] as const;

type Signal = (typeof SIGNALS)[number];
type SignalListener = (signal: NodeJS.Signals) => void;

interface SignalListenerBaseline {
  SIGINT: Set<SignalListener>;
  SIGTERM: Set<SignalListener>;
}

function captureSignalListeners(): SignalListenerBaseline {
  return {
    SIGINT: new Set(process.listeners('SIGINT')),
    SIGTERM: new Set(process.listeners('SIGTERM')),
  };
}

function getRegisteredSignalListener(signal: Signal, baseline: SignalListenerBaseline): SignalListener {
  const listener = process.listeners(signal).find(candidate => !baseline[signal].has(candidate));

  if (!listener) {
    throw new Error(`No ${signal} listener was registered`);
  }

  return listener;
}

function removeRegisteredSignalListeners(baseline: SignalListenerBaseline): void {
  for (const signal of SIGNALS) {
    for (const listener of process.listeners(signal)) {
      if (!baseline[signal].has(listener)) {
        process.removeListener(signal, listener);
      }
    }
  }
}

function createHttpServerStub() {
  let closeCallback: ((error?: Error) => void) | undefined;
  const close = vi.fn<(callback: (error?: Error) => void) => unknown>();
  const closeAllConnections = vi.fn();
  const server = { close, closeAllConnections };
  close.mockImplementation(callback => {
    closeCallback = callback;
    return server;
  });

  return {
    close,
    closeAllConnections,
    completeClose(error?: Error): void {
      closeCallback?.(error);
    },
    server,
  };
}

function configureAppToListen(server: ReturnType<typeof createHttpServerStub>['server']): void {
  bootstrapMocks.app.mockImplementation(function AppStub() {
    return { listen: vi.fn(() => server) };
  });
}

describe('server bootstrap', () => {
  let originalExitCode: typeof process.exitCode;
  let signalListenerBaseline: SignalListenerBaseline;

  beforeEach(() => {
    originalExitCode = process.exitCode;
    process.exitCode = undefined;
    signalListenerBaseline = captureSignalListeners();

    bootstrapMocks.app.mockReset();
    bootstrapMocks.closeRedisClient.mockReset().mockResolvedValue(undefined);
    bootstrapMocks.createSessionStore.mockReset().mockResolvedValue({});
    bootstrapMocks.destroyRedisClient.mockReset();
    bootstrapMocks.logger.error.mockReset();
    bootstrapMocks.logger.info.mockReset();
    bootstrapMocks.validateEnv.mockReset();
  });

  afterEach(() => {
    removeRegisteredSignalListeners(signalListenerBaseline);
    process.exitCode = originalExitCode;
    vi.useRealTimers();
  });

  it('does not construct or listen on the HTTP app when the session store cannot start', async () => {
    bootstrapMocks.createSessionStore.mockRejectedValue(new Error('Redis unavailable'));

    await expect(startServer()).rejects.toThrow('Redis unavailable');

    expect(bootstrapMocks.validateEnv).toHaveBeenCalledOnce();
    expect(bootstrapMocks.app).not.toHaveBeenCalled();
    expect(bootstrapMocks.closeRedisClient).toHaveBeenCalledOnce();
  });

  it('closes Redis before propagating an application startup failure', async () => {
    const startupError = new Error('Application construction failed');
    bootstrapMocks.app.mockImplementation(function AppStub() {
      throw startupError;
    });

    await expect(startServer()).rejects.toBe(startupError);

    expect(bootstrapMocks.closeRedisClient).toHaveBeenCalledOnce();
  });

  it('preserves the startup error when Redis cleanup also fails', async () => {
    const startupError = new Error('Application construction failed');
    bootstrapMocks.app.mockImplementation(function AppStub() {
      throw startupError;
    });
    bootstrapMocks.closeRedisClient.mockRejectedValue(new Error('Redis close failed'));

    await expect(startServer()).rejects.toBe(startupError);

    expect(bootstrapMocks.logger.error).toHaveBeenCalledWith('Redis cleanup after server startup failure failed: Redis close failed');
  });

  it('closes HTTP before Redis during graceful shutdown', async () => {
    vi.useFakeTimers();
    const httpServer = createHttpServerStub();
    configureAppToListen(httpServer.server);
    await startServer();

    getRegisteredSignalListener('SIGTERM', signalListenerBaseline)('SIGTERM');
    expect(httpServer.close).toHaveBeenCalledOnce();
    expect(bootstrapMocks.closeRedisClient).not.toHaveBeenCalled();

    httpServer.completeClose();
    await vi.advanceTimersByTimeAsync(0);

    expect(bootstrapMocks.closeRedisClient).toHaveBeenCalledOnce();
    expect(httpServer.closeAllConnections).not.toHaveBeenCalled();
    expect(bootstrapMocks.destroyRedisClient).not.toHaveBeenCalled();
  });

  it('forces HTTP and Redis connections closed after the graceful deadline', async () => {
    vi.useFakeTimers();
    const httpServer = createHttpServerStub();
    configureAppToListen(httpServer.server);
    await startServer();

    getRegisteredSignalListener('SIGINT', signalListenerBaseline)('SIGINT');
    await vi.advanceTimersByTimeAsync(SHUTDOWN_GRACE_PERIOD_MS);

    expect(httpServer.closeAllConnections).toHaveBeenCalledOnce();
    expect(bootstrapMocks.destroyRedisClient).toHaveBeenCalledOnce();
    expect(process.exitCode).toBe(1);
  });

  it('ignores repeated shutdown signals', async () => {
    vi.useFakeTimers();
    const httpServer = createHttpServerStub();
    configureAppToListen(httpServer.server);
    await startServer();

    getRegisteredSignalListener('SIGTERM', signalListenerBaseline)('SIGTERM');
    getRegisteredSignalListener('SIGINT', signalListenerBaseline)('SIGINT');

    expect(httpServer.close).toHaveBeenCalledOnce();

    httpServer.completeClose();
    await vi.advanceTimersByTimeAsync(0);
  });
});
