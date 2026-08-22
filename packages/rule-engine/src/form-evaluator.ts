import { ASTEvaluator, ConditionRule, CompoundRule } from './ast';

export interface FormRuleEvaluationContext {
  formData: Record<string, unknown>;
  userRoles?: string[];
  userPermissions?: string[];
}

export interface FormEvaluationResult {
  hiddenFields: Set<string>;
  requiredFields: Set<string>;
  disabledFields: Set<string>;
  calculatedValues: Record<string, unknown>;
}

export class FormRuleEvaluator {
  /**
   * Evaluates all form rules against current form state
   */
  static evaluateRules(
    rules: Array<{
      type: string;
      targetFieldCode: string;
      condition: ConditionRule | CompoundRule;
      expression?: string;
    }>,
    context: FormRuleEvaluationContext
  ): FormEvaluationResult {
    const result: FormEvaluationResult = {
      hiddenFields: new Set<string>(),
      requiredFields: new Set<string>(),
      disabledFields: new Set<string>(),
      calculatedValues: {},
    };

    for (const rule of rules) {
      const isConditionMet = ASTEvaluator.evaluate(rule.condition, context.formData);

      switch (rule.type) {
        case 'SHOW_IF':
          if (!isConditionMet) {
            result.hiddenFields.add(rule.targetFieldCode);
          }
          break;

        case 'HIDE_IF':
          if (isConditionMet) {
            result.hiddenFields.add(rule.targetFieldCode);
          }
          break;

        case 'REQUIRED_IF':
          if (isConditionMet) {
            result.requiredFields.add(rule.targetFieldCode);
          }
          break;

        case 'DISABLE_IF':
          if (isConditionMet) {
            result.disabledFields.add(rule.targetFieldCode);
          }
          break;

        case 'CALCULATE':
          if (isConditionMet && rule.expression) {
            const calculated = this.evaluateSimpleMathExpression(rule.expression, context.formData);
            if (calculated !== undefined) {
              result.calculatedValues[rule.targetFieldCode] = calculated;
            }
          }
          break;
      }
    }

    return result;
  }

  /**
   * Safely evaluates arithmetic expressions (e.g., "fee + tax - discount") without `eval()`
   */
  private static evaluateSimpleMathExpression(expression: string, data: Record<string, unknown>): number | undefined {
    try {
      // Tokenize expression
      const sanitized = expression.trim();
      const tokens = sanitized.split(/\s*([\+\-\*\/])\s*/);
      if (tokens.length === 0) return undefined;

      let total = 0;
      let currentOp = '+';

      for (const token of tokens) {
        if (!token) continue;
        if (['+', '-', '*', '/'].includes(token)) {
          currentOp = token;
        } else {
          // Token is a field code or constant number
          const val = !isNaN(Number(token)) ? Number(token) : Number(data[token] ?? 0);
          if (isNaN(val)) return undefined;

          if (currentOp === '+') total += val;
          else if (currentOp === '-') total -= val;
          else if (currentOp === '*') total *= val;
          else if (currentOp === '/') total = val !== 0 ? total / val : 0;
        }
      }

      return total;
    } catch {
      return undefined;
    }
  }
}
