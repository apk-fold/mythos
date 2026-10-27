// Moteur de formules du tableur : analyse lexicale, analyse syntaxique (précédence à la Excel)
// et évaluation avec cache et détection des références circulaires.

export class FErr {
  constructor(code) { this.code = code; }
  toString() { return this.code; }
}
const E = {
  div0: new FErr('#DIV/0!'), ref: new FErr('#REF!'), name: new FErr('#NOM?'),
  value: new FErr('#VALEUR!'), circ: new FErr('#CIRC!'), na: new FErr('#N/A'), num: new FErr('#NOMBRE!'),
};
const isErr = (v) => v instanceof FErr;

// ---- Références ----
export const colName = (c) => { let s = ''; c++; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; };
export const colIndex = (s) => { let n = 0; for (const ch of s.toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
export const cellName = (r, c) => colName(c) + (r + 1);
export function parseRef(s) {
  const m = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)$/.exec(s);
  if (!m) return null;
  return { c: colIndex(m[2]), r: +m[4] - 1, ac: !!m[1], ar: !!m[3] };
}

// ---- Analyse lexicale ----
function tokenize(s) {
  const toks = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
      if (!m) throw E.name;
      toks.push({ t: 'num', v: parseFloat(m[0]) });
      i += m[0].length;
      continue;
    }
    if (ch === '"') {
      let j = i + 1, str = '';
      for (;;) {
        if (j >= s.length) throw E.value;
        if (s[j] === '"') { if (s[j + 1] === '"') { str += '"'; j += 2; continue; } break; }
        str += s[j++];
      }
      toks.push({ t: 'str', v: str });
      i = j + 1;
      continue;
    }
    if (ch === "'") {
      const j = s.indexOf("'", i + 1);
      if (j < 0 || s[j + 1] !== '!') throw E.ref;
      toks.push({ t: 'sheet', v: s.slice(i + 1, j) });
      i = j + 2;
      continue;
    }
    if (/[A-Za-z_$À-ÿ]/.test(ch)) {
      const w = /^[A-Za-z_$À-ÿ][\w.$À-ÿ]*/.exec(s.slice(i))[0];
      i += w.length;
      if (s[i] === '!') { toks.push({ t: 'sheet', v: w }); i++; continue; }
      if (s[i] === '(') { toks.push({ t: 'func', v: w.toUpperCase() }); continue; }
      if (/^\$?[A-Za-z]{1,3}\$?\d+$/.test(w)) { toks.push({ t: 'ref', v: w }); continue; }
      toks.push({ t: 'name', v: w.toUpperCase() });
      continue;
    }
    const two = s.slice(i, i + 2);
    if (two === '<>' || two === '<=' || two === '>=') { toks.push({ t: 'op', v: two }); i += 2; continue; }
    if ('+-*/^&=<>%:'.includes(ch)) { toks.push({ t: 'op', v: ch }); i++; continue; }
    if (ch === '(' || ch === ')') { toks.push({ t: ch }); i++; continue; }
    if (ch === ',' || ch === ';') { toks.push({ t: ',' }); i++; continue; }
    throw E.name;
  }
  return toks;
}

