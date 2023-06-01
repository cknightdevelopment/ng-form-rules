import { InjectionToken } from "@angular/core";

/**
 * Injection token for enabling ng-form-rules tracing
 */
export let TRACE_SETTINGS_TOKEN = new InjectionToken<string>('ngfr.trace-settings');