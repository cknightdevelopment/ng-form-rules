import { Injectable, Inject } from '@angular/core';
import { MODEL_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/model-settings.token';
import { AbstractModelSettings } from '../../../form-rules/models/abstract-model-settings';
import { Property } from '../../../form-rules/models/property';
import { RuleGroup } from '../../../form-rules/models/rule-group';
import { Rule } from '../../../form-rules/models/rule';
import { Validation } from '../../../form-rules/models/validation';
import { ValidationResult } from '../../../form-rules/models/validation-result';
import { RuleSet } from '../../../form-rules/models/rule-set';

/**
 * Engine that digests model settings and applies their rules appropriately
 */
@Injectable()
export class RulesEngineService {

    private modelSettings: { [key: string]: AbstractModelSettings<any>; };

    constructor(
        @Inject(MODEL_SETTINGS_TOKEN) settings: AbstractModelSettings<any>[]
    ) {
        this.modelSettings = {};

        settings
            .forEach(x => this.modelSettings[x.name] = x);
    }

    /**
     * Gets model settings with the provided name
     * @param name Name of model setting
     * @returns Model settings with the provided name
     */
    getModelSettings<T>(name: string): AbstractModelSettings<T> {
        return this.modelSettings[name];
    }

    /**
     * Performs validation on a set of data
     * @param data Data to perform validation against
     * @param validation Validation to perform
     * @returns Result of validation
     */
    validate<T>(data: T, validation: Validation<T>): ValidationResult<T> {
        if (!validation) return { valid: true, name: null, message: null };

        const failedValidationResult: ValidationResult<T> = { valid: false, name: validation.name, message: validation.message };

        const conditionsMet = this.processRuleSet(data, validation.condition);
        if (!conditionsMet) return failedValidationResult;

        const passed = this.processRuleSet(data, validation.check);
        return passed
            ? { valid: true, name: validation.name, message: null }
            : failedValidationResult;
    }

    /**
     * Processes a rule set
     * @param data Data to process rule set against
     * @param ruleSet Rule set to process
     * @returns Result of rule set processing
     */
    processRuleSet<T>(data: T, ruleSet: RuleSet<T>): boolean {
        if (!ruleSet) return true;

        const isRuleGroup = this.isRuleGroup(ruleSet);
        return isRuleGroup
            ? this.processRuleGroup(data, ruleSet as RuleGroup<T>)
            : this.processRule(data, ruleSet as Rule<T>);
    }

    private processRuleGroup<T>(data: T, ruleGroup: RuleGroup<T>): boolean {
        let passedCount = 0;

        for (let i = 0; i < ruleGroup.rules.length; i++) {
            const rule = ruleGroup.rules[i];
            const passed = this.processRuleSet(data, rule);

            if (passed) passedCount++;

            // it passed, and we only need one to pass
            if (passed && ruleGroup.any) return true;

            // if failed, and we need all to pass
            if (!passed && !ruleGroup.any) return false;
        }

        // make sure all were passed
        return (passedCount === ruleGroup.rules.length && !ruleGroup.any);
    }

    private processRule<T>(data: T, rule: Rule<T>): boolean {
        return rule.func(data);
    }

    private isRuleGroup<T>(rule: RuleSet<T>) {
        return !(rule as Rule<T>).func;
    }
}
