import { TestBed, inject } from '@angular/core/testing';

import { ModelSettingsBuilder } from './model-settings-builder';
import { Validation, Rule } from '../models/property';

describe('ModelSettingsBuilder', () => {
    let builder: ModelSettingsBuilder = new ModelSettingsBuilder();

    it('should be created', () => {
        expect(builder).toBeTruthy();
    });

    describe('property', () => {
        it('should set property name', () => {
            const prop = builder.property<TestModel>('name', p => {}); 
            expect(prop.name).toEqual('name');
        });

        it('should throw error for invalid property name', () => {
            const expectedErrorMsg = 'Invalid property name';
            expect(() => builder.property<any>('', p => {})).toThrowError(expectedErrorMsg);
            expect(() => builder.property<any>(null, p => {})).toThrowError(expectedErrorMsg);
            expect(() => builder.property<any>(undefined, p => {})).toThrowError(expectedErrorMsg);
            expect(() => builder.property<any>({ name: "test" } as any, p => {})).toThrowError(expectedErrorMsg);
            expect(() => builder.property<any>((() => { return "test"; }) as any, p => {})).toThrowError(expectedErrorMsg);
            expect(() => builder.property<any>([1,2] as any, p => {})).toThrowError(expectedErrorMsg);
            expect(() => builder.property<any>(999 as any, p => {})).toThrowError(expectedErrorMsg);
            expect(() => builder.property<any>(new Date() as any, p => {})).toThrowError(expectedErrorMsg);
            // that should be enough :)
        });
    });

    describe('validation', () => {
        it('', () => {
            const msg = "Test message";
            const v = builder.validation<TestModel>(msg, { func: (x) => x.name == "Tom" });

            expect(v.message).toEqual(msg);
            expect((v.check as Rule<TestModel>).func({name: "Tom"})).toBeTruthy();
        });
    })
});

class TestModel {
    name: string;
}
