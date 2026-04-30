import type { CallToolResult } from '@modelcontextprotocol/server';

import type { AppConfig } from '../config.js';
import { otlpTraceToolInputSchema, otlpTraceToolOutputSchema } from '../schemas/otlp.js';
import { exportOtlpTrace } from '../services/otlp-trace-export.js';

function formatOtlpError(message: string, targetEndpoint?: string): CallToolResult {
  const prefix = targetEndpoint
    ? `Failed to export trace to ${targetEndpoint}: `
    : 'Failed to export trace: ';

  return {
    content: [{ type: 'text', text: `${prefix}${message}` }],
    isError: true,
  };
}

export function createPushOtlpTraceHandler(config: AppConfig) {
  return async (rawInput: unknown): Promise<CallToolResult> => {
    const parsed = otlpTraceToolInputSchema.safeParse(rawInput);

    if (!parsed.success) {
      return formatOtlpError(parsed.error.issues.map((issue) => issue.message).join('; '));
    }

    if (Object.keys(parsed.data.attributes).length > config.maxAttributes) {
      return formatOtlpError(
        `attributes must contain at most ${config.maxAttributes} entries.`,
        parsed.data.endpoint,
      );
    }

    const overlongAttribute = Object.entries(parsed.data.attributes).find(([, value]) =>
      typeof value === 'string' ? value.length > config.maxStringLength : false,
    );

    if (overlongAttribute) {
      return formatOtlpError(
        `attribute ${overlongAttribute[0]} exceeds ${config.maxStringLength} characters.`,
        parsed.data.endpoint,
      );
    }

    try {
      const result = await exportOtlpTrace(parsed.data, {
        timeoutMs: config.traceTimeoutMs,
      });

      return {
        content: [{ type: 'text', text: result.message }],
        structuredContent: otlpTraceToolOutputSchema.parse(result),
      };
    } catch (error) {
      return formatOtlpError(
        error instanceof Error ? error.message : String(error),
        parsed.data.endpoint,
      );
    }
  };
}
