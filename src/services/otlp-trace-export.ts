import { BasicTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SpanStatusCode, trace } from '@opentelemetry/api';

import type { OtlpTraceToolInput, OtlpTraceToolOutput } from '../schemas/otlp.js';

export interface OtlpTraceServiceOptions {
  timeoutMs: number;
}

const spanStatusMap = {
  unset: SpanStatusCode.UNSET,
  ok: SpanStatusCode.OK,
  error: SpanStatusCode.ERROR,
} as const;

function resolveTiming(input: OtlpTraceToolInput): { startTime: number; endTime: number } {
  const startTime = input.startTime ? Date.parse(input.startTime) : Date.now();

  if (input.endTime) {
    return { startTime, endTime: Date.parse(input.endTime) };
  }

  if (input.durationMs) {
    return { startTime, endTime: startTime + input.durationMs };
  }

  return { startTime, endTime: Date.now() };
}

export async function exportOtlpTrace(
  input: OtlpTraceToolInput,
  options: OtlpTraceServiceOptions,
): Promise<OtlpTraceToolOutput> {
  const exporter = new OTLPTraceExporter({
    url: input.endpoint,
    timeoutMillis: options.timeoutMs,
  });

  const provider = new BasicTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: input.serviceName,
    }),
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });

  trace.setGlobalTracerProvider(provider);

  const tracer = provider.getTracer('obs-mcp');
  const { startTime, endTime } = resolveTiming(input);
  const span = tracer.startSpan(input.spanName, { startTime });

  span.setAttributes(input.attributes);
  span.setStatus({ code: spanStatusMap[input.status] });
  span.end(endTime);

  await provider.forceFlush();
  await provider.shutdown();

  return {
    targetEndpoint: input.endpoint,
    serviceName: input.serviceName,
    spanName: input.spanName,
    exported: true,
    message: `Exported span ${input.spanName} to ${input.endpoint}.`,
  };
}
