import { Injectable, Inject } from '@angular/core';
import { MODEL_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/model-settings.token';
import { AbstractModelSettings } from '../../../form-rules/models/abstract-model-settings';
import { Property } from '../../../form-rules/models/property';
import { RuleGroup } from '../../../form-rules/models/rule-group';
import { Rule } from '../../../form-rules/models/rule';
import { Test } from '../../../form-rules/models/test';
import { TestResult, PropertyTestResults, TestResultsBase } from '../../../form-rules/models/test-result';
import { RuleSet } from '../../../form-rules/models/rule-set';
import { TestOptions } from '../../../form-rules/models/test-options';
import { TraceService } from '../../../utils/trace/trace.service';
import { CommonService } from '../../../utils/common/common.service';
import { Observable } from 'rxjs/Observable';
import { from } from 'rxjs/observable/from';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { of } from 'rxjs/observable/of';
import { takeWhile, concatMap, filter, mergeMap, map, flatMap, combineLatest } from 'rxjs/operators';
import { merge } from 'rxjs/operators/merge';

/**
 * Engine that digests model settings and applies their rules appropriately
 */
@Injectable()
export class RulesEngineService {

    private modelSettings: { [key: string]: AbstractModelSettings<any>; };

    constructor(
        @Inject(MODEL_SETTINGS_TOKEN) settings: AbstractModelSettings<any>[],
        private traceSvc: TraceService,
        private commonSvc: CommonService
    ) {
        this.modelSettings = {};

        settings.forEach(x => {
            this.traceSvc.trace(`Registering model settings "${x.name}"`);
            this.modelSettings[x.name] = x;
        });
    }

    /**
     * Gets model settings with the provided name
     * @param name Name of model setting
     * @returns Model settings with the provided name
     */
    getModelSettings<T>(name: string): AbstractModelSettings<T> {
        this.traceSvc.trace(`Getting model settings "${name}"`);
        return this.modelSettings[name];
    }

    /**
     * Runs validation tests
     * @param data Data to run validation tests against
     * @param property Property to run validation tests for
     * @returns Results of validation tests
     */
    validate<T>(data: T, property: Property<T>, options?: TestOptions): PropertyTestResults<T> {
        const testResults = this.runTests(data, property.valid, options) as any as PropertyTestResults<T>;
        testResults.propertyName = property.name;
        return testResults;
    }

    /**
     * Runs editability tests
     * @param data Data to run editability tests against
     * @param property Property to run editability tests for
     * * @returns Results of editability tests
     */
    editable<T>(data: T, property: Property<T>, options?: TestOptions): PropertyTestResults<T> {
        const testResults = this.runTests(data, property.edit, options) as any as PropertyTestResults<T>;
        testResults.propertyName = property.name;
        return testResults;
    }

    /**
     * Runs visibility tests
     * @param data Data to run visibility tests against
     * @param property Property to run visibility tests for
     * * @returns Results of visibility tests
     */
    visible<T>(data: T, property: Property<T>, options?: TestOptions): PropertyTestResults<T> {
        const testResults = this.runTests(data, property.view, options) as any as PropertyTestResults<T>;
        testResults.propertyName = property.name;
        return testResults;
    }

    /**
     * Runs an array of tests
     * @param data Data to perform tests against
     * @param tests Tests to run
     * @returns Result of tests
     */
    runTests<T>(data: T, tests: Test<T>[], options?: TestOptions): TestResultsBase<T> {
        if (!tests || !tests.length) return new TestResultsBase([]);

        const testResults = tests.map(t => this.runTest(data, t, options));
        return new TestResultsBase(testResults);
    }

    /**
     * Performs test on a set of data
     * @param data Data to perform test against
     * @param test Test to run
     * @returns Result of test
     */
    runTest<T>(data: T, test: Test<T>, options?: TestOptions): TestResult<T> {
        if (!test) return { passed: true, name: null, message: null };

        const passedTestResult: TestResult<T> = { passed: true, name: test.name, message: null };
        const failedTestResult: TestResult<T> = { passed: false, name: test.name, message: test.message };

        const conditionsMet = this.processRuleSet(data, test.condition, options);
        if (!conditionsMet) return passedTestResult;

        const passed = this.processRuleSet(data, test.check, options);
        return passed ? passedTestResult : failedTestResult;
    }

    /**
     * Processes a rule set
     * @param data Data to process rule set against
     * @param ruleSet Rule set to process
     * @returns Result of rule set processing
     */
    processRuleSet<T>(data: T, ruleSet: RuleSet<T>, options?: TestOptions): boolean {
        if (!ruleSet) return true;

        const isRuleGroup = this.isRuleGroup(ruleSet);
        return isRuleGroup
            ? this.processRuleGroup(data, ruleSet as RuleGroup<T>, options)
            : this.processRule(data, ruleSet as Rule<T>, options);
    }

    /**
     * Gets the dependency properties for an array of tests
     * @param tests Tests to get the dependency properties for
     * @returns Dependency properties
     */
    getDependencyProperties<T>(tests: Test<T>[]): string[] {
        if (!tests) return [];

        const deps = tests
            .map(t => this.getDependencyPropertiesFromTest(t))
            .reduce((prev, current) => prev.concat(current));

        return this.commonSvc.unique(deps);
    }

    private processRuleGroup<T>(data: T, ruleGroup: RuleGroup<T>, options?: TestOptions): boolean {
        let passedCount = 0;

        for (let i = 0; i < ruleGroup.rules.length; i++) {
            const rule = ruleGroup.rules[i];
            const passed = this.processRuleSet(data, rule, options);

            if (passed) passedCount++;

            // it passed, and we only need one to pass
            if (passed && ruleGroup.any) return true;

            // if failed, and we need all to pass
            if (!passed && !ruleGroup.any) return false;
        }

        // make sure all were passed
        return (passedCount === ruleGroup.rules.length && !ruleGroup.any);
    }

    private processRule<T>(data: T, rule: Rule<T>, options?: TestOptions): boolean {
        const rootData = options ? options.rootData : null;
        return rule.func(data, rootData);
    }

    /*** ASYNC STUFF */

    /**
     * Runs an array of tests
     * @param data Data to perform tests against
     * @param tests Tests to run
     * @returns Result of tests
     */
    runTestsAsync<T>(data: T, tests: Test<T>[], options?: TestOptions): Observable<TestResultsBase<T>> {
        if (!tests || !tests.length) return of(new TestResultsBase([]));

        const runTest$ = tests
            .map(test => this.runTestAsync(data, test, options));

        return forkJoin(runTest$)
            .pipe(
                map(testResults => new TestResultsBase(testResults))
            );
    }

    /**
     * Performs async test on a set of data
     * @param data Data to perform test against
     * @param test Test to run
     * @returns Result of test
     */
    runTestAsync<T>(data: T, test: Test<T>, options?: TestOptions): Observable<TestResult<T>> {
        if (!test) return of({ passed: true, name: null, message: null });

        const passedTestResult: TestResult<T> = { passed: true, name: test.name, message: null };
        const failedTestResult: TestResult<T> = { passed: false, name: test.name, message: test.message };

        const conditions$ = this.processRuleSetAsync(data, test.condition, options);
        const check$ = this.processRuleSetAsync(data, test.check, options);

        return conditions$
            .pipe(
                flatMap(conditionsMet => {
                    if (!conditionsMet) {
                        return of(passedTestResult);
                    }

                    return check$
                        .pipe(
                            map((passed, i) => passed ? passedTestResult : failedTestResult)
                        );
                })
            );
    }

    /**
     * Processes an async rule set
     * @param data Data to process rule set against
     * @param ruleSet Rule set to process
     * @returns Result of rule set processing
     */
    processRuleSetAsync<T>(data: T, ruleSet: RuleSet<T>, options?: TestOptions): Observable<boolean> {
        if (!ruleSet) return of(true);

        const isRuleGroup = this.isRuleGroup(ruleSet);
        return isRuleGroup
            ? this.processRuleGroupAsync(data, ruleSet as RuleGroup<T>, options)
            : this.processRuleAsync(data, ruleSet as Rule<T>, options);
    }

    private processRuleGroupAsync<T>(data: T, ruleGroup: RuleGroup<T>, options?: TestOptions): Observable<boolean> {
        return from(ruleGroup.rules)
            .pipe(
                concatMap(ruleSet => this.processRuleSetAsync(data, ruleSet, options)),
                takeWhile(passed => {
                    return !((passed && ruleGroup.any) || !passed && !ruleGroup.any);
                })
            );
    }

    private processRuleAsync<T>(data: T, rule: Rule<T>, options?: TestOptions): Observable<boolean> {
        if (!rule.asyncFunc) return of(true);

        const rootData = options ? options.rootData : null;
        return rule.asyncFunc(data, rootData);
    }

    /** END ASYNC STUFF */

    private isRuleGroup<T>(ruleSet: RuleSet<T>) {
        const rule = ruleSet as Rule<T>;
        return !rule.func && !rule.asyncFunc;
    }

    private getDependencyPropertiesFromTest<T>(test: Test<T>): string[] {
        const checkDeps = this.getDependencyPropertiesFromRuleSet<T>(test.check);
        const conditionDeps = this.getDependencyPropertiesFromRuleSet<T>(test.condition);
        return this.commonSvc.unique(checkDeps.concat(conditionDeps));
    }

    private getDependencyPropertiesFromRuleSet<T>(ruleSet: RuleSet<T>): string[] {
        if (!ruleSet) return [];

        const result: string[] = [];

        if (this.isRuleGroup(ruleSet)) {
            const ruleGroup = ruleSet as RuleGroup<T>;
            ruleGroup.rules.forEach(x => {
                result.push(...this.commonSvc.unique(this.getDependencyPropertiesFromRuleSet(x)));
            });
        }

        const rule = ruleSet as Rule<T>;
        if (rule.options && Array.isArray(rule.options.dependencyProperties)) {
            result.push(...this.commonSvc.unique(rule.options.dependencyProperties));
        }

        return this.commonSvc.unique(result);
    }
}
