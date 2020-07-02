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

    if (this.isWriteFile && !this.isLocal && !fs.existsSync(this.logPath)) {
      mkdirp.sync(this.logPath)
    }

    const kafkaTransport = new KafkaTransport({
      origin: {
        project: this.project,
      },
      getKafkaClient: this.getKafkaClient,
      topic: this.topic,
      transformer: this.transformer,
      options: this.kafkaOptions,
    })

    let accessTransports: any
    if (!this.isLocal) accessTransports = []
    if (this.isWriteFile && accessTransports) {
      accessTransports.push(new DailyRotateFile({
        filename: path.resolve(this.logPath, `./%DATE%-${logType}.access.log`),
        datePattern: `YYYY-MM-DD-HH`,
        zippedArchive: true,
        level: 'info',
      }))
    }
    if (this.isWriteKafka && accessTransports) {
      accessTransports.push(kafkaTransport)
    }

    const accessLog = winston.createLogger({
      level: 'info',
      transports: accessTransports,
    })

    let errorTransports: any
    if (!this.isLocal) errorTransports = []
    if (this.isWriteFile && errorTransports) {
      errorTransports.push(new DailyRotateFile({
        filename: path.resolve(this.logPath, `./%DATE%-${logType}.error.log`),
        datePattern: `YYYY-MM-DD-HH`,
        zippedArchive: true,
        level: 'error',
      }))
    }
    if (this.isWriteKafka && errorTransports) {
      errorTransports.push(kafkaTransport)
    }

    const errorLog = winston.createLogger({
      level: 'error',
      transports: errorTransports,
    })

    this.cache.set(logType, {
      accessLog: accessLog.info.bind(accessLog),
      errorLog: errorLog.error.bind(errorLog),
    })

    return this.cache.get(logType)
  }
}
