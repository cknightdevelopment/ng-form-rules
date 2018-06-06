import { TestBed, ComponentFixture } from "@angular/core/testing";
import { ReactiveFormsRuleService } from "./reactive-forms-rule.service";
import { ReactiveFormsModule, FormArray, FormGroup } from "@angular/forms";
import { RulesEngineService } from "../rules-engine/rules-engine.service";
import { MODEL_SETTINGS_TOKEN } from "../../../form-rules/injection-tokens/model-settings.token";
import { Person } from "../../../test-utils/models/person";
import { AbstractModelSettings } from "../../../form-rules/models/abstract-model-settings";
import { Property } from "../../../form-rules/models/property";
import { TraceService } from "../../../utils/trace/trace.service";
import { TRACE_SETTINGS_TOKEN } from "../../../form-rules/injection-tokens/trace-settings.token";
import { Car } from "../../../test-utils/models/car";
import { UtilsModule } from "../../../utils/utils.module";
import { of } from "rxjs";
import { ArrayItemProperty } from "../../../form-rules/models/array-item-property";
import { Component, OnInit } from "@angular/core";
import { ValueTransformer } from "@angular/compiler/src/util";

const validPerson: Person = { name: "Chris", age: 100, car: { year: 2017, make: "Subaru" }, nicknames: ["C-TOWN", "C"] };
const invalidPerson: Person = { name: "Tom", age: -99, nicknames: ["Z-TOWN", "Z"] };
const validSettingsKey = 'validSettings';
const editSettingsKey = 'editSettings';

class PersonModelValidSettings extends AbstractModelSettings<Person> {
    buildPropertyRules(): Property<Person>[] {
        return [
            this.builder.property<Person>("age"),
            this.builder.property<Person>("nicknames", p => {
                p.arrayItemProperty = this.builder.arrayItemProperty<string>(aip => {
                    aip.valid = [
                        {
                            name: "Nickname items test",
                            check: {
                                func: (x, root) => root.age == 100,
                                options: { dependencyProperties: ["/age"] }
                            }
                        }
                    ];
                });
            }),
            this.builder.property<Person>("car", p => {
                p.properties = [
                    this.builder.property<Car>("make"),
                    this.builder.property<Car>("year", cp => {
                        cp.valid = [
                            {
                                name: "Year test",
                                check: {
                                    func: (x, root) => x.year == 2017 && root.name == "Chris",
                                    options: { dependencyProperties: ["../name"] }
                                }
                            }
                        ];
                    })
                ];
            }),
            this.builder.property<Person>("name", p => {
                p.valid = [
                    {
                        check: {
                            func: x => x.name.startsWith("C") && x.age > 0 && x.car.make == "Subaru" && x.nicknames[0] == "C-TOWN",
                            asyncFunc: (x, root) => of(root.age == 100),
                            options: { dependencyProperties: ["./age", "car.make", "nicknames.0"] }
                        }
                    }
                ];
            })
        ];
    }
}

class PersonModelEditSettings extends AbstractModelSettings<Person> {
    buildPropertyRules(): Property<Person>[] {
        return [
            this.builder.property<Person>("age"),
            this.builder.property<Person>("nicknames", p => {
                p.arrayItemProperty = this.builder.arrayItemProperty<string>(aip => {
                    aip.edit = [
                        {
                            name: "Nickname items test",
                            check: {
                                func: (x, root) => root.age == 100,
                                options: { dependencyProperties: ["/age"] }
                            }
                        }
                    ];
                });
            }),
            this.builder.property<Person>("car", p => {
                p.properties = [
                    this.builder.property<Car>("make"),
                    this.builder.property<Car>("year", cp => {
                        cp.edit = [
                            {
                                name: "Year test",
                                check: {
                                    func: (x, root) => x.year == 2017 && root.name == "Chris",
                                    options: { dependencyProperties: ["../name"] }
                                }
                            }
                        ];
                    })
                ];
            }),
            this.builder.property<Person>("name", p => {
                p.edit = [
                    {
                        name: "Name test",
                        check: {
                            func: x =>  x.name.startsWith("C") && x.age > 0 && x.car.make == "Subaru" && x.nicknames[0] == "C-TOWN",
                            options: { dependencyProperties: ["./age", "car.make", "nicknames.0"] }
                        }
                    }
                ];
            })
        ];
    }
}

