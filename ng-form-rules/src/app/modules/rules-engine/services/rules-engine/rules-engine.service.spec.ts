import { TestBed, inject } from '@angular/core/testing';

import { RulesEngineService } from './rules-engine.service';
import { MODEL_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/model-settings.token';
import { AbstractModelSettings } from '../../../form-rules/models/abstract-model-settings';
import { Property } from '../../../form-rules/models/property';
import { RuleGroup } from '../../../form-rules/models/rule-group';

class PersonModelSettings extends AbstractModelSettings<Person> {
    buildPropertyRules(): Property<Person>[] {
        return [
            this.builder.property("name", p => {
                p.valid = [
                    this.builder.validationWithMessage<Person>("Boo!", {
                        rules: [
                            { func: (x) => x.name == "Chris" }
                        ]
                    })
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
                    this.builder.validationWithMessage<Person>("Boo 2!", {
                        func: (x) => x.age === 100
                    })
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
    });

    it('should be created', () => {
        expect(svc).toBeTruthy();
    });

    describe('compilation', () => {
        it('should set model settings initialized via the injection token', () => {
            const settings = svc.getModelSettings<Person>("a");
            expect(settings).toBeTruthy();
        });

        it('should not set model setting when not in the injection token', () => {
            const settings = svc.getModelSettings<Person>("bad-name");
            expect(settings).toBeFalsy();
        });

        it('should set properties configured in model settings', () => {
            const settings = svc.getModelSettings<Person>("a");
            expect(settings.properties.length).toEqual(2);
            expect(settings.properties.map(x => x.name)).toEqual(["name", "age"]);
        });
    });

    describe('processing', () => {
        it('should process rule group', () => {
            const settings = svc.getModelSettings<Person>("a");
            const ruleGroup = settings.properties.find(x => x.name == "name").valid[0].check;
            expect(svc.process({ name: "Chris"}, ruleGroup)).toBeTruthy();
            expect(svc.process({ name: "Bad"}, ruleGroup)).toBeFalsy();
        });

        it('should process rule', () => {
            const settings = svc.getModelSettings<Person>("a");
            const ruleGroup = settings.properties.find(x => x.name == "age").valid[0].check;
            expect(svc.process({ age: 100}, ruleGroup)).toBeTruthy();
            expect(svc.process({ age: 999}, ruleGroup)).toBeFalsy();
        });
    });
});