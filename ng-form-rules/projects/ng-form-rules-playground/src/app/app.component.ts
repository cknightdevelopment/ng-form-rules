import { Component, OnInit } from '@angular/core';
import { ReactiveFormsRuleService, AdhocModelSettings, AbstractModelSettings, ModelSettingsBuilder } from 'ng-form-rules';
import { FormGroup, FormArray } from '@angular/forms';
import { of } from 'rxjs';

interface Person {
    name: string;
    age: number;
}

@Component({
    selector: 'playground-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    settings: AbstractModelSettings<Person>;
    form: FormGroup;

    constructor(private svc: ReactiveFormsRuleService) {
    }

    ngOnInit(): void {
        this.settings = AdhocModelSettings.create<Person>(builder => {
            return [
                builder.property('name', prop => {
                    prop.edit.push(builder.editTest(
                        builder.ruleAsync(person => of(person.age == 1), {
                            dependencyProperties: ['age']
                        })
                    ));
                }),
                builder.property('age')
            ];
        });

        this.form = this.svc.createFormGroup(this.settings);
    }
}