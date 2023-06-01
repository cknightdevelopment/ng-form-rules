import { ReactiveFormsValidationErrorsData } from "./reactive-forms-validation-errors-data";

/**
 * Container model for ng-form-rules validation errors in Angular reactive forms
 */
export interface ReactiveFormsValidationErrors {
    /**
     * Data for the failed validations
     */
    ngFormRules: ReactiveFormsValidationErrorsData;
}