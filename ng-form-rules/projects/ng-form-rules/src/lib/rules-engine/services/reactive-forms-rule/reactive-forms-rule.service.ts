// tslint:disable:max-line-length
import { Injectable } from "@angular/core";
import { FormGroup, AbstractControl, ValidatorFn, FormBuilder, FormControl, FormArray, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { RulesEngineService } from "../rules-engine/rules-engine.service";
import { Property } from "../../../form-rules/models/property";
import { AbstractModelSettings } from "../../../form-rules/models/abstract-model-settings";
import { ArrayItemProperty } from "../../../form-rules/models/array-item-property";
import { PropertyBase } from "../../../form-rules/models/property-base";
import { FormatWidth } from "@angular/common";
import { TraceService } from "../../../utils/trace/trace.service";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { TestResultsBase } from "../../../form-rules/models/test-results-base";
import { ReactiveFormsValidationErrors } from "../../../form-rules/models/reactive-forms-validation-errors";
import { ReactiveFormsFailedValdation } from "../../../form-rules/models/reactive-forms-failed-validation";
import { ReactiveFormsValidationErrorsData } from "../../../form-rules/models/reactive-forms-validation-errors-data";
import { ControlState } from "../../../form-rules/models/control-state";
import { CommonService } from "../../../utils/common/common.service";
// tslint:enable:max-line-length

/**
 * Builds reactive forms using configured model settings
 */
@Injectable()
export class ReactiveFormsRuleService {
    constructor(
        private rulesEngineSvc: RulesEngineService,
        private formBuilder: FormBuilder,
        private traceSvc: TraceService,
        private commonSvc: CommonService
    ) {
    }

    addArrayItemPropertyControl<T>(
        property: ArrayItemProperty<T>,
        parentFormArray: FormArray,
        initialValue?: any,
        index?: number
    ): void {
        const control = this.buildAbstractControl(property, initialValue);
        const willBeLastItem = !this.commonSvc.isZeroOrGreater(index) || index >= parentFormArray.length;

        if (willBeLastItem)
            parentFormArray.push(control);
        else
            parentFormArray.insert(index, control);

        const postAddIndex = willBeLastItem ? parentFormArray.length - 1 : index;

        this.setupSubscriptions(parentFormArray, [property], postAddIndex);

        if (initialValue)
            parentFormArray
                .at(postAddIndex)
                .patchValue(initialValue);
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

    private buildAbstractControl<T>(property: PropertyBase<T>, initialValue?: any): AbstractControl {
        let control: AbstractControl;

        if (property.arrayItemProperty) control = this.buildArray(property.arrayItemProperty, initialValue);
        else if (property.properties) control = this.buildGroup(property.properties, initialValue);
        else control = this.buildControl(property, initialValue);

        control.setValidators(this.buildValidatorFunction(property));
        control.setAsyncValidators(this.buildAsyncValidatorFunction(property));

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
            const controlContextValues = this.getControlContextValues(control, property);

            const testResults = this.rulesEngineSvc
                .runTests(controlContextValues.relative, property.valid, {
                    rootData: controlContextValues.root,
                    controlState: ControlState.create(control)
                });

            return this.mapToReactiveFormsValidationErrors(testResults);
        };
    }

    private buildAsyncValidatorFunction<T>(property: Property<T> | ArrayItemProperty<T>): AsyncValidatorFn {
        return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
            const controlContextValues = this.getControlContextValues(control, property);

            return this.rulesEngineSvc.runTestsAsync(controlContextValues.relative, property.valid, {
                rootData: controlContextValues.root,
                controlState: ControlState.create(control)
            }).pipe(
                map(this.mapToReactiveFormsValidationErrors)
            );
        };
    }

    private setupSubscriptions<T>(parentControl: AbstractControl, properties: PropertyBase<T>[], arrayIndex?: number): void {
        properties.forEach(property => {
            const propertyControl = this.setupValueChangeSubscriptions(parentControl, property, arrayIndex);

            if (property.properties) {
                this.setupSubscriptions(propertyControl, property.properties);
            }

            if (property.arrayItemProperty) {
                // if there is an arrayItemProperty we know that we are working with a FormArray control
                const formArrayControl = (propertyControl as FormArray);
                for (let i = 0; i < formArrayControl.length; i++) {
                    this.setupSubscriptions(formArrayControl, [property.arrayItemProperty], i);
                }
            }
        });
    }

    private setupValueChangeSubscriptions<T>(control: AbstractControl, property: PropertyBase<T>, arrayIndex?: number): AbstractControl {
        const propertyControl = PropertyBase.isArrayItemProperty(property)
            ? (control as FormArray).at(arrayIndex)
            : control.get((property as Property<T>).name);

        if (!propertyControl) return null;

        this.setupEditabilitySubscriptions(propertyControl, control, property);
        this.setupValidationDependencySubscriptions(propertyControl, control, property);

        return propertyControl;
    }

    private setupValidationDependencySubscriptions<T>(
        propertyControl: AbstractControl, parentControl: AbstractControl, property: PropertyBase<T>
    ): void {
        const dependencyPropNames = this.rulesEngineSvc.getDependencyProperties(property.valid);

        dependencyPropNames.forEach(d => {
            const dependencyControl = this.findControlRelatively(parentControl, d);

            if (!dependencyControl) return;

            dependencyControl.valueChanges.subscribe(value => {
                propertyControl.updateValueAndValidity({ onlySelf: false, emitEvent: false });
            });
        });
    }

    private setupEditabilitySubscriptions<T>(
        propertyControl: AbstractControl, parentControl: AbstractControl, property: PropertyBase<T>
    ): void {
        // setup control to perform edit tests on value change
        propertyControl.valueChanges.subscribe(value => {
            this.persistEditTests(propertyControl, property);
        });

        const dependencyPropNames = this.rulesEngineSvc.getDependencyProperties(property.edit);

        dependencyPropNames.forEach(dpn => {
            const dependencyControl = this.findControlRelatively(parentControl, dpn);

            if (!dependencyControl) return;

            // setup control to perform edit tests when dependency property changes
            dependencyControl.valueChanges.subscribe(value => {
                this.persistEditTests(propertyControl, property);
            });
        });
    }

    private persistEditTests<T>(propertyControl: AbstractControl, property: PropertyBase<T>): void {
        const controlContextValues = this.getControlContextValues(propertyControl, property);

        const testResults = this.rulesEngineSvc
            .runTests(controlContextValues.relative, property.edit, {
                rootData: controlContextValues.root,
                controlState: ControlState.create(propertyControl)
            });

        if (testResults.passed && propertyControl.disabled)
            propertyControl.enable({emitEvent: false});
        else if (!testResults.passed && propertyControl.enabled)
            propertyControl.disable({emitEvent: false});
    }

    private getControlContextValues<T>(control: AbstractControl, property: Property<T> | ArrayItemProperty<T>): ControlContextValues {
        const rootValue = (control.root as FormGroup).getRawValue();

        // use the control value if an array item, otherwise use the parent control
        const relativeValue = PropertyBase.isArrayItemProperty(property)
            ? control.value
            : control.parent.getRawValue();

        return {
            root: rootValue,
            relative: relativeValue
        };
    }

    private mapToReactiveFormsValidationErrors<T>(testResults: TestResultsBase<T>): ReactiveFormsValidationErrors {
        // if passed, Angular reactive forms wants us to return null, otherwise return an object with the validation info
        if (!testResults || testResults.passed) return null;

        return {
            ngFormRules: {
                message: testResults.message,
                failed: testResults.failedResults
                    .map(x => ({ name: x.name, message: x.message } as ReactiveFormsFailedValdation))
            } as ReactiveFormsValidationErrorsData
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

        // takes care of './', '../', and '/'
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

class ControlContextValues {
    root: any;
    relative: any;
}
