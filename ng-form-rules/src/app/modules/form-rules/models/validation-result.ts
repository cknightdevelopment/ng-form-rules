export interface ValidationResult<T> {
    message?: string;
    name?: string;
    valid: boolean;
}