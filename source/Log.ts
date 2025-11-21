import { sys } from "cc";

// 日志级别定义
export const enum LogLevel {
    NONE = 0,   // 不输出任何日志
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4,   // 输出全部
}

declare const pluginx: any;

let logger;
if (sys.isNative) {
    if (sys.Platform.ANDROID == sys.platform)
        logger = pluginx.Console;
    else
        logger = console;
} else {
    logger = console;
}

export class Log {
    // 当前日志级别，默认只输出 error（上线时可设为 Level.ERROR 或 Level.NONE）
    private static currentLevel: LogLevel = LogLevel.DEBUG;

    /** 设置日志级别 */
    static setLevel(level: LogLevel) {
        Log.currentLevel = level;
    }

    /** 获取当前日志级别 */
    static getLevel(): LogLevel {
        return Log.currentLevel;
    }

    private static shouldLog(requiredLevel: LogLevel): boolean {
        return Log.currentLevel >= requiredLevel;
    }

    static d(...args: any[]) {
        if (Log.shouldLog(LogLevel.DEBUG)) {
            logger.log('[ccx debug]  ->', ...args);
        }
    }

    static i(...args: any[]) {
        if (Log.shouldLog(LogLevel.INFO)) {
            logger.info('[ccx info]   ->', ...args);
        }
    }

    static w(...args: any[]) {
        if (Log.shouldLog(LogLevel.WARN)) {
            logger.warn('[ccx warning]->', ...args);
        }
    }

    static e(...args: any[]) {
        if (Log.shouldLog(LogLevel.ERROR)) {
            logger.error('[ccx error]  ->', ...args);
        }
    }

    // 可选：如果你还想保留一个通用的 log 方法
    static l(...args: any[]) {
        if (Log.shouldLog(LogLevel.INFO)) {
            logger.log('[ccx log]    ->', ...args);
        }
    }
}