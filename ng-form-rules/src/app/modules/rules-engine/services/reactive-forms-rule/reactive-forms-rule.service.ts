import { Injectable } from "@angular/core";
import { FormGroup, AbstractControl, ValidatorFn, FormBuilder, FormControl, FormArray, ValidationErrors } from '@angular/forms';
import { RulesEngineService } from "../rules-engine/rules-engine.service";
import { Property } from "../../../form-rules/models/property";
import { AbstractModelSettings } from "../../../form-rules/models/abstract-model-settings";
import { ArrayItemProperty } from "../../../form-rules/models/array-item-property";
import { PropertyBase } from "../../../form-rules/models/property-base";
import { FormatWidth } from "@angular/common";

@Injectable()
export class ReactiveFormsRuleService {
    constructor(
        private rulesEngineSvc: RulesEngineService,
        private formBuilder: FormBuilder
    ) {
    }

    /**
     * Creates a form group using an instance of model settings
     * @param modelSettingName Name of the model setting to use
     * @param initialData Initial data to set the form values to
     * @returns Form group created according to defined model settings
     */
    createFormGroup(
        modelSettingName: string,
        initialData?: any
    ): FormGroup {
        const settings = this.rulesEngineSvc.getModelSettings(modelSettingName);
        if (!settings) throw new Error(`No model setting found with the name "${modelSettingName}"`);

        const formGroup = this.buildGroup(settings.properties, initialData);
        if (initialData) {
            formGroup.patchValue(initialData);
        }
        return formGroup;
    }

    private buildAbstractControl<T>(property: PropertyBase<T>, value?: any): AbstractControl {
        let control: AbstractControl;

        if (property.arrayItemProperty) control = this.buildArray(property.arrayItemProperty, value);
        else if (property.properties) control = this.buildGroup(property.properties, value);
        else control = this.buildControl(property, value);

        control.setValidators(this.buildValidatorFunction(property));

        return control;
    }

    private buildControl<T>(property: PropertyBase<T>, value?: any): FormControl {
        return this.formBuilder.control(null);
    }

    private buildGroup<T>(properties: Property<T>[], value?: any): FormGroup {
        const formGroup = this.formBuilder.group({});

        properties.forEach(p => {
            const propertyValue = value ? value[p.name] : null;
            const ctrl = this.buildAbstractControl(p, propertyValue);
            formGroup.addControl(p.name, ctrl);
        });

        return formGroup;
    }

    private buildArray<T>(property: ArrayItemProperty<T>, value?: any[]): FormArray {
        value = Array.isArray(value) ? value : [null];

        return this.formBuilder.array(value.map(v => this.buildAbstractControl(property, v)));
    }

    private buildValidatorFunction<T>(property: PropertyBase<T>): ValidatorFn {
        return (control: AbstractControl): ValidationErrors => {
            const rootValue = (control.root as FormGroup).getRawValue();
            const controlContextValue = !property["name"] ? control.value : control.parent.getRawValue();

            const testResults = this.rulesEngineSvc.runTests(controlContextValue, property.valid);

            // if valid, Angular reactive forms wants us to return null, otherwise return an object with the validation info
            return testResults.passed
                ? null
                : {
                    ngFormRules: {
                        allMessages: testResults.messages,
                        message: testResults.messages[0]
                    }
                };
        };
    }
}
