import { TestBed, inject } from '@angular/core/testing';

import { RulesEngineService } from './rules-engine.service';
import { MODEL_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/model-settings.token';
import { AbstractModelSettings } from '../../../form-rules/models/abstract-model-settings';
import { Property } from '../../../form-rules/models/property';

class PersonModelSettings extends AbstractModelSettings<Person> {
    buildPropertyRules(): Property<Person>[] {
        return [
            this.builder.property("name", p => {
                p.valid = [
                    this.builder.validationWithMessage<Person>("Boo!", {
                        any: true,
                        rules: [
                            { func: (x) => x.name == "Chris" }
                        ]
                    })
                ];

                p.properties = [
                    this.builder.property<Car>("make", cp => {})
                ];

                p.arrayItemProperty = this.builder.arrayItemProperty<Car>(aip => {
                    aip.valid = [
                        this.builder.validation<Car>({ func: (car) => car.year > 2000 })
                    ];
                });
            }),
            this.builder.property("age", p => {

            }),
        ];
    }
}

class Person {
    name: string;
    age: number;
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

    describe('initialization', () => {
        it('should get model settings initialized via the injection token', () => {
            const settings = svc.getModelSettings<PersonModelSettings>("a");
            expect(settings).toBeTruthy();
        });

        it('should not get model setting when not in the injection token', () => {
            const settings = svc.getModelSettings<PersonModelSettings>("bad-name");
            expect(settings).toBeFalsy();
        });
    });
});