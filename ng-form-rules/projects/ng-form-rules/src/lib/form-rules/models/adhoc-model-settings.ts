import { AbstractModelSettings } from "./abstract-model-settings";
import { ModelSettingsBuilder } from "../helper/model-settings-builder";
import { Property } from "./property";

/**
 * Class for creating adhoc (non-registered) model settings
 */
export class AdhocModelSettings<T> extends AbstractModelSettings<T> {
    /**
     * Creates model settings
     * @param propertyBuilderFunc Function that takes a ModelSettingsBuilder and uses it to return an array of properties
     * @returns Model settings configured with properties returned from the 'propertyBuilderFunc' function parameter
     */
    static create<T>(propertyBuilderFunc: (builder: ModelSettingsBuilder) => Property<T>[]): AbstractModelSettings<T> {
        const instance = new AdhocModelSettings();
        instance.properties = !!propertyBuilderFunc ? propertyBuilderFunc(instance.builder) || [] : [];

        return instance;
    }

    private constructor() {
        // since these settings are not registered, just use a static name
        super('adhoc');
    }

    protected buildProperties(): Property<T>[] {
        // this is just needed to satisfy the AbstractModelSettings<T> contract
        return [];
    }
}