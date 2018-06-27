import { ReactiveFormsFailedValdation } from "./reactive-forms-failed-validation";

/**
 * Validation error data for Angular reactive forms
 */
export interface ReactiveFormsValidationErrorsData {
    /**
     * Message of the first failed test
     */
    message: string;

    /**
     * Data for each failed test
     */
    failed: ReactiveFormsFailedValdation[];
}