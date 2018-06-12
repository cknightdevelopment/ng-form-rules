import { Test } from "./test";
import { Property } from "./property";
import { ArrayItemProperty } from "./array-item-property";
import { Subscription } from "rxjs";

export abstract class PropertyBase<T> {
    private _absolutePath: string;
    private _dependencyPropertySubscriptions: Subscription[] = [];
    private _ownerModelSettingsName: string;

    valid: Test<T>[];
    edit: Test<T>[];
    view: Test<T>[];

    /**
     * Properties for a complex object
     */
    properties?: Property<any>[];

    /**
     * Property for an item of an array
     */
    arrayItemProperty?: ArrayItemProperty<any>;

    /**
     * Absolute path to property from root
     */
    get absolutePath(): string {
        return this._absolutePath;
    }

    /**
     * Absolute path to property from root
     */
    get dependencyPropertySubscriptions(): Subscription[] {
        return this._dependencyPropertySubscriptions;
    }

    /**
     * Absolute path to property from root
     */
    get ownerModelSettingsName(): string {
        return this._ownerModelSettingsName;
    }

    /**
     * Determines if the property is an ArrayItemProperty
     * @param property Property to check
     * @returns Whether or not the property is an ArrayItemProperty
     */
    static isArrayItemProperty<T>(property: PropertyBase<T>) {
        return !(property as Property<T>).name;
    }

    /**
     * Internal use only, do not call!
     */
    setAbsolutePath(absolutePath: string): void {
        this._absolutePath = absolutePath;
    }

    /**
     * Internal use only, do not call!
     */
    addDependencyPropertySubscription(subscription: Subscription): void {
        this._dependencyPropertySubscriptions.push(subscription);
    }

    /**
     * Internal use only, do not call!
     */
    clearDependencyPropertySubscriptions(): void {
        this.dependencyPropertySubscriptions.forEach(sub$ => sub$.unsubscribe());
        this._dependencyPropertySubscriptions = [];
    }

    /**
     * Internal use only, do not call!
     */
    setOwnerModelSettingsName(name: string): void {
        this._ownerModelSettingsName = name;
    }
}