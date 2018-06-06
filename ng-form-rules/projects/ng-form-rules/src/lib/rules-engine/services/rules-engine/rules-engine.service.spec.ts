import { TestBed, inject } from '@angular/core/testing';

import { RulesEngineService } from './rules-engine.service';
import { MODEL_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/model-settings.token';
import { AbstractModelSettings } from '../../../form-rules/models/abstract-model-settings';
import { Property } from '../../../form-rules/models/property';
import { RuleGroup } from '../../../form-rules/models/rule-group';
import { TestResult } from '../../../form-rules/models/test-result';
import { Person } from '../../../test-utils/models/person';
import { Rule } from '../../../form-rules/models/rule';
import { Test } from '../../../form-rules/models/test';
import { TraceService } from '../../../utils/trace/trace.service';
import { TRACE_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/trace-settings.token';
import { CommonService } from '../../../utils/common/common.service';
import { UtilsModule } from '../../../utils/utils.module';
import { of } from 'rxjs';
import { ControlState } from '../../../form-rules/models/control-state';
import { AbstractControl } from '@angular/forms';
import { Car } from '../../../test-utils/models/car';
import { TestResultsBase } from '../../../form-rules/models/test-results-base';

const validPerson: Person = { name: "Chris", age: 100 };
const invalidPerson: Person = { name: "Tom", age: 999 };

describe('RulesEngineService', () => {
    let svc: RulesEngineService;
    let personModelSettings: AbstractModelSettings<Person>;
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
                        new PersonModelSettings("a"),
                        new EmptyModelSettings("empty"),
                        // new ControlStateOptionsSettings("b")
                    ]
                },
                { provide: TRACE_SETTINGS_TOKEN, useValue: true }
            ]
        });

        svc = TestBed.get(RulesEngineService);
        personModelSettings = svc.getModelSettings<Person>("a");
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

        it('should set properties configured in model settings', () => {
            expect(personModelSettings.properties.length).toEqual(4);
            expect(personModelSettings.properties.map(x => x.name)).toEqual(["name", "age", "car", "nicknames"]);
        });

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

        it('should handle falsey built property settings', () => {
            const emptyModelSettings = svc.getModelSettings<Person>("empty");
            expect(emptyModelSettings).toBeTruthy();
            expect(emptyModelSettings.properties).toEqual([]);
        });
    });

    describe('rule set processing', () => {
        describe('sync', () => {
            it('should process rule group', () => {
                const ruleGroup = personModelSettings.properties.find(x => x.name == "name").valid[0].check;
                expect(svc.processRuleSet(validPerson, ruleGroup)).toBeTruthy();
                expect(svc.processRuleSet(invalidPerson, ruleGroup)).toBeFalsy();
            });

            it('should process rule', () => {
                const ruleGroup = personModelSettings.properties.find(x => x.name == "age").valid[0].check;
                expect(svc.processRuleSet(validPerson, ruleGroup)).toBeTruthy();
                expect(svc.processRuleSet(invalidPerson, ruleGroup)).toBeFalsy();
            });

            it('should process rule using root data', () => {
                const rule = { func: (x, root) => root.a === 1 } as Rule<any>;
                expect(svc.processRuleSet({}, rule, { rootData: { a: 1 } })).toBeTruthy();
                expect(svc.processRuleSet(invalidPerson, rule, { rootData: { a: 0 } })).toBeFalsy();
            });

            it('should process falsey rule and return positive', () => {
                expect(svc.processRuleSet({ name: "Whatever"}, null)).toBeTruthy();
            });
        });

        describe('async', () => {
            it('should process rule group', () => {
                const ruleGroup = personModelSettings.properties.find(x => x.name == "name").valid[0].check;
                svc.processRuleSetAsync(validPerson, ruleGroup)
                    .subscribe(x => expect(x).toBeTruthy());
                svc.processRuleSetAsync(invalidPerson, ruleGroup)
                    .subscribe(x => expect(x).toBeFalsy());
            });

            it('should process rule', () => {
                const ruleGroup = personModelSettings.properties.find(x => x.name == "age").valid[0].check;

                svc.processRuleSetAsync(validPerson, ruleGroup)
                    .subscribe(x => expect(x).toBeTruthy());
                svc.processRuleSetAsync(invalidPerson, ruleGroup)
                    .subscribe(x => expect(x).toBeFalsy());
            });

            it('should process rule using root data', () => {
                const rule = { asyncFunc: (x, root) => of(root.a === 1) } as Rule<any>;

                svc.processRuleSetAsync({}, rule, { rootData: { a: 1 } })
                    .subscribe(x => expect(x).toBeTruthy());
                svc.processRuleSetAsync({}, rule, { rootData: { a: 0 } })
                    .subscribe(x => expect(x).toBeFalsy());
            });

            it('should process falsey rule and return positive', () => {
                svc.processRuleSetAsync({ name: "Whatever"}, null)
                    .subscribe(x => expect(x).toBeTruthy());
            });
        });
    });

    describe('running test', () => {
        describe('sync', () => {
            it('should handle a passed test', () => {
                const test = personModelSettings.properties.find(x => x.name == "name").valid[0];
                const result = svc.runTest(validPerson, test);
                expect(result).toEqual({ passed: true, message: null, name: "Chris" } as TestResult<Person>);
            });

            it('should handle a failed test', () => {
                const test = personModelSettings.properties.find(x => x.name == "name").valid[0];
                const result = svc.runTest(invalidPerson, test);
                expect(result).toEqual({ passed: false, message: "Doesn't equal Chris", name: "Chris" } as TestResult<Person>);
            });

            it('should handle when provided a falsey test', () => {
                const result = svc.runTest({ name: "Whatever"}, null);
                expect(result).toEqual({ passed: true, message: null, name: null } as TestResult<Person>);
            });

            it('should pass rule where condition is not met', () => {
                const test = personModelSettings.properties.find(x => x.name == "name").valid[1];
                const result = svc.runTest({}, test);
                expect(result.passed).toBeTruthy();
            });
        });

        describe('async', () => {
            it('should handle a passed test', () => {
                const test = personModelSettings.properties.find(x => x.name == "name").valid[0];
                svc.runTestAsync(validPerson, test)
                    .subscribe(result => {
                        expect(result).toEqual({ passed: true, message: null, name: "Chris" } as TestResult<Person>);
                    });
            });

            it('should handle a failed test', () => {
                const test = personModelSettings.properties.find(x => x.name == "name").valid[0];
                svc.runTestAsync(invalidPerson, test)
                    .subscribe(result => {
                        expect(result).toEqual({ passed: false, message: "Doesn't equal Chris", name: "Chris" } as TestResult<Person>);
                    });
            });

            it('should handle when provided a falsey test', () => {
                svc.runTestAsync({ name: "Whatever"}, null)
                    .subscribe(result => {
                        expect(result).toEqual({ passed: true, message: null, name: null } as TestResult<Person>);
                    });
            });

            it('should pass rule where condition is not met', () => {
                const test = personModelSettings.properties.find(x => x.name == "name").valid[1];
                svc.runTestAsync({}, test)
                    .subscribe(result => {
                        expect(result.passed).toBeTruthy();
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
                expect(results.passedResults.length).toEqual(2);
                expect(results.results.length).toEqual(2);
            });

            it('should handle failed tests', () => {
                const validTests = personModelSettings.properties.find(x => x.name == "name").valid;
                const results = svc.runTests({}, validTests);
                expect(results.passed).toBeFalsy();
                expect(results.messages).toEqual(["Doesn't equal Chris"]);
                expect(results.failedResults.length).toEqual(1);
                expect(results.passedResults.length).toEqual(1);
                expect(results.results.length).toEqual(2);
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
                        expect(results.results.length).toEqual(2);
                    });
            });

            it('should handle failed tests', () => {
                const validTests = personModelSettings.properties.find(x => x.name == "name").valid;
                svc.runTestsAsync({}, validTests)
                    .subscribe(results => {
                        expect(results.passed).toBeFalsy();
                        expect(results.messages).toEqual(["Doesn't equal Chris"]);
                        expect(results.failedResults.length).toEqual(1);
                        expect(results.passedResults.length).toEqual(1);
                        expect(results.results.length).toEqual(2);
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
    buildPropertyRules(): Property<Person>[] {
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

class EmptyModelSettings extends AbstractModelSettings<Person> {
    protected buildPropertyRules(): Property<Person>[] {
        return null;
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