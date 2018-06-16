import { AbstractControl } from "@angular/forms";

/**
 * State of an Angular AbstractControl at the time of running a test
 */
export class ControlState {
    private readonly _pristine: boolean;
    private readonly _untouched: boolean;

    // get pristine(): boolean { return this._pristine; }
    // get untouched(): boolean { return this._untouched; }

    private constructor(control: AbstractControl) {
        this._pristine = control.pristine;
        this._untouched = control.untouched;
    }

    static create(control: AbstractControl): ControlState {
        return new ControlState(control);
    }
}