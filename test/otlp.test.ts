import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadConfig } from '../src/config.js';
import { otlpTraceToolInputSchema } from '../src/schemas/otlp.js';
import { createPushOtlpTraceHandler } from '../src/tools/push-otlp-trace.js';

const { exportOtlpTrace } = vi.hoisted(() => ({
  exportOtlpTrace: vi.fn(),
}));

vi.mock('../src/services/otlp-trace-export.js', () => ({
  exportOtlpTrace,
}));

describe('otlp schema', () => {
  it('rejects endTime without startTime', () => {
    const result = otlpTraceToolInputSchema.safeParse({
      endpoint: 'http://localhost:4318/v1/traces',
      serviceName: 'obs-mcp',
      spanName: 'push',
      endTime: '2026-04-30T12:00:00.000Z',
      status: 'ok',
    });

    expect(result.success).toBe(false);
  });
});

describe('push_otlp_trace handler', () => {
  beforeEach(() => {
    exportOtlpTrace.mockReset();
  });

  it('echoes the target endpoint on success', async () => {
    exportOtlpTrace.mockResolvedValue({
      targetEndpoint: 'http://localhost:4318/v1/traces',
      serviceName: 'obs-mcp',
      spanName: 'push',
      exported: true,
      message: 'Exported span push to http://localhost:4318/v1/traces.',
    });

    const handler = createPushOtlpTraceHandler(loadConfig({}));
    const result = await handler({
      endpoint: 'http://localhost:4318/v1/traces',
      serviceName: 'obs-mcp',
      spanName: 'push',
      attributes: { source: 'test' },
      durationMs: 10,
      status: 'ok',
    });

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toMatchObject({
      targetEndpoint: 'http://localhost:4318/v1/traces',
      exported: true,
    });
  });

  it('echoes the target endpoint on failure', async () => {
    exportOtlpTrace.mockRejectedValue(new Error('collector unavailable'));

    const handler = createPushOtlpTraceHandler(loadConfig({}));
    const result = await handler({
      endpoint: 'http://localhost:4318/v1/traces',
      serviceName: 'obs-mcp',
      spanName: 'push',
      attributes: {},
      durationMs: 5,
      status: 'ok',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]).toMatchObject({
      type: 'text',
      text: 'Failed to export trace to http://localhost:4318/v1/traces: collector unavailable',
    });
  });
});