// ---- Analyse syntaxique ----
export function parse(src) {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (...ops) => peek()?.t === 'op' && ops.includes(peek().v);
  const expect = (t) => { const k = toks[p++]; if (!k || k.t !== t) throw E.name; return k; };

  const bin = (next, ops) => () => {
    let l = next();
    while (isOp(...ops)) { const o = toks[p++].v; l = { k: 'bin', o, l, r: next() }; }
    return l;
  };
  const prim = () => {
    const t = toks[p++];
    if (!t) throw E.name;
    switch (t.t) {
      case 'num': return { k: 'lit', v: t.v };
      case 'str': return { k: 'lit', v: t.v };
      case 'ref': return refNode(null, t.v);
      case 'sheet': return refNode(t.v, expect('ref').v);
      case 'name':
        if (t.v === 'TRUE' || t.v === 'VRAI') return { k: 'lit', v: true };
        if (t.v === 'FALSE' || t.v === 'FAUX') return { k: 'lit', v: false };
        return { k: 'lit', v: E.name };
      case 'func': {
        expect('(');
        const args = [];
        if (peek()?.t !== ')') {
          do { args.push(peek()?.t === ',' || peek()?.t === ')' ? { k: 'lit', v: null } : cmp()); } while (peek()?.t === ',' && ++p);
        }
        expect(')');
        return { k: 'fn', n: t.v, args };
      }
      case '(': { const e = cmp(); expect(')'); return e; }
    }
    throw E.name;
  };
  const refNode = (sheet, a) => {
    const ra = parseRef(a);
    if (isOp(':')) {
      p++;
      const t = toks[p++];
      const rb = t && t.t === 'ref' ? parseRef(t.v) : null;
      if (!rb) throw E.ref;
      return { k: 'range', sheet, r1: Math.min(ra.r, rb.r), c1: Math.min(ra.c, rb.c), r2: Math.max(ra.r, rb.r), c2: Math.max(ra.c, rb.c) };
    }
    return { k: 'ref', sheet, r: ra.r, c: ra.c };
  };
  const pct = () => { let e = prim(); while (isOp('%')) { p++; e = { k: 'pct', e }; } return e; };
  const unary = () => {
    if (isOp('-')) { p++; return { k: 'neg', e: unary() }; }
    if (isOp('+')) { p++; return unary(); }
    return pct();
  };
  const pow = bin(unary, ['^']);
  const mul = bin(pow, ['*', '/']);
  const add = bin(mul, ['+', '-']);
  const cat = bin(add, ['&']);
  const cmp = bin(cat, ['=', '<>', '<', '>', '<=', '>=']);
  const ast = cmp();
  if (p < toks.length) throw E.name;
  return ast;
}

// ---- Conversions ----
export function parseLiteral(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === '') return null;
  if (/^[-+]?(\d+([.,]\d+)?|[.,]\d+)(e[+-]?\d+)?$/i.test(s)) return parseFloat(s.replace(',', '.'));
  if (/^[-+]?\d+([.,]\d+)?\s?%$/.test(s)) return parseFloat(s.replace(',', '.')) / 100;
  if (/^[-+]?\d{1,3}( \d{3})+([.,]\d+)?$/.test(s)) return parseFloat(s.replace(/ /g, '').replace(',', '.'));
  const up = s.toUpperCase();
  if (up === 'VRAI' || up === 'TRUE') return true;
  if (up === 'FAUX' || up === 'FALSE') return false;
  return String(raw);
}
const toNum = (v) => {
  if (isErr(v)) return v;
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const n = parseLiteral(v);
  return typeof n === 'number' ? n : E.value;
};
const toStr = (v) => (v == null ? '' : typeof v === 'boolean' ? (v ? 'VRAI' : 'FAUX') : typeof v === 'number' ? fmtGeneral(v) : String(v));
const toBool = (v) => (typeof v === 'string' ? (parseLiteral(v) === true ? true : parseLiteral(v) === false ? false : E.value) : isErr(v) ? v : !!toNum(v));
export const fmtGeneral = (n) => (Number.isInteger(n) ? String(n) : String(+n.toPrecision(12)));

const isRange = (v) => v && v.range;
const flat = (args) => {
  const out = [];
  for (const a of args) {
    if (isRange(a)) for (const row of a.vals) for (const x of row) out.push({ v: x, fromRange: true });
    else out.push({ v: a, fromRange: false });
  }
  return out;
};
const nums = (args) => {
  const out = [];
  for (const { v, fromRange } of flat(args)) {
    if (isErr(v)) return v;
    if (fromRange) { if (typeof v === 'number') out.push(v); }
    else { const n = toNum(v); if (isErr(n)) return n; out.push(n); }
  }
  return out;
};
const agg = (fn) => (...args) => { const a = nums(args); return isErr(a) ? a : fn(a); };

