import { ModelSettingsBuilder } from './model-settings-builder';
import { of } from 'rxjs';
import { RuleSet } from '../models/rule-set';
import { AdhocModelSettings } from '../models/adhoc-model-settings';

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

        it('should create property and not try to call extend function when not provided', () => {
            const prop = builder.property<TestModel>('name');
            expect(prop.name).toEqual('name');
        });

        it('should call extend function when provided', () => {
            let tmp;
            builder.property<TestModel>('name', p => { tmp = 123; });
            expect(tmp).toEqual(123);
        });
    });

    describe('arrayItemProperty', () => {
        it('should call extend function', () => {
            let tmp;
            builder.arrayItemProperty<TestModel>(p => { tmp = 123; });
            expect(tmp).toEqual(123);
        });
    });

    describe('rules', () => {
        it('should create rule', () => {
            const rule = builder.rule(x => true);
            expect(rule.func).toBeTruthy();
            expect(rule.asyncFunc).toBeFalsy();
            expect(rule.options).toBeFalsy();
        });

        it('should create rule with options', () => {
            const rule = builder.rule(x => true, { dependencyProperties: ['a'] });
            expect(rule.func).toBeTruthy();
            expect(rule.asyncFunc).toBeFalsy();
            expect(rule.options).toEqual({dependencyProperties: ['a']});
        });

        it('should create async rule', () => {
            const rule = builder.ruleAsync(x => of(true));
            expect(rule.func).toBeFalsy();
            expect(rule.asyncFunc).toBeTruthy();
            expect(rule.options).toBeFalsy();
        });

        it('should create async rule with options', () => {
            const rule = builder.ruleAsync(x => of(true), { dependencyProperties: ['a'] });
            expect(rule.func).toBeFalsy();
            expect(rule.asyncFunc).toBeTruthy();
            expect(rule.options).toEqual({dependencyProperties: ['a']});
        });

        it('should create rule combo', () => {
            const rule = builder.ruleCombo(x => true, x => of(true));
            expect(rule.func).toBeTruthy();
            expect(rule.asyncFunc).toBeTruthy();
            expect(rule.options).toBeFalsy();
        });

        it('should create rule combo with options', () => {
            const rule = builder.ruleCombo(x => true, x => of(true), { dependencyProperties: ['a'] });
            expect(rule.func).toBeTruthy();
            expect(rule.asyncFunc).toBeTruthy();
            expect(rule.options).toEqual({dependencyProperties: ['a']});
        });

        it('should create rule group', () => {
            const ruleGroup = builder.ruleGroup([]);
            expect(ruleGroup.rules).toBeTruthy();
            expect(ruleGroup.any).toBeFalsy();
        });

        it('should create rule group with options', () => {
            const ruleGroup = builder.ruleGroup([], true);
            expect(ruleGroup.rules).toBeTruthy();
            expect(ruleGroup.any).toBeTruthy();
        });
    });

    describe('tests', () => {
        const name = "Test Name";
        const message = "Test Message";
        const ruleSet = builder.rule(x => true) as RuleSet<any>;

        it('should create valid test', () => {
            const test = builder.validTest(message, ruleSet);
            expect(test.message).toEqual(message);
            expect(test.name).toBeFalsy();
            expect(test.check).toBeTruthy();
            expect(test.condition).toBeFalsy();
        });

        it('should create valid test with condition', () => {
            const test = builder.validTest(message, ruleSet, ruleSet);
            expect(test.message).toEqual(message);
            expect(test.name).toBeFalsy();
            expect(test.check).toBeTruthy();
            expect(test.condition).toBeTruthy();
        });

        it('should create named valid test', () => {
            const test = builder.validNamedTest(name, message, ruleSet);
            expect(test.message).toEqual(message);
            expect(test.name).toEqual(name);
            expect(test.check).toBeTruthy();
            expect(test.condition).toBeFalsy();
        });

        it('should create named valid test with condition', () => {
            const test = builder.validNamedTest(name, message, ruleSet, ruleSet);
            expect(test.message).toEqual(message);
            expect(test.name).toEqual(name);
            expect(test.check).toBeTruthy();
            expect(test.condition).toBeTruthy();
        });

        it('should create edit test', () => {
            const test = builder.editTest(ruleSet);
            expect(test.message).toBeFalsy();
            expect(test.name).toBeFalsy();
            expect(test.check).toBeTruthy();
            expect(test.condition).toBeFalsy();
        });

        it('should create edit test with condition', () => {
            const test = builder.editTest(ruleSet, ruleSet);
            expect(test.message).toBeFalsy();
            expect(test.name).toBeFalsy();
            expect(test.check).toBeTruthy();
            expect(test.condition).toBeTruthy();
        });

        it('should create named edit test', () => {
            const test = builder.editNamedTest(name, ruleSet);
            expect(test.message).toBeFalsy();
            expect(test.name).toEqual(name);
            expect(test.check).toBeTruthy();
            expect(test.condition).toBeFalsy();
        });

        it('should create named edit test with condition', () => {
            const test = builder.editNamedTest(name, ruleSet, ruleSet);
            expect(test.message).toBeFalsy();
            expect(test.name).toEqual(name);
            expect(test.check).toBeTruthy();
            expect(test.condition).toBeTruthy();
        });
    });

    describe('model settings', () => {
        it('should create model settings with properties', () => {
            const settings = AdhocModelSettings.create<TestModel>((b: ModelSettingsBuilder) => {
                return [
                    b.property('name'),
                    b.property('age')
                ];
            });

            expect(settings.name).toBeTruthy();
            expect(settings.properties.length).toEqual(2);
        });

        it('should create model settings with empty properties when given falsey property builder function', () => {
            const settings = AdhocModelSettings.create<TestModel>(null);

            expect(settings.name).toBeTruthy();
            expect(settings.properties.length).toEqual(0);
        });

        it('should create model settings with empty properties when property builder function return null', () => {
            const settings = AdhocModelSettings.create<TestModel>((b) => {
                return null;
            });

            expect(settings.name).toBeTruthy();
            expect(settings.properties.length).toEqual(0);
        });
    });
});

class TestModel {
    name: string;
    age: number;
}
