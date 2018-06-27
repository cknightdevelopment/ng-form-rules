/**
 * Options for how and when to process value changes in a form control
 */
export class ValueChangeOptions {
    /**
     * Consider value changed only if it is different
     */
    distinctUntilChanged?: boolean;

    /**
     * Milliseconds to debounce value changes
     */
    debounceMilliseconds?: number;
}