function criteria(c) {
  if (typeof c === 'number' || typeof c === 'boolean') return (v) => v === c;
  const m = /^(<=|>=|<>|<|>|=)?(.*)$/.exec(String(c ?? ''));
  const op = m[1] || '=';
  const target = parseLiteral(m[2]);
  const rx = typeof target === 'string' && /[*?]/.test(target)
    ? new RegExp('^' + target.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i') : null;
  return (v) => {
    if (rx) return op === '<>' ? !rx.test(toStr(v)) : rx.test(toStr(v));
    const a = typeof target === 'number' ? (typeof v === 'number' ? v : NaN) : toStr(v).toLowerCase();
    const b = typeof target === 'string' ? target.toLowerCase() : target ?? '';
    switch (op) { case '=': return a === b; case '<>': return a !== b; case '<': return a < b; case '>': return a > b; case '<=': return a <= b; case '>=': return a >= b; }
  };
}
const cells = (r) => (isRange(r) ? r.vals.flat() : [r]);
const excelDate = (d) => (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()) - Date.UTC(1899, 11, 30)) / 864e5;
export const fromExcelDate = (n) => new Date(Date.UTC(1899, 11, 30) + Math.round(n * 864e5));

const FUNCS = {
  SUM: agg((a) => a.reduce((s, x) => s + x, 0)),
  AVERAGE: agg((a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : E.div0)),
  MIN: agg((a) => (a.length ? Math.min(...a) : 0)),
  MAX: agg((a) => (a.length ? Math.max(...a) : 0)),
  PRODUCT: agg((a) => a.reduce((s, x) => s * x, 1)),
  MEDIAN: agg((a) => { if (!a.length) return E.num; a.sort((x, y) => x - y); const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }),
  STDEV: agg((a) => { if (a.length < 2) return E.div0; const m = a.reduce((s, x) => s + x, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); }),
  COUNT: (...args) => flat(args).filter(({ v, fromRange }) => typeof v === 'number' || (!fromRange && typeof toNum(v) === 'number')).length,
  COUNTA: (...args) => flat(args).filter(({ v }) => v != null && v !== '').length,
  COUNTBLANK: (r) => cells(r).filter((v) => v == null || v === '').length,
  ABS: (x) => wrap1(x, Math.abs),
  SQRT: (x) => wrap1(x, (n) => (n < 0 ? E.num : Math.sqrt(n))),
  INT: (x) => wrap1(x, Math.floor),
  EXP: (x) => wrap1(x, Math.exp),
  LN: (x) => wrap1(x, (n) => (n <= 0 ? E.num : Math.log(n))),
  LOG10: (x) => wrap1(x, (n) => (n <= 0 ? E.num : Math.log10(n))),
  ROUND: (x, d = 0) => num2(x, d, (a, b) => { const k = 10 ** b; return Math.round(a * k + Math.sign(a) * 1e-9) / k; }),
  ROUNDUP: (x, d = 0) => num2(x, d, (a, b) => { const k = 10 ** b; return Math.sign(a) * Math.ceil(Math.abs(a) * k - 1e-9) / k; }),
  ROUNDDOWN: (x, d = 0) => num2(x, d, (a, b) => { const k = 10 ** b; return Math.sign(a) * Math.floor(Math.abs(a) * k + 1e-9) / k; }),
  MOD: (x, y) => num2(x, y, (a, b) => (b === 0 ? E.div0 : a - b * Math.floor(a / b))),
  POWER: (x, y) => num2(x, y, (a, b) => a ** b),
  PI: () => Math.PI,
  RAND: () => Math.random(),
  RANDBETWEEN: (x, y) => num2(x, y, (a, b) => Math.floor(Math.random() * (b - a + 1)) + Math.ceil(a)),
  CONCAT: (...args) => flat(args).map(({ v }) => toStr(v)).join(''),
  LEN: (s) => toStr(s).length,
  UPPER: (s) => toStr(s).toUpperCase(),
  LOWER: (s) => toStr(s).toLowerCase(),
  PROPER: (s) => toStr(s).toLowerCase().replace(/(^|[^a-zà-ÿ])([a-zà-ÿ])/g, (_, a, b) => a + b.toUpperCase()),
  TRIM: (s) => toStr(s).trim().replace(/\s+/g, ' '),
  LEFT: (s, n = 1) => toStr(s).slice(0, toNum(n)),
  RIGHT: (s, n = 1) => { const t = toStr(s); const k = toNum(n); return k ? t.slice(-k) : ''; },
  MID: (s, a, n) => toStr(s).substr(toNum(a) - 1, toNum(n)),
  SUBSTITUTE: (s, a, b) => toStr(s).split(toStr(a)).join(toStr(b)),
  FIND: (a, s, st = 1) => { const i = toStr(s).indexOf(toStr(a), toNum(st) - 1); return i < 0 ? E.value : i + 1; },
  REPT: (s, n) => toStr(s).repeat(Math.max(0, toNum(n))),
  TEXT: (v, f) => formatValue(toNum(v), String(f).includes('%') ? 'pct' : String(f).includes('0,00') || String(f).includes('0.00') ? 'num2' : 'general'),
  VALUE: (s) => toNum(s),
  AND: (...args) => { for (const { v } of flat(args)) { const b = toBool(v); if (isErr(b)) return b; if (!b) return false; } return true; },
  OR: (...args) => { for (const { v } of flat(args)) { const b = toBool(v); if (isErr(b)) return b; if (b) return true; } return false; },
  NOT: (v) => { const b = toBool(v); return isErr(b) ? b : !b; },
  ISBLANK: (v) => v == null || v === '',
  ISNUMBER: (v) => typeof v === 'number',
  ISTEXT: (v) => typeof v === 'string',
  ISERROR: (v) => isErr(v),
  TODAY: () => Math.floor(excelDate(new Date())),
  NOW: () => excelDate(new Date()),
  YEAR: (d) => wrap1(d, (n) => fromExcelDate(n).getUTCFullYear()),
  MONTH: (d) => wrap1(d, (n) => fromExcelDate(n).getUTCMonth() + 1),
  DAY: (d) => wrap1(d, (n) => fromExcelDate(n).getUTCDate()),
  DATE: (y, m, d) => excelDate(new Date(toNum(y), toNum(m) - 1, toNum(d))),
  SUMIF: (r, c, s) => { const t = criteria(c); const a = cells(r), b = s ? cells(s) : a; let sum = 0; a.forEach((v, i) => { if (t(v) && typeof b[i] === 'number') sum += b[i]; }); return sum; },
  COUNTIF: (r, c) => { const t = criteria(c); return cells(r).filter((v) => t(v)).length; },
  AVERAGEIF: (r, c, s) => { const t = criteria(c); const a = cells(r), b = s ? cells(s) : a; const x = []; a.forEach((v, i) => { if (t(v) && typeof b[i] === 'number') x.push(b[i]); }); return x.length ? x.reduce((p, q) => p + q, 0) / x.length : E.div0; },
  VLOOKUP: (v, r, col, approx = true) => {
    if (!isRange(r)) return E.ref;
    const k = toNum(col) - 1;
    if (k < 0 || k >= r.vals[0].length) return E.ref;
    const exact = toBool(approx) === false;
    let best = -1;
    for (let i = 0; i < r.vals.length; i++) {
      const x = r.vals[i][0];
      if (exact || typeof v !== 'number') { if (toStr(x).toLowerCase() === toStr(v).toLowerCase()) return r.vals[i][k]; }
      else if (typeof x === 'number' && x <= v) best = i;
    }
    return best >= 0 && !exact ? r.vals[best][k] : E.na;
  },
  HLOOKUP: (v, r, row, approx = true) => {
    if (!isRange(r)) return E.ref;
    const k = toNum(row) - 1;
    const exact = toBool(approx) === false;
    for (let j = 0; j < r.vals[0].length; j++) if (toStr(r.vals[0][j]).toLowerCase() === toStr(v).toLowerCase()) return r.vals[k]?.[j] ?? E.ref;
    return exact ? E.na : E.na;
  },
  INDEX: (r, row, col = 1) => (isRange(r) ? r.vals[toNum(row) - 1]?.[toNum(col) - 1] ?? E.ref : E.ref),
  MATCH: (v, r) => { const i = cells(r).findIndex((x) => toStr(x).toLowerCase() === toStr(v).toLowerCase()); return i < 0 ? E.na : i + 1; },
};
function wrap1(x, fn) { const n = toNum(x); return isErr(n) ? n : fn(n); }
function num2(x, y, fn) { const a = toNum(x), b = toNum(y); return isErr(a) ? a : isErr(b) ? b : fn(a, b); }

