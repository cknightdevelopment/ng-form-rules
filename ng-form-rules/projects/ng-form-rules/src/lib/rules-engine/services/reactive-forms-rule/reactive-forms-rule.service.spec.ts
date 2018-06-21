import { TestBed, ComponentFixture } from "@angular/core/testing";
import { ReactiveFormsRuleService } from "./reactive-forms-rule.service";
import { ReactiveFormsModule, FormArray, FormGroup, Validators, AbstractControl, FormControl } from "@angular/forms";
import { RulesEngineService } from "../rules-engine/rules-engine.service";
import { MODEL_SETTINGS_TOKEN } from "../../../form-rules/injection-tokens/model-settings.token";
import { Person } from "../../../test-utils/models/person";
import { AbstractModelSettings } from "../../../form-rules/models/abstract-model-settings";
import { Property } from "../../../form-rules/models/property";
import { TRACE_SETTINGS_TOKEN } from "../../../form-rules/injection-tokens/trace-settings.token";
import { Car } from "../../../test-utils/models/car";
import { UtilsModule } from "../../../utils/utils.module";
import { of } from "rxjs";
import { ArrayItemProperty } from "../../../form-rules/models/array-item-property";
import { AdhocModelSettings } from "../../../form-rules/models/adhoc-model-settings";
import { Component } from "@angular/core";

const validPerson: Person = { name: "Chris", age: 100, car: { year: 2017, make: "Subaru" }, nicknames: ["C-TOWN", "C"] };
const invalidPerson: Person = { name: "Tom", age: -99, nicknames: ["Z-TOWN", "Z"] };
const validSettingsKey = 'validSettings';
const editSettingsKey = 'editSettings';
const registeredSettingsKey = 'registeredSettings';

