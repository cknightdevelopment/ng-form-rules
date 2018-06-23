import { Component, OnInit } from '@angular/core';
import { ReactiveFormsRuleService, AdhocModelSettings } from 'ng-form-rules';
import { FormGroup } from '@angular/forms';
import { UserService } from './services/user.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'samples-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  registerForm: FormGroup;
  adhocForm: FormGroup;

  activeSample: string;
  showErrors = true;

  constructor(private svc: ReactiveFormsRuleService, private userSvc: UserService) {
  }

  ngOnInit(): void {
    this.registerForm = this.svc.createFormGroup('register');

    const adhocModelSettings = AdhocModelSettings.create<any>(builder => {
      return [
        builder.property('repositoryName', p => {
          p.valueChangeOptions.self.asyncValid = { distinctUntilChanged: true, debounceMilliseconds: 2000 };
          p.valid.push(builder.validTest('No repositories found',
            builder.ruleAsync(
              y => this.userSvc.callGitHub(y.repositoryName).pipe(map(x => !!x)), {dependencyProperties: ['random']}),
            builder.rule(y => !!y.repositoryName && y.repositoryName.length >= 3)
          ));
        }),
        builder.property('random')
      ];
    });

    this.adhocForm = this.svc.createFormGroup(adhocModelSettings);

    this.activeSample = 'getting-started';
  }
}