import { ModelSettingsBuilder } from "../helper/model-settings-builder";
import { Property } from "./property";
import { AdhocModelSettings } from "./adhoc-model-settings";

/**
 * Base class for ng-form-rules model settings
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
     * Helper for building the model, properties, etc.
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