class PersonModelValidSettings extends AbstractModelSettings<Person> {
    buildProperties(): Property<Person>[] {
        return [
            this.builder.property<Person>("age"),
            this.builder.property<Person>("nicknames", p => {
                p.arrayItemProperty = this.builder.arrayItemProperty<string>(aip => {
                    aip.valid = [
                        {
                            name: "Nickname items test",
                            check: {
                                func: (x, root) => root.age == 100,
                                options: { dependencyProperties: ["/age", "bad.dep.property.path", null, { bad: "path" } as any] }
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
                p.valid.push(this.builder.validTest(
                    'Name messsage sync',
                    this.builder.rule(x => x.name.startsWith("C") && x.age > 0 && x.car.make == "Subaru" && x.nicknames[0] == "C-TOWN",
                        { dependencyProperties: ["./age", "car.make", "nicknames.0"]}
                    )
                ));
                // p.valid.push(this.builder.validTest(
                //     'Name messsage async',
                //     this.builder.ruleAsync<Person, Person>((x, root) => of(root.age == 100),
                //         { dependencyProperties: ["./age"]}
                //     )
                // ));
            })
        ];
    }
}

class PersonModelEditSettings extends AbstractModelSettings<Person> {
    buildProperties(): Property<Person>[] {
        return [
            this.builder.property<Person>("age"),
            this.builder.property<Person>("nicknames", p => {
                p.arrayItemProperty = this.builder.arrayItemProperty<string>(aip => {
                    aip.edit = [
                        {
                            name: "Nickname items test",
                            check: {
                                func: (x, root) => root.age == 100,
                                options: { dependencyProperties: ["/age", "bad.dep.property.path", null, { bad: "path" } as any] }
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
                            func: x => x.name.startsWith("C") && x.age > 0 && x.car.make == "Subaru" && x.nicknames[0] == "C-TOWN",
                            options: { dependencyProperties: ["./age", "car.make", "nicknames.0"] }
                        }
                    }
                ];
            })
        ];
    }
}

class RegisteredSettings extends AbstractModelSettings<Person> {
    protected buildProperties(): Property<Person>[] {
        return [
            this.builder.property('name', p => {
                p.valid.push(
                    this.builder.validTest('Name is required', 
                        this.builder.rule(x => !!x.name)
                    ))
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
                        new RegisteredSettings(registeredSettingsKey),
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
        describe('registered model setting', () => {
            fit('should create form group according to model settings', () => {
                const fg = svc.createFormGroup(registeredSettingsKey);
                const value = fg.getRawValue();
                expect(value).toEqual({
                    name: null
                } as Person);
            });

            fit('should throw an error provided non-configured model settings name', () => {
                expect(() => svc.createFormGroup('BAD NAME')).toThrowError(`No model setting found with the name "BAD NAME"`);
            });

            fit('should create form group with initial values', () => {
                const fg = svc.createFormGroup(registeredSettingsKey, { name: 'Chris' });
                const value = fg.getRawValue();
                expect(value).toEqual({ name: 'Chris' });
            });

            fit('should create form group as valid when given valid values', () => {
                const fg = svc.createFormGroup(registeredSettingsKey, {name: 'Chris'});
                expect(fg.valid).toBeTruthy();
            });

            fit('should create form group as invalid when given invalid values', () => {
                const fg = svc.createFormGroup(registeredSettingsKey, {name: null});
                expect(fg.valid).toBeFalsy();
            });
        });

        describe('adhoc model setting', () => {
            const adhoc = AdhocModelSettings.create<Person>(builder => {
                return [
                    builder.property('name', p => {
                        p.valid.push(builder.validTest('Boo!', builder.rule(person => !!person.name)));
                    })
                ];
            });

            it('should create form group according to model settings', () => {
                const fg = svc.createFormGroup(adhoc);
                const value = fg.getRawValue();
                expect(value).toEqual({ name: null } as Person);
            });

            it('should throw an error provided falsey model settings', () => {
                expect(() => svc.createFormGroup(null)).toThrowError(`Adhoc model setting provided is invalid`);
            });

            it('should create form group with initial values', () => {
                const fg = svc.createFormGroup(adhoc, { name: 'Chris' });
                const value = fg.getRawValue();
                expect(value).toEqual({ name: 'Chris' });
            });

            it('should create form group as valid when given valid values', () => {
                const fg = svc.createFormGroup(adhoc, { name: 'Chris' });
                expect(fg.valid).toBeTruthy();
            });

            it('should create form group as invalid when given invalid values', () => {
                const fg = svc.createFormGroup(adhoc, { name: '' });
                expect(fg.valid).toBeFalsy();
            });

            describe('async', () => {
                const asyncAdhoc = AdhocModelSettings.create<Person>(builder => {
                    return [
                        builder.property('name', p => {
                            p.valid.push(builder.validTest('Message',
                                builder.ruleAsync((x: Person) => of(x.name === 'Chris'))
                            ));
                        }),
                    ];
                });

                it('should create form group as invalid when given invalid values', () => {
                    const fg = svc.createFormGroup(asyncAdhoc, { name: 'Tom' });
                    const nameControl = fg.get('name');

                    expect(nameControl.valid).toBeFalsy();
                    expect(nameControl.errors).toBeTruthy();
                });
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

            it('should re-enabled a disabled control when tests pass', () => {
                const fg = svc.createFormGroup(editSettingsKey, invalidPerson);
                const nameControl = fg.get('name');

                expect(nameControl.enabled).toBeFalsy();
                fg.patchValue(validPerson);
                expect(nameControl.enabled).toBeTruthy();
            });
        });

        describe('async', () => {
            const adhoc = AdhocModelSettings.create<Person>(builder => {
                return [
                    builder.property('age'),
                    builder.property('name', p => {
                        p.edit.push(builder.editTest(
                            builder.ruleAsync((x: Person) => of(x.age === 100), { dependencyProperties: ['./age'] })
                        ));
                    }),
                ];
            });

            it('should pass async test', () => {
                const fg = svc.createFormGroup(adhoc, validPerson);
                const nameControl = fg.get('name');

                expect(nameControl.enabled).toBeTruthy();
            });

            it('should fail async test', () => {
                const fg = svc.createFormGroup(adhoc, validPerson);
                fg.patchValue({age: 200});

                const nameControl = fg.get('name');

                expect(nameControl.enabled).toBeFalsy();
            });
        });
    });

    describe('addArrayItemPropertyControl', () => {
        let fg: FormGroup;
        let settings: AbstractModelSettings<Person>;
        let nicknamesFormArray: FormArray;
        let nicknameArrayItemProperty: ArrayItemProperty<string>;
        const newNicknameValue = 'New Nickname';

        beforeEach(() => {
            fg = svc.createFormGroup(validSettingsKey, validPerson);
            settings = engine.getModelSettings(validSettingsKey);
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

        it('should unsubscribe and re-subscribe dependency properties', () => {
            const nameControl = fg.get('name');
            expect(nameControl.valid).toBeTruthy();

            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray, "Invalid Nickname", 0);

            expect(nameControl.valid).toBeFalsy();
            expect(nameControl.errors).toBeTruthy();
        });
    });

    describe('extend', () => {
        describe('sync', () => {
            let fg: FormGroup;
            let nameControl: AbstractControl;
            let ageControl: AbstractControl;

            beforeEach(() => {
                fg = svc.createFormGroup(validSettingsKey, validPerson);
                nameControl = fg.get('name');
                ageControl = fg.get('age');
            });

            it('should extend existing validator with single validator', () => {
                svc.extendValidator(nameControl, Validators.required);

                nameControl.setValue('');

                expect(nameControl.errors.ngFormRules).toBeTruthy();
                expect(nameControl.errors.required).toBeTruthy();
            });

            it('should extend existing validator with multiple validators', () => {
                svc.extendValidator(nameControl, [Validators.maxLength(1), Validators.minLength(5)]);

                nameControl.setValue('123');

                expect(nameControl.errors.ngFormRules).toBeTruthy();
                expect(nameControl.errors.maxlength).toBeTruthy();
                expect(nameControl.errors.minlength).toBeTruthy();
            });

            it('should extend empty validator with single validator', () => {
                svc.extendValidator(ageControl, Validators.required);

                ageControl.setValue('');

                expect(ageControl.errors.ngFormRules).toBeFalsy();
                expect(ageControl.errors.required).toBeTruthy();
            });

            it('should extend empty validator with multiple validators', () => {
                svc.extendValidator(ageControl, [Validators.max(1), Validators.min(5)]);

                ageControl.setValue(3);

                expect(ageControl.errors.ngFormRules).toBeFalsy();
                expect(ageControl.errors.max).toBeTruthy();
                expect(ageControl.errors.min).toBeTruthy();
            });

            it('should not throw exception when passed falsy validator', () => {
                svc.extendValidator(nameControl, null);

                nameControl.setValue('');

                expect(nameControl.errors.ngFormRules).toBeTruthy();
            });
        });

        describe('async', () => {
            const asyncModelSettings = AdhocModelSettings.create<Person>(builder => {
                return [
                    builder.property('name', p => {
                        p.valid.push(builder.validTest('Boo!',
                            builder.ruleAsync(x => of(x.name === 'Chris'))
                        ));
                    }),
                    builder.property('age')
                ];
            });

            const customAsyncValidator1 = () => (c: AbstractControl) => of({customAsyncValidator1: { passed: false }});
            const customAsyncValidator2 = () => (c: AbstractControl) => of({customAsyncValidator2: { passed: false }});

            let fg: FormGroup;
            let nameControl: AbstractControl;
            let ageControl: AbstractControl;

            beforeEach(() => {
                fg = svc.createFormGroup(asyncModelSettings, { name: 'Chris' });
                nameControl = fg.get('name');
                ageControl = fg.get('age');
            });

            it('should extend existing async validator with single async validator', () => {
                svc.extendAsyncValidator(nameControl, customAsyncValidator1());

                nameControl.setValue('Tom');

                expect(nameControl.errors.ngFormRules).toBeTruthy();
                expect(nameControl.errors.customAsyncValidator1).toBeTruthy();
            });

            it('should extend existing async validator with multiple async validators', () => {
                svc.extendAsyncValidator(nameControl, [customAsyncValidator1(), customAsyncValidator2()]);

                nameControl.setValue('Tom');

                expect(nameControl.errors.ngFormRules).toBeTruthy();
                expect(nameControl.errors.customAsyncValidator1).toBeTruthy();
                expect(nameControl.errors.customAsyncValidator2).toBeTruthy();
            });

            it('should extend empty async validator with single async validator', () => {
                svc.extendAsyncValidator(ageControl, customAsyncValidator1());

                ageControl.setValue(0);

                expect(ageControl.errors.ngFormRules).toBeFalsy();
                expect(ageControl.errors.customAsyncValidator1).toBeTruthy();
            });

            it('should extend empty async validator with multiple async validators', () => {
                svc.extendAsyncValidator(ageControl, [customAsyncValidator1(), customAsyncValidator2()]);

                ageControl.setValue(0);

                expect(ageControl.errors.ngFormRules).toBeFalsy();
                expect(ageControl.errors.customAsyncValidator1).toBeTruthy();
                expect(ageControl.errors.customAsyncValidator2).toBeTruthy();
            });

            it('should not throw exception when passed falsy async validator', () => {
                svc.extendValidator(nameControl, null);

                nameControl.setValue('Tom');

                expect(nameControl.errors.ngFormRules).toBeTruthy();
            });
        });
    });
});

@Component({
    selector: 'lib-banner',
    template: '<h1>{{title}}</h1>',
    styles: ['h1 { color: green; font-size: 350%}']
  })
  export class BannerComponent {
    title = 'Test Tour of Heroes';
  }