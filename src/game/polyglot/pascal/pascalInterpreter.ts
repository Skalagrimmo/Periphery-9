/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Pascal-Like Scripting Subsystem
// Genuine lightweight Lexer, Recursive-Descent Parser, and AST Evaluator for Pascal syntax.
// Used for deterministic game quest rules, oxygen credit tariffs, and reputation modifiers.

export type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'STRING'
  | 'OPERATOR'
  | 'ASSIGN' // :=
  | 'SEMICOLON'
  | 'COLON'
  | 'COMMA'
  | 'LPAREN'
  | 'RPAREN'
  | 'DOT'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
}

const PASCAL_KEYWORDS = new Set([
  'PROGRAM',
  'VAR',
  'BEGIN',
  'END',
  'IF',
  'THEN',
  'ELSE',
  'PROCEDURE',
  'FUNCTION',
  'AND',
  'OR',
  'NOT',
  'INTEGER',
  'BOOLEAN',
  'STRING',
  'TRUE',
  'FALSE',
  'DIV',
  'MOD',
]);

export function tokenizePascal(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;

  while (i < source.length) {
    const c = source[i];

    // Newline tracking
    if (c === '\n') {
      line++;
      i++;
      continue;
    }

    // Whitespace
    if (/\s/.test(c)) {
      i++;
      continue;
    }

    // Comments { ... }
    if (c === '{') {
      while (i < source.length && source[i] !== '}') {
        if (source[i] === '\n') line++;
        i++;
      }
      if (i < source.length && source[i] === '}') i++;
      continue;
    }

    // Single-line comment //
    if (c === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') {
        i++;
      }
      continue;
    }

    // Semicolon, Colon, Assign :=
    if (c === ';') {
      tokens.push({ type: 'SEMICOLON', value: ';', line });
      i++;
      continue;
    }
    if (c === ':') {
      if (source[i + 1] === '=') {
        tokens.push({ type: 'ASSIGN', value: ':=', line });
        i += 2;
      } else {
        tokens.push({ type: 'COLON', value: ':', line });
        i++;
      }
      continue;
    }

    // Comma, Dot, Parens
    if (c === ',') {
      tokens.push({ type: 'COMMA', value: ',', line });
      i++;
      continue;
    }
    if (c === '.') {
      tokens.push({ type: 'DOT', value: '.', line });
      i++;
      continue;
    }
    if (c === '(') {
      tokens.push({ type: 'LPAREN', value: '(', line });
      i++;
      continue;
    }
    if (c === ')') {
      tokens.push({ type: 'RPAREN', value: ')', line });
      i++;
      continue;
    }

    // Comparison / Arithmetic operators
    if (['+', '-', '*', '/', '=', '<', '>'].includes(c)) {
      let op = c;
      if (
        (c === '<' && (source[i + 1] === '=' || source[i + 1] === '>')) ||
        (c === '>' && source[i + 1] === '=')
      ) {
        op += source[i + 1];
        i += 2;
      } else {
        i++;
      }
      tokens.push({ type: 'OPERATOR', value: op, line });
      continue;
    }

    // String literals '...'
    if (c === "'") {
      let str = '';
      i++;
      while (i < source.length && source[i] !== "'") {
        if (source[i] === '\n') line++;
        str += source[i];
        i++;
      }
      if (source[i] === "'") i++;
      tokens.push({ type: 'STRING', value: str, line });
      continue;
    }

    // Numbers
    if (/[0-9]/.test(c)) {
      let num = '';
      while (i < source.length && /[0-9]/.test(source[i])) {
        num += source[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: num, line });
      continue;
    }

    // Identifiers or Keywords
    if (/[a-zA-Z_]/.test(c)) {
      let ident = '';
      while (i < source.length && /[a-zA-Z0-9_]/.test(source[i])) {
        ident += source[i];
        i++;
      }
      const upper = ident.toUpperCase();
      if (PASCAL_KEYWORDS.has(upper)) {
        tokens.push({ type: 'KEYWORD', value: upper, line });
      } else {
        tokens.push({ type: 'IDENTIFIER', value: ident, line });
      }
      continue;
    }

    // Unexpected character, advance safely
    i++;
  }

  tokens.push({ type: 'EOF', value: '', line });
  return tokens;
}

// AST Nodes
export type ASTNode =
  | { type: 'Program'; name: string; declarations: ASTNode[]; body: ASTNode }
  | { type: 'VarDecl'; name: string; varType: string }
  | { type: 'Block'; statements: ASTNode[] }
  | { type: 'Assignment'; variable: string; expression: ASTNode }
  | { type: 'If'; condition: ASTNode; thenBranch: ASTNode; elseBranch?: ASTNode }
  | { type: 'BinaryOp'; left: ASTNode; op: string; right: ASTNode }
  | { type: 'UnaryOp'; op: string; operand: ASTNode }
  | { type: 'Identifier'; name: string }
  | { type: 'Number'; value: number }
  | { type: 'String'; value: string }
  | { type: 'Boolean'; value: boolean }
  | { type: 'Call'; name: string; args: ASTNode[] };

