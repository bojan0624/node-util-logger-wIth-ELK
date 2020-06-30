import Cache from '@blued-core/cache-intl'
import { transformer } from './transformer'

export interface Loggers {
  accessLog: (res: any) => any
  errorLog: (res: any) => any
}

export interface LoggerOptions {
  project: string
  getKafkaClient: () => any
  topic: string
  logPath: string
  transformer?: any
  isLocal?: boolean
  isWriteKafka?: boolean
  isWriteFile?: boolean
  kafkaOptions?: {
    key?: string
    partition?: number
    attributes?: 0 | 1 | 2
  }
}

export interface LoggerIntl {
  logPath: string
  isLocal?: boolean
  cache?: Cache<Loggers>
  getLogger: (logType: string) => LoggerClient
  buildLogger: (logType: string) => Loggers
}

export interface LoggerClient {
  access: (data?: Record<string, any>) => void
  error: (error: Error, data?: Record<string, any>) => void
}

export default abstract class Logger implements LoggerIntl {
  public logPath: string

  public isLocal: boolean

  public project: string

  public getKafkaClient: any

  public topic: string

  public transformer: any

  public isWriteKafka: boolean

  public isWriteFile: boolean

  public kafkaOptions: {
    key?: string
    partition?: number
    attributes?: 0 | 1 | 2
  }

  private colors: any

  constructor(public opts: LoggerOptions, public cache: Cache<Loggers>) {
    this.logPath = opts.logPath
    this.isLocal = opts.isLocal || false

    this.isWriteKafka = typeof opts.isWriteKafka === 'boolean' ? opts.isWriteKafka : true
    this.isWriteFile = typeof opts.isWriteFile === 'boolean' ? opts.isWriteFile : true

    this.project = opts.project
    this.getKafkaClient = opts.getKafkaClient
    this.topic = opts.topic
    this.transformer = opts.transformer || transformer
    this.kafkaOptions = opts.kafkaOptions

    if (this.isLocal) {
      this.colors = require('colors')
    }
  }

  getLogger(logType: string) {
    const logger = this.buildLogger(logType)
    const { colors, isLocal } = this

    return {
      access(data?: Record<string, any>) {
        if (isLocal) {
          console.log(colors.green(data))
        }
        logger.accessLog(data)
      },
      error(error: Error, data?: Record<string, any>) {
        const err = {
          err_msg: error.message,
          err_name: error.name,
          err_stack: error.stack,
        }

        const results = { ...err, ...data }

        // 添加本地环境的colors输出
        if (isLocal) {
          console.error(colors.red(results))
        }
        logger.errorLog(results)
      },
    }
  }

  abstract buildLogger(logType: string): Loggers
}
