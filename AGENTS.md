# AGENTS.md

## Purpose

`obs-mcp` exposes MCP tools for pushing telemetry to caller-specified endpoints.

## Tools

### `push_prometheus_metric`

Use when you need to send a single Prometheus metric sample to a Pushgateway.

Code:

1. Registration: `src/server.ts`
2. Handler: `src/tools/push-prometheus-metric.ts`
3. Schema: `src/schemas/prometheus.ts`
4. Transport logic: `src/services/prometheus-pushgateway.ts`

Required input:

1. `endpoint` is mandatory and determines the exact target
2. `jobName`
3. `metricName`
4. `metricType`
5. `value`
6. `help`

Agent guidance:

1. Tell the user which endpoint you are targeting before or while calling the tool
2. Expect the tool result to repeat `targetEndpoint`
3. Do not assume a default endpoint exists

### `push_otlp_trace`

Use when you need to export a single trace span to an OTLP HTTP traces endpoint.

Code:

1. Registration: `src/server.ts`
2. Handler: `src/tools/push-otlp-trace.ts`
3. Schema: `src/schemas/otlp.ts`
4. Transport logic: `src/services/otlp-trace-export.ts`

Required input:

1. `endpoint` is mandatory and determines the exact target
2. `serviceName`
3. `spanName`

Agent guidance:

1. Tell the user which endpoint you are targeting before or while calling the tool
2. Expect the tool result to repeat `targetEndpoint`
3. Provide either `durationMs` or a full timestamp range

## Validation

Validation and limits are implemented in:

1. `src/schemas/common.ts`
2. `src/schemas/prometheus.ts`
3. `src/schemas/otlp.ts`
4. `src/config.ts`

Common failure causes:

1. Invalid `http` or `https` endpoint
2. Invalid metric or label names
3. Conflicting trace timing fields
4. Too many labels or attributes

## Runtime

Entrypoint: `src/index.ts`

This server currently runs over MCP `stdio` only.
