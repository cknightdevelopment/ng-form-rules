// tslint:disable:max-line-length
import { Injectable } from "@angular/core";
import { FormGroup, AbstractControl, ValidatorFn, FormBuilder, FormControl, FormArray, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { RulesEngineService } from "../rules-engine/rules-engine.service";
import { Property } from "../../../form-rules/models/property";
import { ArrayItemProperty } from "../../../form-rules/models/array-item-property";
import { PropertyBase } from "../../../form-rules/models/property-base";
import { TraceService } from "../../../utils/trace/trace.service";
import { Observable, BehaviorSubject, of, OperatorFunction, timer, empty, EMPTY } from "rxjs";
import { map, tap, switchMap, take, distinctUntilChanged, debounce } from "rxjs/operators";
import { TestResultsBase } from "../../../form-rules/models/test-results-base";
import { ReactiveFormsValidationErrors } from "../../../form-rules/models/reactive-forms-validation-errors";
import { ReactiveFormsFailedValdation } from "../../../form-rules/models/reactive-forms-failed-validation";
import { ReactiveFormsValidationErrorsData } from "../../../form-rules/models/reactive-forms-validation-errors-data";
import { ControlState } from "../../../form-rules/models/control-state";
import { CommonService } from "../../../utils/common/common.service";
import { AbstractModelSettings } from "../../../form-rules/models/abstract-model-settings";
import { ValueChangeOptions } from "../../../form-rules/models/value-change-options";
import { AddArrayItemPropertyOptions } from "../../../form-rules/models/add-array-item-property-options";
// tslint:enable:max-line-length

/**
 * Builds reactive forms using configured model settings
 */
@Injectable()
export class ReactiveFormsRuleService {
    private static readonly FORM_MODEL_SETTINGS_PROPERTY_NAME = 'ngFormRulesModelSetting';
    private static readonly FORCE_ASYNC_VALID_TEST_RUN_PROPERTY_NAME = 'ngFormRulesForceAsyncValidTestRun';
    private static readonly CONTROL_LAST_ERROR = 'ngFormRulesControlLastError';

    constructor(
        private rulesEngineSvc: RulesEngineService,
        private formBuilder: FormBuilder,
        private traceSvc: TraceService,
        private commonSvc: CommonService
    ) {
    }

    /**
     * Gets model settings with the provided name
     * @param name Name of model setting
     * @returns Model settings with the provided name
     */
    getModelSettings<T>(name: string): AbstractModelSettings<T> {
        return this.rulesEngineSvc.getModelSettings(name);
    }

    /**
     * Creates a form group using an instance of model settings
     * @param modelSettings Name of the model setting or an instance of model settings to use
     * @param initialValue Initial data to set the form values to
     * @returns Form group created according to defined model settings
     */
    createFormGroup<T>(
        modelSettings: string | AbstractModelSettings<T>,
        initialValue?: any
    ): FormGroup {
        let settings: AbstractModelSettings<T>;

        if (typeof modelSettings === "string") {
            settings = this.rulesEngineSvc.getModelSettings(modelSettings as string);
            if (!settings) throw new Error(`No model setting found with the name "${modelSettings}"`);
        } else {
            if (!modelSettings) throw new Error(`Adhoc model setting provided is invalid`);
            settings = modelSettings as AbstractModelSettings<T>;
            this.rulesEngineSvc.initializeModelSetting(settings);
        }

        this.traceSvc.trace(`Creating form group using model settings "${settings.name}"`);
        const formGroup = this.buildGroup(settings.properties, initialValue);

        this.traceSvc.trace(`Setting up dependency subscriptions`);
        this.resetDependencySubscriptions(formGroup, settings.properties);

        this.traceSvc.trace(`Patching form group with initial value`);
        this.triggerValueChange(formGroup);

        this.attachModelSettingsToForm(formGroup, settings);

        return formGroup;
    }

    /**
     * Adds an array item property to an existing form array
     * @param property ArrayItemProperty to for the array item to be added
     * @param parentFormArray The parent FormArray
     * @param initialValue Initial value of the form array item
     * @param options Options for adding new array item property
     */
    addArrayItemPropertyControl<T>(
        property: ArrayItemProperty<T>,
        parentFormArray: FormArray,
        initialValue?: any,
        options?: AddArrayItemPropertyOptions
    ): void {
        const control = this.buildAbstractControl(property, initialValue);
        const willBeLastItem = !options || !this.commonSvc.isZeroOrGreater(options.index) || options.index >= parentFormArray.length;

        if (willBeLastItem)
            parentFormArray.push(control);
        else
            parentFormArray.insert(options.index, control);

        const modelSettings = this.getModelSettingsFromForm(parentFormArray.root as FormGroup);
        this.resetDependencySubscriptions(parentFormArray.root, modelSettings.properties);

        // we need to do this because the item could have been added at any index in the array, and we need
        // trigger a value change to trigger any dependency propertiy valdidations
        this.triggerValueChange(parentFormArray);
    }

    /**
     * Extends validators generated by ng-form-rules with your own validators
     * @param control Control to extends the validators for
     * @param validator Validator to add
     */
    extendValidator(control: AbstractControl, validator: ValidatorFn | ValidatorFn[]): void {
        if (!validator) return;

        const validatorArray = Array.isArray(validator) ? validator : [validator];
        control.setValidators([control.validator, ...validatorArray]
            .filter(validatorFn => !!validatorFn));
    }

    /**
     * Extends async validators generated by ng-form-rules with your own async validators
     * @param control Control to extends the async validators for
     * @param asyncValidator Async validator to add
     */
    extendAsyncValidator(control: AbstractControl, asyncValidator: AsyncValidatorFn | AsyncValidatorFn[]): void {
        if (!asyncValidator) return;

        const asyncValidatorArray = Array.isArray(asyncValidator) ? asyncValidator : [asyncValidator];
        control.setAsyncValidators([control.asyncValidator, ...asyncValidatorArray]
            .filter(asyncValidatorFn => !!asyncValidatorFn));
    }

    private buildAbstractControl<T>(property: PropertyBase<T>, initialValue?: any): AbstractControl {
        let control: AbstractControl;

        if (property.arrayItemProperty) control = this.buildArray(property.arrayItemProperty, initialValue);
        else if (property.properties) control = this.buildGroup(property.properties, initialValue);
        else control = this.buildControl(initialValue);

        // setup validation tests on value change
        control.setValidators(this.buildValidatorFunction(property));
        control.setAsyncValidators(this.buildAsyncValidatorFunction(property));

        // setup edit tests on value change
        control.valueChanges
            .pipe(
                this.applyValueChangeOptions(property.valueChangeOptions.self.edit)
            )
            .subscribe(value => {
                this.persistEditTests(control, property);
            });

        return control;
    }

    private buildControl<T>(initialValue?: any): FormControl {
        return this.formBuilder.control(initialValue || null);
    }

    private buildGroup<T>(properties: Property<T>[], value?: any): FormGroup {
        const formGroup = this.formBuilder.group({});

        (properties || []).forEach(p => {
            const propertyValue = value ? value[p.name] : null;
            const ctrl = this.buildAbstractControl(p, propertyValue);
            formGroup.addControl(p.name, ctrl);
        });

        return formGroup;
    }

    private buildArray<T>(property: ArrayItemProperty<T>, initialValue?: any[]): FormArray {
        initialValue = Array.isArray(initialValue) ? initialValue : [];

        return this.formBuilder.array(initialValue.map(v => this.buildAbstractControl(property, v)));
    }

    private buildValidatorFunction<T>(property: PropertyBase<T>): ValidatorFn {
        const syncGroups = this.rulesEngineSvc.groupTestsBySyncType(property.valid);
        if (!syncGroups.sync.length) return null;

        return (control: AbstractControl): ValidationErrors => {
            const controlContextValues = this.getControlContextValues(control, property);

            const testResults = this.rulesEngineSvc
                .runTests(controlContextValues.relative, syncGroups.sync, {
                    rootData: controlContextValues.root,
                    controlState: ControlState.create(control)
                });

            if (testResults.results.length) {
                this.traceSvc.trace(`Validated property "${property.absolutePath}". ` +
                    this.buildTestResultStatsString(testResults));
            }

            return this.mapToReactiveFormsValidationErrors(testResults);
        };
    }

    private buildAsyncValidatorFunction<T>(property: PropertyBase<T>): AsyncValidatorFn {
        const rawAsyncFunc = this.buildAsyncValidatorFunctionRaw(property);

        if (!rawAsyncFunc) return null;

        const values = new BehaviorSubject<AbstractControl>(null);
        const valid$ = values.pipe(
            this.applyAsyncValidValueChangeOptions(property.valueChangeOptions.self.asyncValid),
            switchMap(x => {
                // pass through means we did not execute the ng-form-rules async tests
                if (x.passthrough) {
                    const currentErrors = x.control.errors || {};
                    const lastNgFormRulesErrors = this.getLastErrorForControl(x.control);

                    // return the last ng-form-rules errors (if any) alongside non ng-form-rules errors.
                    // this handles scenario where debounce and distinct are used and state goes from:
                    //    invalid -> make changes and back them out -> valid
                    return of(Object.assign(currentErrors, { ngFormRules: lastNgFormRulesErrors } as ReactiveFormsValidationErrors));
                } else {
                    return rawAsyncFunc(x.control);
                }
            }),
            take(1)
        );

        return (control: AbstractControl): Promise<ValidationErrors> | Observable<ValidationErrors> => {
            values.next(control);
            return valid$;
        };
    }

    private buildAsyncValidatorFunctionRaw<T>(property: PropertyBase<T>): AsyncValidatorFn {
        const syncGroups = this.rulesEngineSvc.groupTestsBySyncType(property.valid);
        if (!syncGroups.async.length) return null;

        return (control: AbstractControl) => {
            const controlContextValues = this.getControlContextValues(control, property);

            return this.rulesEngineSvc.runTestsAsync(controlContextValues.relative, syncGroups.async, {
                rootData: controlContextValues.root,
                controlState: ControlState.create(control)
            }).pipe(
                tap(testResults => {
                    if (testResults.results.length) {
                        this.traceSvc.trace(`Validated (async) property "${property.absolutePath}". ` +
                            this.buildTestResultStatsString(testResults));
                    }
                }),
                map(this.mapToReactiveFormsValidationErrors),
                tap(x => this.setLastErrorForControl(control, (x || {}).ngFormRules))
            );
        };
    }

    private resetDependencySubscriptions<T>(
        parentControl: AbstractControl,
        properties: PropertyBase<T>[],
    ): void {
        this.removeDependencySubscriptions(properties);
        this.addDependencySubscriptions(parentControl, properties);
    }

    private removeDependencySubscriptions<T>(
        properties: PropertyBase<T>[]
    ): void {
        (properties || []).forEach(property => {
            property.clearDependencyPropertySubscriptions();

            if (property.properties) {
                this.removeDependencySubscriptions(property.properties);
            }

            if (property.arrayItemProperty) {
                this.removeDependencySubscriptions([property.arrayItemProperty]);
            }
        });
    }

    private addDependencySubscriptions<T>(
        parentControl: AbstractControl,
        properties: PropertyBase<T>[],
        arrayIndex?: number
    ): void {
        (properties || []).forEach(property => {
            const propertyControl = this.getPropertyFromParent(parentControl, property, arrayIndex);
            if (!propertyControl) return;

            this.setupEditabilityDependencySubscriptions(propertyControl, parentControl, property);
            this.setupValidationDependencySubscriptions(propertyControl, parentControl, property);

            if (property.properties) {
                this.addDependencySubscriptions(propertyControl, property.properties);
            }

            if (property.arrayItemProperty) {
                // if there is an arrayItemProperty we know that we are working with a FormArray control
                const formArrayControl = (propertyControl as FormArray);
                for (let i = 0; i < formArrayControl.length; i++) {
                    this.addDependencySubscriptions(formArrayControl, [property.arrayItemProperty], i);
                }
            }
        });
    }

    private setupValidationDependencySubscriptions<T>(
        propertyControl: AbstractControl, parentControl: AbstractControl, property: PropertyBase<T>
    ): void {
        const dependencyPropNames = this.rulesEngineSvc.getDependencyProperties(property.valid);

        dependencyPropNames.forEach(d => {
            const dependencyControl = this.findControlRelatively(parentControl, d);

            if (!dependencyControl) return;

            const sub$ = dependencyControl.valueChanges
                .pipe(
                    this.applyValueChangeOptions(property.valueChangeOptions.dependencyProperties.valid)
                )
                .subscribe(value => {
                    this.setForceAsyncValidationTestForControl(propertyControl, true);
                    propertyControl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
                });

            property.addDependencyPropertySubscription(sub$);
        });
    }

    private setupEditabilityDependencySubscriptions<T>(
        propertyControl: AbstractControl,
        parentControl: AbstractControl,
        property: PropertyBase<T>
    ): void {
        const dependencyPropNames = this.rulesEngineSvc.getDependencyProperties(property.edit);

        dependencyPropNames.forEach(dpn => {
            const dependencyControl = this.findControlRelatively(parentControl, dpn);

            if (!dependencyControl) return;

            // setup control to perform edit tests when dependency property changes
            const sub$ = dependencyControl.valueChanges
                .pipe(
                    this.applyValueChangeOptions(property.valueChangeOptions.dependencyProperties.edit)
                )
                .subscribe(value => {
                    this.persistEditTests(propertyControl, property);
                });

            property.addDependencyPropertySubscription(sub$);
        });
    }

    private persistEditTests<T>(propertyControl: AbstractControl, property: PropertyBase<T>): void {
        const controlContextValues = this.getControlContextValues(propertyControl, property);

        this.rulesEngineSvc.editable(controlContextValues.relative, property, {
            rootData: controlContextValues.root,
            controlState: ControlState.create(propertyControl)
        }).subscribe(testResults => {
            if (testResults.results.length) {
                this.traceSvc.trace(`Editable property "${property.absolutePath}". ` +
                    this.buildTestResultStatsString(testResults));
            }

            if (testResults.passed && propertyControl.disabled)
                propertyControl.enable({ emitEvent: false });
            else if (!testResults.passed && propertyControl.enabled)
                propertyControl.disable({ emitEvent: false });
        });
    }

    private applyAsyncValidValueChangeOptions(
        valueChangeOptions: ValueChangeOptions
    ): OperatorFunction<AbstractControl, AsyncValidationPassthroughable> {
        return (source$: Observable<AbstractControl>): Observable<AsyncValidationPassthroughable> => {
            let lastValue: any;
            let isForce: boolean;

            return source$.pipe(
                tap(control => {
                    isForce = this.doesControlHaveForcedAsyncValidation(control);
                    this.setForceAsyncValidationTestForControl(control, false);
                }),
                debounce(x => {
                    return isForce || valueChangeOptions.debounceMilliseconds > 0
                        ? timer(valueChangeOptions.debounceMilliseconds)
                        : EMPTY;
                }),
                map(control => {
                    return {
                        control: control,
                        passthrough: !(control.value !== lastValue || !valueChangeOptions.distinctUntilChanged || isForce)
                    } as AsyncValidationPassthroughable;
                }),
                tap(x => {
                    if (!x.passthrough) lastValue = x.control.value;
                })
            );
        };
    }

    private applyValueChangeOptions(valueChangeOptions: ValueChangeOptions): OperatorFunction<any, any> {
        return (source$: Observable<any>): Observable<any> => {
            return source$.pipe(
                debounce(x => {
                    return valueChangeOptions.debounceMilliseconds > 0
                        ? timer(valueChangeOptions.debounceMilliseconds)
                        : EMPTY;
                }),
                valueChangeOptions.distinctUntilChanged ? distinctUntilChanged() : tap()
            );
        };
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

    private getPropertyFromParent<T>(
        parentControl: AbstractControl,
        property: PropertyBase<T>,
        arrayIndex?: number
    ) {
        return PropertyBase.isArrayItemProperty(property)
            ? (parentControl as FormArray).at(arrayIndex)
            : parentControl.get((property as Property<T>).name);
    }

    private mapToReactiveFormsValidationErrors<T>(testResults: TestResultsBase<T>): ReactiveFormsValidationErrors {
        // if passed, Angular reactive forms wants us to return null, otherwise return an object with the validation info
        if (!testResults || testResults.passed) return null;

        const failed: { [key: string]: ReactiveFormsFailedValdation } = {};

        testResults.failedResults.forEach(test => {
            failed[test.name] = { message: test.message };
        });

        return {
            ngFormRules: {
                message: testResults.message,
                failed: failed
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

        if (!relativePath || typeof relativePath !== "string") return result;

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

    private buildTestResultStatsString<T>(testResults: TestResultsBase<T>) {
        return `Executed ${testResults.results.length} tests ` +
            `(${testResults.passedResults.length} PASS | ` +
            `${testResults.failedResults.length} FAIL | `
            + `${testResults.skippedResults.length} SKIP)`;
    }

    private attachModelSettingsToForm<T>(formGroup: FormGroup, modelSettings: AbstractModelSettings<T>): void {
        formGroup[ReactiveFormsRuleService.FORM_MODEL_SETTINGS_PROPERTY_NAME] = modelSettings;
    }

    private getModelSettingsFromForm<T>(formGroup: FormGroup): AbstractModelSettings<T> {
        return formGroup[ReactiveFormsRuleService.FORM_MODEL_SETTINGS_PROPERTY_NAME] as AbstractModelSettings<T>;
    }

    private setForceAsyncValidationTestForControl(control: AbstractControl, force: boolean): void {
        control[ReactiveFormsRuleService.FORCE_ASYNC_VALID_TEST_RUN_PROPERTY_NAME] = force;
    }

    private setLastErrorForControl(control: AbstractControl, errors: ReactiveFormsValidationErrorsData): void {
        control[ReactiveFormsRuleService.CONTROL_LAST_ERROR] = errors;
    }

    private getLastErrorForControl(control: AbstractControl): ReactiveFormsValidationErrorsData {
        return control[ReactiveFormsRuleService.CONTROL_LAST_ERROR];
    }

    private doesControlHaveForcedAsyncValidation(control: AbstractControl): boolean {
        return !!(control[ReactiveFormsRuleService.FORCE_ASYNC_VALID_TEST_RUN_PROPERTY_NAME]);
    }

    private triggerValueChange(control: AbstractControl): void {
        control.patchValue(control.value);
    }
}

interface ControlContextValues {
    root: any;
    relative: any;
}

interface AsyncValidationPassthroughable {
    control: AbstractControl;
    passthrough: boolean;
}
