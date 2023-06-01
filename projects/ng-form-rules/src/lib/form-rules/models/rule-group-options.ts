import { ResultsPassRequirement } from "./results-pass-requirement";

/**
 * Options for rule group processing
 */
export interface RuleGroupOptions {
    /**
     * Requirement of results to consider the rule group to have passed
     */
    resultRequirements: ResultsPassRequirement;
}