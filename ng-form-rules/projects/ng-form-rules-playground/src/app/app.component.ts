import { Component, OnInit } from '@angular/core';
import { ReactiveFormsRuleService, AdhocModelSettings, AbstractModelSettings, ModelSettingsBuilder } from 'ng-form-rules';
import { FormGroup, FormArray } from '@angular/forms';
import { of } from 'rxjs';

interface Person {
    addresses: Address[];
}

interface Address {
    street: string;
    canEdit: boolean;
    addresses: Address[];
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

    add() {
        this.svc.addArrayItemPropertyControl(
            this.settings.properties.find(x => x.name === 'addresses').arrayItemProperty,
            this.form.get('addresses') as FormArray,
            {canEdit: true, street: 'NEW', addresses: [ { canEdit: true, street: 'NEW' }, { canEdit: true, street: 'NEW' } ]} as Address
        );
    }

    ngOnInit(): void {
        this.settings = AdhocModelSettings.create<Person>(builder => {
            return [
                builder.property('addresses', prop => {
                    prop.arrayItemProperty = builder.arrayItemProperty(aip => {
                        aip.properties = [
                            builder.property<Address>('canEdit'),
                            builder.property<Address>('street', streetProp => {
                                streetProp.edit.push(builder.editTest(
                                    builder.rule(x => !!x.canEdit, { dependencyProperties: ['canEdit'] })
                                ));
                            }),
                            builder.property('addresses', addrProp => {
                                addrProp.arrayItemProperty = builder.arrayItemProperty(aip2 => {
                                    aip2.properties = [
                                        builder.property<Address>('canEdit'),
                                        builder.property<Address>('street', streetProp => {
                                            streetProp.edit.push(builder.editTest(
                                                builder.rule(x => !!x.canEdit, { dependencyProperties: ['canEdit'] })
                                            ));
                                        }),
                                    ];
                                });
                            })
                        ];
                    });
                }),
            ];
        });

        this.form = this.svc.createFormGroup(this.settings, {
            addresses: [
                { street: 'abs', canEdit: true, addresses: [
                    { street: 'aaa', canEdit: true },
                    { street: 'bbb', canEdit: true },
                ] },
                { street: 'xyz', canEdit: true, addresses: [
                    { street: 'xxx', canEdit: true },
                    { street: 'yyy', canEdit: true },
                ] },
            ]
        } as Person);
    }
}