import { RuleSet } from "./rule-set";

/**
 * Collection of checks and conditions
 */
export interface Test<T> {
    /**
     * Message when test fails
     */
    message?: string;

    /**
     * Name of the test
     */
    name?: string;

    /**
     * Checks for the test. Will only execute if conditions are passed.
     */
    check: RuleSet<T>;

    /**
     * Conditions for when the checks should be executed.
     */
    condition?: RuleSet<T>;
}