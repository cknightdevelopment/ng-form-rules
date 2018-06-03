import { Injectable } from '@angular/core';

@Injectable()
export class CommonService {
    unique(values: any[]): any[] {
        return Array.from(new Set(values));
    }

    isZeroOrGreater(value: number): boolean {
        if (!value && value === 0) return true;

        if (!value || !Number.isInteger(value)) return false;

        return value > 0;
    }
}
