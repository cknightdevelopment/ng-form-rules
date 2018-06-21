import { TestBed, inject } from '@angular/core/testing';

import { RulesEngineService } from './rules-engine.service';
import { MODEL_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/model-settings.token';
import { AbstractModelSettings } from '../../../form-rules/models/abstract-model-settings';
import { Property } from '../../../form-rules/models/property';
import { TestResult } from '../../../form-rules/models/test-result';
import { Person } from '../../../test-utils/models/person';
import { Rule } from '../../../form-rules/models/rule';
import { Test } from '../../../form-rules/models/test';
import { TRACE_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/trace-settings.token';
import { UtilsModule } from '../../../utils/utils.module';
import { of } from 'rxjs';
import { Car } from '../../../test-utils/models/car';
import { TestResultsBase } from '../../../form-rules/models/test-results-base';
import { ProcessResultType } from '../../../form-rules/models/proccess-result-type';
import { ModelSettingsBuilder } from '../../../form-rules/helper/model-settings-builder';

const validPerson: Person = { name: "Chris", age: 100 };
const invalidPerson: Person = { name: "Tom", age: 999 };

describe('RulesEngineService', () => {
    let svc: RulesEngineService;
    let personModelSettings: AbstractModelSettings<Person>;
    let anyModelSettings: AbstractModelSettings<Person>;
    const builder = new ModelSettingsBuilder();
    // let controlStateOptionsSettings: AbstractModelSettings<ControlStateOptionsSettings>;

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
                        new PersonModelSettings("person"),
                        new AnyModelSettings("any"),
                        new NullModelSettings("null"),
                        new EmptyModelSettings("empty"),
                        { name: "rogue"},
                        // new ControlStateOptionsSettings("b")
                    ]
                },
                { provide: TRACE_SETTINGS_TOKEN, useValue: true }
            ]
        });

        svc = TestBed.get(RulesEngineService);
        personModelSettings = svc.getModelSettings<Person>("person");
        anyModelSettings = svc.getModelSettings<Person>("any");
        // controlStateOptionsSettings = svc.getModelSettings<Person>("b");
    });

    it('should be created', () => {
        expect(svc).toBeTruthy();
    });

    describe('compilation', () => {
        it('should set model settings initialized via the injection token', () => {
            expect(personModelSettings).toBeTruthy();
        });

        it('should not set model setting when not in the injection token', () => {
            const badSettings = svc.getModelSettings<Person>("bad-name");
            expect(badSettings).toBeFalsy();
        });

        it('should handle property settings with properties set to null', () => {
            const emptyModelSettings = svc.getModelSettings<Person>("null");
            expect(emptyModelSettings).toBeTruthy();
            expect(emptyModelSettings.properties).toEqual([]);
        });

        it('should handle property settings with properties set to an empty array', () => {
            const emptyModelSettings = svc.getModelSettings<Person>("empty");
            expect(emptyModelSettings).toBeTruthy();
            expect(emptyModelSettings.properties).toEqual([]);
        });

        it('should handle rogue model settings', () => {
            const rogueModelSettings = svc.getModelSettings<any>("rogue");
            expect(rogueModelSettings).toBeTruthy();
            expect(rogueModelSettings.properties).toBeUndefined();
        });
    });

    describe('initialize model settings', () => {
        it('should set absolute paths for properties configured in model settings', () => {
            expect(personModelSettings.properties.find(p => p.name == "name").absolutePath).toEqual('name');
            expect(personModelSettings.properties.find(p => p.name == "age").absolutePath).toEqual('age');

            expect(personModelSettings.properties.find(p => p.name == "car").absolutePath).toEqual('car');
            expect(personModelSettings.properties
                .find(p => p.name == "car").properties
                .find(p => p.name == 'make').absolutePath
            ).toEqual('car.make');
            expect(personModelSettings.properties
                .find(p => p.name == "car").properties
                .find(p => p.name == 'year').absolutePath
            ).toEqual('car.year');

            expect(personModelSettings.properties.find(p => p.name == "nicknames").absolutePath).toEqual('nicknames');
            expect(personModelSettings.properties
                .find(p => p.name == "nicknames").arrayItemProperty.absolutePath
            ).toEqual('nicknames.[]');
        });

        it('should set owner model settings name of every property', () => {
            const propertyWithOwnerSetCount = personModelSettings.properties
                .filter(p => p.ownerModelSettingsName == "person").length;
            expect(personModelSettings.properties.length).toEqual(propertyWithOwnerSetCount);
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

            it('should process rule set with truthy "any" when second rule passes', () => {
                const ruleGroup = builder.ruleGroup<Person>(
                    [
                        builder.rule((x: Person) => !x.name),
                        builder.rule((x: Person) => !!x.name),
                    ], true
                );
                const result = svc.processRuleSet({name: 'Chris'}, ruleGroup);
                expect(result).toEqual(ProcessResultType.Passed);
            });

            it('should process rule set with truthy "any" when no rules pass', () => {
                const ruleGroup = builder.ruleGroup<Person>(
                    [
                        builder.rule((x: Person) => !!x.name),
                        builder.rule((x: Person) => !!x.name),
                    ], true
                );
                const result = svc.processRuleSet({name: null}, ruleGroup);
                expect(result).toEqual(ProcessResultType.Failed);
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
            it('should handle passed tests', () => {
                const validTests = personModelSettings.properties.find(x => x.name == "name").valid;
                const results = svc.runTests(validPerson, validTests);
                expect(results.passed).toBeTruthy();
                expect(results.messages).toEqual([]);
                expect(results.failedResults.length).toEqual(0);
                expect(results.passedResults.length).toEqual(1);
                expect(results.skippedResults.length).toEqual(2);
                expect(results.results.length).toEqual(3);
            });

            it('should handle failed tests', () => {
                const validTests = personModelSettings.properties.find(x => x.name == "name").valid;
                const results = svc.runTests({}, validTests);
                expect(results.passed).toBeFalsy();
                expect(results.messages).toEqual(["Doesn't equal Chris"]);
                expect(results.failedResults.length).toEqual(1);
                expect(results.passedResults.length).toEqual(0);
                expect(results.skippedResults.length).toEqual(2);
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
            it('should handle passed tests', () => {
                const validTests = personModelSettings.properties.find(x => x.name == "name").valid;
                svc.runTestsAsync(validPerson, validTests)
                    .subscribe(results => {
                        expect(results.passed).toBeTruthy();
                        expect(results.messages).toEqual([]);
                        expect(results.failedResults.length).toEqual(0);
                        expect(results.passedResults.length).toEqual(2);
                        expect(results.skippedResults.length).toEqual(1);
                        expect(results.results.length).toEqual(3);
                    });
            });

            it('should handle failed tests', () => {
                const validTests = personModelSettings.properties.find(x => x.name == "name").valid;
                svc.runTestsAsync({}, validTests)
                    .subscribe(results => {
                        expect(results.passed).toBeFalsy();
                        expect(results.messages).toEqual(["Doesn't equal Chris", "Doesn't equal Chris async only"]);
                        expect(results.failedResults.length).toEqual(2);
                        expect(results.passedResults.length).toEqual(0);
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
            const property = personModelSettings.properties.find(x => x.name == "name");
            const results = svc.validate(invalidPerson, property);
            expect(results.passed).toBeFalsy();
            expect(results.messages).toEqual(["Doesn't equal Chris"]);
        });
    });

    describe('editable', () => {
        it('should run editable tests', () => {
            const property = personModelSettings.properties.find(x => x.name == "name");
            const results = svc.editable(invalidPerson, property);
            expect(results.passed).toBeFalsy();
            expect(results.messages).toEqual(["The first letter isn't C."]);
        });
    });

    describe('visible', () => {
        it('should run visible tests', () => {
            const property = personModelSettings.properties.find(x => x.name == "name");
            const results = svc.visible(invalidPerson, property);
            expect(results.passed).toBeFalsy();
            expect(results.messages).toEqual(["Not 5 characters long."]);
        });
    });

    describe('dependency properties', () => {
        it('should get rule check dependency properties', () => {
            const test = {
                check: {
                    func: () => true,
                    options: { dependencyProperties: ["a"] }
                }
            } as Test<Person>;
            const result = svc.getDependencyProperties([test]);

            expect(result.length).toEqual(1);
            expect(result[0]).toEqual("a");
        });

        it('should get rule condition dependency properties', () => {
            const test = {
                check: null,
                condition: {
                    func: () => true,
                    options: { dependencyProperties: ["a"] }
                }
            } as Test<Person>;
            const result = svc.getDependencyProperties([test]);

            expect(result.length).toEqual(1);
            expect(result[0]).toEqual("a");
        });

        it('should get rule group dependency properties', () => {
            const test = {
                check: {
                    rules: [
                        {
                            func: () => true,
                            options: { dependencyProperties: ["a"] }
                        }
                    ]
                }
            } as Test<Person>;
            const result = svc.getDependencyProperties([test]);

            expect(result[0]).toEqual("a");
        });

        it('should get unique dependency properties', () => {
            const test = {
                check: {
                    func: () => true,
                    options: { dependencyProperties: ["a", "b", "a", "c", "a"] }
                }
            } as Test<Person>;
            const result = svc.getDependencyProperties([test]);

            expect(result.length).toEqual(3);
            expect(result[0]).toEqual("a");
            expect(result[1]).toEqual("b");
            expect(result[2]).toEqual("c");
        });

        it('should get unique dependency properties from multiple tests', () => {
            const tests = [
                {
                    check: {
                        func: () => true,
                        options: { dependencyProperties: ["a", "b", "c"] }
                    }
                } as Test<Person>,
                {
                    check: {
                        func: () => true,
                        options: { dependencyProperties: ["b", "c", "d"] }
                    }
                } as Test<Person>
            ];
            const result = svc.getDependencyProperties(tests);

            expect(result.length).toEqual(4);
            expect(result).toEqual(["a", "b", "c", "d"]);
        });
    });

    describe('group tests by sync type', () => {
        const b = new ModelSettingsBuilder();
        const syncRule = b.rule(x => !!x);
        const asyncRule = b.ruleAsync(x => of(!!x));

        it('should group single sync test', () => {
            const tests = [
                b.validTest('test1', syncRule)
            ];
            const results = svc.groupTestsBySyncType(tests);
            expect(results.sync.length).toEqual(1);
            expect(results.async.length).toEqual(0);
        });

        it('should group single async test', () => {
            const tests = [
                b.validTest('test1', asyncRule)
            ];
            const results = svc.groupTestsBySyncType(tests);
            expect(results.sync.length).toEqual(0);
            expect(results.async.length).toEqual(1);
        });

        it('should group sync and async test', () => {
            const tests = [
                b.validTest('test1', syncRule),
                b.validTest('test2', asyncRule)
            ];
            const results = svc.groupTestsBySyncType(tests);
            expect(results.sync.length).toEqual(1);
            expect(results.async.length).toEqual(1);
        });

        it('should group as async when async rule exists in the test', () => {
            const tests = [
                b.validTest('test1', syncRule, asyncRule),
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

    // describe('control state options', () => {
    //     it('should skip validations for pristine controls when control state options dictate', () => {
    //         const ruleGroup = controlStateOptionsSettings.properties
    //             .find(prop => prop.name == "name")
    //             .valid.find(t => t.name == "ChrisSkipPristine").check;

    //         expect(svc.processRuleSet(invalidPerson, ruleGroup)).toBeFalsy();
    //         expect(svc.processRuleSet(invalidPerson, ruleGroup, { controlState: { pristine: true } as any })).toBeTruthy();
    //     });

    //     it('should skip validations for untouched controls when control state options dictate', () => {
    //         const ruleGroup = controlStateOptionsSettings.properties
    //             .find(prop => prop.name == "name")
    //             .valid.find(t => t.name == "ChrisSkipUntouched").check;

    //         expect(svc.processRuleSet(invalidPerson, ruleGroup)).toBeFalsy();
    //         expect(svc.processRuleSet(invalidPerson, ruleGroup, { controlState: { untouched: true } as any })).toBeTruthy();
    //     });
    // });
});

class PersonModelSettings extends AbstractModelSettings<Person> {
    buildProperties(): Property<Person>[] {
        return [
            this.builder.property("name", p => {
                p.valid = [
                    {
                        name: "Chris",
                        message: "Doesn't equal Chris",
                        check: {
                            // rule group
                            rules: [
                                {
                                    func: (x) => x.name == "Chris",
                                    asyncFunc: x => of(x.name == "Chris")
                                }
                            ],
                        }
                    },
                    {
                        name: "Chris async only",
                        message: "Doesn't equal Chris async only",
                        check: {
                            rules: [
                                {
                                    asyncFunc: x => of(x.name == "Chris")
                                }
                            ],
                        }
                    },
                    {
                        name: "Condition never met",
                        message: "This should never happen",
                        // would always fail validation
                        check: {
                            func: (x) => false,
                            asyncFunc: (x) => of(false)
                        },
                        // condition will never be met
                        condition: {
                            func: (x) => false,
                            asyncFunc: (x) => of(false)
                        }
                    }
                ];
                p.edit = [
                    {
                        name: "First Character",
                        message: "The first letter isn't C.",
                        check: {
                            rules: [
                                { func: (x) => x.name.startsWith("C") }
                            ]
                        }
                    }
                ];
                p.view = [
                    {
                        name: "Length",
                        message: "Not 5 characters long.",
                        check: {
                            rules: [
                                { func: (x) => x.name.length === 5 }
                            ]
                        }
                    }
                ];
            }),
            this.builder.property("age", p => {
                p.valid = [
                    {
                        name: "100",
                        message: "Not 100",
                        check: {
                            rules: [
                                // rule
                                { func: (x) => x.age == 100, asyncFunc: x => of(x.age == 100) }
                            ]
                        }
                    }
                ];
            }),
            this.builder.property('car', p => {
                p.properties = [
                    this.builder.property<Car>('make'),
                    this.builder.property<Car>('year'),
                ];
            }),
            this.builder.property('nicknames', p => {
                p.arrayItemProperty = this.builder.arrayItemProperty<string>();
            })
        ];
    }
}

class AnyModelSettings extends AbstractModelSettings<Person> {
    protected buildProperties(): Property<Person>[] {
        return [
            this.builder.property('name', p => {
                p.valid = [
                    {
                        name: "name",
                        message: "Name must be Chris or Aubrey",
                        check: {
                            any: true,
                            rules: [
                                {
                                    func: (person) => person.name == "Chris"
                                },
                                {
                                    func: (person) => person.name == "Aubrey"
                                }
                            ]
                        }
                    },
                    {
                        name: "name async",
                        message: "Name async must be Chris or Aubrey",
                        check: {
                            any: true,
                            rules: [
                                {
                                    asyncFunc: (person) => of(person.name == "Chris")
                                },
                                {
                                    asyncFunc: (person) => of(person.name == "Aubrey")
                                }
                            ]
                        }
                    }
                ];
            })
        ];
    }
}

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

// class ControlStateOptionsSettings extends AbstractModelSettings<Person> {
//     buildPropertyRules(): Property<Person>[] {
//         return [
//             this.builder.property("name", p => {
//                 p.valid = [
//                     {
//                         name: "ChrisSkipPristine",
//                         message: "Doesn't equal Chris",
//                         check: {
//                             func: x => x.name == "Chris",
//                             options: { controlStateOptions: { skipPristine: true } }
//                         }
//                     },
//                     {
//                         name: "ChrisSkipUntouched",
//                         message: "Doesn't equal Chris",
//                         check: {
//                             func: x => x.name == "Chris",
//                             options: { controlStateOptions: { skipUntouched: true } }
//                         }
//                     }
//                 ];
//             }),
//         ];
//     }
// }