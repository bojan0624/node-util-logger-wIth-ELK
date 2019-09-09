## 一个较为公共的log组件封装

继承自 `logger-intl`，由 `winston-logger` 驱动。

```bash
npm i @blued-core/winston-logger
```

### 使用方法

```typescript
const winstonLogger = new Logger(
  {
    project: name,
    topic: IS_PRO ? 'log-web' : 'log-web-dev',
    logPath: `/data/logs/${name}/`,
    getKafkaClient: () => getKafkaClient(KAFKA_QCONF_CONFIG_PATH.ELKLOG),
    transformer,
    isLocal: IS_LOCAL
  },
  new Cache()
)

export const getLogger = () => winstonLogger.getLogger('admin-server')
```

### constructor

Argument|Type|Required|Desc
:--|:--|:--|:--
`project`|`string`|✅|项目名称标识
`topic`|`string`|✅|elk kafka 对应的topic
`getKafkaClient`|`func`|✅|延迟获取kafkaClient的函数
`transformer`|`func`|✅|将日志数据转换上报elk数据的函数，包已提供常规的
`logPath`|`string`|✅|日志输出的路径
`logType`|`string`|✅|日志的标识符`YYYY-MM-DD-%logType%.<access|error>.log`
`isLocal`|`string`|❌|是否为本地环境，开启 terminal 输出，默认为`false`

### access

Argument|Type|Required|Desc
:--|:--|:--|:--
`data`|`Record<string, any>`|❌|日志的输出内容

### error

Argument|Type|Required|Desc
:--|:--|:--|:--
`error`|`Error`|✅|日志的输出内容
`data`|`Record<string, any>`|❌|日志的输出内容

