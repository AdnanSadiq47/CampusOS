export type ComparisonOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN_OR_EQUAL'
  | 'IS_EMPTY'
  | 'IS_NOT_EMPTY'
  | 'IN'
  | 'NOT_IN';

export interface ConditionRule {
  field: string;
  operator: ComparisonOperator;
  value?: unknown;
}

export interface CompoundRule {
  logic: 'AND' | 'OR';
  rules: (ConditionRule | CompoundRule)[];
}

export class ASTEvaluator {
  /**
   * Safely evaluates a boolean condition rule against a data record
   */
  static evaluate(rule: ConditionRule | CompoundRule, record: Record<string, unknown>): boolean {
    if ('logic' in rule) {
      if (rule.logic === 'AND') {
        return rule.rules.every((r) => this.evaluate(r, record));
      } else {
        return rule.rules.some((r) => this.evaluate(r, record));
      }
    }

    const fieldValue = record[rule.field];

    switch (rule.operator) {
      case 'EQUALS':
        return fieldValue === rule.value;

      case 'NOT_EQUALS':
        return fieldValue !== rule.value;

      case 'CONTAINS':
        return typeof fieldValue === 'string' && fieldValue.includes(String(rule.value));

      case 'NOT_CONTAINS':
        return typeof fieldValue === 'string' && !fieldValue.includes(String(rule.value));

      case 'GREATER_THAN':
        return typeof fieldValue === 'number' && fieldValue > Number(rule.value);

      case 'LESS_THAN':
        return typeof fieldValue === 'number' && fieldValue < Number(rule.value);

      case 'GREATER_THAN_OR_EQUAL':
        return typeof fieldValue === 'number' && fieldValue >= Number(rule.value);

      case 'LESS_THAN_OR_EQUAL':
        return typeof fieldValue === 'number' && fieldValue <= Number(rule.value);

      case 'IS_EMPTY':
        return fieldValue === undefined || fieldValue === null || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);

      case 'IS_NOT_EMPTY':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0);

      case 'IN':
        return Array.isArray(rule.value) && rule.value.includes(fieldValue);

      case 'NOT_IN':
        return Array.isArray(rule.value) && !rule.value.includes(fieldValue);

      default:
        return false;
    }
  }
}
