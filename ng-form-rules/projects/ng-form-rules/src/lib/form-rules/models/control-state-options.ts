/**
 * Settings concerning the state of an Angular AbstractControl at the time of running a test
 */
export interface ControlStateOptions {
    skipUntouched?: boolean;
    skipPristine?: boolean;
}