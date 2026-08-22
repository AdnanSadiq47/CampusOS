import { describe, it, expect } from 'vitest';
import { FormRuleEvaluator } from '../src/form-evaluator.js';

describe('FormRuleEvaluator', () => {
  it('correctly evaluates SHOW_IF rule', () => {
    const rules = [
      {
        type: 'SHOW_IF',
        targetFieldCode: 'hostel_room_no',
        condition: {
          field: 'requires_hostel',
          operator: 'EQUALS' as const,
          value: true,
        },
      },
    ];

    const result1 = FormRuleEvaluator.evaluateRules(rules, {
      formData: { requires_hostel: false },
    });
    expect(result1.hiddenFields.has('hostel_room_no')).toBe(true);

    const result2 = FormRuleEvaluator.evaluateRules(rules, {
      formData: { requires_hostel: true },
    });
    expect(result2.hiddenFields.has('hostel_room_no')).toBe(false);
  });

  it('correctly evaluates REQUIRED_IF rule', () => {
    const rules = [
      {
        type: 'REQUIRED_IF',
        targetFieldCode: 'guardian_contact',
        condition: {
          field: 'age',
          operator: 'LESS_THAN' as const,
          value: 18,
        },
      },
    ];

    const result = FormRuleEvaluator.evaluateRules(rules, {
      formData: { age: 16 },
    });
    expect(result.requiredFields.has('guardian_contact')).toBe(true);
  });

  it('correctly evaluates CALCULATE rule for math expression', () => {
    const rules = [
      {
        type: 'CALCULATE',
        targetFieldCode: 'net_fee',
        condition: {
          field: 'tuition_fee',
          operator: 'GREATER_THAN' as const,
          value: 0,
        },
        expression: 'tuition_fee + lab_fee - discount',
      },
    ];

    const result = FormRuleEvaluator.evaluateRules(rules, {
      formData: {
        tuition_fee: 5000,
        lab_fee: 500,
        discount: 200,
      },
    });

    expect(result.calculatedValues['net_fee']).toBe(5300);
  });
});
