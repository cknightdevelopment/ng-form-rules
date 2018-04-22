import { TestBed, inject } from '@angular/core/testing';

import { RulesEngineService } from './rules-engine.service';
import { MODEL_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/model-settings.token';
import { AbstractModelSettings } from '../../../form-rules/models/abstract-model-settings';
import { Property } from '../../../form-rules/models/property';
import { RuleGroup } from '../../../form-rules/models/rule-group';
import { ValidationResult } from '../../../form-rules/models/validation-result';

class PersonModelSettings extends AbstractModelSettings<Person> {
    buildPropertyRules(): Property<Person>[] {
        return [
            this.builder.property("name", p => {
                p.valid = [
                    {
                        name: "Name equals Chris",
                        message: "Boo!",
                        check: {
                            rules: [
                                { func: (x) => x.name == "Chris" }
                            ]
                        }
                    }
                ];

                // p.properties = [
                //     this.builder.property<Car>("make", cp => {})
                // ];

                // p.arrayItemProperty = this.builder.arrayItemProperty<Car>(aip => {
                //     aip.valid = [
                //         this.builder.validation<Car>({ func: (car) => car.year > 2000 })
                //     ];
                // });
            }),
            this.builder.property("age", p => {
                p.valid = [
                    {
                        name: "Age equals 100",
                        message: "Boo 2!",
                        check: {
                            rules: [
                                { func: (x) => x.age == 100 }
                            ]
                        }
                    }
                ];
            }),
        ];
    }
}

class Person {
    name?: string;
    age?: number;
}

class Car {
    make: string;
    year: number;
}

describe('RulesEngineService', () => {
    let svc: RulesEngineService;
    let personModelSettings: AbstractModelSettings<Person>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                RulesEngineService,
                {
                    provide: MODEL_SETTINGS_TOKEN,
                    useValue: [
                        new PersonModelSettings("a")
                    ]
                }
            ]
        });

        svc = TestBed.get(RulesEngineService);
        personModelSettings = svc.getModelSettings<Person>("a");
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
            expect(personModelSettings.properties.length).toEqual(2);
            expect(personModelSettings.properties.map(x => x.name)).toEqual(["name", "age"]);
        });
    });

    describe('rule set processing', () => {
        it('should process rule group', () => {
            const ruleGroup = personModelSettings.properties.find(x => x.name == "name").valid[0].check;
            expect(svc.processRuleSet({ name: "Chris"}, ruleGroup)).toBeTruthy();
            expect(svc.processRuleSet({ name: "Bad"}, ruleGroup)).toBeFalsy();
        });

        it('should process rule', () => {
            const ruleGroup = personModelSettings.properties.find(x => x.name == "age").valid[0].check;
            expect(svc.processRuleSet({ age: 100}, ruleGroup)).toBeTruthy();
            expect(svc.processRuleSet({ age: 999}, ruleGroup)).toBeFalsy();
        });

        it('should process falsey rule and return positive', () => {
            expect(svc.processRuleSet({ name: "Whatever"}, null)).toBeTruthy();
        });
    });

    describe('validation', () => {
        it('should handle when valid', () => {
            const validation = personModelSettings.properties.find(x => x.name == "name").valid[0];
            const result = svc.validate({ name: "Chris"}, validation);
            expect(result).toEqual({ valid: true, message: null, name: "Name equals Chris" } as ValidationResult<Person>);
        });

        it('should handle when invalid', () => {
            const validation = personModelSettings.properties.find(x => x.name == "name").valid[0];
            const result = svc.validate({ name: "Bad"}, validation);
            expect(result).toEqual({ valid: false, message: "Boo!", name: "Name equals Chris" } as ValidationResult<Person>);
        });

        it('should handle when provided a falsey validation', () => {
            const result = svc.validate({ name: "Whatever"}, null);
            expect(result).toEqual({ valid: true, message: null, name: null } as ValidationResult<Person>);
        });
    });
});