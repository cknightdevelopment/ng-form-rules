import { TestBed, inject } from '@angular/core/testing';
import { TraceService } from './trace.service';
import { TRACE_SETTINGS_TOKEN } from '../../form-rules/injection-tokens/trace-settings.token';


describe('TraceService', () => {
    const testMessage = 'Test';
    const testTimeStamp = "5:30 PM";

    let svc: TraceService;
    let logSpy: jasmine.Spy;

    function setupTestBed(traceSettingsTokenConfig: any): void {
        const providersToUse = [TraceService];
        if (traceSettingsTokenConfig) providersToUse.push(traceSettingsTokenConfig);

        TestBed.configureTestingModule({
            providers: providersToUse
        });

        svc = TestBed.get(TraceService);
    }

    beforeEach(() => {
        logSpy = spyOn(window.console, "log");
    });

    it('should be created', () => {
        setupTestBed({ provide: TRACE_SETTINGS_TOKEN, useValue: true });
        expect(svc).toBeTruthy();

        expect(logSpy).not.toHaveBeenCalled();
    });

    it('should trace when provided truthy value for token', () => {
        setupTestBed({ provide: TRACE_SETTINGS_TOKEN, useValue: true });
        svc.trace(testMessage);

        expect(logSpy).toHaveBeenCalled();
    });

    it('should trace namespaced message with timestamp', () => {
        setupTestBed({ provide: TRACE_SETTINGS_TOKEN, useValue: true });

        // allows us to test the message that would be logged
        spyOn(svc as any, "getTimeStamp").and.returnValue(testTimeStamp);

        svc.trace(testMessage);

        expect(logSpy).toHaveBeenCalledWith(`[NGFR - ${testTimeStamp}] ${testMessage}`);
    });

    it('should not trace when provided falsey value for token', () => {
        setupTestBed({ provide: TRACE_SETTINGS_TOKEN, useValue: false });
        svc.trace(testMessage);

        expect(logSpy).not.toHaveBeenCalled();
    });

    it('should not trace when not token provided (token is optional)', () => {
        setupTestBed(null);
        svc.trace(testMessage);

        expect(logSpy).not.toHaveBeenCalled();
    });
});
