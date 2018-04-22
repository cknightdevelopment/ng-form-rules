import { TestBed, inject } from '@angular/core/testing';

import { ModelSettingsBuilder } from './model-settings-builder';
import { Rule } from '../models/rule';
import { RuleGroup } from '../models/rule-group';

describe('ModelSettingsBuilder', () => {
    const builder: ModelSettingsBuilder = new ModelSettingsBuilder();

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
            expect(() => builder.property<any>({ name: 'test' } as any, p => {})).toThrowError(expectedErrorMsg);
            expect(() => builder.property<any>((() => 'test') as any, p => {})).toThrowError(expectedErrorMsg);
            expect(() => builder.property<any>([1, 2] as any, p => {})).toThrowError(expectedErrorMsg);
            expect(() => builder.property<any>(999 as any, p => {})).toThrowError(expectedErrorMsg);
            expect(() => builder.property<any>(new Date() as any, p => {})).toThrowError(expectedErrorMsg);
            // that should be enough :)
        });

        it('should call extend function', () => {
            let tmp;
            const prop = builder.property<TestModel>('name', p => { tmp = 123; });
            expect(tmp).toEqual(123);
        });
    });

    describe('arrayItemProperty', () => {
        it('should call extend function', () => {
            let tmp;
            const prop = builder.arrayItemProperty<TestModel>(p => { tmp = 123; });
            expect(tmp).toEqual(123);
        });
    });
});

class TestModel {
    name: string;
    age: number;
}
