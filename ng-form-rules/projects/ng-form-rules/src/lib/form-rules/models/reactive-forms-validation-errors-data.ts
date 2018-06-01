import { ReactiveFormsFailedValdation } from "./reactive-forms-failed-validation";

export interface ReactiveFormsValidationErrorsData {
    message: string;
    failed: ReactiveFormsFailedValdation[];
}