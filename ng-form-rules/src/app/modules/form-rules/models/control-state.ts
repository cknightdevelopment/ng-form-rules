import { AbstractControl } from "@angular/forms";

export class ControlState {
    private readonly _untouched: boolean;
    private readonly _pristine: boolean;
    private readonly _disabled: boolean;

    // cktodo: use bitwise with '|'
    get untouched(): boolean { return this._untouched; }
    get pristine(): boolean { return this._pristine; }
    get disabled(): boolean { return this._disabled; }

    private constructor(control: AbstractControl) {
    }

    static create(control: AbstractControl): ControlState {
        return new ControlState(control);
    }
}