// Noms français (comme dans un tableur en français) → noms internes.
export const FR = {
  SOMME: 'SUM', MOYENNE: 'AVERAGE', PRODUIT: 'PRODUCT', MEDIANE: 'MEDIAN', ECARTYPE: 'STDEV', NB: 'COUNT', NBVAL: 'COUNTA', 'NB.VIDE': 'COUNTBLANK',
  RACINE: 'SQRT', ENT: 'INT', ARRONDI: 'ROUND', 'ARRONDI.SUP': 'ROUNDUP', 'ARRONDI.INF': 'ROUNDDOWN', PUISSANCE: 'POWER', ALEA: 'RAND', 'ALEA.ENTRE.BORNES': 'RANDBETWEEN',
  CONCATENER: 'CONCAT', CONCATENATE: 'CONCAT', NBCAR: 'LEN', MAJUSCULE: 'UPPER', MINUSCULE: 'LOWER', NOMPROPRE: 'PROPER', SUPPRESPACE: 'TRIM', GAUCHE: 'LEFT', DROITE: 'RIGHT',
  STXT: 'MID', SUBSTITUE: 'SUBSTITUTE', TROUVE: 'FIND', REPT: 'REPT', TEXTE: 'TEXT', CNUM: 'VALUE', SI: 'IF', ET: 'AND', OU: 'OR', NON: 'NOT', SIERREUR: 'IFERROR',
  ESTVIDE: 'ISBLANK', ESTNUM: 'ISNUMBER', ESTTEXTE: 'ISTEXT', ESTERREUR: 'ISERROR', AUJOURDHUI: 'TODAY', MAINTENANT: 'NOW', ANNEE: 'YEAR', MOIS: 'MONTH', JOUR: 'DAY',
  'SOMME.SI': 'SUMIF', 'NB.SI': 'COUNTIF', 'MOYENNE.SI': 'AVERAGEIF', RECHERCHEV: 'VLOOKUP', RECHERCHEH: 'HLOOKUP', EQUIV: 'MATCH', ABS: 'ABS', MOD: 'MOD', PI: 'PI', EXP: 'EXP', LN: 'LN', LOG10: 'LOG10',
};
export const FUNCTION_NAMES = [...Object.keys(FUNCS), 'IF', 'IFERROR', ...Object.keys(FR)].sort();

