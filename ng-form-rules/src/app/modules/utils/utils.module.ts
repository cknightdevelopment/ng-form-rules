import { NgModule } from '@angular/core';
import { TraceService } from './trace/trace.service';
import { CommonService } from './common/common.service';

@NgModule({
  imports: [],
  declarations: [],
  providers: [
      TraceService,
      CommonService
  ]
})
export class UtilsModule { }
