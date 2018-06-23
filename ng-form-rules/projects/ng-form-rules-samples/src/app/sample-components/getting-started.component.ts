import { Component, OnInit, Input } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { ReactiveFormsRuleService, AbstractModelSettings, Property } from 'ng-form-rules';

@Component({
    selector: 'samples-getting-started',
    templateUrl: 'getting-started.component.html'
})
export class GettingStartedComponent implements OnInit {
    form: FormGroup;

    constructor(private svc: ReactiveFormsRuleService) {
    }

    ngOnInit(): void {
        this.form = this.svc.createFormGroup('getting-started');
    }
}

export class GettingStarted {
    fullName: string;
}

export class GettingStartedModelSettings extends AbstractModelSettings<GettingStarted> {
    buildProperties(): Property<GettingStarted>[] {
        return [
            // add a 'fullName' property
            this.builder.property('fullName', prop => {
                // add validation to make full name required
                prop.valid.push(
                    this.builder.validTest(
                        'Full name is required',
                        this.builder.rule(person => !!person.fullName)
                    ));
            }),
        ];
    }
}