import { Injectable } from "@angular/core";
import { FormGroup, AbstractControl, ValidatorFn, FormBuilder, FormControl, FormArray, ValidationErrors } from '@angular/forms';
import { RulesEngineService } from "../rules-engine/rules-engine.service";
import { Property } from "../../../form-rules/models/property";
import { AbstractModelSettings } from "../../../form-rules/models/abstract-model-settings";
import { ArrayItemProperty } from "../../../form-rules/models/array-item-property";
import { PropertyBase } from "../../../form-rules/models/property-base";

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

        return this.buildGroup(settings.properties);
    }

    private buildAbstractControl<T>(property: PropertyBase<T>): AbstractControl {
        if (property.arrayItemProperty) return this.buildArray(property.arrayItemProperty);
        else if (property.properties) return this.buildGroup(property.properties);
        else return this.buildControl(property);
    }

    private buildControl<T>(property: PropertyBase<T>): FormControl {
        return this.formBuilder.control(null);
    }

    private buildGroup<T>(properties: Property<T>[]): FormGroup {
        const formGroup = this.formBuilder.group({});
        properties.forEach(p => {
            const ctrl = this.buildAbstractControl(p);
            formGroup.addControl(p.name, ctrl);
        });

        return formGroup;
    }

    private buildArray<T>(property: ArrayItemProperty<T>): FormArray {
        return this.formBuilder.array([
            this.buildAbstractControl(property)
        ]);
    }

    private setValidation() {

    }
}
