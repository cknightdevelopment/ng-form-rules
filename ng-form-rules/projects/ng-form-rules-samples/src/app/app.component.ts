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
  showErrors = false;

  constructor(private svc: ReactiveFormsRuleService, private userSvc: UserService) {
  }

  ngOnInit(): void {
    this.registerForm = this.svc.createFormGroup('register');

    const adhocModelSettings = AdhocModelSettings.create<any>(builder => {
      return [
        builder.property('repositoryName', p => {
          p.valid.push(builder.validTest('Repo exists',
            builder.ruleAsync(y => this.userSvc.callGitHub().pipe(map(x => !!x)))));
        }),
        builder.property('random')
      ];
    });

    this.adhocForm = this.svc.createFormGroup(adhocModelSettings);

    this.activeSample = 'register';
  }
}