export class PascalParser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: 'EOF', value: '', line: -1 };
  }

  private match(type: TokenType, value?: string): boolean {
    const t = this.peek();
    if (t.type === type && (!value || t.value === value)) {
      this.current++;
      return true;
    }
    return false;
  }

  private expect(type: TokenType, value?: string): Token {
    const t = this.peek();
    if (t.type !== type || (value && t.value !== value)) {
      throw new Error(`Pascal Syntax Error on line ${t.line}: Expected ${type} ${value || ''}, got ${t.type} "${t.value}"`);
    }
    this.current++;
    return t;
  }

  public parse(): ASTNode {
    let programName = 'PeripheryRule';
    if (this.match('KEYWORD', 'PROGRAM')) {
      const nameToken = this.expect('IDENTIFIER');
      programName = nameToken.value;
      this.expect('SEMICOLON');
    }

    const declarations: ASTNode[] = [];
    if (this.match('KEYWORD', 'VAR')) {
      while (this.peek().type === 'IDENTIFIER') {
        const id = this.expect('IDENTIFIER').value;
        this.expect('COLON');
        const typeToken = this.expect('KEYWORD');
        this.expect('SEMICOLON');
        declarations.push({ type: 'VarDecl', name: id, varType: typeToken.value });
      }
    }

    const body = this.parseBlock();
    this.match('DOT'); // trailing dot
    return { type: 'Program', name: programName, declarations, body };
  }

  private parseBlock(): ASTNode {
    this.expect('KEYWORD', 'BEGIN');
    const statements: ASTNode[] = [];

    while (this.peek().value !== 'END' && this.peek().type !== 'EOF') {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
      if (this.match('SEMICOLON')) {
        // optional trailing semicolons allowed
      }
    }

    this.expect('KEYWORD', 'END');
    return { type: 'Block', statements };
  }

  private parseStatement(): ASTNode | null {
    const t = this.peek();

    if (t.type === 'KEYWORD' && t.value === 'IF') {
      this.expect('KEYWORD', 'IF');
      const condition = this.parseExpression();
      this.expect('KEYWORD', 'THEN');
      const thenBranch = this.parseStatement() || { type: 'Block', statements: [] };
      let elseBranch: ASTNode | undefined;
      if (this.match('KEYWORD', 'ELSE')) {
        elseBranch = this.parseStatement() || { type: 'Block', statements: [] };
      }
      return { type: 'If', condition, thenBranch, elseBranch };
    }

    if (t.type === 'KEYWORD' && t.value === 'BEGIN') {
      return this.parseBlock();
    }

    if (t.type === 'IDENTIFIER') {
      const id = this.expect('IDENTIFIER').value;
      if (this.match('ASSIGN')) {
        const expr = this.parseExpression();
        return { type: 'Assignment', variable: id, expression: expr };
      }
      // Function / procedure call
      if (this.match('LPAREN')) {
        const args: ASTNode[] = [];
        if (this.peek().type !== 'RPAREN') {
          args.push(this.parseExpression());
          while (this.match('COMMA')) {
            args.push(this.parseExpression());
          }
        }
        this.expect('RPAREN');
        return { type: 'Call', name: id, args };
      }
    }

    return null;
  }

  private parseExpression(): ASTNode {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): ASTNode {
    let expr = this.parseLogicalAnd();
    while (this.match('KEYWORD', 'OR')) {
      const right = this.parseLogicalAnd();
      expr = { type: 'BinaryOp', left: expr, op: 'OR', right };
    }
    return expr;
  }

  private parseLogicalAnd(): ASTNode {
    let expr = this.parseComparison();
    while (this.match('KEYWORD', 'AND')) {
      const right = this.parseComparison();
      expr = { type: 'BinaryOp', left: expr, op: 'AND', right };
    }
    return expr;
  }

  private parseComparison(): ASTNode {
    let expr = this.parseAdditive();
    while (
      this.peek().type === 'OPERATOR' &&
      ['=', '<>', '<', '>', '<=', '>='].includes(this.peek().value)
    ) {
      const op = this.expect('OPERATOR').value;
      const right = this.parseAdditive();
      expr = { type: 'BinaryOp', left: expr, op, right };
    }
    return expr;
  }

  private parseAdditive(): ASTNode {
    let expr = this.parseMultiplicative();
    while (
      this.peek().type === 'OPERATOR' &&
      ['+', '-'].includes(this.peek().value)
    ) {
      const op = this.expect('OPERATOR').value;
      const right = this.parseMultiplicative();
      expr = { type: 'BinaryOp', left: expr, op, right };
    }
    return expr;
  }

  private parseMultiplicative(): ASTNode {
    let expr = this.parsePrimary();
    while (
      (this.peek().type === 'OPERATOR' && ['*', '/'].includes(this.peek().value)) ||
      (this.peek().type === 'KEYWORD' && ['DIV', 'MOD'].includes(this.peek().value))
    ) {
      const op = this.tokens[this.current++].value;
      const right = this.parsePrimary();
      expr = { type: 'BinaryOp', left: expr, op, right };
    }
    return expr;
  }

  private parsePrimary(): ASTNode {
    const t = this.peek();

    if (this.match('KEYWORD', 'NOT')) {
      const operand = this.parsePrimary();
      return { type: 'UnaryOp', op: 'NOT', operand };
    }
    if (this.match('KEYWORD', 'TRUE')) {
      return { type: 'Boolean', value: true };
    }
    if (this.match('KEYWORD', 'FALSE')) {
      return { type: 'Boolean', value: false };
    }
    if (t.type === 'NUMBER') {
      this.current++;
      return { type: 'Number', value: parseFloat(t.value) };
    }
    if (t.type === 'STRING') {
      this.current++;
      return { type: 'String', value: t.value };
    }
    if (t.type === 'IDENTIFIER') {
      this.current++;
      return { type: 'Identifier', name: t.value };
    }
    if (this.match('LPAREN')) {
      const expr = this.parseExpression();
      this.expect('RPAREN');
      return expr;
    }

    throw new Error(`Pascal Syntax Error: Unexpected token "${t.value}" on line ${t.line}`);
  }
}

