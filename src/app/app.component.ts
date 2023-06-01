import { Component, OnInit } from '@angular/core';
import { ReactiveFormsRuleService, AdhocModelSettings, AbstractModelSettings } from 'ng-form-rules';
import { FormGroup } from '@angular/forms';

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
