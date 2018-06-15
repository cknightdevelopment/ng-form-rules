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
import { Observable, from , forkJoin, of, pipe, combineLatest } from 'rxjs';
import { takeWhile, concatMap, filter, map, flatMap, mergeMap, take, tap, concat, concatAll, mergeAll, merge } from 'rxjs/operators';
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

        settings.forEach(setting => {
            this.traceSvc.trace(`Registering model settings "${setting.name}"`);
            this.setPropertyAbsolutePaths(setting.properties);
            this.setPropertyOwnerModelSettingsName(setting.name, setting.properties);
            this.modelSettings[setting.name] = setting;
        });
    }

    /**
     * Gets model settings with the provided name
     * @param name Name of model setting
     * @returns Model settings with the provided name
     */
    getModelSettings<T>(name: string): AbstractModelSettings<T> {
        this.traceSvc.trace(`Retrieving model settings "${name}"`);

        const settings = this.modelSettings[name];

        // create new object as we manage
        return settings
            ? Object.assign({}, this.modelSettings[name])
            : null;
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
            .reduce((prev, current) => prev.concat(current), []);

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
     * Runs an array of sync tests
     * @param data Data to perform tests against
     * @param tests Tests to run
     * @returns Result of tests
     */
    runTests<T>(data: T, tests: Test<T>[], state?: TestRunState): TestResultsBase<T> {
        if (!tests || !tests.length) return new TestResultsBase([]);

        const testResults = tests
            .map(t => this.runTest(data, t, state))
            .filter(x => !!x);

        return new TestResultsBase(testResults);
    }

    /**
     * Runs an array of async tests
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
                map(testResults => new TestResultsBase(testResults.filter(x => !!x)))
            );
    }

    /**
     * Runs an array of sync and async tests
     * @param data Data to perform tests against
     * @param tests Tests to run
     * @returns Result of tests
     */
    runAllTests<T>(data: T, tests: Test<T>[], state?: TestRunState): Observable<TestResultsBase<T>> {
        if (!tests || !tests.length) return of(new TestResultsBase([]));

        const syncTestResults = of(this.runTests(data, tests, state));

        return syncTestResults.pipe(
            mergeMap(result => {
                if (!result.passed) return of(result);

                return this.runTestsAsync(data, tests, state);
            }),
            take(1)
        );
    }

    /**
     * Performs sync test on a set of data
     * @param data Data to perform test against
     * @param test Test to run
     * @returns Result of test
     */
    runTest<T>(data: T, test: Test<T>, state?: TestRunState): TestResult<T> {
        if (!test) return null;

        const passedTestResult: TestResult<T> = { passed: true, name: test.name, message: null };
        const failedTestResult: TestResult<T> = { passed: false, name: test.name, message: test.message };
        const skippedTestResult: TestResult<T> = { passed: true, skipped: true, name: test.name, message: null };

        const conditionsRuleSetResult = this.processRuleSet(data, test.condition, state);
        if (conditionsRuleSetResult === RuleSetResultType.Failed) return skippedTestResult;

        const checkRuleSetResult = this.processRuleSet(data, test.check, state);
        switch (checkRuleSetResult) {
            case RuleSetResultType.Passed:
                return passedTestResult;
            case RuleSetResultType.Failed:
                return failedTestResult;
            case RuleSetResultType.Skipped:
                return skippedTestResult;
            default:
                return skippedTestResult;
        }
    }

    /**
     * Performs async test on a set of data
     * @param data Data to perform test against
     * @param test Test to run
     * @returns Result of test
     */
    runTestAsync<T>(data: T, test: Test<T>, state?: TestRunState): Observable<TestResult<T>> {
        if (!test) return of(null);

        const passedTestResult: TestResult<T> = { passed: true, name: test.name, message: null };
        const failedTestResult: TestResult<T> = { passed: false, name: test.name, message: test.message };
        const skippedTestResult: TestResult<T> = { passed: true, skipped: true, name: test.name, message: null };

        const conditionsRuleSetResult$ = this.processRuleSetAsync(data, test.condition, state);
        const checkRuleSetResult$ = this.processRuleSetAsync(data, test.check, state);

        return conditionsRuleSetResult$
            .pipe(
                flatMap(conditionsRuleSetResult => {
                    if (conditionsRuleSetResult === RuleSetResultType.Failed) return of(skippedTestResult);

                    return checkRuleSetResult$
                        .pipe(
                            map(checkRuleSetResult => {
                                switch (checkRuleSetResult) {
                                    case RuleSetResultType.Passed:
                                        return passedTestResult;
                                    case RuleSetResultType.Failed:
                                        return failedTestResult;
                                    case RuleSetResultType.Skipped:
                                        return skippedTestResult;
                                    default:
                                        return skippedTestResult;
                                }
                            })
                        );
                })
            );
    }

    /**
     * Processes a sync rule set
     * @param data Data to process rule set against
     * @param ruleSet Rule set to process
     * @returns Result of rule set processing
     */
    processRuleSet<T>(data: T, ruleSet: RuleSet<T>, state?: TestRunState): RuleSetResultType {
        if (!ruleSet) return RuleSetResultType.Skipped;

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
    processRuleSetAsync<T>(data: T, ruleSet: RuleSet<T>, state?: TestRunState): Observable<RuleSetResultType> {
        if (!ruleSet) return of(RuleSetResultType.Skipped);

        const isRuleGroup = this.isRuleGroup(ruleSet);
        return isRuleGroup
            ? this.processRuleGroupAsync(data, ruleSet as RuleGroup<T>, state)
            : this.processRuleAsync(data, ruleSet as Rule<T>, state);
    }

    private processRuleGroup<T>(data: T, ruleGroup: RuleGroup<T>, state?: TestRunState): RuleSetResultType {
        let passedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < ruleGroup.rules.length; i++) {
            const rule = ruleGroup.rules[i];
            const ruleSetResult = this.processRuleSet(data, rule, state);

            if (this.canShortCircuitRuleGroup(ruleSetResult, ruleGroup)) return ruleSetResult;

            if (ruleSetResult == RuleSetResultType.Passed) passedCount++;
            else if (ruleSetResult == RuleSetResultType.Skipped) skippedCount++;
        }

        // if we skipped them all, then return skipped
        if (skippedCount === ruleGroup.rules.length) return RuleSetResultType.Skipped;

        // if we got this far, make sure all tests were passed
        return passedCount === ruleGroup.rules.length ? RuleSetResultType.Passed : RuleSetResultType.Failed;
    }

    private processRuleGroupAsync<T>(data: T, ruleGroup: RuleGroup<T>, state?: TestRunState): Observable<RuleSetResultType> {
        const asyncRuleSetResults$ = ruleGroup.rules.map(x => this.processRuleSetAsync(data, x, state));

        return forkJoin(asyncRuleSetResults$).pipe(
            map(ruleSetResults => {
                const counts = {
                    passed: ruleSetResults.filter(x => x === RuleSetResultType.Passed).length,
                    failed: ruleSetResults.filter(x => x === RuleSetResultType.Failed).length,
                    skipped: ruleSetResults.filter(x => x === RuleSetResultType.Skipped).length,
                };

                if (!!ruleGroup.any && counts.passed > 0) return RuleSetResultType.Passed;
                if (!ruleGroup.any && counts.passed === ruleSetResults.length) return RuleSetResultType.Passed;
                if (counts.skipped === ruleSetResults.length) return RuleSetResultType.Skipped;

                return RuleSetResultType.Failed;
            })
        );
    }

    private processRule<T>(data: T, rule: Rule<T>, state?: TestRunState): RuleSetResultType {
        if (!this.doProcessRule(rule, state, false)) return RuleSetResultType.Skipped;

        const rootData = state ? state.rootData : null;
        return rule.func(data, rootData) ? RuleSetResultType.Passed : RuleSetResultType.Failed;
    }

    private processRuleAsync<T>(data: T, rule: Rule<T>, state?: TestRunState): Observable<RuleSetResultType> {
        if (!this.doProcessRule(rule, state, true)) return of(RuleSetResultType.Skipped);

        const rootData = state ? state.rootData : null;
        return rule.asyncFunc(data, rootData)
            .pipe(
                map(passed => passed ? RuleSetResultType.Passed : RuleSetResultType.Failed)
            );
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

    private canShortCircuitRuleGroup<T>(ruleSetResult: RuleSetResultType, ruleGroup: RuleGroup<T>): boolean {
        return (ruleSetResult == RuleSetResultType.Passed && ruleGroup.any) // it passed, and we only need one to pass
            || (ruleSetResult == RuleSetResultType.Failed && !ruleGroup.any); // if failed, and we need all to pass
    }

    private isRuleGroup<T>(ruleSet: RuleSet<T>): boolean {
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

    private setPropertyAbsolutePaths(properties: PropertyBase<any>[], currentAbsolutePath: string = ''): void {
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

    private setPropertyOwnerModelSettingsName(modelSettingsName: string, properties: PropertyBase<any>[]): void {
        if (!properties) return;

        properties.forEach(prop => {
            prop.setOwnerModelSettingsName(modelSettingsName);

            if (prop.properties) {
                this.setPropertyOwnerModelSettingsName(modelSettingsName, prop.properties);
            } else if (prop.arrayItemProperty) {
                this.setPropertyOwnerModelSettingsName(modelSettingsName, [prop.arrayItemProperty]);
            }
        });
    }
}

export enum RuleSetResultType {
    Passed,
    Failed,
    Skipped
}