// Traduit les noms de fonctions français en anglais (format de stockage des fichiers .xlsx).
export function toEnglishFormula(f) {
  // Les fichiers .xlsx utilisent toujours la virgule comme séparateur d'arguments.
  return f.replace(/("(?:[^"]|"")*")|([A-Za-zÀ-ÿ][\w.À-ÿ]*)\s*\(|;/g, (m, str, name) => (str ? m : name ? (FR[name.toUpperCase()] || name) + '(' : ','));
}

// ---- Évaluation ----
export function createEngine(model) {
  // model : { sheetByName(name) -> sheet, raw(sheet, r, c) -> string, id(sheet) }
  const cache = new Map();
  const asts = new Map();
  const computing = new Set();

  function astOf(src) {
    let a = asts.get(src);
    if (!a) {
      try { a = parse(src); } catch (e) { a = { k: 'lit', v: isErr(e) ? e : E.name }; }
      asts.set(src, a);
    }
    return a;
  }

  function value(sheet, r, c) {
    if (!sheet) return E.ref;
    const key = model.id(sheet) + '!' + r + ',' + c;
    if (cache.has(key)) return cache.get(key);
    const raw = model.raw(sheet, r, c);
    let v;
    if (typeof raw === 'string' && raw.startsWith('=') && raw.length > 1) {
      if (computing.has(key)) return E.circ;
      computing.add(key);
      try { v = ev(astOf(raw.slice(1)), sheet); } catch (e) { v = isErr(e) ? e : E.value; }
      computing.delete(key);
      if (isRange(v)) v = v.vals[0]?.[0] ?? null;
      if (typeof v === 'number' && !isFinite(v)) v = E.num;
    } else v = parseLiteral(raw);
    cache.set(key, v);
    return v;
  }

  function ev(n, sheet) {
    switch (n.k) {
      case 'lit': return n.v;
      case 'ref': return value(n.sheet ? model.sheetByName(n.sheet) : sheet, n.r, n.c);
      case 'range': {
        const s = n.sheet ? model.sheetByName(n.sheet) : sheet;
        if (!s) return E.ref;
        const vals = [];
        for (let r = n.r1; r <= n.r2; r++) { const row = []; for (let c = n.c1; c <= n.c2; c++) row.push(value(s, r, c)); vals.push(row); }
        return { range: true, vals };
      }
      case 'neg': { const v = toNum(scalar(ev(n.e, sheet))); return isErr(v) ? v : -v; }
      case 'pct': { const v = toNum(scalar(ev(n.e, sheet))); return isErr(v) ? v : v / 100; }
      case 'bin': {
        const a = scalar(ev(n.l, sheet)), b = scalar(ev(n.r, sheet));
        if (isErr(a)) return a;
        if (isErr(b)) return b;
        if (n.o === '&') return toStr(a) + toStr(b);
        if (['=', '<>', '<', '>', '<=', '>='].includes(n.o)) {
          let x = a ?? '', y = b ?? '';
          if (typeof x === 'string' && typeof y === 'string') { x = x.toLowerCase(); y = y.toLowerCase(); }
          else if (typeof x !== typeof y) { if (x === '' && typeof y === 'number') x = 0; else if (y === '' && typeof x === 'number') y = 0; }
          switch (n.o) { case '=': return x === y; case '<>': return x !== y; case '<': return x < y; case '>': return x > y; case '<=': return x <= y; case '>=': return x >= y; }
        }
        const x = toNum(a), y = toNum(b);
        if (isErr(x)) return x;
        if (isErr(y)) return y;
        switch (n.o) {
          case '+': return x + y;
          case '-': return x - y;
          case '*': return x * y;
          case '/': return y === 0 ? E.div0 : x / y;
          case '^': return x ** y;
        }
        return E.value;
      }
      case 'fn': {
        const name = FR[n.n] || n.n;
        if (name === 'IF') {
          const c = toBool(scalar(ev(n.args[0] || { k: 'lit', v: false }, sheet)));
          if (isErr(c)) return c;
          const branch = c ? n.args[1] : n.args[2];
          return branch ? ev(branch, sheet) : c ? true : false;
        }
        if (name === 'IFERROR') {
          const v = scalar(ev(n.args[0], sheet));
          return isErr(v) ? (n.args[1] ? ev(n.args[1], sheet) : '') : v;
        }
        const f = FUNCS[name];
        if (!f) return E.name;
        const args = n.args.map((a) => ev(a, sheet));
        const keepsRanges = ['SUM', 'AVERAGE', 'MIN', 'MAX', 'PRODUCT', 'MEDIAN', 'STDEV', 'COUNT', 'COUNTA', 'COUNTBLANK', 'CONCAT', 'AND', 'OR', 'SUMIF', 'COUNTIF', 'AVERAGEIF', 'VLOOKUP', 'HLOOKUP', 'INDEX', 'MATCH'];
        if (!keepsRanges.includes(name)) for (let i = 0; i < args.length; i++) { args[i] = scalar(args[i]); if (isErr(args[i]) && name !== 'ISERROR') return args[i]; }
        return f(...args);
      }
    }
    return E.value;
  }
  const scalar = (v) => (isRange(v) ? (v.vals.length === 1 && v.vals[0].length === 1 ? v.vals[0][0] : E.value) : v);

  return { value, invalidate: () => cache.clear(), isErr };
}