describe('ReactiveFormsRuleService', () => {
    let svc: ReactiveFormsRuleService;
    let engine: RulesEngineService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                UtilsModule
            ],
            providers: [
                ReactiveFormsRuleService,
                RulesEngineService,
                {
                    provide: MODEL_SETTINGS_TOKEN,
                    useValue: [
                        new PersonModelValidSettings(validSettingsKey),
                        new PersonModelEditSettings(editSettingsKey)
                    ]
                },
                { provide: TRACE_SETTINGS_TOKEN, useValue: true }
            ]
        });

        svc = TestBed.get(ReactiveFormsRuleService);
        engine = TestBed.get(RulesEngineService);
    });

    it('should be created', () => {
        expect(svc).toBeTruthy();
    });

    describe('create form group', () => {
        it('should create form group according to model settings', () => {
            const fg = svc.createFormGroup(validSettingsKey);
            const value = fg.getRawValue();
            expect(value).toEqual({
                age: null,
                name: null,
                car: {
                    make: null,
                    year: null
                },
                nicknames: [null]
            } as Person);
        });

        it('should throw an error provided non-configured model settings name', () => {
            expect(() => svc.createFormGroup('BAD NAME')).toThrowError(`No model setting found with the name "BAD NAME"`);
        });

        it('should create form group with initial values', () => {
            const fg = svc.createFormGroup(validSettingsKey, validPerson);
            const value = fg.getRawValue();
            expect(value).toEqual(validPerson);
        });

        it('should create form group as valid when given valid values', () => {
            const fg = svc.createFormGroup(validSettingsKey, validPerson);
            expect(fg.valid).toBeTruthy();
        });

        it('should create form group as invalid when given invalid values', () => {
            const fg = svc.createFormGroup(validSettingsKey, invalidPerson);
            expect(fg.valid).toBeFalsy();
        });

        describe('async', () => {
            it('should create form group as invalid when given invalid values', () => {
                const fg = svc.createFormGroup(validSettingsKey, Object.assign({}, validPerson, { age: 200 }));
                const nameControl = fg.get('name');

                expect(nameControl.valid).toBeFalsy();
                expect(nameControl.errors).toBeTruthy();
            });
        });
    });

    describe('valid', () => {
        describe('dependency property reactions', () => {
            it('should react to same level property change', () => {
                const fg = svc.createFormGroup(validSettingsKey, validPerson);
                const nameControl = fg.get('name');

                expect(nameControl.valid).toBeTruthy();
                fg.patchValue({ age: -30 });
                expect(nameControl.valid).toBeFalsy();
                expect(nameControl.errors).toBeTruthy();
            });

            it('should react to parent property change (non-array item)', () => {
                const fg = svc.createFormGroup(validSettingsKey, validPerson);
                const yearControl = fg.get('car.year');

                expect(yearControl.valid).toBeTruthy();
                fg.patchValue({ name: "Cindy" });
                expect(yearControl.valid).toBeFalsy();
                expect(yearControl.errors).toBeTruthy();
            });

            it('should react to parent property change (array item)', () => {
                const fg = svc.createFormGroup(validSettingsKey, validPerson);
                const firstNicknameControl = fg.get('nicknames.0');

                expect(firstNicknameControl.valid).toBeTruthy();
                fg.patchValue({ age: 101 });
                expect(firstNicknameControl.valid).toBeFalsy();
                expect(firstNicknameControl.errors).toBeTruthy();
            });

            it('should react to child property change', () => {
                const fg = svc.createFormGroup(validSettingsKey, validPerson);
                const nameControl = fg.get('name');

                expect(nameControl.valid).toBeTruthy();
                fg.patchValue({ car: { make: "Ford" } });
                expect(nameControl.valid).toBeFalsy();
                expect(nameControl.errors).toBeTruthy();
            });

            it('should react to array item change', () => {
                const fg = svc.createFormGroup(validSettingsKey, validPerson);
                const nameControl = fg.get('name');

                expect(nameControl.valid).toBeTruthy();
                fg.patchValue({ nicknames: ["Something else"] });
                expect(nameControl.valid).toBeFalsy();
                expect(nameControl.errors).toBeTruthy();
            });
        });
    });

    describe('edit', () => {
        describe('dependency property reactions', () => {
            it('should react to same level property change', () => {
                const fg = svc.createFormGroup(editSettingsKey, validPerson);
                const nameControl = fg.get('name');

                expect(nameControl.enabled).toBeTruthy();
                fg.patchValue({ age: -30 });
                expect(nameControl.enabled).toBeFalsy();
            });

            it('should react to parent property change (non-array item)', () => {
                const fg = svc.createFormGroup(editSettingsKey, validPerson);
                const yearControl = fg.get('car.year');

                expect(yearControl.enabled).toBeTruthy();
                fg.patchValue({ name: "Cindy" });
                expect(yearControl.enabled).toBeFalsy();
            });

            it('should react to parent property change (array item)', () => {
                const fg = svc.createFormGroup(editSettingsKey, validPerson);
                const firstNicknameControl = fg.get('nicknames.0');

                expect(firstNicknameControl.enabled).toBeTruthy();
                fg.patchValue({ age: 101 });
                expect(firstNicknameControl.enabled).toBeFalsy();
            });

            it('should react to child property change', () => {
                const fg = svc.createFormGroup(editSettingsKey, validPerson);
                const nameControl = fg.get('name');

                expect(nameControl.enabled).toBeTruthy();
                fg.patchValue({ car: { make: "Ford" } });
                expect(nameControl.enabled).toBeFalsy();
            });

            it('should react to array item change', () => {
                const fg = svc.createFormGroup(editSettingsKey, validPerson);
                const nameControl = fg.get('name');

                expect(nameControl.enabled).toBeTruthy();
                fg.patchValue({ nicknames: ["Something else"] });
                expect(nameControl.enabled).toBeFalsy();
            });
        });
    });

    describe('addArrayItemPropertyControl', () => {
        let nicknamesFormArray: FormArray;
        let nicknameArrayItemProperty: ArrayItemProperty<string>;
        const newNicknameValue = 'New Nickname';

        beforeEach(() => {
            const fg = svc.createFormGroup(validSettingsKey, validPerson);
            const settings = engine.getModelSettings(validSettingsKey);
            nicknamesFormArray = fg.get('nicknames') as FormArray;
            nicknameArrayItemProperty = settings.properties
                .find(p => p.name == "nicknames")
                .arrayItemProperty;
        });

        it('should push null to the end', () => {
            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray);
            expect(nicknamesFormArray.length).toEqual(3);
            expect(nicknamesFormArray.at(2).value).toEqual(null);
        });

        it('should push initial value to the end', () => {
            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray, newNicknameValue);
            expect(nicknamesFormArray.length).toEqual(3);
            expect(nicknamesFormArray.at(2).value).toEqual(newNicknameValue);
        });

        it('should push to array index item one', () => {
            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray, newNicknameValue, 1);
            expect(nicknamesFormArray.length).toEqual(3);
            expect(nicknamesFormArray.at(1).value).toEqual(newNicknameValue);
        });

        it('should push to end of array when given positive out of bound array index', () => {
            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray, newNicknameValue, 99);
            expect(nicknamesFormArray.length).toEqual(3);
            expect(nicknamesFormArray.at(2).value).toEqual(newNicknameValue);
        });

        it('should push to end of array when given negative out of bound array index', () => {
            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray, newNicknameValue, -99);
            expect(nicknamesFormArray.length).toEqual(3);
            expect(nicknamesFormArray.at(2).value).toEqual(newNicknameValue);
        });
    });
});