# obs-mcp

MCP server that lets AI agents send telemetry to explicitly provided endpoints.

Current MVP tools:

1. `push_prometheus_metric` for Prometheus Pushgateway
2. `push_otlp_trace` for OTLP HTTP trace export

Each tool requires an `endpoint` argument. The server does not infer a default endpoint. Each result states which endpoint was targeted.

## Stack

1. TypeScript + Node.js
2. `@modelcontextprotocol/server`
3. `zod`
4. `prom-client`
5. OpenTelemetry JS trace exporter

## Run

```bash
npm install
npm run build
npm run test
```

Development entrypoint:

```bash
npm run dev
```

Production entrypoint:

```bash
node dist/src/index.js
```

## Tools

### `push_prometheus_metric`

Sends one metric sample to the exact Pushgateway `endpoint` provided by the caller.

Implementation:

1. Tool registration: `src/server.ts`
2. Handler: `src/tools/push-prometheus-metric.ts`
3. Validation: `src/schemas/prometheus.ts`
4. Sink service: `src/services/prometheus-pushgateway.ts`

Important inputs:

1. `endpoint`
2. `jobName`
3. `metricName`
4. `metricType`
5. `value`
6. `help`

### `push_otlp_trace`

Exports one span to the exact OTLP traces `endpoint` provided by the caller.

Implementation:

1. Tool registration: `src/server.ts`
2. Handler: `src/tools/push-otlp-trace.ts`
3. Validation: `src/schemas/otlp.ts`
4. Sink service: `src/services/otlp-trace-export.ts`

Important inputs:

1. `endpoint`
2. `serviceName`
3. `spanName`
4. `attributes`
5. `durationMs` or explicit timestamps

## Configuration

Optional environment variables are parsed in `src/config.ts`.

1. `SERVER_NAME`
2. `SERVER_VERSION`
3. `METRIC_TIMEOUT_MS`
4. `TRACE_TIMEOUT_MS`
5. `MAX_LABELS`
6. `MAX_ATTRIBUTES`
7. `MAX_STRING_LENGTH`

## Current Constraints

1. No auth yet
2. No batching
3. No OTLP metrics tool yet
4. `stdio` transport only
