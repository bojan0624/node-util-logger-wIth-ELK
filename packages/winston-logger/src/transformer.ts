export interface LogData {
  message: any
  level: string
  meta: { [key: string]: any }
  timestamp?: string
}

export interface Transformed {
  '@timestamp': string
  message: any
  severity: string
  fields: { [key: string]: any }
}

export interface ITransformer {
  (logData: LogData): Transformed
}

export const transformer: ITransformer = (logData: LogData) => ({
  '@timestamp': logData.timestamp ? logData.timestamp : new Date().toISOString(),
  message: logData.message,
  severity: logData.level,
  fields: logData.meta,
})
