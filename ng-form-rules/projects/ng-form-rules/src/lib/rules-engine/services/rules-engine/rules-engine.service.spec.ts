import { TestBed, inject } from '@angular/core/testing';

import { RulesEngineService } from './rules-engine.service';
import { MODEL_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/model-settings.token';
import { AbstractModelSettings } from '../../../form-rules/models/abstract-model-settings';
import { Property } from '../../../form-rules/models/property';
import { TestResult } from '../../../form-rules/models/test-result';
import { Person } from '../../../test-utils/models/person';
import { TRACE_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/trace-settings.token';
import { UtilsModule } from '../../../utils/utils.module';
import { of } from 'rxjs';
import { TestResultsBase } from '../../../form-rules/models/test-results-base';
import { ProcessResultType } from '../../../form-rules/models/proccess-result-type';
import { ModelSettingsBuilder } from '../../../form-rules/helper/model-settings-builder';
import { AdhocModelSettings } from '../../../form-rules/models/adhoc-model-settings';
import { Car } from '../../../test-utils/models/car';
import { TraceService } from '../../../utils/trace/trace.service';
import { CommonService } from '../../../utils/common/common.service';


describe('RulesEngineService', () => {
    let svc: RulesEngineService;
    const builder = new ModelSettingsBuilder();

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                UtilsModule
            ],
            providers: [
                RulesEngineService,
                {
                    provide: MODEL_SETTINGS_TOKEN,
                    useValue: [
                        new NullModelSettings("null"),
                        new EmptyModelSettings("empty"),
                        { name: "rogue"},
                    ]
                },
                { provide: TRACE_SETTINGS_TOKEN, useValue: true }
            ]
        });

        svc = TestBed.get(RulesEngineService);
    });

    it('should be created', () => {
        expect(svc).toBeTruthy();
    });

    describe('compilation', () => {
        it('should compile settings set in the injection token', () => {
            const personSettings = svc.getModelSettings<Person>("empty");
            expect(personSettings).toBeTruthy();
        });

        it('should not set model setting when not in the injection token', () => {
            const badSettings = svc.getModelSettings<Person>("bad-name");
            expect(badSettings).toBeFalsy();
        });

        it('should handle rogue model settings', () => {
            const rogueModelSettings = svc.getModelSettings<any>("rogue");
            expect(rogueModelSettings).toBeTruthy();
            expect(rogueModelSettings.properties).toBeUndefined();
        });

        it('should not throw error when provided empty model settings (token is optional)', () => {
            expect(() => new RulesEngineService([], new TraceService(false), new CommonService()))
                .not.toThrowError();
        });

        it('should not throw error when provided falsy model settings (token is optional)', () => {
            expect(() => new RulesEngineService(null, new TraceService(false), new CommonService()))
                .not.toThrowError();
        });
    });

    describe('initialize model settings', () => {
        const settings = AdhocModelSettings.create<Person>(b => {
            return [
                b.property('name'),
                b.property('age'),
                b.property('car', p => {
                    p.properties = [
                        b.property<Car>('make'),
                        b.property<Car>('year')
                    ];
                }),
                b.property('nicknames', p => {
                    p.arrayItemProperty = b.arrayItemProperty<string>();
                })
            ];
        });

        it('should set absolute paths for properties configured in model settings', () => {
            svc.initializeModelSetting(settings);

            expect(settings.properties.find(p => p.name == "name").absolutePath).toEqual('name');
            expect(settings.properties.find(p => p.name == "age").absolutePath).toEqual('age');

            expect(settings.properties.find(p => p.name == "car").absolutePath).toEqual('car');
            expect(settings.properties
                .find(p => p.name == "car").properties
                .find(p => p.name == 'make').absolutePath
            ).toEqual('car.make');
            expect(settings.properties
                .find(p => p.name == "car").properties
                .find(p => p.name == 'year').absolutePath
            ).toEqual('car.year');

            expect(settings.properties.find(p => p.name == "nicknames").absolutePath).toEqual('nicknames');
            expect(settings.properties
                .find(p => p.name == "nicknames").arrayItemProperty.absolutePath
            ).toEqual('nicknames.[]');
        });

        it('should set owner model settings name of every property', () => {
            svc.initializeModelSetting(settings);

            const personPropertiesWithOwnerSetCount = settings.properties
                .filter(p => p.ownerModelSettingsName == 'adhoc').length;
            const carProperties = settings.properties
                .find(p => p.name == 'car').properties;
            const carPropertiesWithOwnerSet = carProperties
                .filter(p => p.ownerModelSettingsName == 'adhoc');
            const nicknameArrayItemProperty = settings.properties
                .find(p => p.name == 'nicknames').arrayItemProperty;

            expect(settings.properties.length).toEqual(personPropertiesWithOwnerSetCount);
            expect(carProperties.length).toEqual(carPropertiesWithOwnerSet.length);
            expect(nicknameArrayItemProperty.ownerModelSettingsName).toEqual('adhoc');
        });

        it('should handle property settings with properties set to null', () => {
            const emptyModelSettings = AdhocModelSettings.create<Person>(b => null);
            svc.initializeModelSetting(emptyModelSettings);

            expect(emptyModelSettings).toBeTruthy();
            expect(emptyModelSettings.properties).toEqual([]);
        });

        it('should handle property settings with properties builder function set to null', () => {
            const rogueModelSettings = AdhocModelSettings.create<Person>(null);
            svc.initializeModelSetting(rogueModelSettings);

            expect(rogueModelSettings).toBeTruthy();
            expect(rogueModelSettings.properties).toEqual([]);
        });
    });

    describe('rule set processing', () => {
        describe('sync', () => {
            it('should process rule group', () => {
                const ruleGroup = builder.ruleGroup<Person>(
                    [ builder.rule((x: Person) => !!x.name) ]
                );
                expect(svc.processRuleSet({name: 'Chris'}, ruleGroup)).toEqual(ProcessResultType.Passed);
                expect(svc.processRuleSet({name: null}, ruleGroup)).toEqual(ProcessResultType.Failed);
            });

            it('should process rule', () => {
                const rule = builder.rule((x: Person) => !!x.name);
                expect(svc.processRuleSet({name: 'Chris'}, rule)).toEqual(ProcessResultType.Passed);
                expect(svc.processRuleSet({name: null}, rule)).toEqual(ProcessResultType.Failed);
            });

            it('should process rule using root data', () => {
                const rule = builder.rule((x, root: Person) => !!root.name);
                expect(svc.processRuleSet(null, rule, { rootData: {name: 'Chris'} })).toEqual(ProcessResultType.Passed);
                expect(svc.processRuleSet(null, rule, { rootData: {name: null} })).toEqual(ProcessResultType.Failed);
            });

            it('should process falsey rule and return skipped', () => {
                expect(svc.processRuleSet(null, null)).toEqual(ProcessResultType.Skipped);
            });

            it('should process rule group with truthy "any" when first rule passes', () => {
                const ruleGroup = builder.ruleGroup<Person>(
                    [
                        builder.rule((x: Person) => !!x.name),
                        builder.rule((x: Person) => !x.name),
                    ], true
                );
                const result = svc.processRuleSet({name: 'Chris'}, ruleGroup);
                expect(result).toEqual(ProcessResultType.Passed);
            });

            it('should process rule group with truthy "any" when second rule passes', () => {
                const ruleGroup = builder.ruleGroup<Person>(
                    [
                        builder.rule((x: Person) => !x.name),
                        builder.rule((x: Person) => !!x.name),
                    ], true
                );
                const result = svc.processRuleSet({name: 'Chris'}, ruleGroup);
                expect(result).toEqual(ProcessResultType.Passed);
            });

            it('should process rule group with truthy "any" when no rules pass', () => {
                const ruleGroup = builder.ruleGroup<Person>(
                    [
                        builder.rule((x: Person) => !!x.name),
                        builder.rule((x: Person) => !!x.name),
                    ], true
                );
                const result = svc.processRuleSet({name: null}, ruleGroup);
                expect(result).toEqual(ProcessResultType.Failed);
            });

            it('should process rule group with falsy rules', () => {
                const ruleGroup = builder.ruleGroup<Person>([null]);
                const result = svc.processRuleSet({name: null}, ruleGroup);
                expect(result).toEqual(ProcessResultType.Skipped);
            });

            it('should process rule group with rules that have null sync rule', () => {
                const ruleGroup = builder.ruleGroup<Person>([
                    builder.rule(null)
                ]);
                const result = svc.processRuleSet({name: null}, ruleGroup);
                expect(result).toEqual(ProcessResultType.Skipped);
            });

            it('should process rule when ran sync for an async rule', () => {
                const rule = builder.ruleAsync((x: Person) => of(!!x.name));
                const result = svc.processRuleSet({}, rule);
                expect(result).toEqual(ProcessResultType.Skipped);
            });
        });

        describe('async', () => {
            it('should process rule group', () => {
                const ruleGroup = builder.ruleGroup<Person>(
                    [ builder.ruleAsync((x: Person) => of(!!x.name)) ]
                );
                svc.processRuleSetAsync({name: 'Chris'}, ruleGroup).subscribe(x => {
                    expect(x).toEqual(ProcessResultType.Passed);
                });
                svc.processRuleSetAsync({name: null}, ruleGroup).subscribe(x => {
                    expect(x).toEqual(ProcessResultType.Failed);
                });
            });

            it('should process rule', () => {
                const rule = builder.ruleAsync((x: Person) => of(!!x.name));
                svc.processRuleSetAsync({name: 'Chris'}, rule).subscribe(x => {
                    expect(x).toEqual(ProcessResultType.Passed);
                });
                svc.processRuleSetAsync({name: null}, rule).subscribe(x => {
                    expect(x).toEqual(ProcessResultType.Failed);
                });
            });

            it('should process rule using root data', () => {
                const rule = builder.ruleAsync((x, root: Person) => of(!!root.name));
                svc.processRuleSetAsync(null, rule, { rootData: {name: 'Chris'} }).subscribe(x => {
                    expect(x).toEqual(ProcessResultType.Passed);
                });
                svc.processRuleSetAsync(null, rule, { rootData: {name: null} }).subscribe(x => {
                    expect(x).toEqual(ProcessResultType.Failed);
                });
            });

            it('should process falsey rule and return skipped', () => {
                svc.processRuleSetAsync(null, null).subscribe(x => {
                    expect(x).toEqual(ProcessResultType.Skipped);
                });
            });

            it('should process rule group with truthy "any" when first rule passes', () => {
                const ruleGroup = builder.ruleGroup<Person>(
                    [
                        builder.ruleAsync((x: Person) => of(!!x.name)),
                        builder.ruleAsync((x: Person) => of(!x.name)),
                    ], true
                );
                svc.processRuleSetAsync({name: 'Chris'}, ruleGroup).subscribe(x => {
                    expect(x).toEqual(ProcessResultType.Passed);
                });
            });

            it('should process rule set with truthy "any" when second rule passes', () => {
                const ruleGroup = builder.ruleGroup<Person>(
                    [
                        builder.ruleAsync((x: Person) => of(!x.name)),
                        builder.ruleAsync((x: Person) => of(!!x.name)),
                    ], true
                );
                svc.processRuleSetAsync({name: 'Chris'}, ruleGroup).subscribe(x => {
                    expect(x).toEqual(ProcessResultType.Passed);
                });
            });

            it('should process rule set with truthy "any" when no rules pass', () => {
                const ruleGroup = builder.ruleGroup<Person>(
                    [
                        builder.ruleAsync((x: Person) => of(!!x.name)),
                        builder.ruleAsync((x: Person) => of(!!x.name)),
                    ], true
                );
                svc.processRuleSetAsync({name: null}, ruleGroup).subscribe(x => {
                    expect(x).toEqual(ProcessResultType.Failed);
                });
            });

            it('should process rule group with falsy rules', () => {
                const ruleGroup = builder.ruleGroup<Person>([null]);
                svc.processRuleSetAsync({name: null}, ruleGroup)
                    .subscribe(result => {
                        expect(result).toEqual(ProcessResultType.Skipped);
                    });
            });

            it('should process rule group with rules that have a null async func', () => {
                const ruleGroup = builder.ruleGroup<Person>([
                    builder.ruleAsync(null)
                ]);
                svc.processRuleSetAsync({name: null}, ruleGroup)
                    .subscribe(result => {
                        expect(result).toEqual(ProcessResultType.Skipped);
                    });
            });

            it('should process rule when ran async for an sync rule', () => {
                const rule = builder.rule((x: Person) => true);
                svc.processRuleSetAsync({}, rule)
                    .subscribe(result => {
                        // async rule sets can have sync rules, so it should process
                        expect(result).toEqual(ProcessResultType.Passed);
                    });
            });
        });
    });

    describe('running test', () => {
        describe('sync', () => {
            it('should handle a passed test', () => {
                const test = builder.validNamedTest('Pass test', '', builder.rule(x => !!x));
                const result = svc.runTest('Hello', test);
                expect(result).toEqual({ passed: true, message: null, name: 'Pass test' });
            });

            it('should handle a failed test', () => {
                const test = builder.validNamedTest('Fail test', 'Message', builder.rule(x => !!x));
                const result = svc.runTest(null, test);
                expect(result).toEqual({ passed: false, message: "Message", name: "Fail test" } as TestResult<Person>);
            });

            it('should handle when provided a falsey test', () => {
                const result = svc.runTest(null, null);
                expect(result).toBeFalsy();
            });

            it('should handle rule where condition is not met', () => {
                const test = builder.validNamedTest('False condition test', '', builder.rule(x => !!x), builder.rule(x => false));
                const result = svc.runTest(null, test);
                expect(result).toEqual({ passed: true, skipped: true, message: null, name: "False condition test" });
            });
        });

        describe('async', () => {
            it('should handle a passed test', () => {
                const test = builder.validNamedTest('Pass test', '', builder.ruleAsync(x => of(!!x)));
                svc.runTestAsync('Hello', test).subscribe(x => {
                    expect(x).toEqual({ passed: true, message: null, name: 'Pass test' });
                });
            });

            it('should handle a failed test', () => {
                const test = builder.validNamedTest('Fail test', 'Message', builder.ruleAsync(x => of(!!x)));
                svc.runTestAsync(null, test).subscribe(x => {
                    expect(x).toEqual({ passed: false, message: "Message", name: "Fail test" } as TestResult<Person>);
                });
            });

            it('should handle when provided a falsey test', () => {
                svc.runTestAsync(null, null).subscribe(x => {
                    expect(x).toBeFalsy();
                });
            });

            it('should handle rule where condition is not met', () => {
                const test = builder.validNamedTest('False condition test', '',
                    builder.ruleAsync(x => of(!!x)), builder.ruleAsync(x => of(false)));
                svc.runTestAsync(null, test).subscribe(x => {
                    expect(x).toEqual({ passed: true, skipped: true, message: null, name: "False condition test" });
                });
            });
        });
    });

    describe('running multiple tests', () => {
        describe('sync', () => {
            const passedTest1 = builder.validTest('Pass test 1', builder.rule(x => true));
            const passedTest2 = builder.validTest('Pass test 2', builder.rule(x => true));
            const failedTest1 = builder.validTest('Failed test 1', builder.rule(x => false));
            const failedTest2 = builder.validTest('Failed test 2', builder.rule(x => false));
            const skippedTest1 = builder.validTest('Skipped test 1', builder.rule(x => false), builder.rule(x => false));
            const skippedTest2 = builder.validTest('Skipped test 2', builder.rule(x => false), builder.rule(x => false));

            it('should handle passed tests', () => {
                const tests = [passedTest1, passedTest2];
                const results = svc.runTests({}, tests);
                expect(results.passed).toBeTruthy();
                expect(results.messages).toEqual([]);
                expect(results.failedResults.length).toEqual(0);
                expect(results.passedResults.length).toEqual(2);
                expect(results.skippedResults.length).toEqual(0);
                expect(results.results.length).toEqual(2);
            });

            it('should handle failed tests', () => {
                const tests = [failedTest1, failedTest2];
                const results = svc.runTests({}, tests);
                expect(results.passed).toBeFalsy();
                expect(results.messages).toEqual(["Failed test 1", "Failed test 2"]);
                expect(results.failedResults.length).toEqual(2);
                expect(results.passedResults.length).toEqual(0);
                expect(results.skippedResults.length).toEqual(0);
                expect(results.results.length).toEqual(2);
            });

            it('should handle skipped tests', () => {
                const tests = [skippedTest1, skippedTest2];
                const results = svc.runTests({}, tests);
                expect(results.passed).toBeTruthy();
                expect(results.messages).toEqual([]);
                expect(results.failedResults.length).toEqual(0);
                expect(results.passedResults.length).toEqual(0);
                expect(results.skippedResults.length).toEqual(2);
                expect(results.results.length).toEqual(2);
            });

            it('should handle mixture of tests', () => {
                const tests = [passedTest1, failedTest1, skippedTest1];
                const results = svc.runTests({}, tests);
                expect(results.passed).toBeFalsy();
                expect(results.messages).toEqual(["Failed test 1"]);
                expect(results.failedResults.length).toEqual(1);
                expect(results.passedResults.length).toEqual(1);
                expect(results.skippedResults.length).toEqual(1);
                expect(results.results.length).toEqual(3);
            });

            it('should handle when provided falsey tests', () => {
                const results = svc.runTests({}, null);
                expect(results.passed).toBeTruthy();
                expect(results.messages).toEqual([]);
                expect(results.failedResults).toEqual([]);
                expect(results.passedResults).toEqual([]);
                expect(results.results).toEqual([]);
            });

            it('should handle empty tests array', () => {
                const results = svc.runTests({}, []);
                expect(results.passed).toBeTruthy();
                expect(results.messages).toEqual([]);
                expect(results.failedResults).toEqual([]);
                expect(results.passedResults).toEqual([]);
                expect(results.results).toEqual([]);
            });
        });

        describe('async', () => {
            const passedTest1 = builder.validTest('Pass test 1', builder.ruleAsync(x => of(true)));
            const passedTest2 = builder.validTest('Pass test 2', builder.ruleAsync(x => of(true)));
            const failedTest1 = builder.validTest('Failed test 1', builder.ruleAsync(x => of(false)));
            const failedTest2 = builder.validTest('Failed test 2', builder.ruleAsync(x => of(false)));
            const skippedTest1 = builder.validTest('Skipped test 1', builder.ruleAsync(x => of(false)), builder.ruleAsync(x => of(false)));
            const skippedTest2 = builder.validTest('Skipped test 2', builder.ruleAsync(x => of(false)), builder.ruleAsync(x => of(false)));

            it('should handle passed tests', () => {
                const tests = [passedTest1, passedTest2];
                svc.runTestsAsync({}, tests)
                    .subscribe(results => {
                        expect(results.passed).toBeTruthy();
                        expect(results.messages).toEqual([]);
                        expect(results.failedResults.length).toEqual(0);
                        expect(results.passedResults.length).toEqual(2);
                        expect(results.skippedResults.length).toEqual(0);
                        expect(results.results.length).toEqual(2);
                    });
            });

            it('should handle failed tests', () => {
                const tests = [failedTest1, failedTest2];
                svc.runTestsAsync({}, tests)
                    .subscribe(results => {
                        expect(results.passed).toBeFalsy();
                        expect(results.messages).toEqual(["Failed test 1", "Failed test 2"]);
                        expect(results.failedResults.length).toEqual(2);
                        expect(results.passedResults.length).toEqual(0);
                        expect(results.skippedResults.length).toEqual(0);
                        expect(results.results.length).toEqual(2);
                    });
            });

            it('should handle skipped tests', () => {
                const tests = [skippedTest1, skippedTest2];
                svc.runTestsAsync({}, tests)
                    .subscribe(results => {
                        expect(results.passed).toBeTruthy();
                        expect(results.messages).toEqual([]);
                        expect(results.failedResults.length).toEqual(0);
                        expect(results.passedResults.length).toEqual(0);
                        expect(results.skippedResults.length).toEqual(2);
                        expect(results.results.length).toEqual(2);
                    });
            });

            it('should handle mixture of tests', () => {
                const tests = [passedTest1, failedTest1, skippedTest1];
                svc.runTestsAsync({}, tests)
                    .subscribe(results => {
                        expect(results.passed).toBeFalsy();
                        expect(results.messages).toEqual(["Failed test 1"]);
                        expect(results.failedResults.length).toEqual(1);
                        expect(results.passedResults.length).toEqual(1);
                        expect(results.skippedResults.length).toEqual(1);
                        expect(results.results.length).toEqual(3);
                    });
            });

            it('should handle when provided falsey tests', () => {
                svc.runTestsAsync({}, null)
                    .subscribe(results => {
                        expect(results.passed).toBeTruthy();
                        expect(results.messages).toEqual([]);
                        expect(results.failedResults).toEqual([]);
                        expect(results.passedResults).toEqual([]);
                        expect(results.results).toEqual([]);
                    });
            });

            it('should handle empty tests array', () => {
                svc.runTestsAsync({}, [])
                    .subscribe(results => {
                        expect(results.passed).toBeTruthy();
                        expect(results.messages).toEqual([]);
                        expect(results.failedResults).toEqual([]);
                        expect(results.passedResults).toEqual([]);
                        expect(results.results).toEqual([]);
                    });
            });
        });
    });

    describe('validate', () => {
        it('should run validation tests', () => {
            const property = builder.property('name', p => {
                p.valid.push(builder.validTest('Failed tests', builder.rule(x => false)));
            });
            svc.validate({}, property)
                .subscribe(results => {
                    expect(results.passed).toBeFalsy();
                    expect(results.messages).toEqual(["Failed tests"]);
                });
        });
    });

    describe('editable', () => {
        it('should run editable tests', () => {
            const property = builder.property('name', p => {
                p.edit.push(builder.editTest(builder.rule(x => false)));
            });
            svc.editable({}, property)
                .subscribe(results => {
                    expect(results.passed).toBeFalsy();
                });
        });
    });

    describe('visible', () => {
        it('should run visible tests', () => {
            const property = builder.property('name', p => {
                p.view.push(builder.editTest(builder.rule(x => false)));
            });
            svc.visible({}, property)
                .subscribe(results => {
                    expect(results.passed).toBeFalsy();
                });
        });
    });

    describe('dependency properties', () => {
        it('should get rule check dependency properties', () => {
            const test = builder.editTest(builder.rule(x => true, {dependencyProperties: ['a']}));
            const result = svc.getDependencyProperties([test]);

            expect(result.length).toEqual(1);
            expect(result[0]).toEqual("a");
        });

        it('should get rule condition dependency properties', () => {
            const test = builder.editTest(null, builder.rule(x => true, {dependencyProperties: ['a']}));
            const result = svc.getDependencyProperties([test]);

            expect(result.length).toEqual(1);
            expect(result[0]).toEqual("a");
        });

        it('should get rule group dependency properties', () => {
            const test = builder.editTest(builder.ruleGroup([builder.rule(x => true, {dependencyProperties: ['a']})]));
            const result = svc.getDependencyProperties([test]);

            expect(result[0]).toEqual("a");
        });

        it('should get unique dependency properties', () => {
            const test = builder.editTest(builder.rule(x => true, {dependencyProperties: ["a", "b", "a", "c", "a"]}));
            const result = svc.getDependencyProperties([test]);

            expect(result.length).toEqual(3);
            expect(result[0]).toEqual("a");
            expect(result[1]).toEqual("b");
            expect(result[2]).toEqual("c");
        });

        it('should get unique dependency properties from multiple tests', () => {
            const tests = [
                builder.editTest(builder.rule(x => true, {dependencyProperties: ["a", "b", "c"]})),
                builder.editTest(builder.rule(x => true, {dependencyProperties: ["b", "c", "d"]})),
            ];
            const result = svc.getDependencyProperties(tests);

            expect(result.length).toEqual(4);
            expect(result).toEqual(["a", "b", "c", "d"]);
        });

        it('should handle falsey tests', () => {
            const result = svc.getDependencyProperties(null);

            expect(result).toEqual([]);
        });
    });

    describe('group tests by sync type', () => {
        const syncRule = builder.rule(x => true);
        const asyncRule = builder.ruleAsync(x => of(true));

        it('should group single sync test', () => {
            const tests = [
                builder.validTest('test1', syncRule)
            ];
            const results = svc.groupTestsBySyncType(tests);
            expect(results.sync.length).toEqual(1);
            expect(results.async.length).toEqual(0);
        });

        it('should group single async test', () => {
            const tests = [
                builder.validTest('test1', asyncRule)
            ];
            const results = svc.groupTestsBySyncType(tests);
            expect(results.sync.length).toEqual(0);
            expect(results.async.length).toEqual(1);
        });

        it('should group sync and async test', () => {
            const tests = [
                builder.validTest('test1', syncRule),
                builder.validTest('test2', asyncRule)
            ];
            const results = svc.groupTestsBySyncType(tests);
            expect(results.sync.length).toEqual(1);
            expect(results.async.length).toEqual(1);
        });

        it('should group as async when async rule exists in the test', () => {
            const tests = [
                builder.validTest('test1', syncRule, asyncRule),
            ];
            const results = svc.groupTestsBySyncType(tests);
            expect(results.sync.length).toEqual(0);
            expect(results.async.length).toEqual(1);
        });

        it('should group empty test array', () => {
            const tests = [];
            const results = svc.groupTestsBySyncType(tests);
            expect(results.sync.length).toEqual(0);
            expect(results.async.length).toEqual(0);
        });

        it('should group null test array', () => {
            const results = svc.groupTestsBySyncType(null);
            expect(results.sync.length).toEqual(0);
            expect(results.async.length).toEqual(0);
        });
    });

    describe('miscellaneous', () => {
        it('should handle null test results being sent to TestResultsBase', () => {
            const results = new TestResultsBase(null);
            expect(results.passed).toBeTruthy();
            expect(results.results).toEqual([]);
        });
    });
});

class NullModelSettings extends AbstractModelSettings<Person> {
    protected buildProperties(): Property<Person>[] {
        return null;
    }
}

class EmptyModelSettings extends AbstractModelSettings<Person> {
    protected buildProperties(): Property<Person>[] {
        return [];
    }
}