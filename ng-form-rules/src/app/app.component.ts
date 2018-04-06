import { Component } from '@angular/core';
import { RulesEngineService } from './modules/rules-engine/services/rules-engine/rules-engine.service';

@Component({
  selector: 'ngfr-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'app';

  constructor(private rulesEngineSvc: RulesEngineService) {
      this.rulesEngineSvc.log();
  }
}
