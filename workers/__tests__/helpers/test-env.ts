/**
 * Test helpers for mocking Cloudflare Worker environment
 */

import type { Env } from '../types';
import { hashToken } from '../utils/auth';

/**
 * Simple in-memory mock for D1Database
 * Implements basic D1 operations needed for testing
 */
export class MockD1Database implements D1Database {
  private data: Map<string, any[]> = new Map();

  prepare(query: string): D1PreparedStatement {
    return new MockD1PreparedStatement(query, this.data);
  }

  exec(_query: string): Promise<D1Result> {
    return Promise.resolve({
      success: true,
      meta: { changes: 0, duration: 0, last_row_id: 0, rows_read: 0, rows_written: 0 },
    });
  }

  batch(_statements: D1PreparedStatement[]): Promise<D1Result[]> {
    return Promise.resolve([]);
  }

  dump(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }
}

class MockD1PreparedStatement implements D1PreparedStatement {
  private query: string;
  private data: Map<string, any[]>;
  private bindings: any[] = [];

  constructor(query: string, data: Map<string, any[]>) {
    this.query = query;
    this.data = data;
  }

  bind(...values: any[]): D1PreparedStatement {
    this.bindings = values;
    return this;
  }

  async first<T = any>(): Promise<T | null> {
    const result = await this.all<T>();
    return result.results.length > 0 ? result.results[0] : null;
  }

  async run(): Promise<D1Result> {
    const tableName = this.getTableName();
    let table = this.data.get(tableName) || [];
    let changes = 0;

    // SELECT queries should not be processed in run() - use all() instead
    if (this.query.trim().toUpperCase().startsWith('SELECT')) {
      throw new Error('SELECT queries should use all() or first(), not run()');
    }

    // Handle INSERT queries
    if (this.query.trim().toUpperCase().startsWith('INSERT')) {
      const row: any = {};
      const columns = this.extractInsertColumns(this.query);
      
      columns.forEach((col, idx) => {
        row[col] = this.bindings[idx];
      });

      // Handle ON CONFLICT UPDATE
      if (this.query.includes('ON CONFLICT')) {
        const existingIdx = table.findIndex((r: any) => r.id === row.id);
        if (existingIdx >= 0) {
          // Extract columns that are updated in ON CONFLICT clause
          const updateCols = this.extractConflictUpdateColumns(this.query);
          
          // Create a map of column name to binding index
          const colToBindingIdx: Record<string, number> = {};
          columns.forEach((col, idx) => {
            colToBindingIdx[col] = idx;
          });
          
          // Update each column mentioned in UPDATE clause
          updateCols.forEach((col) => {
            const bindingIdx = colToBindingIdx[col];
            if (bindingIdx !== undefined) {
              const bindingValue = this.bindings[bindingIdx];
              
              // Check if this column has COALESCE handling
              // COALESCE format: column = COALESCE(excluded.column, cards.column)
              const coalescePattern = new RegExp(`${col}\\s*=\\s*COALESCE\\(excluded\\.${col}`, 'i');
              if (coalescePattern.test(this.query)) {
                // Use new value if not null/undefined, else keep old
                if (bindingValue !== null && bindingValue !== undefined) {
                  table[existingIdx][col] = bindingValue;
                }
                // Otherwise keep existing value (do nothing)
              } else {
                // Regular excluded column - always update
                table[existingIdx][col] = bindingValue;
              }
            }
          });
          changes = 1;
        } else {
          table.push(row);
          changes = 1;
        }
      } else {
        table.push(row);
        changes = 1;
      }

      this.data.set(tableName, table);
      return {
        success: true,
        meta: { changes, duration: 0, last_row_id: 0, rows_read: 0, rows_written: changes },
        results: [],
      };
    }

    // Handle UPDATE queries
    if (this.query.trim().toUpperCase().startsWith('UPDATE')) {
      const updateCols = this.extractUpdateColumns(this.query);
      const numBindings = this.extractUpdateBindings(this.query);
      
      // For UPDATE queries, WHERE clause binding is after all SET bindings
      // So bindings[0] to bindings[numBindings-1] are the column values
      // and bindings[numBindings] is the WHERE id
      const whereId = this.bindings[numBindings];
      
      // Also handle literal values in SET clause (e.g., is_active = 0)
      const setClauseMatch = this.query.match(/SET\s+([^W]+)/i);
      const literalValues: Record<string, any> = {};
      if (setClauseMatch) {
        const setClause = setClauseMatch[1];
        setClause.split(',').forEach((part) => {
          const trimmed = part.trim();
          const [col, val] = trimmed.split('=').map((s) => s.trim());
          // If value is not a ?, it's a literal
          if (val && !val.includes('?')) {
            // Try to parse as number, boolean, or keep as string
            if (val === '0' || val === '1') {
              literalValues[col] = parseInt(val, 10);
            } else if (val === 'true' || val === 'false') {
              literalValues[col] = val === 'true';
            } else {
              literalValues[col] = val;
            }
          }
        });
      }
      
      const matchingRows = table
        .map((row, idx) => ({ row, idx }))
        .filter(({ row }) => row.id === whereId)
        .map(({ idx }) => idx);
      
      if (matchingRows.length > 0) {
        matchingRows.forEach((rowIdx) => {
          // Apply bindings
          let bindingIdx = 0;
          updateCols.forEach((col) => {
            // Check if this column has a literal value
            if (literalValues.hasOwnProperty(col)) {
              table[rowIdx][col] = literalValues[col];
            } else if (bindingIdx < numBindings) {
              // Use binding value
              table[rowIdx][col] = this.bindings[bindingIdx];
              bindingIdx++;
            }
          });
        });
        this.data.set(tableName, table);
        changes = matchingRows.length;
      }

      return {
        success: true,
        meta: { changes, duration: 0, last_row_id: 0, rows_read: matchingRows.length, rows_written: changes },
        results: [],
      };
    }

    return {
      success: true,
      meta: { changes, duration: 0, last_row_id: 0, rows_read: 0, rows_written: changes },
      results: [],
    };
  }

