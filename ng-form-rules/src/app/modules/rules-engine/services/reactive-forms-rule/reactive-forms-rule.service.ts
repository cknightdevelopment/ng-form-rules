import { Injectable } from "@angular/core";
import { FormGroup, AbstractControl, ValidatorFn, FormBuilder, FormControl, FormArray, ValidationErrors } from '@angular/forms';
import { RulesEngineService } from "../rules-engine/rules-engine.service";
import { Property } from "../../../form-rules/models/property";
import { AbstractModelSettings } from "../../../form-rules/models/abstract-model-settings";
import { ArrayItemProperty } from "../../../form-rules/models/array-item-property";
import { PropertyBase } from "../../../form-rules/models/property-base";
import { FormatWidth } from "@angular/common";
import { TraceService } from "../../../utils/trace/trace.service";

/**
 * Builds reactive forms using configured model settings
 */
@Injectable()
export class ReactiveFormsRuleService {
    constructor(
        private rulesEngineSvc: RulesEngineService,
        private formBuilder: FormBuilder,
        private traceSvc: TraceService
    ) {
    }

    /**
     * Creates a form group using an instance of model settings
     * @param modelSettingName Name of the model setting to use
     * @param initialValue Initial data to set the form values to
     * @returns Form group created according to defined model settings
     */
    createFormGroup(
        modelSettingName: string,
        initialValue?: any
    ): FormGroup {
        const settings = this.rulesEngineSvc.getModelSettings(modelSettingName);
        if (!settings) throw new Error(`No model setting found with the name "${modelSettingName}"`);

        const formGroup = this.buildGroup(settings.properties, initialValue);

        this.setupSubscriptions(formGroup, settings.properties);

        if (initialValue) formGroup.patchValue(initialValue);

        return formGroup;
    }

    private setupSubscriptions<T>(control: AbstractControl, properties: PropertyBase<T>[], arrayIndex?: number) {
        properties.forEach(p => {
            const propertyControl = this.setupValueChangeSubscriptions(control, p, arrayIndex);

            if (p.properties) {
                this.setupSubscriptions(propertyControl, p.properties);
            }

            if (p.arrayItemProperty) {
                // if there is an arrayItemProperty we know that we are working with a FormArray control
                const formArrayControl = (propertyControl as FormArray);
                for (let i = 0; i < formArrayControl.length; i++) {
                    this.setupSubscriptions(formArrayControl, [p.arrayItemProperty], i);
                }
            }
        });
    }

    private setupValueChangeSubscriptions<T>(control: AbstractControl, property: PropertyBase<T>, arrayIndex?: number) {
        const dependencyPropNames = this.rulesEngineSvc.getDependencyProperties(property.valid);
        const propertyControl = PropertyBase.isArrayItemProperty(property)
            ? (control as FormArray).at(arrayIndex)
            : control.get((property as Property<T>).name);

        if (!propertyControl) return null;

        dependencyPropNames.forEach(d => {
            const dependencyControl = this.findControlRelatively(control, d);

            if (!dependencyControl) return;

            dependencyControl.valueChanges.subscribe(value => {
                propertyControl.updateValueAndValidity({ onlySelf: false, emitEvent: false });
            });
        });

        return propertyControl;
    }

    private buildAbstractControl<T>(property: PropertyBase<T>, initialValue?: any): AbstractControl {
        let control: AbstractControl;

        if (property.arrayItemProperty) control = this.buildArray(property.arrayItemProperty, initialValue);
        else if (property.properties) control = this.buildGroup(property.properties, initialValue);
        else control = this.buildControl(property, initialValue);

        control.setValidators(this.buildValidatorFunction(property));

        return control;
    }

    private buildControl<T>(property: PropertyBase<T>, initialValue?: any): FormControl {
        return this.formBuilder.control(initialValue || null);
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

    private buildArray<T>(property: ArrayItemProperty<T>, initialValue?: any[]): FormArray {
        initialValue = Array.isArray(initialValue) ? initialValue : [null];

        return this.formBuilder.array(initialValue.map(v => this.buildAbstractControl(property, v)));
    }

    private buildValidatorFunction<T>(property: Property<T> | ArrayItemProperty<T>): ValidatorFn {
        return (control: AbstractControl): ValidationErrors => {
            const rootValue = (control.root as FormGroup).getRawValue();

            // use the control value if an array item, otherwise use the parent control
            const controlContextValue = !(property as Property<T>).name ? control.value : control.parent.getRawValue();

            const testResults = this.rulesEngineSvc.runTests(controlContextValue, property.valid, { rootData: rootValue });

            // if valid, Angular reactive forms wants us to return null, otherwise return an object with the validation info
            return testResults.passed
                ? null
                : { ngFormRules: testResults };
        };
    }

    private findControlRelatively(control: AbstractControl, path: string) {
        const relativePaths = this.buildControlRelativePathArray(path);

        if (!relativePaths.length) return null;

        let result: AbstractControl;
        relativePaths.forEach(pathSegment => {
            result = this.getControlByPathSegment(result || control, pathSegment);
            if (!result) return;
        });

        return result;
    }

    private buildControlRelativePathArray(relativePath: string): string[] {
        const result: string[] = [];

        // takes care of './'. '../', and '/'
        const slashSeparated = relativePath.split("/");

        slashSeparated.forEach(slashItem => {
            const dotSeparated = slashItem.split(".")
                .filter(dotItem => !!dotItem);

            if (dotSeparated.length)
                result.push(...dotSeparated);
            else
                result.push(slashItem);
        });

        return result;
    }

    private getControlByPathSegment(control: AbstractControl, pathSegment: string): AbstractControl {
        switch (pathSegment) {
            case "":
                return control.root;
            case "..":
                return control.parent;
            case ".":
                return control;
            default:
                return control.get(pathSegment);
        }
    }
}
