#!/usr/bin/env node
// Reporta drift entre los códigos de error del backend (transport-api) y el
// catálogo del frontend (lib/apiErrors.ts → API_ERROR_CATALOG).
//
// Uso:
//   node scripts/check-error-catalog-drift.mjs [ruta-al-repo-backend]
//
// Por defecto busca el backend en C:\Users\x\Documents\GitHub\transport-api.
// Escanea los *Error.cs del dominio y extrae el primer string literal de cada
// constructor de Error. Sale con código 1 si hay códigos del backend que NO
// están en el catálogo del frontend (ver docs/adr/0001).

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_CATALOG = resolve(__dirname, '..', 'lib', 'apiErrors.ts');
const DEFAULT_BACKEND = 'C:\\Users\\x\\Documents\\GitHub\\transport-api';

const backendRoot = process.argv[2] || process.env.TRANSPORT_API_PATH || DEFAULT_BACKEND;
const backendDomain = join(backendRoot, 'transport.domain');

// Códigos del backend que se emiten dinámicamente (no como string literal) o
// desde infraestructura, y que por diseño no esperamos detectar por escaneo.
const KNOWN_DYNAMIC = new Set(['Validation.General']);

function walk(dir) {
  /** @type {string[]} */
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'obj' || name === 'bin') continue;
      out.push(...walk(full));
    } else if (name.endsWith('Error.cs')) {
      out.push(full);
    }
  }
  return out;
}

function extractBackendCodes() {
  const codes = new Set();
  const files = walk(backendDomain);
  // Captura el primer string literal de: Error.Validation/NotFound/Conflict/
  // Problem/Failure(...), new Error(...) y new(...) (target-typed).
  const re =
    /(?:Error\.(?:Validation|NotFound|Conflict|Problem|Failure)|new\s+Error|new)\s*\(\s*"([^"]+)"/g;
  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    let m;
    while ((m = re.exec(src)) !== null) {
      const code = m[1];
      // Descartar literales que no son códigos (ej: string.Empty no entra acá
      // porque no lleva comillas; un mensaje suelto no precede a un constructor).
      if (code && !code.includes(' ')) codes.add(code);
    }
  }
  return codes;
}

function extractCatalogKeys() {
  const src = readFileSync(FRONTEND_CATALOG, 'utf8');
  const start = src.indexOf('API_ERROR_CATALOG: Record');
  const open = src.indexOf('{', start);
  // Acotar al objeto del catálogo: avanzar hasta la llave que lo cierra
  // (profundidad 0), así no se cuelan claves de otros tipos del archivo.
  let depth = 0;
  let end = open;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const keys = new Set();
  const body = src.slice(open + 1, end);
  // Sólo claves de nivel 1 (las entradas anidadas { message, field } están a
  // profundidad mayor): contamos llaves por línea para quedarnos en depth 1.
  let lineDepth = 1;
  const keyRe = /^\s*(?:'([^']+)'|([A-Za-z_][\w.]*))\s*:/;
  for (const line of body.split('\n')) {
    if (lineDepth === 1) {
      const m = keyRe.exec(line);
      if (m) keys.add(m[1] ?? m[2]);
    }
    for (const ch of line) {
      if (ch === '{') lineDepth++;
      else if (ch === '}') lineDepth--;
    }
  }
  return keys;
}

if (!existsSync(backendDomain)) {
  console.error(`No se encontró el backend en: ${backendDomain}`);
  console.error('Pasá la ruta como argumento o seteá TRANSPORT_API_PATH.');
  process.exit(2);
}

const backendCodes = extractBackendCodes();
const catalogKeys = extractCatalogKeys();

const missing = [...backendCodes]
  .filter((c) => !catalogKeys.has(c) && !KNOWN_DYNAMIC.has(c))
  .sort();
const orphan = [...catalogKeys].filter((k) => !backendCodes.has(k)).sort();

console.log(`Backend: ${backendCodes.size} códigos · Catálogo: ${catalogKeys.size} claves\n`);

if (missing.length) {
  console.log(`✗ ${missing.length} código(s) del backend SIN entrada en el catálogo:`);
  for (const c of missing) console.log(`   - ${c}`);
  console.log('\n  Agregalos a API_ERROR_CATALOG en lib/apiErrors.ts.');
} else {
  console.log('✓ Todos los códigos del backend están en el catálogo.');
}

if (orphan.length) {
  console.log(
    `\nℹ ${orphan.length} clave(s) del catálogo sin match directo en el backend ` +
      `(alias canónicos, infra o legacy — normal):`,
  );
  for (const k of orphan) console.log(`   - ${k}`);
}

process.exit(missing.length ? 1 : 0);