  async all<T = any>(): Promise<D1Result<T>> {
    const tableName = this.getTableName();
    let table = this.data.get(tableName) || [];

    // Handle SELECT queries
    if (this.query.trim().toUpperCase().startsWith('SELECT')) {
      const whereClause = this.extractWhereClause(this.query);
      let results = table;

      if (whereClause) {
        results = this.findMatchingRows(table, whereClause).map((idx) => table[idx]);
      }

      // Handle SELECT specific columns
      const selectCols = this.extractSelectColumns(this.query);
      if (selectCols.length > 0 && !selectCols.includes('*')) {
        results = results.map((row: any) => {
          const filtered: any = {};
          selectCols.forEach((col) => {
            filtered[col] = row[col];
          });
          return filtered;
        });
      }

      return {
        success: true,
        meta: { changes: 0, duration: 0, last_row_id: 0, rows_read: results.length, rows_written: 0 },
        results: results as T[],
      } as D1Result<T>;
    }

    // For non-SELECT queries, call run()
    const runResult = await this.run();
    return runResult as D1Result<T>;
  }

  private getTableName(): string {
    const match = this.query.match(/FROM\s+(\w+)|INTO\s+(\w+)|UPDATE\s+(\w+)/i);
    return match ? (match[1] || match[2] || match[3]) : 'cards';
  }

