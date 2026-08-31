import fs from 'fs';
import path from 'path';

// ANSI Color Codes for terminal
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';

// Get Shamsi (Jalali) date string: YYYY-MM-DD
export function getShamsiDate(date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Tehran'
    });
    const parts = formatter.format(date).split('/');
    return `${parts[0]}-${parts[1]}-${parts[2]}`;
  } catch {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

// Get Shamsi Full DateTime string: YYYY-MM-DD HH:mm:ss
export function getShamsiDateTime(date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Tehran'
    });
    return formatter.format(date).replace(',', '');
  } catch {
    return date.toISOString();
  }
}

class JsonLogger {
  constructor() {
    // Determine logs directory (Docker /app/logs or root ./logs)
    const possibleDirs = [
      process.env.LOGS_DIR,
      path.resolve(process.cwd(), 'logs'),
      path.resolve(process.cwd(), '../logs')
    ].filter(Boolean);

    this.logsDir = possibleDirs.find(d => fs.existsSync(d)) || path.resolve(process.cwd(), 'logs');
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
    } catch {}
  }

  getLogFilePath() {
    const shamsiDay = getShamsiDate();
    return path.join(this.logsDir, `${shamsiDay}.json`);
  }

  write(level, message, data = null, category = 'SYSTEM', error = null) {
    const now = new Date();
    const shamsiDay = getShamsiDate(now);
    const shamsiTimeStr = getShamsiDateTime(now);

    const logEntry = {
      timestamp: now.toISOString(),
      shamsi_date: shamsiDay,
      shamsi_time: shamsiTimeStr,
      level: level.toUpperCase(),
      service: 'kaiser-bot',
      category: category.toUpperCase(),
      message: typeof message === 'object' ? JSON.stringify(message) : String(message)
    };

    if (data) {
      logEntry.data = data;
    }

    if (error) {
      logEntry.error = {
        message: error.message || String(error),
        name: error.name || 'Error',
        stack: error.stack || null,
        code: error.code || null,
        response: error.response?.data || null
      };
    }

    // 1. Colorized Console Output for Terminal / Docker Logs
    let colorPrefix = CYAN;
    let icon = 'ℹ️';

    switch (level.toUpperCase()) {
      case 'SUCCESS':
        colorPrefix = `${BOLD}${GREEN}`;
        icon = '✅';
        break;
      case 'ERROR':
        colorPrefix = `${BOLD}${RED}`;
        icon = '❌';
        break;
      case 'WARN':
        colorPrefix = `${BOLD}${YELLOW}`;
        icon = '⚠️';
        break;
      case 'WEBHOOK':
        colorPrefix = `${BOLD}${MAGENTA}`;
        icon = '📡';
        break;
      case 'TELEGRAM_UPDATE':
        colorPrefix = `${BLUE}`;
        icon = '💬';
        break;
      case 'USER_ACTION':
        colorPrefix = `${BOLD}${CYAN}`;
        icon = '👤';
        break;
      default:
        colorPrefix = CYAN;
        icon = 'ℹ️';
        break;
    }

    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    const errStr = error ? `\n${RED}${error.stack || error.message}${RESET}` : '';
    const terminalLine = `[${shamsiTimeStr}] [${BOLD}kaiser-bot${RESET}] [${colorPrefix}${category.toUpperCase()}${RESET}] ${icon} ${colorPrefix}${logEntry.message}${RESET}${dataStr}${errStr}`;

    if (level.toUpperCase() === 'ERROR') {
      console.error(terminalLine);
    } else if (level.toUpperCase() === 'WARN') {
      console.warn(terminalLine);
    } else {
      console.log(terminalLine);
    }

    // 2. Append Pure JSON Line to Daily Shamsi Log File
    try {
      const filePath = this.getLogFilePath();
      const jsonLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(filePath, jsonLine, 'utf8');
    } catch (fsErr) {
      console.error('Failed to write log to file:', fsErr.message);
    }
  }

  info(message, data = null, category = 'SYSTEM') {
    this.write('INFO', message, data, category);
  }

  success(message, data = null, category = 'SYSTEM') {
    this.write('SUCCESS', message, data, category);
  }

  warn(message, data = null, category = 'SYSTEM') {
    this.write('WARN', message, data, category);
  }

  error(message, error = null, category = 'SYSTEM', data = null) {
    this.write('ERROR', message, data, category, error);
  }

  webhook(message, data = null, isError = false) {
    this.write(isError ? 'ERROR' : 'WEBHOOK', message, data, 'WEBHOOK');
  }

  update(message, data = null) {
    this.write('TELEGRAM_UPDATE', message, data, 'TELEGRAM_UPDATE');
  }

  userAction(userId, action, details = null) {
    this.write('USER_ACTION', `User [${userId}] action: ${action}`, details, 'USER_ACTION');
  }
}

export const logger = new JsonLogger();
