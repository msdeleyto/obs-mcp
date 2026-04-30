import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import type { AppConfig } from './config.js';
import { createPushOtlpTraceHandler } from './tools/push-otlp-trace.js';
import { createPushPrometheusMetricHandler } from './tools/push-prometheus-metric.js';
import { otlpTraceToolInputSchema, otlpTraceToolOutputSchema } from './schemas/otlp.js';
import {
  prometheusToolInputSchema,
  prometheusToolOutputSchema,
} from './schemas/prometheus.js';

export function createServer(config: AppConfig): McpServer {
  const server = new McpServer(
    {
      name: config.serverName,
      version: config.serverVersion,
    },
    {
      instructions:
        'Use push_prometheus_metric for Pushgateway targets and push_otlp_trace for OTLP trace targets. Each tool requires an explicit endpoint and will report the exact endpoint it targeted.',
    },
  );

  server.registerTool(
    'push_prometheus_metric',
    {
      title: 'Push Prometheus Metric',
      description:
        'Push a single metric sample to a specific Prometheus Pushgateway endpoint. The required endpoint input determines the exact target, and the response will state which endpoint was used.',
      inputSchema: prometheusToolInputSchema,
      outputSchema: prometheusToolOutputSchema,
      annotations: {
        idempotentHint: false,
      },
    },
    createPushPrometheusMetricHandler(config),
  );

  server.registerTool(
    'push_otlp_trace',
    {
      title: 'Push OTLP Trace',
      description:
        'Export a single trace span to a specific OTLP HTTP traces endpoint. The required endpoint input determines the exact target, and the response will state which endpoint was used.',
      inputSchema: otlpTraceToolInputSchema,
      outputSchema: otlpTraceToolOutputSchema,
      annotations: {
        idempotentHint: false,
      },
    },
    createPushOtlpTraceHandler(config),
  );

  return server;
}

export const serverMetadataSchema = z.object({
  name: z.string(),
  version: z.string(),
});
