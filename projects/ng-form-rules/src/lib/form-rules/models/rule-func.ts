/**
 * Syncronous function for a rule that takes its parent's value and root value, and returns a
 * boolean that determines if the rule has passed
 */
export type RuleFunc<T, R> = (value: T, rootValue?: R) => boolean;