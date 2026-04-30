import type { CallToolResult } from '@modelcontextprotocol/server';

import type { AppConfig } from '../config.js';
import { prometheusToolInputSchema, prometheusToolOutputSchema } from '../schemas/prometheus.js';
import { pushPrometheusMetric } from '../services/prometheus-pushgateway.js';

function formatPrometheusError(message: string, targetEndpoint?: string): CallToolResult {
  const prefix = targetEndpoint
    ? `Failed to push metric to ${targetEndpoint}: `
    : 'Failed to push metric: ';

  return {
    content: [{ type: 'text', text: `${prefix}${message}` }],
    isError: true,
  };
}

export function createPushPrometheusMetricHandler(config: AppConfig) {
  return async (rawInput: unknown): Promise<CallToolResult> => {
    const parsed = prometheusToolInputSchema.safeParse(rawInput);

    if (!parsed.success) {
      return formatPrometheusError(parsed.error.issues.map((issue) => issue.message).join('; '));
    }

    if (Object.keys(parsed.data.labels).length > config.maxLabels) {
      return formatPrometheusError(
        `labels must contain at most ${config.maxLabels} entries.`,
        parsed.data.endpoint,
      );
    }

    if (Object.keys(parsed.data.groupings).length > config.maxLabels) {
      return formatPrometheusError(
        `groupings must contain at most ${config.maxLabels} entries.`,
        parsed.data.endpoint,
      );
    }

    try {
      const result = await pushPrometheusMetric(parsed.data, {
        timeoutMs: config.metricTimeoutMs,
      });

      return {
        content: [{ type: 'text', text: result.message }],
        structuredContent: prometheusToolOutputSchema.parse(result),
      };
    } catch (error) {
      return formatPrometheusError(
        error instanceof Error ? error.message : String(error),
        parsed.data.endpoint,
      );
    }
  };
}
