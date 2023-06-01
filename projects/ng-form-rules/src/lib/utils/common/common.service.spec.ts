import { TestBed, inject } from '@angular/core/testing';
import { TRACE_SETTINGS_TOKEN } from '../../form-rules/injection-tokens/trace-settings.token';
import { CommonService } from './common.service';

describe('CommonService', () => {
    let svc: CommonService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                CommonService
            ]
        });

        svc = TestBed.get(CommonService);
    });

    it('should be created', () => {
        expect(svc).toBeTruthy();
    });

    describe('unique', () => {
        it('should return unique values', () => {
            const result = svc.unique([1, 2, 3, 2, 1]);
            expect(result).toEqual([1, 2, 3]);
        });

        it('should return empty array when provided an empty array', () => {
            const result = svc.unique([]);
            expect(result).toEqual([]);
        });

        it('should return empty array when provided non-array value', () => {
            const result = svc.unique(123 as any);
            expect(result).toEqual([]);
        });

        it('should return empty array when provided null', () => {
            const result = svc.unique(null);
            expect(result).toEqual([]);
        });
    });

    describe('isZeroOrGreater', () => {
        it('should handle positive integer', () => {
            const result = svc.isZeroOrGreater(1);
            expect(result).toBeTruthy();
        });

        it('should handle positive float', () => {
            const result = svc.isZeroOrGreater(1.25);
            expect(result).toBeTruthy();
        });

        it('should handle zero', () => {
            const result = svc.isZeroOrGreater(0);
            expect(result).toBeTruthy();
        });

        it('should handle negative integer', () => {
            const result = svc.isZeroOrGreater(-1);
            expect(result).toBeFalsy();
        });

        it('should handle negative float', () => {
            const result = svc.isZeroOrGreater(-1.25);
            expect(result).toBeFalsy();
        });

        it('should handle null', () => {
            const result = svc.isZeroOrGreater(null);
            expect(result).toBeFalsy();
        });

        it('should handle empty string', () => {
            const result = svc.isZeroOrGreater("" as any);
            expect(result).toBeFalsy();
        });

        it('should handle wrong type', () => {
            const result = svc.isZeroOrGreater({} as any);
            expect(result).toBeFalsy();
        });
    });
});