// Runtime Environment
export class PascalEnvironment {
  private values: Map<string, unknown> = new Map();

  constructor(initialValues?: Record<string, unknown>) {
    if (initialValues) {
      for (const [k, v] of Object.entries(initialValues)) {
        this.set(k, v);
      }
    }
  }

  public get(name: string): unknown {
    return this.values.get(name.toLowerCase());
  }

  public set(name: string, value: unknown): void {
    this.values.set(name.toLowerCase(), value);
  }

  public getAll(): Record<string, unknown> {
    const res: Record<string, unknown> = {};
    for (const [k, v] of this.values.entries()) {
      res[k] = v;
    }
    return res;
  }
}

// Evaluator
export function evaluatePascal(ast: ASTNode, env: PascalEnvironment): unknown {
  switch (ast.type) {
    case 'Program': {
      return evaluatePascal(ast.body, env);
    }
    case 'Block': {
      let result: unknown = null;
      for (const stmt of ast.statements) {
        result = evaluatePascal(stmt, env);
      }
      return result;
    }
    case 'Assignment': {
      const val = evaluatePascal(ast.expression, env);
      env.set(ast.variable, val);
      return val;
    }
    case 'If': {
      const cond = Boolean(evaluatePascal(ast.condition, env));
      if (cond) {
        return evaluatePascal(ast.thenBranch, env);
      } else if (ast.elseBranch) {
        return evaluatePascal(ast.elseBranch, env);
      }
      return null;
    }
    case 'BinaryOp': {
      const left = evaluatePascal(ast.left, env);
      const right = evaluatePascal(ast.right, env);
      switch (ast.op) {
        case '+':
          return (Number(left) + Number(right));
        case '-':
          return (Number(left) - Number(right));
        case '*':
          return (Number(left) * Number(right));
        case '/':
        case 'DIV':
          return Math.floor(Number(left) / (Number(right) || 1));
        case 'MOD':
          return Number(left) % (Number(right) || 1);
        case '=':
          return left === right;
        case '<>':
          return left !== right;
        case '<':
          return Number(left) < Number(right);
        case '>':
          return Number(left) > Number(right);
        case '<=':
          return Number(left) <= Number(right);
        case '>=':
          return Number(left) >= Number(right);
        case 'AND':
          return Boolean(left) && Boolean(right);
        case 'OR':
          return Boolean(left) || Boolean(right);
        default:
          return null;
      }
    }
    case 'UnaryOp': {
      const val = evaluatePascal(ast.operand, env);
      if (ast.op === 'NOT') return !val;
      return val;
    }
    case 'Identifier':
      return env.get(ast.name);
    case 'Number':
      return ast.value;
    case 'String':
      return ast.value;
    case 'Boolean':
      return ast.value;
    default:
      return null;
  }
}

// Convenient execution helper
export function runPascalScript(source: string, initialVars: Record<string, unknown> = {}): Record<string, unknown> {
  const tokens = tokenizePascal(source);
  const parser = new PascalParser(tokens);
  const ast = parser.parse();
  const env = new PascalEnvironment(initialVars);
  evaluatePascal(ast, env);
  return env.getAll();
}
