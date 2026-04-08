/**
 * Parser de un campo individual usado por `useReportFilters`.
 *
 * - `parse`: convierte el valor crudo del query string a su tipo tipado.
 * - `serialize`: convierte el valor tipado a string para la URL, o null para omitirlo.
 * - `urlSafe`: si es `false`, el campo NO se persiste en URL (queda solo en memoria).
 *   Usar para PII: email, documentNumber, phone, etc.
 */
export interface UrlParser<T> {
  parse: (raw: string | null) => T | undefined;
  serialize: (value: T | undefined) => string | null;
  urlSafe: boolean;
}

const isEmpty = (v: unknown): boolean =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

// ----- String -----

export const stringParser: UrlParser<string> = {
  parse: (raw) => (raw == null || raw === '' ? undefined : raw),
  serialize: (value) => (isEmpty(value) ? null : String(value)),
  urlSafe: true,
};

/** String que NO se persiste en URL (PII: email, documento, teléfono). */
export const piiStringParser: UrlParser<string> = {
  parse: () => undefined, // nunca se hidrata desde URL
  serialize: () => null, // nunca se escribe a URL
  urlSafe: false,
};

// ----- Number -----

export const numberParser: UrlParser<number> = {
  parse: (raw) => {
    if (raw == null || raw === '') return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  },
  serialize: (value) => (isEmpty(value) ? null : String(value)),
  urlSafe: true,
};

/** Number que NO se persiste en URL. */
export const piiNumberParser: UrlParser<number> = {
  parse: () => undefined,
  serialize: () => null,
  urlSafe: false,
};

// ----- Boolean -----

export const boolParser: UrlParser<boolean> = {
  parse: (raw) => {
    if (raw == null || raw === '') return undefined;
    if (raw === 'true' || raw === '1') return true;
    if (raw === 'false' || raw === '0') return false;
    return undefined;
  },
  serialize: (value) => {
    if (value === undefined || value === null) return null;
    return value ? 'true' : 'false';
  },
  urlSafe: true,
};

// ----- Date (ISO yyyy-mm-dd) -----

export const dateParser: UrlParser<string> = {
  // Mantenemos como string ISO — el backend espera DateTime parseable.
  parse: (raw) => (raw == null || raw === '' ? undefined : raw),
  serialize: (value) => (isEmpty(value) ? null : String(value)),
  urlSafe: true,
};

// ----- Enum -----

/**
 * Parser para un enum TypeScript (o objeto const con valores primitivos).
 * Acepta los valores del enum como strings/numbers.
 */
export function enumParser<T extends string | number>(allowed: readonly T[]): UrlParser<T> {
  const asString = allowed.map((v) => String(v));
  return {
    parse: (raw) => {
      if (raw == null || raw === '') return undefined;
      // Intento numérico primero si el enum es numérico
      const asNum = Number(raw);
      if (Number.isFinite(asNum) && (allowed as readonly (string | number)[]).includes(asNum)) {
        return asNum as T;
      }
      if (asString.includes(raw)) {
        // Si era numérico en realidad, devolverlo como número
        const n = Number(raw);
        return (Number.isFinite(n) ? (n as T) : (raw as T));
      }
      return undefined;
    },
    serialize: (value) => (isEmpty(value) ? null : String(value)),
    urlSafe: true,
  };
}

// ----- Helpers -----

/** Elimina claves con valores vacíos (undefined, null, ""). */
export function pruneEmpty<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.keys(obj) as (keyof T)[]).forEach((k) => {
    const v = obj[k];
    if (!isEmpty(v)) {
      out[k] = v;
    }
  });
  return out;
}
