import { TestBed, inject } from '@angular/core/testing';

import { RulesEngineService } from './rules-engine.service';

describe('RulesEngineService', () => {
    let svc: RulesEngineService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [RulesEngineService]
        });

        svc = TestBed.get(RulesEngineService);
    });

    it('should be created', () => {
        expect(svc).toBeTruthy();
    });
});
