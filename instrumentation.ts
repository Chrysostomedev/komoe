import { type Instrumentation } from 'next'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const fs = await import('fs');
    const path = await import('path');
    const util = await import('util');

    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, 'frontend.log');
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    const formatMessage = (level: string, ...args: any[]) => {
      const timestamp = new Date().toISOString();
      const message = util.format(...args);
      return `[${timestamp}] ${level}: ${message}\n`;
    };

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    console.log = (...args) => {
      logStream.write(formatMessage('LOG', ...args));
      originalLog(...args);
    };

    console.error = (...args) => {
      logStream.write(formatMessage('ERROR', ...args));
      originalError(...args);
    };

    console.warn = (...args) => {
      logStream.write(formatMessage('WARN', ...args));
      originalWarn(...args);
    };

    console.info = (...args) => {
      logStream.write(formatMessage('INFO', ...args));
      originalInfo(...args);
    };
    
    console.log('Frontend logging initialized');
  }
}
