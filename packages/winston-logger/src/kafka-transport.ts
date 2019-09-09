import Transport from 'winston-transport'
import { hostname } from 'os'
import { Kafka } from '@blued-core/kafka-client'

interface TransformableInfo {
  level: string
  message: string
  [key: string]: any
}

interface KafkaTransportOprations extends Transport.TransportStreamOptions {
  origin: any
  topic: string
  getKafkaClient: () => Kafka
  transformer: (logData: TransformableInfo) => any
}

export class KafkaTransport extends Transport {
  origin: object

  hostname: string

  topic: string

  getKafkaClient: () => Kafka

  transformer: (logData: any) => any

  constructor(opts: KafkaTransportOprations) {
    super(opts)
    this.origin = opts.origin
    this.hostname = hostname()
    this.getKafkaClient = opts.getKafkaClient
    this.topic = opts.topic
    this.transformer = opts.transformer
  }

  log(info: TransformableInfo, callback: () => void) {
    const { level, message, timestamp, ...restInfo } = info

    /**
     * restInfo k-v symbol类型 k 无法被一般迭代器遍历， 序列化时 会被自动忽略，故不做单独处理
     */
    const meta = {
      key: restInfo,
      origin: {
        ...this.origin,
        hostname: this.hostname,
      },
    }

    setImmediate(() => this.emit('logged', info))

    const logData = {
      message,
      level,
      timestamp,
      meta,
    }

    const entry = this.transformer(logData)

    const bootstrapKafka = this.getKafkaClient()

    bootstrapKafka.send(this.topic, JSON.stringify(entry))

    callback()
  }
}
