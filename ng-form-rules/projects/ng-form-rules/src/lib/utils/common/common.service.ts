import { Injectable } from '@angular/core';

@Injectable()
export class CommonService {
    unique(values: any[]): any[] {
        return Array.from(new Set(values));
    }
}
