import { Component, OnInit } from '@angular/core';
import { ReactiveFormsRuleService } from 'ng-form-rules';
import { FormGroup } from '@angular/forms';
import { UserService } from './services/user.service';

@Component({
  selector: 'samples-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  registerForm: FormGroup;

  constructor(private svc: ReactiveFormsRuleService) {
  }

  ngOnInit(): void {
    this.registerForm = this.svc.createFormGroup('register');
  }
}