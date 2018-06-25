import { Component, OnInit } from '@angular/core';
import { ReactiveFormsRuleService, AdhocModelSettings, AbstractModelSettings, ModelSettingsBuilder } from 'ng-form-rules';
import { FormGroup, FormArray } from '@angular/forms';

interface Math {
    thirdNameLength: number;
    nameToAdd: string;
    people: { name: string }[];
}

@Component({
  selector: 'samples-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    settings: AbstractModelSettings<Math>;
    form: FormGroup;

    constructor(private svc: ReactiveFormsRuleService) {
    }

    ngOnInit(): void {
        this.settings = this.createSettings();
        this.form = this.svc.createFormGroup(this.settings, {
            thirdNameLength: 99,
            people: [
                { name: 'David Putty' },
                { name: 'Kenny Bania' },
                { name: 'Susan Ross' },
            ]
        });
    }

    addPerson(name: string): void {
        const property = this.settings.properties
            .find(prop => prop.name === 'people').arrayItemProperty;
        const peopleFormArray = this.form.get('people') as FormArray;

        this.svc.addArrayItemPropertyControl(property, peopleFormArray, { name: name }, { index: 0 });
    }

    private createSettings(): AbstractModelSettings<Math> {
        return AdhocModelSettings.create<Math>((builder: ModelSettingsBuilder) => {
            return [
                builder.property('thirdNameLength', prop => {
                    prop.valid.push(builder.validTest<any>(
                        `This must equal the length of the 3rd person's name. Serenity now!`,
                        builder.rule(x => {
                           return x.people.length >= 3 && x.people[2].name.length === x.thirdNameLength;
                        }, {
                            dependencyProperties: ['people.2.name']
                        })));
                }),
                builder.property('people', prop => {
                    prop.arrayItemProperty = builder.arrayItemProperty(arrayItemProp => {
                        arrayItemProp.properties = [
                            builder.property('name')
                        ];
                    });
                }),
                builder.property('nameToAdd', prop => {
                    prop.valid.push(builder.validTest(
                        'Enter a name to add.',
                        builder.rule(x => !!x.nameToAdd)
                    ));
                })
            ];
        });
    }
}