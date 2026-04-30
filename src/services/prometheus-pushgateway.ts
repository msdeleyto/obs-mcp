import { Counter, Gauge, Histogram, Pushgateway, Registry } from 'prom-client';

import type { PrometheusToolInput, PrometheusToolOutput } from '../schemas/prometheus.js';

export interface PrometheusServiceOptions {
  timeoutMs: number;
}

export async function pushPrometheusMetric(
  input: PrometheusToolInput,
  options: PrometheusServiceOptions,
): Promise<PrometheusToolOutput> {
  const registry = new Registry();
  const gateway = new Pushgateway(
    input.endpoint,
    { timeout: options.timeoutMs },
    registry,
  );

  const labelNames = Object.keys(input.labels);

  switch (input.metricType) {
    case 'counter': {
      const metric = new Counter({
        name: input.metricName,
        help: input.help,
        labelNames,
        registers: [registry],
      });
      metric.inc(input.labels, input.value);
      break;
    }
    case 'gauge': {
      const metric = new Gauge({
        name: input.metricName,
        help: input.help,
        labelNames,
        registers: [registry],
      });
      metric.set(input.labels, input.value);
      break;
    }
    case 'histogram': {
      const metric = new Histogram({
        name: input.metricName,
        help: input.help,
        labelNames,
        registers: [registry],
      });
      metric.observe(input.labels, input.value);
      break;
    }
  }

  const { resp } = await gateway.pushAdd({
    jobName: input.jobName,
    groupings: input.groupings,
  });

  const statusCode =
    typeof resp === 'object' &&
    resp !== null &&
    'statusCode' in resp &&
    typeof resp.statusCode === 'number'
      ? resp.statusCode
      : undefined;

  return {
    targetEndpoint: input.endpoint,
    jobName: input.jobName,
    metricName: input.metricName,
    metricType: input.metricType,
    pushed: true,
    statusCode,
    message: `Pushed ${input.metricType} metric ${input.metricName} to ${input.endpoint}.`,
  };
}
