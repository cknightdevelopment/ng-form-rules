import { Component, OnInit } from '@angular/core';
import { ReactiveFormsRuleService, AdhocModelSettings, AbstractModelSettings, ModelSettingsBuilder } from 'ng-form-rules';
import { FormGroup, FormArray } from '@angular/forms';

interface World {
    people: Person[];
}

interface Person {
    name: string;
}

@Component({
    selector: 'playground-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    settings: AbstractModelSettings<World>;
    form: FormGroup;

    constructor(private svc: ReactiveFormsRuleService) {
    }

    addPerson() {
        const a = this.settings.properties
            .find(x => x.name == 'people')
            .arrayItemProperty;
        const b = this.form.get('people') as FormArray;

        this.svc.addArrayItemPropertyControl(a, b, { name: 'Chris' });
    }

    ngOnInit(): void {
        this.settings = AdhocModelSettings.create<World>(builder => {
            return [
                builder.property('people', prop => {
                    prop.arrayItemProperty = builder.arrayItemProperty(aip => {
                        aip.properties = [
                            builder.property('name')
                        ];
                    });
                })
            ];
        });

        this.form = this.svc.createFormGroup(this.settings);
    }
}