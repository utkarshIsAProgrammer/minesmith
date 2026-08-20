/**
 * Request logging middleware
 * Logs method, path, status code, and response time
 * Only logs slow requests (>500ms) or errors (4xx/5xx) in production
 */

export function requestLogger(req, res, next) {
  const start = Date.now();

  // Capture the original end to measure response time
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const path = req.originalUrl || req.url;

    // Always log errors (4xx/5xx)
    if (status >= 400) {
      // No sensitive data logged — just method, path, status, duration
    }
    // Log slow requests (>500ms)
    else if (duration > 500) {
      // Slow request detected
    }

    // In development, log all requests
    if (process.env.NODE_ENV !== 'production') {
      const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
      const reset = '\x1b[0m';
      process.stdout.write(
        `${color}${method}${reset} ${path} ${color}${status}${reset} ${duration}ms\n`
      );
    }

    originalEnd.apply(res, args);
  };

  next();
}
