import { TestBed, ComponentFixture, fakeAsync, tick, discardPeriodicTasks, async } from "@angular/core/testing";
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
import { ReactiveFormsValidationErrors } from "../../../form-rules/models/reactive-forms-validation-errors";
import { Component } from "@angular/core";
import { FormRulesModule } from "../../../form-rules/form-rules.module";
import { By } from "@angular/platform-browser";

const registeredSettingsKey = 'registeredSettings';

@Component({
    providers: [],
    template: `
        <form [formGroup]="fg">
            <input type="text" id="name" formControlName="name" />
            <input type="text" id="age" formControlName="age" />
        </form>
`
})
class UpdateOnComponent {
    private settings = AdhocModelSettings.create<Person>(builder => {
        return [
            builder.property('name', p => {
                p.updateOn = 'submit';
                p.valid = [
                    builder.validTest('Required', builder.rule(person => !!person.name))
                ];
            }),
            builder.property('age', p => {
                p.updateOn = 'blur';
                p.valid = [
                    builder.validTest('Required', builder.rule(person => !!person.age))
                ];
            }),
        ];
    });

    fg: FormGroup;

    constructor(svc: ReactiveFormsRuleService) {
        this.fg = svc.createFormGroup(this.settings);
    }
}

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
    let updateOnComponent: UpdateOnComponent;
    let updateOnFixture: ComponentFixture<UpdateOnComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
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
                { provide: TRACE_SETTINGS_TOKEN, useValue: false }
            ],
            declarations: [
                UpdateOnComponent
            ]
        }).compileComponents().then(() => {
            updateOnFixture = TestBed.createComponent(UpdateOnComponent);
            updateOnComponent = updateOnFixture.componentInstance;
            svc = TestBed.get(ReactiveFormsRuleService);

            updateOnFixture.detectChanges();
        });
    }));

    it('should be created', () => {
        expect(svc).toBeTruthy();
    });

    describe('get model settings', () => {
        it('should get registered model settings', () => {
            const settings = svc.getModelSettings(registeredSettingsKey);
            expect(settings).toBeTruthy();
        });

        it('should get fresh copy ever time', () => {
            const settings1 = svc.getModelSettings(registeredSettingsKey);
            settings1.properties = [];

            const settings2 = svc.getModelSettings(registeredSettingsKey);
            expect(settings2.properties).not.toEqual(settings1.properties);
        });

        it('should handle getting settings that do not exist', () => {
            const settings = svc.getModelSettings('bad-settings-name');
            expect(settings).toBeNull();
        });

        it('should handle passing falsy settings name', () => {
            const settings = svc.getModelSettings(null);
            expect(settings).toBeNull();
        });
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
                const fg = svc.createFormGroup(registeredSettingsKey, { name: 'Chris' });
                expect(fg.valid).toBeTruthy();
            });

            it('should create form group as invalid when given invalid values', () => {
                const fg = svc.createFormGroup(registeredSettingsKey, { name: '' });
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
                const fg = svc.createFormGroup(settings, { name: '' });
                expect(fg.valid).toBeFalsy();
            });
        });
    });

    describe('reactive forms error output', () => {
        it('should return null when all tests pass', () => {
            const settings = AdhocModelSettings.create<Person>(builder => {
                return [
                    builder.property('name', p => {
                        p.valid.push(builder.validTest<Person>(
                            'Boo',
                            builder.rule(x => true)
                        ));
                    })
                ];
            });

            const fg = svc.createFormGroup(settings);
            expect(fg.get('name').errors).toBeNull();
        });

        it('should return error data for failed tests', () => {
            const settings = AdhocModelSettings.create<Person>(builder => {
                return [
                    builder.property('name', p => {
                        p.valid.push(builder.validNamedTest<Person>(
                            'my-name-test',
                            'Boo1',
                            builder.rule(x => false)
                        ));
                        p.valid.push(builder.validTest<Person>(
                            'Boo2',
                            builder.rule(x => false)
                        ));
                        p.valid.push(builder.validNamedTest<Person>(
                            'my-name-test2',
                            'Boo3',
                            builder.rule(x => false)
                        ));
                        p.valid.push(builder.validTest<Person>(
                            'Boo4',
                            builder.rule(x => false)
                        ));
                        // this test always passes
                        p.valid.push(builder.validTest<Person>(
                            'Boo5',
                            builder.rule(x => true)
                        ));
                    })
                ];
            });

            const fg = svc.createFormGroup(settings);

            expect(fg.get('name').errors).toEqual({
                ngFormRules: {
                    message: 'Boo1',
                    failed: {
                        'my-name-test': {
                            message: 'Boo1'
                        },
                        'validTest0': {
                            message: 'Boo2'
                        },
                        'my-name-test2': {
                            message: 'Boo3'
                        },
                        'validTest1': {
                            message: 'Boo4'
                        }
                    }
                }
            } as ReactiveFormsValidationErrors);
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
                        builder.rule(x => x.nicknames[0] == 'MyNickname', { dependencyProperties: ['nicknames.0'] })));
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

        let fg: FormGroup;

        beforeEach(() => {
            fg = svc.createFormGroup(settings, { nicknames: ['MyNickname'] });
        });

        describe('dependency property reactions', () => {

            it('should react to same level property change', () => {
                const nameControl = fg.get('name');

                expect(nameControl.valid).toBeTruthy();
                fg.patchValue({ age: 1 });

                expect(nameControl.valid).toBeFalsy();
                expect(nameControl.errors.ngFormRules).toBeTruthy();
                expect(nameControl.errors.ngFormRules.message).toEqual('Age dependency cause');
            });

            it('should react to parent property change (non-array item)', () => {
                const yearControl = fg.get('car.year');

                expect(yearControl.valid).toBeTruthy();
                fg.patchValue({ age: 1 });
                expect(yearControl.valid).toBeFalsy();
                expect(yearControl.errors.ngFormRules).toBeTruthy();
                expect(yearControl.errors.ngFormRules.message).toEqual('Age dependency cause');
            });

            it('should react to parent property change (array item)', () => {
                const firstNicknameControl = fg.get('nicknames.0');

                expect(firstNicknameControl.valid).toBeTruthy();
                fg.patchValue({ age: 1 });
                expect(firstNicknameControl.valid).toBeFalsy();
                expect(firstNicknameControl.errors.ngFormRules).toBeTruthy();
                expect(firstNicknameControl.errors.ngFormRules.message).toEqual('Age dependency cause');
            });

            it('should react to child property change', () => {
                const nameControl = fg.get('name');

                expect(nameControl.valid).toBeTruthy();
                fg.patchValue({ car: { make: "Ford" } });
                expect(nameControl.valid).toBeFalsy();
                expect(nameControl.errors.ngFormRules).toBeTruthy();
                expect(nameControl.errors.ngFormRules.message).toEqual('Car make dependency cause');
            });

            it('should react to array item change', () => {
                const nameControl = fg.get('name');

                expect(nameControl.valid).toBeTruthy();
                fg.patchValue({ nicknames: ["BadNickname"] });
                expect(nameControl.valid).toBeFalsy();
                expect(nameControl.errors.ngFormRules).toBeTruthy();
                expect(nameControl.errors.ngFormRules.message).toEqual('Nicknames 0 dependency cause');
            });

            it('should handle bad dependency property values', () => {
                const badDepPropSettings = AdhocModelSettings.create<any>(builder => {
                    return [
                        builder.property('prop', p => {
                            p.valid.push(builder.validTest('',
                                builder.rule(x => true, {
                                    dependencyProperties: [
                                        null,
                                        {} as any,
                                        'badPropertyName',
                                        '../../outOfBounds',
                                        'arrayProp.999'
                                    ]
                                })));
                        }),
                        builder.property('arrayProp', p => {
                            p.arrayItemProperty = builder.arrayItemProperty<string>();
                        }),
                    ];
                });

                const form = svc.createFormGroup(badDepPropSettings);

                expect(() => {
                    form.get('prop').patchValue(123);
                    form.get('arrayProp').patchValue([123]);
                }).not.toThrowError();

                expect(form.valid).toBeTruthy();
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
                            builder.rule(x => x.nicknames[0] == 'MyNickname', { dependencyProperties: ['/nicknames.0'] })));
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

            let fg: FormGroup;

            beforeEach(() => {
                fg = svc.createFormGroup(settings, { nicknames: ['MyNickname'] });
            });

            it('should react to same level property change', () => {
                const nameControl = fg.get('name');

                expect(nameControl.enabled).toBeTruthy();
                fg.patchValue({ age: 1 });
                expect(nameControl.enabled).toBeFalsy();
            });

            it('should react to parent property change (non-array item)', () => {
                const yearControl = fg.get('car.year');

                expect(yearControl.enabled).toBeTruthy();
                fg.patchValue({ age: 1 });
                expect(yearControl.enabled).toBeFalsy();
            });

            it('should react to parent property change (array item)', () => {
                const firstNicknameControl = fg.get('nicknames.0');

                expect(firstNicknameControl.enabled).toBeTruthy();
                fg.patchValue({ age: 1 });
                expect(firstNicknameControl.enabled).toBeFalsy();
            });

            it('should react to child property change', () => {
                const nameControl = fg.get('name');

                expect(nameControl.enabled).toBeTruthy();
                fg.patchValue({ car: { make: "Ford" } });
                expect(nameControl.enabled).toBeFalsy();
            });

            it('should react to array item change', () => {
                const nameControl = fg.get('name');

                expect(nameControl.enabled).toBeTruthy();
                fg.patchValue({ nicknames: ["Something else"] });
                expect(nameControl.enabled).toBeFalsy();
            });

            it('should re-enabled a disabled control when tests pass', () => {
                fg.patchValue({ age: 1 });
                const nameControl = fg.get('name');

                expect(nameControl.enabled).toBeFalsy();
                fg.patchValue({ age: null });
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
                        builder.rule(x => x.nicknames[1] !== 'Invalid nickname', { dependencyProperties: ['nicknames.1'] })));
                })
            ];
        });

        let fg: FormGroup;
        let nicknamesFormArray: FormArray;
        let nicknameArrayItemProperty: ArrayItemProperty<string>;
        const newNicknameValue = 'New Nickname';

        beforeEach(() => {
            fg = svc.createFormGroup(settings, { nicknames: ['a', 'b'] });
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
            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray, newNicknameValue, { index: 1 });
            expect(nicknamesFormArray.length).toEqual(3);
            expect(nicknamesFormArray.value).toEqual(['a', newNicknameValue, 'b']);
        });

        it('should push to end of array when given positive out of bound array index', () => {
            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray, newNicknameValue, { index: 99 });
            expect(nicknamesFormArray.length).toEqual(3);
            expect(nicknamesFormArray.value).toEqual(['a', 'b', newNicknameValue]);
        });

        it('should push to end of array when given negative out of bound array index', () => {
            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray, newNicknameValue, { index: -99 });
            expect(nicknamesFormArray.length).toEqual(3);
            expect(nicknamesFormArray.value).toEqual(['a', 'b', newNicknameValue]);
        });

        it('should unsubscribe and re-subscribe dependency properties', () => {
            const nameControl = fg.get('name');
            expect(nameControl.valid).toBeTruthy();

            // added to first item, which should still be valid
            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray, "Invalid nickname", { index: 0 });
            expect(nameControl.valid).toBeTruthy();

            // added another item to the front of the array, bumping "Invalid nickname" to index 1
            svc.addArrayItemPropertyControl(nicknameArrayItemProperty, nicknamesFormArray, "c", { index: 0 });
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
                fg = svc.createFormGroup(settings, { name: 'Chris' });
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

            const customAsyncValidator1 = () => (c: AbstractControl) => of({ customAsyncValidator1: { passed: false } });
            const customAsyncValidator2 = () => (c: AbstractControl) => of({ customAsyncValidator2: { passed: false } });

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
                svc.extendAsyncValidator(nameControl, null);

                nameControl.setValue('Whatever');

                expect(nameControl.errors.ngFormRules).toBeTruthy();
            });
        });
    });

    describe('value change options', () => {
        describe('debounce time', () => {
            const debounceMilliseconds = 5000;
            let settings: AbstractModelSettings<Person>;
            let spies: {
                depValidFunc: jasmine.Spy,
                depEditFunc: jasmine.Spy,
                selfEditFunc: jasmine.Spy,
                selfAsyncValidFunc: jasmine.Spy
            };
            const container = {
                depValidFunc: (sanityCheck: string) => { },
                depEditFunc: (sanityCheck: string) => { },
                selfEditFunc: (sanityCheck: string) => { },
                selfAsyncValidFunc: (sanityCheck: string) => { },
            };

            beforeEach(() => {
                settings = AdhocModelSettings.create<Person>(b => {
                    return [
                        b.property('name', p => {
                            p.valueChangeOptions.dependencyProperties.valid.debounceMilliseconds = debounceMilliseconds;
                            p.valueChangeOptions.dependencyProperties.edit.debounceMilliseconds = debounceMilliseconds;
                            p.valueChangeOptions.self.edit.debounceMilliseconds = debounceMilliseconds;
                            p.valueChangeOptions.self.asyncValid.debounceMilliseconds = debounceMilliseconds;

                            p.valid.push(b.validTest('',
                                b.rule(x => {
                                    container.depValidFunc('dep valid');
                                    return true;
                                }, { dependencyProperties: ['age'] })));

                            p.edit.push(b.editTest(
                                b.rule(x => {
                                    container.depEditFunc('dep edit');
                                    return true;
                                }, { dependencyProperties: ['age'] })));

                            p.edit.push(b.editTest(
                                b.rule(x => {
                                    container.selfEditFunc('self edit');
                                    return true;
                                })));

                            p.valid.push(b.validTest('',
                                b.ruleAsync(x => {
                                    container.selfAsyncValidFunc('self valid async');
                                    return of(true);
                                })));
                        }),
                        b.property('age')
                    ];
                });

                spies = {
                    depValidFunc: spyOn(container, 'depValidFunc'),
                    depEditFunc: spyOn(container, 'depEditFunc'),
                    selfEditFunc: spyOn(container, 'selfEditFunc'),
                    selfAsyncValidFunc: spyOn(container, 'selfAsyncValidFunc'),
                };
            });

            it('should honor setting for valid dependency changes', fakeAsync(() => {
                const form = svc.createFormGroup(settings);
                tick(debounceMilliseconds);
                discardPeriodicTasks();
                spies.depValidFunc.calls.reset();

                form.get('age').setValue(100);
                expect(spies.depValidFunc).not.toHaveBeenCalled();

                tick(debounceMilliseconds);
                discardPeriodicTasks();

                expect(spies.depValidFunc).toHaveBeenCalledTimes(1);
                expect(spies.depValidFunc).toHaveBeenCalledWith('dep valid');
            }));

            it('should honor setting for edit dependency changes', fakeAsync(() => {
                const form = svc.createFormGroup(settings);
                tick(debounceMilliseconds);
                discardPeriodicTasks();
                spies.depEditFunc.calls.reset();

                form.get('age').setValue(100);
                expect(spies.depEditFunc).not.toHaveBeenCalled();

                tick(debounceMilliseconds);
                discardPeriodicTasks();

                expect(spies.depEditFunc).toHaveBeenCalledTimes(1);
                expect(spies.depEditFunc).toHaveBeenCalledWith('dep edit');
            }));

            it('should honor setting for edit self changes', fakeAsync(() => {
                const form = svc.createFormGroup(settings);
                tick(debounceMilliseconds);
                discardPeriodicTasks();
                spies.selfEditFunc.calls.reset();

                form.get('name').setValue('Chris');
                expect(spies.selfEditFunc).not.toHaveBeenCalled();

                tick(debounceMilliseconds);
                discardPeriodicTasks();

                expect(spies.selfEditFunc).toHaveBeenCalledTimes(1);
                expect(spies.selfEditFunc).toHaveBeenCalledWith('self edit');
            }));

            it('should honor setting for valid async self changes', fakeAsync(() => {
                const form = svc.createFormGroup(settings);
                tick(debounceMilliseconds);
                discardPeriodicTasks();
                spies.selfAsyncValidFunc.calls.reset();

                form.get('name').setValue('Chris');
                expect(spies.selfAsyncValidFunc).not.toHaveBeenCalled();

                tick(debounceMilliseconds);
                discardPeriodicTasks();

                expect(spies.selfAsyncValidFunc).toHaveBeenCalledTimes(1);
                expect(spies.selfAsyncValidFunc).toHaveBeenCalledWith('self valid async');
            }));
        });

        describe('distinct until changed', () => {
            let settings: AbstractModelSettings<Person>;
            let spies: {
                depValidFunc: jasmine.Spy,
                depEditFunc: jasmine.Spy,
                selfEditFunc: jasmine.Spy,
                selfAsyncValidFunc: jasmine.Spy
            };
            const container = {
                depValidFunc: (sanityCheck: string) => { },
                depEditFunc: (sanityCheck: string) => { },
                selfEditFunc: (sanityCheck: string) => { },
                selfAsyncValidFunc: (sanityCheck: string) => { },
            };

            beforeEach(() => {
                settings = AdhocModelSettings.create<Person>(b => {
                    return [
                        b.property('name', p => {
                            p.valueChangeOptions.dependencyProperties.valid.distinctUntilChanged = true;
                            p.valueChangeOptions.dependencyProperties.edit.distinctUntilChanged = true;
                            p.valueChangeOptions.self.edit.distinctUntilChanged = true;
                            p.valueChangeOptions.self.asyncValid.distinctUntilChanged = true;

                            p.valid.push(b.validTest('',
                                b.rule(x => {
                                    container.depValidFunc('dep valid');
                                    return true;
                                }, { dependencyProperties: ['age'] })));

                            p.edit.push(b.editTest(
                                b.rule(x => {
                                    container.depEditFunc('dep edit');
                                    return true;
                                }, { dependencyProperties: ['age'] })));

                            p.edit.push(b.editTest(
                                b.rule(x => {
                                    container.selfEditFunc('self edit');
                                    return true;
                                })));

                            p.valid.push(b.validTest('',
                                b.ruleAsync(x => {
                                    container.selfAsyncValidFunc('self valid async');
                                    return of(true);
                                })));
                        }),
                        b.property('age')
                    ];
                });

                spies = {
                    depValidFunc: spyOn(container, 'depValidFunc'),
                    depEditFunc: spyOn(container, 'depEditFunc'),
                    selfEditFunc: spyOn(container, 'selfEditFunc'),
                    selfAsyncValidFunc: spyOn(container, 'selfAsyncValidFunc'),
                };
            });

            it('should honor setting for valid dependency changes', () => {
                const form = svc.createFormGroup(settings);
                form.get('age').setValue(100);
                expect(spies.depValidFunc).toHaveBeenCalledWith('dep valid');

                spies.depValidFunc.calls.reset();

                form.get('age').setValue(100);
                expect(spies.depValidFunc).not.toHaveBeenCalled();
            });

            it('should honor setting for edit dependency changes', () => {
                const form = svc.createFormGroup(settings);
                form.get('age').setValue(100);
                expect(spies.depEditFunc).toHaveBeenCalledWith('dep edit');

                spies.depEditFunc.calls.reset();

                form.get('age').setValue(100);
                expect(spies.depEditFunc).not.toHaveBeenCalled();
            });

            it('should honor setting for edit self changes', () => {
                const form = svc.createFormGroup(settings);
                form.get('name').setValue('Chris');
                expect(spies.selfEditFunc).toHaveBeenCalledWith('self edit');

                spies.selfEditFunc.calls.reset();

                form.get('name').patchValue('Chris');
                expect(spies.selfEditFunc).not.toHaveBeenCalled();
            });

            it('should honor setting for async valid self changes', () => {
                const form = svc.createFormGroup(settings);
                form.get('name').setValue('Chris');
                expect(spies.selfAsyncValidFunc).toHaveBeenCalledWith('self valid async');

                spies.selfAsyncValidFunc.calls.reset();

                form.get('name').patchValue('Chris');
                expect(spies.selfAsyncValidFunc).not.toHaveBeenCalled();
            });
        });

        describe('misc', () => {
            const debounceMilliseconds = 5000;
            let settings: AbstractModelSettings<Person>;
            let spies: {
                selfAsyncValidFunc: jasmine.Spy
            };
            const container = {
                selfAsyncValidFunc: (sanityCheck: string) => { },
            };

            beforeEach(() => {
                settings = AdhocModelSettings.create<Person>(b => {
                    return [
                        b.property('name', p => {
                            p.valueChangeOptions.self.asyncValid = {
                                debounceMilliseconds: debounceMilliseconds,
                                distinctUntilChanged: true
                            };

                            p.valid.push(b.validTest('',
                                b.ruleAsync(x => {
                                    container.selfAsyncValidFunc('self valid async');
                                    return of(x.name != 'chris');
                                })));
                        }),
                    ];
                });

                spies = {
                    selfAsyncValidFunc: spyOn(container, 'selfAsyncValidFunc'),
                };
            });

            it('should handle debounce and distinct when no "real" value change before debounce timer expires', fakeAsync(() => {
                // set to invalid value and make sure control is invalid
                const form = svc.createFormGroup(settings, { name: 'chris' });
                tick(debounceMilliseconds);
                discardPeriodicTasks();
                expect(form.get('name').valid).toBeFalsy();
                spies.selfAsyncValidFunc.calls.reset();

                // set to valid value and then back to the SAME invalid value as initially set BEFORE debounce timer expires
                form.get('name').setValue('sarah');
                expect(spies.selfAsyncValidFunc).not.toHaveBeenCalled();
                form.get('name').setValue('chris');
                expect(spies.selfAsyncValidFunc).not.toHaveBeenCalled();

                // debounce timer completes
                tick(debounceMilliseconds);
                discardPeriodicTasks();

                // should not have been called, and should still be invalid control
                expect(spies.selfAsyncValidFunc).not.toHaveBeenCalled();
                expect(form.get('name').valid).toBeFalsy();
            }));
        });
    });

    describe('updateOn', () => {
        it('should only update form values on submit when updateOn is submit', () => {
            const nameControl = updateOnComponent.fg.get('name');
            const nameInputNativeElement = updateOnFixture.debugElement.query(By.css('input#name')).nativeElement;
            const testValue = 'some_value';

            // set value on native element and dispatch input event
            nameInputNativeElement.value = testValue;
            nameInputNativeElement.dispatchEvent(new Event('input'));

            updateOnFixture.detectChanges();

            expect(nameInputNativeElement.value).toEqual(testValue);
            expect(nameControl.value).toBeFalsy();

            // now submit the form
            updateOnFixture.debugElement.query(By.css('form')).triggerEventHandler('submit', null);

            expect(nameControl.value).toBeTruthy();
        });

        it('should only update form values on blur when updateOn is blur', () => {
            const ageControl = updateOnComponent.fg.get('age');
            const ageInputNativeElement = updateOnFixture.debugElement.query(By.css('input#age')).nativeElement;
            const testValue = 'test_value';

            // set value on native element and dispatch input event
            ageInputNativeElement.value = testValue;
            ageInputNativeElement.dispatchEvent(new Event('input'));

            updateOnFixture.detectChanges();

            expect(ageInputNativeElement.value).toEqual(testValue);
            expect(ageControl.value).toBeFalsy();

            // now submit the form
            ageInputNativeElement.dispatchEvent(new Event('blur'));

            expect(ageControl.value).toBeTruthy();
        });
    });
});