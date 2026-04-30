import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadConfig } from '../src/config.js';
import { prometheusToolInputSchema } from '../src/schemas/prometheus.js';
import { createPushPrometheusMetricHandler } from '../src/tools/push-prometheus-metric.js';

const { pushPrometheusMetric } = vi.hoisted(() => ({
  pushPrometheusMetric: vi.fn(),
}));

vi.mock('../src/services/prometheus-pushgateway.js', () => ({
  pushPrometheusMetric,
}));

describe('prometheus schema', () => {
  it('rejects invalid metric names', () => {
    const result = prometheusToolInputSchema.safeParse({
      endpoint: 'http://localhost:9091',
      jobName: 'job',
      metricName: 'bad metric',
      metricType: 'counter',
      value: 1,
      help: 'help',
    });

    expect(result.success).toBe(false);
  });
});

describe('push_prometheus_metric handler', () => {
  beforeEach(() => {
    pushPrometheusMetric.mockReset();
  });

  it('echoes the target endpoint on success', async () => {
    pushPrometheusMetric.mockResolvedValue({
      targetEndpoint: 'http://localhost:9091',
      jobName: 'job',
      metricName: 'obs_runs_total',
      metricType: 'counter',
      pushed: true,
      statusCode: 202,
      message: 'Pushed counter metric obs_runs_total to http://localhost:9091.',
    });

    const handler = createPushPrometheusMetricHandler(loadConfig({}));
    const result = await handler({
      endpoint: 'http://localhost:9091',
      jobName: 'job',
      metricName: 'obs_runs_total',
      metricType: 'counter',
      value: 1,
      help: 'help',
      labels: { source: 'test' },
      groupings: { instance: 'local' },
    });

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toMatchObject({
      targetEndpoint: 'http://localhost:9091',
      pushed: true,
    });
  });

  it('echoes the target endpoint on failure', async () => {
    pushPrometheusMetric.mockRejectedValue(new Error('network down'));

    const handler = createPushPrometheusMetricHandler(loadConfig({}));
    const result = await handler({
      endpoint: 'http://localhost:9091',
      jobName: 'job',
      metricName: 'obs_runs_total',
      metricType: 'counter',
      value: 1,
      help: 'help',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]).toMatchObject({
      type: 'text',
      text: 'Failed to push metric to http://localhost:9091/: network down',
    });
  });
});
