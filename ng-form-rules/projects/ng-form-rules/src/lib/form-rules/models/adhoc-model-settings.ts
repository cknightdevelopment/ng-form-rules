import { AbstractModelSettings } from "./abstract-model-settings";
import { ModelSettingsBuilder } from "../helper/model-settings-builder";
import { Property } from "./property";

export class AdhocModelSettings<T> extends AbstractModelSettings<T> {
    static create<T>(propertyBuilderFunc: (builder: ModelSettingsBuilder) => Property<T>[]): AdhocModelSettings<T> {
        const instance = new AdhocModelSettings();
        instance.properties = !!propertyBuilderFunc ? propertyBuilderFunc(instance.builder) || [] : [];

        return instance;
    }

    private constructor() {
        super('adhoc');
    }

    protected buildProperties(): Property<T>[] {
        return [];
    }
}