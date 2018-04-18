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

    describe('validation', () => {
        const msg = 'Test message';
        const model: TestModel = { name: 'Tom', age: 30 };

        it('should build validation with simple rules', () => {
            const v = builder.validationWithMessage<TestModel>(
                msg,
                { func: (x) => x.name == 'Tom', options: { dependencyProperties: ['age'] } },
                { func: (x) => x.age == 30 },
            );

            const checkRule = v.check as Rule<TestModel>;
            const conditionRule = v.condition as Rule<TestModel>;

            expect(v.message).toEqual(msg);
            expect(checkRule.func(model)).toBeTruthy();
            expect(checkRule.options.dependencyProperties).toEqual(['age']);
            expect(conditionRule.func(model)).toBeTruthy();
        });

        it('should build validation with complex rules', () => {
            const v = builder.validationWithMessage<TestModel>(
                msg,
                { rules: [ { func: (x) => x.name == 'Tom', options: { dependencyProperties: ['age'] } } ], any: true },
                { rules: [ { func: (x) => x.age == 30 } ], any: true },
            );

            const checkRuleGroup = (v.check as RuleGroup<TestModel>).rules[0] as Rule<TestModel>;
            const conditionRuleGroup = (v.condition as RuleGroup<TestModel>).rules[0] as Rule<TestModel>;

            expect(v.message).toEqual(msg);
            expect(checkRuleGroup.func(model)).toBeTruthy();
            expect(checkRuleGroup.options.dependencyProperties).toEqual(['age']);
            expect(conditionRuleGroup.func(model)).toBeTruthy();
        });

        it('should not add a message when not provided one', () => {
            const v = builder.validation<TestModel>(null, null);

            expect(v.message).toBeUndefined();
        });

        it('should throw error for invalid message', () => {
            const expectedErrorMsg = 'Invalid message';
            expect(() => builder.validationWithMessage<any>(null, null, null)).toThrowError(expectedErrorMsg);
            expect(() => builder.validationWithMessage<any>(undefined, null, null)).toThrowError(expectedErrorMsg);
            expect(() => builder.validationWithMessage<any>({ name: 'test' } as any, null, null)).toThrowError(expectedErrorMsg);
            expect(() => builder.validationWithMessage<any>((() => 'test') as any, null, null)).toThrowError(expectedErrorMsg);
            expect(() => builder.validationWithMessage<any>([1, 2] as any, null, null)).toThrowError(expectedErrorMsg);
            expect(() => builder.validationWithMessage<any>(999 as any, null, null)).toThrowError(expectedErrorMsg);
            expect(() => builder.validationWithMessage<any>(new Date() as any, null, null)).toThrowError(expectedErrorMsg);
            // that should be enough :)
        });
    });
});

class TestModel {
    name: string;
    age: number;
}
