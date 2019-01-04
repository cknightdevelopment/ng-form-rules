import { Component, OnInit } from '@angular/core';
import { ReactiveFormsRuleService, AdhocModelSettings, AbstractModelSettings, ModelSettingsBuilder } from 'ng-form-rules';
import { FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { of, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'playground-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    settings: AbstractModelSettings<any>;
    form: FormGroup;

    constructor(private svc: ReactiveFormsRuleService) {
    }

    ngOnInit(): void {
        this.settings = AdhocModelSettings.create<any>(builder => {
            return [
                builder.property('name', prop => {
                    prop.updateOn = 'submit';
                    prop.valid = [
                        builder.validNamedTest(
                            'req',
                            'Required',
                            builder.rule(x => !!x.name)
                        )
                    ];
                }),
            ];
        });

        this.form = this.svc.createFormGroup(this.settings, { name: 'cknightdevelopment' });
    }

    submit() {
    }
}