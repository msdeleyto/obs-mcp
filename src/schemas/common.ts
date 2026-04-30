import * as z from 'zod/v4';

export const metricNamePattern = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;
export const labelNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export const absoluteHttpUrlSchema = z
  .url()
  .refine((value) => {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  }, 'Endpoint must use http or https.')
  .transform((value) => new URL(value).toString());

export const finiteNumberSchema = z.number().finite();

export const stringMapSchema = z.record(z.string(), z.string());

export const boundedString = (maxLength: number) =>
  z.string().min(1).max(maxLength);