// ---- Formats d'affichage ----
const nf = (o) => new Intl.NumberFormat('fr-FR', o);
const FMT = {
  num0: nf({ maximumFractionDigits: 0 }), num2: nf({ minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  pct: nf({ style: 'percent', maximumFractionDigits: 2 }), eur: nf({ style: 'currency', currency: 'EUR' }),
  usd: nf({ style: 'currency', currency: 'USD' }), gen: nf({ maximumFractionDigits: 10, useGrouping: false }),
};
export const FORMATS = [['general', 'Standard'], ['num0', 'Nombre (0)'], ['num2', 'Nombre (0,00)'], ['pct', 'Pourcentage'], ['eur', 'Monétaire €'], ['usd', 'Monétaire $'], ['date', 'Date'], ['text', 'Texte']];

export function formatValue(v, fmt = 'general') {
  if (v == null) return '';
  if (isErr(v)) return v.code;
  if (typeof v === 'boolean') return v ? 'VRAI' : 'FAUX';
  if (typeof v !== 'number') return String(v);
  if (fmt === 'date') { const d = fromExcelDate(v); return d.toLocaleDateString('fr-FR', { timeZone: 'UTC' }); }
  if (FMT[fmt]) return FMT[fmt].format(v);
  if (Math.abs(v) >= 1e11 || (v !== 0 && Math.abs(v) < 1e-6)) return v.toExponential(4).replace('.', ',');
  return FMT.gen.format(+v.toPrecision(12));
}

// ---- Décalage des références (copier/coller, insertion de lignes/colonnes) ----
// fn(ref) reçoit { sheet, r, c, ar, ac } et renvoie la nouvelle position ou null (→ #REF!).
export function mapRefs(formula, fn) {
  return formula.replace(/("(?:[^"]|"")*")|((?:'[^']+'|[A-Za-z_À-ÿ][\w.À-ÿ]*)!)?(?<![\w.$])(\$?)([A-Za-z]{1,3})(\$?)(\d+)(?![\w(!])/g,
    (m, str, sheetPart, ac, col, ar, row) => {
      if (str) return m;
      const sheet = sheetPart ? sheetPart.slice(0, -1).replace(/^'|'$/g, '') : null;
      const res = fn({ sheet, r: +row - 1, c: colIndex(col), ar: !!ar, ac: !!ac });
      if (!res) return (sheetPart || '') + '#REF!';
      return (sheetPart || '') + (ac ? '$' : '') + colName(res.c) + (ar ? '$' : '') + (res.r + 1);
    });
}
export const shiftFormula = (f, dr, dc) =>
  mapRefs(f, (x) => { const r = x.ar ? x.r : x.r + dr, c = x.ac ? x.c : x.c + dc; return r < 0 || c < 0 ? null : { r, c }; });
