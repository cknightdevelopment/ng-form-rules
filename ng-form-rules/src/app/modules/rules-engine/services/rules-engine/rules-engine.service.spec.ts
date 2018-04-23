import { TestBed, inject } from '@angular/core/testing';

import { RulesEngineService } from './rules-engine.service';
import { MODEL_SETTINGS_TOKEN } from '../../../form-rules/injection-tokens/model-settings.token';
import { AbstractModelSettings } from '../../../form-rules/models/abstract-model-settings';
import { Property } from '../../../form-rules/models/property';
import { RuleGroup } from '../../../form-rules/models/rule-group';
import { TestResult, PropertyTestResults, TestResultsBase } from '../../../form-rules/models/test-result';
import { Person } from '../../../test-utils/models/person';
import { PersonModelSettings } from '../../../test-utils/models/person-model-settings';

describe('RulesEngineService', () => {
    let svc: RulesEngineService;
    let personModelSettings: AbstractModelSettings<Person>;
    const validPerson: Person = { name: "Chris", age: 100, nicknames: ["C-Dog", "C"] };
    const invalidPerson: Person = { name: "Tom", age: 999, nicknames: ["T-Dog", "T"] };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                RulesEngineService,
                {
                    provide: MODEL_SETTINGS_TOKEN,
                    useValue: [
                        new PersonModelSettings("a")
                    ]
                }
            ]
        });

        svc = TestBed.get(RulesEngineService);
        personModelSettings = svc.getModelSettings<Person>("a");
    });

    it('should be created', () => {
        expect(svc).toBeTruthy();
    });

    describe('compilation', () => {
        it('should set model settings initialized via the injection token', () => {
            expect(personModelSettings).toBeTruthy();
        });

        it('should not set model setting when not in the injection token', () => {
            const badSettings = svc.getModelSettings<Person>("bad-name");
            expect(badSettings).toBeFalsy();
        });

        it('should set properties configured in model settings', () => {
            expect(personModelSettings.properties.length).toEqual(3);
            expect(personModelSettings.properties.map(x => x.name)).toEqual(["name", "age", "nicknames"]);
        });
    });

    describe('rule set processing', () => {
        it('should process rule group', () => {
            const ruleGroup = personModelSettings.properties.find(x => x.name == "name").valid[0].check;
            expect(svc.processRuleSet(validPerson, ruleGroup)).toBeTruthy();
            expect(svc.processRuleSet(invalidPerson, ruleGroup)).toBeFalsy();
        });

        it('should process rule', () => {
            const ruleGroup = personModelSettings.properties.find(x => x.name == "age").valid[0].check;
            expect(svc.processRuleSet(validPerson, ruleGroup)).toBeTruthy();
            expect(svc.processRuleSet(invalidPerson, ruleGroup)).toBeFalsy();
        });

        it('should process falsey rule and return positive', () => {
            expect(svc.processRuleSet({ name: "Whatever"}, null)).toBeTruthy();
        });
    });

    describe('running test', () => {
        it('should handle a passed test', () => {
            const validation = personModelSettings.properties.find(x => x.name == "name").valid[0];
            const result = svc.runTest(validPerson, validation);
            expect(result).toEqual({ passed: true, message: null, name: "Chris" } as TestResult<Person>);
        });

        it('should handle a failed test', () => {
            const validation = personModelSettings.properties.find(x => x.name == "name").valid[0];
            const result = svc.runTest(invalidPerson, validation);
            expect(result).toEqual({ passed: false, message: "Doesn't equal Chris", name: "Chris" } as TestResult<Person>);
        });

        it('should handle when provided a falsey test', () => {
            const result = svc.runTest({ name: "Whatever"}, null);
            expect(result).toEqual({ passed: true, message: null, name: null } as TestResult<Person>);
        });
    });

    describe('running multiple tests', () => {
        it('should handle passed tests', () => {
            const validTests = personModelSettings.properties.find(x => x.name == "name").valid;
            const results = svc.runTests(validPerson, validTests);
            expect(results.passed).toBeTruthy();
            expect(results.messages).toEqual([]);
            expect(results.failedResults).toEqual([]);
            expect(results.passedResults).toEqual([ { message: null, passed: true, name: "Chris" } ]);
            expect(results.results).toEqual([ { message: null, passed: true, name: "Chris" } ]);
        });

        it('should handle failed tests', () => {
            const validTests = personModelSettings.properties.find(x => x.name == "name").valid;
            const results = svc.runTests({}, validTests);
            expect(results.passed).toBeFalsy();
            expect(results.messages).toEqual(["Doesn't equal Chris"]);
            expect(results.failedResults).toEqual([{ message: "Doesn't equal Chris", passed: false, name: "Chris" }]);
            expect(results.passedResults).toEqual([]);
            expect(results.results).toEqual([{ message: "Doesn't equal Chris", passed: false, name: "Chris" }]);
        });

        it('should handle when provided falsey tests', () => {
            const results = svc.runTests({}, null);
            expect(results.passed).toBeTruthy();
            expect(results.messages).toEqual([]);
            expect(results.failedResults).toEqual([]);
            expect(results.passedResults).toEqual([]);
            expect(results.results).toEqual([]);
        });

        it('should handle empty tests array', () => {
            const results = svc.runTests({}, []);
            expect(results.passed).toBeTruthy();
            expect(results.messages).toEqual([]);
            expect(results.failedResults).toEqual([]);
            expect(results.passedResults).toEqual([]);
            expect(results.results).toEqual([]);
        });
    });

    describe('validate', () => {
        it('should run validation tests', () => {
            const property = personModelSettings.properties.find(x => x.name == "name");
            const results = svc.validate(invalidPerson, property);
            expect(results.passed).toBeFalsy();
            expect(results.messages).toEqual(["Doesn't equal Chris"]);
        });
    });

    describe('editable', () => {
        it('should run editable tests', () => {
            const property = personModelSettings.properties.find(x => x.name == "name");
            const results = svc.editable(invalidPerson, property);
            expect(results.passed).toBeFalsy();
            expect(results.messages).toEqual(["The first letter isn't C."]);
        });
    });

    describe('visible', () => {
        it('should run visible tests', () => {
            const property = personModelSettings.properties.find(x => x.name == "name");
            const results = svc.visible(invalidPerson, property);
            expect(results.passed).toBeFalsy();
            expect(results.messages).toEqual(["Not 5 characters long."]);
        });
    });
});