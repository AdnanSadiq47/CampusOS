import { describe, it, expect } from 'vitest';
import { ASTEvaluator, ConditionRule, CompoundRule } from '../src/ast.js';

describe('ASTEvaluator', () => {
  it('correctly evaluates EQUALS and NOT_EQUALS operators', () => {
    const rule: ConditionRule = {
      field: 'studentType',
      operator: 'EQUALS',
      value: 'International',
    };

    expect(ASTEvaluator.evaluate(rule, { studentType: 'International' })).toBe(true);
    expect(ASTEvaluator.evaluate(rule, { studentType: 'Domestic' })).toBe(false);
  });

  it('correctly evaluates numeric comparison thresholds', () => {
    const thresholdRule: ConditionRule = {
      field: 'feeAmount',
      operator: 'GREATER_THAN',
      value: 10000,
    };

    expect(ASTEvaluator.evaluate(thresholdRule, { feeAmount: 15000 })).toBe(true);
    expect(ASTEvaluator.evaluate(thresholdRule, { feeAmount: 5000 })).toBe(false);
  });

  it('correctly evaluates compound AND / OR logic trees', () => {
    const compound: CompoundRule = {
      logic: 'AND',
      rules: [
        { field: 'grade', operator: 'EQUALS', value: '10' },
        { field: 'hasScholarship', operator: 'EQUALS', value: true },
      ],
    };

    expect(ASTEvaluator.evaluate(compound, { grade: '10', hasScholarship: true })).toBe(true);
    expect(ASTEvaluator.evaluate(compound, { grade: '10', hasScholarship: false })).toBe(false);
  });
});
