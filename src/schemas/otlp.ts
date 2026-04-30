import * as z from 'zod/v4';

import { absoluteHttpUrlSchema, boundedString, finiteNumberSchema } from './common.js';

const otlpAttributeValueSchema = z.union([
  z.string().max(256),
  z.boolean(),
  finiteNumberSchema,
  z.array(z.string().max(256)).max(16),
  z.array(z.boolean()).max(16),
  z.array(finiteNumberSchema).max(16),
]);

export const spanStatusSchema = z.enum(['unset', 'ok', 'error']).default('unset');

export const otlpTraceToolInputSchema = z
  .object({
    endpoint: absoluteHttpUrlSchema.describe('OTLP traces endpoint that this tool will target.'),
    serviceName: boundedString(128),
    spanName: boundedString(128),
    attributes: z.record(z.string(), otlpAttributeValueSchema).default({}),
    startTime: z.iso.datetime().optional(),
    endTime: z.iso.datetime().optional(),
    durationMs: z.number().finite().positive().max(86_400_000).optional(),
    status: spanStatusSchema,
  })
  .superRefine((value, ctx) => {
    if (value.endTime && !value.startTime) {
      ctx.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'endTime requires startTime.',
      });
    }

    if (value.endTime && value.durationMs) {
      ctx.addIssue({
        code: 'custom',
        path: ['durationMs'],
        message: 'Provide either endTime or durationMs, not both.',
      });
    }

    if (value.startTime && value.endTime) {
      const start = Date.parse(value.startTime);
      const end = Date.parse(value.endTime);

      if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
        ctx.addIssue({
          code: 'custom',
          path: ['endTime'],
          message: 'endTime must be greater than or equal to startTime.',
        });
      }
    }
  });

export const otlpTraceToolOutputSchema = z.object({
  targetEndpoint: z.string(),
  serviceName: z.string(),
  spanName: z.string(),
  exported: z.boolean(),
  message: z.string(),
});

export type OtlpTraceToolInput = z.infer<typeof otlpTraceToolInputSchema>;
export type OtlpTraceToolOutput = z.infer<typeof otlpTraceToolOutputSchema>;
