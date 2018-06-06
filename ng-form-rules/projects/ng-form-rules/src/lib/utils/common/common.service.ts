import { Injectable } from '@angular/core';

@Injectable()
export class CommonService {
    /**
     * Gets unique values from an array
     * @param values Values to get unique items from
     * @returns Unique values array
     */
    unique(values: any[]): any[] {
        if (!Array.isArray(values)) return [];

        return Array.from(new Set(values));
    }

    /**
     * Determines if number is zero or greater
     * @param value If number is greater than or equal zero
     */
    isZeroOrGreater(value: number): boolean {
        if (!value && value === 0) return true;

        if (!value || typeof value !== "number") return false;

        return value > 0;
    }
}
