import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import BaseLogger from './interface'
import { KafkaTransport } from './kafka-transport'

export class Logger extends BaseLogger {
  buildLogger(logType: string) {
    if (this.cache.has(logType)) return this.cache.get(logType)

    const { logPath } = this
    if (!this.isLocal && !fs.existsSync(logPath)) {
      mkdirp.sync(logPath)
    }

    const kafkaTransport = new KafkaTransport({
      origin: {
        project: this.project,
      },
      getKafkaClient: this.getKafkaClient,
      topic: this.topic,
      transformer: this.transformer,
    })

    const accessLog = winston.createLogger({
      level: 'info',
      transports: !this.isLocal
        ? [
          new DailyRotateFile({
            filename: path.resolve(logPath, `./%DATE%-${logType}.access.log`),
            datePattern: `YYYY-MM-DD-HH`,
            zippedArchive: true,
            level: 'info',
          }),
          kafkaTransport,
        ]
        : [],
    })

    const errorLog = winston.createLogger({
      level: 'error',
      transports: !this.isLocal
        ? [
          new DailyRotateFile({
            filename: path.resolve(logPath, `./%DATE%-${logType}.error.log`),
            datePattern: `YYYY-MM-DD-HH`,
            zippedArchive: true,
            level: 'error',
          }),
          kafkaTransport,
        ]
        : [],
    })

    this.cache.set(logType, {
      accessLog: accessLog.info.bind(accessLog),
      errorLog: errorLog.error.bind(errorLog),
    })

    return this.cache.get(logType)
  }
}
