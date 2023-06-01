import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormArray, AbstractControl } from '@angular/forms';

@Component({
  selector: 'playground-json-errors',
  templateUrl: './json-errors.component.html',
  styleUrls: ['./json-errors.component.css']
})
export class JsonErrorsComponent {
  @Input() control: AbstractControl;
}