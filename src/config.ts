import * as z from 'zod/v4';

const configSchema = z.object({
  serverName: z.string().default('obs-mcp'),
  serverVersion: z.string().default('0.1.0'),
  metricTimeoutMs: z.coerce.number().int().positive().default(5000),
  traceTimeoutMs: z.coerce.number().int().positive().default(5000),
  maxLabels: z.coerce.number().int().positive().default(20),
  maxAttributes: z.coerce.number().int().positive().default(32),
  maxStringLength: z.coerce.number().int().positive().default(256),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return configSchema.parse({
    serverName: env.SERVER_NAME,
    serverVersion: env.SERVER_VERSION,
    metricTimeoutMs: env.METRIC_TIMEOUT_MS,
    traceTimeoutMs: env.TRACE_TIMEOUT_MS,
    maxLabels: env.MAX_LABELS,
    maxAttributes: env.MAX_ATTRIBUTES,
    maxStringLength: env.MAX_STRING_LENGTH,
  });
}