  private extractInsertColumns(query: string): string[] {
    const match = query.match(/\(([^)]+)\)\s*VALUES/i);
    if (!match) return [];
    return match[1]
      .split(',')
      .map((col) => col.trim())
      .filter((col) => col.length > 0);
  }

  private extractConflictUpdateColumns(query: string): string[] {
    // Match everything after "DO UPDATE SET" until end of query or WHERE clause
    const match = query.match(/DO UPDATE SET\s+(.+?)(?:\s+WHERE|$)/is);
    if (!match) return [];
    const setClause = match[1].trim();
    
    // Split by comma and extract column names (before =)
    return setClause
      .split(',')
      .map((col) => {
        // Handle cases like "column = excluded.column" or "column = COALESCE(...)"
        const parts = col.trim().split('=');
        return parts[0].trim();
      })
      .filter((col) => col.length > 0);
  }

  private extractUpdateColumns(query: string): string[] {
    const match = query.match(/SET\s+([^W]+)/i);
    if (!match) return [];
    const setClause = match[1];
    return setClause
      .split(',')
      .map((col) => col.trim().split('=')[0].trim())
      .filter((col) => col.length > 0);
  }
  
  private extractUpdateBindings(query: string): number {
    // Count the number of ? placeholders in the SET clause
    const match = query.match(/SET\s+([^W]+)/i);
    if (!match) return 0;
    const setClause = match[1];
    return (setClause.match(/\?/g) || []).length;
  }

  private extractSelectColumns(query: string): string[] {
    const match = query.match(/SELECT\s+(.+?)\s+FROM/i);
    if (!match) return [];
    return match[1]
      .split(',')
      .map((col) => col.trim())
      .filter((col) => col.length > 0);
  }

  private extractWhereClause(query: string): any {
    if (!query.includes('WHERE')) return null;

    const whereMatch = query.match(/WHERE\s+(.+)/i);
    if (!whereMatch) return null;

    const whereClause = whereMatch[1].trim();
    const clause: any = { type: 'AND', conditions: [] };

    // Handle (id = ? OR username = ?) AND is_active = 1 (literal, not binding)
    if (whereClause.includes('(id = ? OR username = ?)') && whereClause.includes('is_active = 1')) {
      const id = this.bindings[0];
      const username = this.bindings[1]; // Can be same as id
      return {
        type: 'AND',
        conditions: [
          { type: 'OR', field: 'id', value: id, field2: 'username', value2: username },
          { field: 'is_active', value: 1 },
        ],
      };
    }
    
    // Handle (id = ? OR username = ?) AND is_active = ? (with binding)
    if (whereClause.includes('(id = ? OR username = ?)') && whereClause.includes('is_active = ?')) {
      const id = this.bindings[0];
      const username = this.bindings[1]; // Can be same as id
      const isActive = this.bindings[2];
      return {
        type: 'AND',
        conditions: [
          { type: 'OR', field: 'id', value: id, field2: 'username', value2: username },
          { field: 'is_active', value: isActive },
        ],
      };
    }
    
    // Handle (id = ? OR username = ?) without is_active check
    if (whereClause.includes('(id = ? OR username = ?)')) {
      const id = this.bindings[0];
      const username = this.bindings[1]; // Can be same as id
      return {
        type: 'OR',
        field: 'id',
        value: id,
        field2: 'username',
        value2: username,
      };
    }

    // Handle id = ? (but not as part of OR clause)
    if (whereClause.includes('id = ?') && !whereClause.includes('OR')) {
      // Find which binding index corresponds to id = ?
      // Count question marks before "id = ?"
      const beforeId = whereClause.substring(0, whereClause.indexOf('id = ?'));
      const bindingIndex = (beforeId.match(/\?/g) || []).length;
      const id = this.bindings[bindingIndex];
      return { field: 'id', value: id };
    }

    // Handle username = ? AND id != ?
    if (whereClause.includes('username = ?') && whereClause.includes('id != ?')) {
      const username = this.bindings[0];
      const id = this.bindings[1];
      return {
        type: 'AND',
        conditions: [
          { field: 'username', value: username },
          { field: 'id', operator: '!=', value: id },
        ],
      };
    }

    // Handle is_active = 1
    if (whereClause.includes('is_active = ?')) {
      const isActive = this.bindings[0];
      return { field: 'is_active', value: isActive };
    }

    return null;
  }

  private findMatchingRows(table: any[], whereClause: any): number[] {
    if (!whereClause) return table.map((_, idx) => idx);

    const matches: number[] = [];

    for (let i = 0; i < table.length; i++) {
      const row = table[i];
      let matchesClause = true;

      if (whereClause.field && !whereClause.type) {
        // Simple condition
        if (whereClause.operator === '!=') {
          matchesClause = row[whereClause.field] !== whereClause.value;
        } else {
          matchesClause = row[whereClause.field] === whereClause.value;
        }
      } else if (whereClause.type === 'OR' && whereClause.field2) {
        // OR condition: (id = ? OR username = ?)
        matchesClause = (
          row[whereClause.field] === whereClause.value || 
          row[whereClause.field2] === whereClause.value2
        );
      } else if (whereClause.type === 'AND' && whereClause.conditions) {
        // AND conditions
        matchesClause = whereClause.conditions.every((cond: any) => {
          if (cond.type === 'OR') {
            return (
              row[cond.field] === cond.value || row[cond.field2] === cond.value2
            );
          }
          if (cond.operator === '!=') {
            return row[cond.field] !== cond.value;
          }
          return row[cond.field] === cond.value;
        });
      }

      if (matchesClause) {
        matches.push(i);
      }
    }

    return matches;
  }
}

/**
 * Create a mock Worker environment for testing
 */
export function createTestEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: new MockD1Database(),
    IMAGES: {} as R2Bucket,
    RATE_LIMIT_KV: {} as KVNamespace,
    ENVIRONMENT: 'test',
    AUTH_SECRET: 'test-secret-key-for-testing-only',
    ALLOWED_ORIGINS: '*',
    ...overrides,
  };
}

/**
 * Create CORS headers for testing
 */
export function createCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Create a test card data object
 */
export function createTestCard(overrides: any = {}): any {
  const now = Date.now();
  return {
    profile: {
      full_name: 'Test Professional',
      profession: 'Cabeleireira',
      whatsapp: '+5511999999999',
      headline: 'Test Headline',
      bio: 'Test bio',
      photo: null,
      website: '',
    },
    services: [],
    social: [],
    links: [],
    ratings: [],
    testimonials: [],
    client_photos: [],
    badges: [],
    certifications: [],
    recommendations: { count: 0, recent: [] },
    settings: {
      theme: 'system' as const,
      accent_color: '#10B981',
      reduce_motion: false,
      language: 'pt-BR' as const,
    },
    created_at: new Date(now).toISOString(),
    updated_at: new Date(now).toISOString(),
    ...overrides,
  };
}

/**
 * Helper to create a request with Authorization header
 */
export function createAuthenticatedRequest(
  url: string,
  options: RequestInit = {},
  token: string
): Request {
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return new Request(url, {
    ...options,
    headers,
  });
}

