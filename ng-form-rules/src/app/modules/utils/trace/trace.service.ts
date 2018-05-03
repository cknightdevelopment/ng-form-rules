import { Injectable, Inject, Optional } from '@angular/core';
import { TRACE_SETTINGS_TOKEN } from '../../form-rules/injection-tokens/trace-settings.token';

@Injectable()
export class TraceService {
    constructor(
        @Optional() @Inject(TRACE_SETTINGS_TOKEN) private doTrace: boolean = false
    ) {
    }

    trace(msg: string) {
        if (!this.doTrace) return;

        const fullMsg = `[NGFR TRACE - ${this.getTimeStamp()}] ${msg}`;
        console.log(fullMsg);
    }

    private getTimeStamp(): string {
        return (new Date).toLocaleTimeString();
    }
}
