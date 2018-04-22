import { Injectable, Inject } from '@angular/core';
import { MODEL_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/model-settings.token';
import { AbstractModelSettings } from '../../../form-rules/models/abstract-model-settings';
import { Property } from '../../../form-rules/models/property';
import { RuleGroup } from '../../../form-rules/models/rule-group';
import { Rule } from '../../../form-rules/models/rule';

/**
 * Engine that digests model settings and applies their rules appropriately
 */
@Injectable()
export class RulesEngineService {

    private modelSettings: {
        [key: string]: AbstractModelSettings<any>;
    };

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
     */
    getModelSettings<T>(name: string): AbstractModelSettings<T> {
        return this.modelSettings[name];
    }

    process<T>(data: T, rule: RuleGroup<T> | Rule<T>): boolean {
        const isRuleGroup = this.isRuleGroup(rule);
        return isRuleGroup
            ? this.processRuleGroup(data, rule as RuleGroup<T>)
            : this.processRule(data, rule as Rule<T>);
    }

    private processRuleGroup<T>(data: T, ruleGroup: RuleGroup<T>): boolean {
        let passedCount = 0;

        for (let i = 0; i < ruleGroup.rules.length; i++) {
            const rule = ruleGroup.rules[i];
            const passed = this.process(data, rule);

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

    private isRuleGroup<T>(rule: RuleGroup<T> | Rule<T>) {
        return !(rule as Rule<T>).func;
    }
}
