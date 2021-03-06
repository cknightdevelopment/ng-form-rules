import { ModelSettingsBuilder } from "../helper/model-settings-builder";
import { Property } from "./property";

/**
 * Base class for model settings
 */
export abstract class AbstractModelSettings<T> {
    private _name: string;

    /**
     * Name of the model setting
     */
    get name(): string {
        return this._name;
    }

    /**
     * Helper for building properties, tests, and rules
     */
    protected builder: ModelSettingsBuilder;

    /**
     * Properties configured for the model settings
     */
    properties: Property<T>[];

    /**
     * Creates model settings
     * @param name Name of the model settings
     */
    constructor(name: string) {
        this.builder = new ModelSettingsBuilder();
        this._name = name;
        this.properties = this.buildProperties() || [];
    }

    /**
     * Abstract function for building the properties
     */
    protected abstract buildProperties(): Property<T>[];
}