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

    if (!this.isLocal && !fs.existsSync(this.logPath)) {
      mkdirp.sync(this.logPath)
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
          this.isWriteFile ? new DailyRotateFile({
            filename: path.resolve(this.logPath, `./%DATE%-${logType}.access.log`),
            datePattern: `YYYY-MM-DD-HH`,
            zippedArchive: true,
            level: 'info',
          }) : null,
          this.isWriteKafka ? kafkaTransport : null,
        ]
        : [],
    })

    const errorLog = winston.createLogger({
      level: 'error',
      transports: !this.isLocal
        ? [
          this.isWriteFile ? new DailyRotateFile({
            filename: path.resolve(this.logPath, `./%DATE%-${logType}.error.log`),
            datePattern: `YYYY-MM-DD-HH`,
            zippedArchive: true,
            level: 'error',
          }) : null,
          this.isWriteKafka ? kafkaTransport : null,
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
