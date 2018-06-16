import { Test } from "./test";
import { Property } from "./property";
import { ArrayItemProperty } from "./array-item-property";
import { Subscription } from "rxjs";

/**
 * Base class representing a property
 */
export abstract class PropertyBase<T> {
    private _absolutePath: string;
    private _dependencyPropertySubscriptions: Subscription[] = [];
    private _ownerModelSettingsName: string;

    /**
     * Validation tests
     */
    valid: Test<T>[] = [];

    /**
     * Editability tests
     */
    edit: Test<T>[] = [];

    /**
     * Viewability tests
     */
    view: Test<T>[] = [];

    /**
     * Properties for a complex object
     */
    properties?: Property<any>[];

    /**
     * Property for an item of an array
     */
    arrayItemProperty?: ArrayItemProperty<any>;

    /**
     * Absolute path to the property from root
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
    static isArrayItemProperty<T>(property: PropertyBase<T>): boolean {
        return !(property as Property<T>).name;
    }

    /**
     * DO NOT CALL! Internal use only
     * @param absolutePath Absolute path to the property from the root
     */
    setAbsolutePath(absolutePath: string): void {
        this._absolutePath = absolutePath;
    }

    /**
     * DO NOT CALL! Internal use only
     * @param subscription Subscription for the dependency property
     */
    addDependencyPropertySubscription(subscription: Subscription): void {
        this._dependencyPropertySubscriptions.push(subscription);
    }

    /**
     * DO NOT CALL! Internal use only
     */
    clearDependencyPropertySubscriptions(): void {
        this.dependencyPropertySubscriptions.forEach(sub$ => sub$.unsubscribe());
        this._dependencyPropertySubscriptions = [];
    }

    /**
     * DO NOT CALL! Internal use only
     * @param name Name of the owner model settings
     */
    setOwnerModelSettingsName(name: string): void {
        this._ownerModelSettingsName = name;
    }
}