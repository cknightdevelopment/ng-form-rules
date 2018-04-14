import { ModelSettingsBuilder } from "../helper/model-settings-builder";
import { Property } from "./property";

export abstract class AbstractModelSettings<T> {
    private _name: keyof T;
    get name(): string {
        return this._name;
    }

    builder: ModelSettingsBuilder;
    properties: Property<T>[];

    constructor(name: keyof T) {
        this.builder = new ModelSettingsBuilder();
        this._name = name;
        this.properties = [];
        this.init();
    }

    abstract init(): void;
}