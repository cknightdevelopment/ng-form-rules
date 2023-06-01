/**
 * Options for rule processing
 */
export interface RuleOptions {
    /**
     * Properties that have values that the rule depends on.
     * These property's value changes will be subscribed to and will trigger the rule to be processed
     */
    dependencyProperties?: string[];
    // controlStateOptions?: ControlStateOptions;
}