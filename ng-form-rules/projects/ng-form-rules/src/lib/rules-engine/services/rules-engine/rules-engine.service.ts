import { Injectable, Inject } from '@angular/core';
import { MODEL_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/model-settings.token';
import { AbstractModelSettings } from '../../../form-rules/models/abstract-model-settings';
import { Property } from '../../../form-rules/models/property';
import { RuleGroup } from '../../../form-rules/models/rule-group';
import { Rule } from '../../../form-rules/models/rule';
import { Test } from '../../../form-rules/models/test';
import { TestResult } from '../../../form-rules/models/test-result';
import { RuleSet } from '../../../form-rules/models/rule-set';
import { TestRunState } from '../../../form-rules/models/test-run-state';
import { TraceService } from '../../../utils/trace/trace.service';
import { CommonService } from '../../../utils/common/common.service';
import { Observable, from , forkJoin, of } from 'rxjs';
import { takeWhile, concatMap, filter, map, flatMap } from 'rxjs/operators';
import { TestResultsBase } from '../../../form-rules/models/test-results-base';
import { PropertyTestResults } from '../../../form-rules/models/property-test-result';
import { PropertyBase } from '../../../form-rules/models/property-base';

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
            this.setPropertyAbsolutePaths(x.properties);
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

    /**
     * Runs validation tests
     * @param data Data to run validation tests against
     * @param property Property to run validation tests for
     * @returns Results of validation tests
     */
    validate<T>(data: T, property: Property<T>, state?: TestRunState): PropertyTestResults<T> {
        const testResults = this.runTests(data, property.valid, state) as any as PropertyTestResults<T>;
        testResults.propertyName = property.name;
        return testResults;
    }

    /**
     * Runs editability tests
     * @param data Data to run editability tests against
     * @param property Property to run editability tests for
     * * @returns Results of editability tests
     */
    editable<T>(data: T, property: Property<T>, state?: TestRunState): PropertyTestResults<T> {
        const testResults = this.runTests(data, property.edit, state) as any as PropertyTestResults<T>;
        testResults.propertyName = property.name;
        return testResults;
    }

    /**
     * Runs visibility tests
     * @param data Data to run visibility tests against
     * @param property Property to run visibility tests for
     * * @returns Results of visibility tests
     */
    visible<T>(data: T, property: Property<T>, state?: TestRunState): PropertyTestResults<T> {
        const testResults = this.runTests(data, property.view, state) as any as PropertyTestResults<T>;
        testResults.propertyName = property.name;
        return testResults;
    }

    /**
     * Runs an array of tests
     * @param data Data to perform tests against
     * @param tests Tests to run
     * @returns Result of tests
     */
    runTests<T>(data: T, tests: Test<T>[], state?: TestRunState): TestResultsBase<T> {
        if (!tests || !tests.length) return new TestResultsBase([]);

        const testResults = tests.map(t => this.runTest(data, t, state));
        return new TestResultsBase(testResults);
    }

    /**
     * Runs an array of tests
     * @param data Data to perform tests against
     * @param tests Tests to run
     * @returns Result of tests
     */
    runTestsAsync<T>(data: T, tests: Test<T>[], state?: TestRunState): Observable<TestResultsBase<T>> {
        if (!tests || !tests.length) return of(new TestResultsBase([]));

        const runTest$ = tests
            .map(test => this.runTestAsync(data, test, state));

        return forkJoin(runTest$)
            .pipe(
                map(testResults => new TestResultsBase(testResults))
            );
    }

    /**
     * Performs test on a set of data
     * @param data Data to perform test against
     * @param test Test to run
     * @returns Result of test
     */
    runTest<T>(data: T, test: Test<T>, state?: TestRunState): TestResult<T> {
        if (!test) return { passed: true, name: null, message: null };

        const passedTestResult: TestResult<T> = { passed: true, name: test.name, message: null };
        const failedTestResult: TestResult<T> = { passed: false, name: test.name, message: test.message };

        const conditionsMet = this.processRuleSet(data, test.condition, state);
        if (!conditionsMet) return passedTestResult;

        const passed = this.processRuleSet(data, test.check, state);
        return passed ? passedTestResult : failedTestResult;
    }

    /**
     * Performs async test on a set of data
     * @param data Data to perform test against
     * @param test Test to run
     * @returns Result of test
     */
    runTestAsync<T>(data: T, test: Test<T>, state?: TestRunState): Observable<TestResult<T>> {
        if (!test) return of({ passed: true, name: null, message: null });

        const passedTestResult: TestResult<T> = { passed: true, name: test.name, message: null };
        const failedTestResult: TestResult<T> = { passed: false, name: test.name, message: test.message };

        const condition$ = this.processRuleSetAsync(data, test.condition, state);
        const check$ = this.processRuleSetAsync(data, test.check, state);

        return condition$
            .pipe(
                flatMap(conditionsMet => {
                    if (!conditionsMet) return of(passedTestResult);

                    return check$
                        .pipe(
                            map(passed => passed ? passedTestResult : failedTestResult)
                        );
                })
            );
    }

    /**
     * Processes a rule set
     * @param data Data to process rule set against
     * @param ruleSet Rule set to process
     * @returns Result of rule set processing
     */
    processRuleSet<T>(data: T, ruleSet: RuleSet<T>, state?: TestRunState): boolean {
        if (!ruleSet) return true;

        const isRuleGroup = this.isRuleGroup(ruleSet);
        return isRuleGroup
            ? this.processRuleGroup(data, ruleSet as RuleGroup<T>, state)
            : this.processRule(data, ruleSet as Rule<T>, state);
    }

    /**
     * Processes an async rule set
     * @param data Data to process rule set against
     * @param ruleSet Rule set to process
     * @returns Result of rule set processing
     */
    processRuleSetAsync<T>(data: T, ruleSet: RuleSet<T>, state?: TestRunState): Observable<boolean> {
        if (!ruleSet) return of(true);

        const isRuleGroup = this.isRuleGroup(ruleSet);
        return isRuleGroup
            ? this.processRuleGroupAsync(data, ruleSet as RuleGroup<T>, state)
            : this.processRuleAsync(data, ruleSet as Rule<T>, state);
    }

    private processRuleGroup<T>(data: T, ruleGroup: RuleGroup<T>, state?: TestRunState): boolean {
        let passedCount = 0;

        for (let i = 0; i < ruleGroup.rules.length; i++) {
            const rule = ruleGroup.rules[i];
            const passed = this.processRuleSet(data, rule, state);

            if (this.canShortCircuitRuleGroup(passed, ruleGroup)) return passed;

            if (passed) passedCount++;
        }

        // if we got this far, make sure all tests were passed
        return (passedCount === ruleGroup.rules.length && !ruleGroup.any);
    }

    private processRuleGroupAsync<T>(data: T, ruleGroup: RuleGroup<T>, state?: TestRunState): Observable<boolean> {
        return from(ruleGroup.rules)
            .pipe(
                concatMap(ruleSet => this.processRuleSetAsync(data, ruleSet, state)),
                takeWhile(passed => !this.canShortCircuitRuleGroup(passed, ruleGroup))
            );
    }

    private processRule<T>(data: T, rule: Rule<T>, state?: TestRunState): boolean {
        if (!this.doProcessRule(rule, state, false)) return true;

        const rootData = state ? state.rootData : null;
        return rule.func(data, rootData);
    }

    private processRuleAsync<T>(data: T, rule: Rule<T>, state?: TestRunState): Observable<boolean> {
        if (!this.doProcessRule(rule, state, true)) return of(true);

        const rootData = state ? state.rootData : null;
        return rule.asyncFunc(data, rootData);
    }

    private doProcessRule<T>(rule: Rule<T>, state: TestRunState, isAsync: boolean): boolean {
        // make sure we have the appropriate func to call
        if ((isAsync && !rule.asyncFunc) || (!isAsync && !rule.func)) return false;

        // // if there is missing data, then assume we should process the rule
        // if (!rule.options || !rule.options.controlStateOptions || !state || !state.controlState) return true;

        // if (rule.options.controlStateOptions.skipPristine && state.controlState.pristine) return false;
        // if (rule.options.controlStateOptions.skipUntouched && state.controlState.untouched) return false;

        return true;
    }

    private canShortCircuitRuleGroup<T>(passed: boolean, ruleGroup: RuleGroup<T>) {
        return (passed && ruleGroup.any) // it passed, and we only need one to pass
            || (!passed && !ruleGroup.any); // if failed, and we need all to pass
    }

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

    private setPropertyAbsolutePaths(properties: PropertyBase<any>[], currentAbsolutePath: string = '') {
        if (!properties) return;

        properties.forEach(prop => {
            const isArrayItemProperty = PropertyBase.isArrayItemProperty(prop);
            const newAbsolutePathSegment = isArrayItemProperty ? '[]' : (prop as Property<any>).name;
            const isAtRoot = !currentAbsolutePath;
            const newAbsolutePath = `${currentAbsolutePath}${isAtRoot ? '' : '.'}${newAbsolutePathSegment}`;

            // set absolute path for property
            prop.setAbsolutePath(newAbsolutePath);

            if (prop.properties) {
                this.setPropertyAbsolutePaths(prop.properties, newAbsolutePath);
            } else if (prop.arrayItemProperty) {
                this.setPropertyAbsolutePaths([prop.arrayItemProperty], newAbsolutePath);
            }
        });
    }

}
