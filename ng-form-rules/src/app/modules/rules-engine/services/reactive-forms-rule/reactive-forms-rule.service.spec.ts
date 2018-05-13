import { TestBed } from "@angular/core/testing";
import { ReactiveFormsRuleService } from "./reactive-forms-rule.service";
import { ReactiveFormsModule } from "@angular/forms";
import { RulesEngineService } from "../rules-engine/rules-engine.service";
import { MODEL_SETTINGS_TOKEN } from "../../../form-rules/injection-tokens/model-settings.token";
import { Person } from "../../../test-utils/models/person";
import { AbstractModelSettings } from "../../../form-rules/models/abstract-model-settings";
import { Property } from "../../../form-rules/models/property";
import { TraceService } from "../../../utils/trace/trace.service";
import { TRACE_SETTINGS_TOKEN } from "../../../form-rules/injection-tokens/trace-settings.token";
import { Car } from "../../../test-utils/models/car";

const validPerson: Person = { name: "Chris", age: 100, car: { year: 2017, make: "Subaru" }, nicknames: ["C-TOWN", "C"] };
const invalidPerson: Person = { name: "Tom", age: -99, nicknames: ["Z-TOWN", "Z"] };

export class PersonModelSettings extends AbstractModelSettings<Person> {
    buildPropertyRules(): Property<Person>[] {
        return [
            this.builder.property<Person>("age"),
            this.builder.property<Person>("nicknames", p => {
                p.arrayItemProperty = this.builder.arrayItemProperty(aip => {
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

describe('ReactiveFormsRuleService', () => {
    let svc: ReactiveFormsRuleService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule
            ],
            providers: [
                ReactiveFormsRuleService,
                RulesEngineService,
                TraceService,
                {
                    provide: MODEL_SETTINGS_TOKEN,
                    useValue: [
                        new PersonModelSettings("a")
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
        it('should create form group according to model settings', () => {
            const fg = svc.createFormGroup('a');
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
            const fg = svc.createFormGroup('a', validPerson);
            const value = fg.getRawValue();
            expect(value).toEqual(validPerson);
        });

        it('should create form group as valid when given valid values', () => {
            const fg = svc.createFormGroup('a', validPerson);
            expect(fg.valid).toBeTruthy();
        });

        it('should create form group as invalid when given invalid values', () => {
            const fg = svc.createFormGroup('a', invalidPerson);
            expect(fg.valid).toBeFalsy();
        });
    });

    describe('dependency property reactions', () => {
        it('should react to same level property change', () => {
            const fg = svc.createFormGroup('a', validPerson);
            expect(fg.valid).toBeTruthy();
            fg.patchValue({age: -30});
            expect(fg.valid).toBeFalsy();
        });

        it('should react to parent property change (validation of non-array item)', () => {
            const fg = svc.createFormGroup('a', validPerson);
            expect(fg.valid).toBeTruthy();
            fg.patchValue({ name: "Cindy" });
            expect(fg.valid).toBeFalsy();
        });

        it('should react to parent property change (validation of array item)', () => {
            const fg = svc.createFormGroup('a', validPerson);
            expect(fg.valid).toBeTruthy();
            fg.patchValue({ age: 101 });
            expect(fg.valid).toBeFalsy();
        });

        it('should react to child property change', () => {
            const fg = svc.createFormGroup('a', validPerson);
            expect(fg.valid).toBeTruthy();
            fg.patchValue({ car: { make: "Ford" } });
            expect(fg.valid).toBeFalsy();
        });

        it('should react to array item change', () => {
            const fg = svc.createFormGroup('a', validPerson);
            expect(fg.valid).toBeTruthy();
            fg.patchValue({ nicknames: ["Something else"] });
            expect(fg.valid).toBeFalsy();
        });
    });
});