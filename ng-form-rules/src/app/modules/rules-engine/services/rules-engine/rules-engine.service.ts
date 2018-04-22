import { Injectable, Inject } from '@angular/core';
import { MODEL_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/model-settings.token';
import { AbstractModelSettings } from '../../../form-rules/models/abstract-model-settings';
import { Property } from '../../../form-rules/models/property';
import { RuleGroup } from '../../../form-rules/models/rule-group';
import { Rule } from '../../../form-rules/models/rule';
import { Test } from '../../../form-rules/models/test';
import { TestResult, PropertyTestResults, TestResultsBase } from '../../../form-rules/models/test-result';
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
     * Runs validation tests
     * @param data Data to run validation tests against
     * @param property Property to run validation tests for
     * @returns Results of validation tests
     */
    validate<T>(data: T, property: Property<T>): PropertyTestResults<T> {
        const testResults = this.runTests(data, property.valid) as any as PropertyTestResults<T>;
        testResults.propertyName = property.name;
        return testResults;
    }

    /**
     * Runs editability tests
     * @param data Data to run editability tests against
     * @param property Property to run editability tests for
     * * @returns Results of editability tests
     */
    editable<T>(data: T, property: Property<T>): PropertyTestResults<T> {
        const testResults = this.runTests(data, property.edit) as any as PropertyTestResults<T>;
        testResults.propertyName = property.name;
        return testResults;
    }

    /**
     * Runs visibility tests
     * @param data Data to run visibility tests against
     * @param property Property to run visibility tests for
     * * @returns Results of visibility tests
     */
    visible<T>(data: T, property: Property<T>): PropertyTestResults<T> {
        const testResults = this.runTests(data, property.view) as any as PropertyTestResults<T>;
        testResults.propertyName = property.name;
        return testResults;
    }

    /**
     * Runs an array of tests
     * @param data Data to perform tests against
     * @param tests Tests to run
     * @returns Result of tests
     */
    runTests<T>(data: T, tests: Test<T>[]): TestResultsBase<T> {
        if (!tests || !tests.length) return new TestResultsBase([]);

        const testResults = tests.map(t => this.runTest(data, t));
        return new TestResultsBase(testResults);
    }

    /**
     * Performs test on a set of data
     * @param data Data to perform test against
     * @param test Test to run
     * @returns Result of test
     */
    runTest<T>(data: T, test: Test<T>): TestResult<T> {
        if (!test) return { passed: true, name: null, message: null };

        const failedTestResult: TestResult<T> = { passed: false, name: test.name, message: test.message };

        const conditionsMet = this.processRuleSet(data, test.condition);
        if (!conditionsMet) return failedTestResult;

        const passed = this.processRuleSet(data, test.check);
        return passed
            ? { passed: true, name: test.name, message: null }
            : failedTestResult;
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
