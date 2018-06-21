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

const registeredSettingsKey = 'registeredSettings';

class RegisteredSettings extends AbstractModelSettings<Person> {
    protected buildProperties(): Property<Person>[] {
        return [
            this.builder.property('name', p => {
                p.valid.push(
                    this.builder.validTest('Name is required',
                        this.builder.rule(x => !!x.name)
                    ));
            })
        ];
    }
}

describe('ReactiveFormsRuleService', () => {
    let svc: ReactiveFormsRuleService;

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
                    ]
                },
                { provide: TRACE_SETTINGS_TOKEN, useValue: true }
            ]
        });

        svc = TestBed.get(ReactiveFormsRuleService);
    });

    it('should be created', () => {
        expect(svc).toBeTruthy();
    });

    describe('create form group', () => {
        describe('registered model setting', () => {
            it('should create form group according to model settings', () => {
                const fg = svc.createFormGroup(registeredSettingsKey);
                const value = fg.getRawValue();
                expect(value).toEqual({ name: null });
            });

            it('should throw an error provided non-configured model settings name', () => {
                expect(() => svc.createFormGroup('BAD NAME')).toThrowError(`No model setting found with the name "BAD NAME"`);
            });

            it('should create form group with initial values', () => {
                const fg = svc.createFormGroup(registeredSettingsKey, { name: 'Chris' });
                const value = fg.getRawValue();
                expect(value).toEqual({ name: 'Chris' });
            });

            it('should create form group as valid when given valid values', () => {
                const fg = svc.createFormGroup(registeredSettingsKey, {name: 'Chris'});
                expect(fg.valid).toBeTruthy();
            });

            it('should create form group as invalid when given invalid values', () => {
                const fg = svc.createFormGroup(registeredSettingsKey, {name: ''});
                expect(fg.valid).toBeFalsy();
            });
        });

        describe('adhoc model setting', () => {
            const settings = AdhocModelSettings.create<Person>(builder => {
                return [
                    builder.property('name', p => {
                        p.valid.push(builder.validTest('Name is required', builder.rule(x => !!x.name)));
                    })
                ];
            });

            it('should create form group according to model settings', () => {
                const fg = svc.createFormGroup(settings);
                const value = fg.getRawValue();
                expect(value).toEqual({ name: null } as Person);
            });

            it('should throw an error provided falsey model settings', () => {
                expect(() => svc.createFormGroup(null)).toThrowError(`Adhoc model setting provided is invalid`);
            });

            it('should create form group with initial values', () => {
                const fg = svc.createFormGroup(settings, { name: 'Chris' });
                const value = fg.getRawValue();
                expect(value).toEqual({ name: 'Chris' });
            });

            it('should create form group as valid when given valid values', () => {
                const fg = svc.createFormGroup(settings, { name: 'Chris' });
                expect(fg.valid).toBeTruthy();
            });

            it('should create form group as invalid when given invalid values', () => {
                const fg = svc.createFormGroup(settings, {name: ''});
                expect(fg.valid).toBeFalsy();
            });
        });
    });

    describe('valid', () => {
        const settings = AdhocModelSettings.create<Person>(builder => {
            return [
                builder.property('age'),
                builder.property('name', p => {
                    p.valid.push(builder.validTest<Person>('Age dependency cause',
                        builder.rule(x => !x.age, { dependencyProperties: ['age'] })));
                    p.valid.push(builder.validTest<Person>('Car make dependency cause',
                        builder.rule(x => !x.car.make, { dependencyProperties: ['./car.make'] })));
                    p.valid.push(builder.validTest<Person>('Nicknames 0 dependency cause',
                        builder.rule(x => !x.nicknames[0], { dependencyProperties: ['nicknames.0'] })));
                }),
                builder.property('car', p => {
                    p.properties = [
                        builder.property<Car>('make'),
                        builder.property<Car>('year', p2 => {
                            p2.valid.push(builder.validTest('Age dependency cause',
                                builder.rule((x, root: Person) => !root.age, { dependencyProperties: ['../age'] })));
                        })
                    ];
                }),
                builder.property('nicknames', p => {
                    p.arrayItemProperty = builder.arrayItemProperty(aip => {
                        aip.valid.push(builder.validTest<Person>('Age dependency cause',
                            builder.rule((x, root: Person) => !root.age, { dependencyProperties: ['../age'] })));
                    });
                })
            ];
        });

        describe('dependency property reactions', () => {
            it('should react to same level property change', () => {
                const fg = svc.createFormGroup(settings);
                const nameControl = fg.get('name');

                expect(nameControl.valid).toBeTruthy();
                fg.patchValue({ age: 1 });
                expect(nameControl.valid).toBeFalsy();
                expect(nameControl.errors.ngFormRules).toBeTruthy();
                expect(nameControl.errors.ngFormRules.message).toEqual('Age dependency cause');
            });

            it('should react to parent property change (non-array item)', () => {
                const fg = svc.createFormGroup(settings);
                const yearControl = fg.get('car.year');

                expect(yearControl.valid).toBeTruthy();
                fg.patchValue({ age: 1 });
                expect(yearControl.valid).toBeFalsy();
                expect(yearControl.errors.ngFormRules).toBeTruthy();
                expect(yearControl.errors.ngFormRules.message).toEqual('Age dependency cause');
            });

            it('should react to parent property change (array item)', () => {
                const fg = svc.createFormGroup(settings);
                const firstNicknameControl = fg.get('nicknames.0');

                expect(firstNicknameControl.valid).toBeTruthy();
                fg.patchValue({ age: 1 });
                expect(firstNicknameControl.valid).toBeFalsy();
                expect(firstNicknameControl.errors.ngFormRules).toBeTruthy();
                expect(firstNicknameControl.errors.ngFormRules.message).toEqual('Age dependency cause');
            });

            it('should react to child property change', () => {
                const fg = svc.createFormGroup(settings);
                const nameControl = fg.get('name');

                expect(nameControl.valid).toBeTruthy();
                fg.patchValue({ car: { make: "Ford" } });
                expect(nameControl.valid).toBeFalsy();
                expect(nameControl.errors.ngFormRules).toBeTruthy();
                expect(nameControl.errors.ngFormRules.message).toEqual('Car make dependency cause');
            });

            it('should react to array item change', () => {
                const fg = svc.createFormGroup(settings);
                const nameControl = fg.get('name');

                expect(nameControl.valid).toBeTruthy();
                fg.patchValue({ nicknames: ["Value"] });
                expect(nameControl.valid).toBeFalsy();
                expect(nameControl.errors.ngFormRules).toBeTruthy();
                expect(nameControl.errors.ngFormRules.message).toEqual('Nicknames 0 dependency cause');
            });
        });
    });

    describe('edit', () => {
        describe('dependency property reactions', () => {
            const settings = AdhocModelSettings.create<Person>(builder => {
                return [
                    builder.property('age'),
                    builder.property('name', p => {
                        p.edit.push(builder.editTest<Person>(
                            builder.rule(x => !x.age, { dependencyProperties: ['age'] })));
                        p.edit.push(builder.editTest<Person>(
                            builder.rule(x => !x.car.make, { dependencyProperties: ['./car.make'] })));
                        p.edit.push(builder.editTest<Person>(
                            builder.rule(x => !x.nicknames[0], { dependencyProperties: ['nicknames.0'] })));
                    }),
                    builder.property('car', p => {
                        p.properties = [
                            builder.property<Car>('make'),
                            builder.property<Car>('year', p2 => {
                                p2.edit.push(builder.editTest(
                                    builder.rule((x, root: Person) => !root.age, { dependencyProperties: ['../age'] })));
                            })
                        ];
                    }),
                    builder.property('nicknames', p => {
                        p.arrayItemProperty = builder.arrayItemProperty(aip => {
                            aip.edit.push(builder.editTest<Person>(
                                builder.rule((x, root: Person) => !root.age, { dependencyProperties: ['../age'] })));
                        });
                    })
                ];
            });

            it('should react to same level property change', () => {
                const fg = svc.createFormGroup(settings);
                const nameControl = fg.get('name');

                expect(nameControl.enabled).toBeTruthy();
                fg.patchValue({ age: 1 });
                expect(nameControl.enabled).toBeFalsy();
            });

            it('should react to parent property change (non-array item)', () => {
                const fg = svc.createFormGroup(settings);
                const yearControl = fg.get('car.year');

                expect(yearControl.enabled).toBeTruthy();
                fg.patchValue({ age: 1 });
                expect(yearControl.enabled).toBeFalsy();
            });

            it('should react to parent property change (array item)', () => {
                const fg = svc.createFormGroup(settings);
                const firstNicknameControl = fg.get('nicknames.0');

                expect(firstNicknameControl.enabled).toBeTruthy();
                fg.patchValue({ age: 1 });
                expect(firstNicknameControl.enabled).toBeFalsy();
            });

            it('should react to child property change', () => {
                const fg = svc.createFormGroup(settings);
                const nameControl = fg.get('name');

                expect(nameControl.enabled).toBeTruthy();
                fg.patchValue({ car: { make: "Ford" } });
                expect(nameControl.enabled).toBeFalsy();
            });

            it('should react to array item change', () => {
                const fg = svc.createFormGroup(settings);
                const nameControl = fg.get('name');

                expect(nameControl.enabled).toBeTruthy();
                fg.patchValue({ nicknames: ["Something else"] });
                expect(nameControl.enabled).toBeFalsy();
            });

            it('should re-enabled a disabled control when tests pass', () => {
                const fg = svc.createFormGroup(settings, {age: 1});
                const nameControl = fg.get('name');

                expect(nameControl.enabled).toBeFalsy();
                fg.patchValue({age: null});
                expect(nameControl.enabled).toBeTruthy();
            });
        });
    });

    describe('addArrayItemPropertyControl', () => {
        const settings = AdhocModelSettings.create<Person>(builder => {
            return [
                builder.property('nicknames', p => {
                    p.arrayItemProperty = builder.arrayItemProperty();
                }),
                builder.property('name', p => {
                    p.valid.push(builder.validTest<Person>('',
                        builder.rule(x => x.nicknames[0] !== 'Invalid nickname', { dependencyProperties: ['nicknames.0'] })));
                })
            ];
        });

        let fg: FormGroup;
        let nicknamesFormArray: FormArray;
        let nicknameArrayItemProperty: ArrayItemProperty<string>;
        const newNicknameValue = 'New Nickname';

        beforeEach(() => {
            fg = svc.createFormGroup(settings, {nicknames: ['a', 'b']});
            nicknamesFormArray = fg.get('nicknames') as FormArray;
            nicknameArrayItemProperty = settings.properties
                .find(p => p.name == "nicknames")
                .arrayItemProperty;
        });

        it('should push null to the end', () => {
            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray);
            expect(nicknamesFormArray.length).toEqual(3);
            expect(nicknamesFormArray.value).toEqual(['a', 'b', null]);
        });

        it('should push initial value to the end', () => {
            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray, newNicknameValue);
            expect(nicknamesFormArray.length).toEqual(3);
            expect(nicknamesFormArray.value).toEqual(['a', 'b', newNicknameValue]);
        });

        it('should push to array index item one', () => {
            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray, newNicknameValue, 1);
            expect(nicknamesFormArray.length).toEqual(3);
            expect(nicknamesFormArray.value).toEqual(['a', newNicknameValue, 'b']);
        });

        it('should push to end of array when given positive out of bound array index', () => {
            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray, newNicknameValue, 99);
            expect(nicknamesFormArray.length).toEqual(3);
            expect(nicknamesFormArray.value).toEqual(['a', 'b', newNicknameValue]);
        });

        it('should push to end of array when given negative out of bound array index', () => {
            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray, newNicknameValue, -99);
            expect(nicknamesFormArray.length).toEqual(3);
            expect(nicknamesFormArray.value).toEqual(['a', 'b', newNicknameValue]);
        });

        it('should unsubscribe and re-subscribe dependency properties', () => {
            const nameControl = fg.get('name');
            expect(nameControl.valid).toBeTruthy();

            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray, "Invalid nickname", 0);

            expect(nameControl.valid).toBeFalsy();
            expect(nameControl.errors).toBeTruthy();
        });
    });

    describe('extend', () => {
        describe('sync', () => {
            const settings = AdhocModelSettings.create<Person>(builder => {
                return [
                    builder.property('name', p => {
                        p.valid.push(builder.validTest<Person>('',
                            builder.rule(x => !!x.name && x.name === "Chris")));
                    }),
                    builder.property('age')
                ];
            });
            let fg: FormGroup;
            let nameControl: AbstractControl;
            let ageControl: AbstractControl;

            beforeEach(() => {
                fg = svc.createFormGroup(settings, {name: 'Chris'});
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
                svc.extendValidator(nameControl, [Validators.maxLength(1), Validators.minLength(100)]);

                nameControl.setValue('Kyle');

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
                svc.extendValidator(ageControl, [Validators.max(1), Validators.min(100)]);

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
            const settings = AdhocModelSettings.create<Person>(builder => {
                return [
                    builder.property('name', p => {
                        p.valid.push(builder.validTest<Person>('',
                            builder.ruleAsync(x => of(!x.name))
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
                fg = svc.createFormGroup(settings);
                nameControl = fg.get('name');
                ageControl = fg.get('age');
            });

            it('should extend existing async validator with single async validator', () => {
                svc.extendAsyncValidator(nameControl, customAsyncValidator1());

                nameControl.setValue('Whatever');

                expect(nameControl.errors.ngFormRules).toBeTruthy();
                expect(nameControl.errors.customAsyncValidator1).toBeTruthy();
            });

            it('should extend existing async validator with multiple async validators', () => {
                svc.extendAsyncValidator(nameControl, [customAsyncValidator1(), customAsyncValidator2()]);

                nameControl.setValue('Whatever');

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