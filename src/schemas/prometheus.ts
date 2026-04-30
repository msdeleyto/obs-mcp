import * as z from 'zod/v4';

import { absoluteHttpUrlSchema, finiteNumberSchema, labelNamePattern, metricNamePattern, stringMapSchema } from './common.js';

export const prometheusMetricTypeSchema = z.enum(['counter', 'gauge', 'histogram']);

export const prometheusToolInputSchema = z
  .object({
    endpoint: absoluteHttpUrlSchema.describe('Pushgateway base URL that this tool will target.'),
    jobName: z.string().min(1).max(128),
    metricName: z.string().regex(metricNamePattern, 'Metric name must match Prometheus naming rules.'),
    metricType: prometheusMetricTypeSchema,
    value: finiteNumberSchema,
    help: z.string().min(1).max(256),
    labels: stringMapSchema.default({}),
    groupings: stringMapSchema.default({}),
  })
  .superRefine((value, ctx) => {
    if (Object.keys(value.labels).some((key) => !labelNamePattern.test(key))) {
      ctx.addIssue({
        code: 'custom',
        path: ['labels'],
        message: 'Label names must match Prometheus label naming rules.',
      });
    }

    if (Object.keys(value.groupings).some((key) => !labelNamePattern.test(key))) {
      ctx.addIssue({
        code: 'custom',
        path: ['groupings'],
        message: 'Grouping keys must match Prometheus label naming rules.',
      });
    }

    if ((value.metricType === 'counter' || value.metricType === 'histogram') && value.value < 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: `${value.metricType} values must be non-negative.`,
      });
    }
  });

export const prometheusToolOutputSchema = z.object({
  targetEndpoint: z.string(),
  jobName: z.string(),
  metricName: z.string(),
  metricType: prometheusMetricTypeSchema,
  pushed: z.boolean(),
  statusCode: z.number().int().optional(),
  message: z.string(),
});

export type PrometheusToolInput = z.infer<typeof prometheusToolInputSchema>;
export type PrometheusToolOutput = z.infer<typeof prometheusToolOutputSchema>;
