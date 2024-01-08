import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { HelpService } from "src/app/service/help.service";
import { MessageService } from "src/app/service/message.service";

import { FieldConfig } from "./models/field-config";
import { DynamicService } from "src/app/service/dynamic.service";
import { FormConfig } from "../dynamic-models/form-config";
import { ActivatedRoute } from "@angular/router";
import { FieldType } from "../../enum/field-type";

@Component({
  exportAs: "dynamicForm",
  selector: "app-dynamic-forms",
  templateUrl: "./dynamic-forms.component.html",
  styleUrls: ["./dynamic-forms.component.scss"],
})
export class DynamicFormsComponent implements OnInit, OnChanges {
  @Input()
  config!: FormConfig;
  @Input() path!: string;
  @Input() file!: string;
  @Input() data!: any;

  @Input()
  showDialogExit: boolean = false;

  @Input()
  isFormDirty = false;

  @Output()
  isFormDirtyChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output()
  showDialogExitChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output()
  receiveConfirmExitResponse: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  @Output()
  submit: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  isDataSaved: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  emitValue: EventEmitter<any> = new EventEmitter<any>();

  form: FormGroup;

  get controls() {
    return this.config.config
      ? this.config.config!.filter(({ type }) => type !== "button")
      : (this.config as FieldConfig[]).filter(({ type }) => type !== "button");
  }
  get changes() {
    return this.form.valueChanges;
  }
  get valid() {
    return this.form.valid;
  }
  get value() {
    return this.form.value;
  }
  language: any;
  public loader = false;

  constructor(
    private fb: FormBuilder,
    private helpService: HelpService,
    private configurationService: DynamicService,
    private router: ActivatedRoute,
    private service: DynamicService
  ) {}

  ngOnInit() {
    if (this.path && this.file && !this.data) {
      this.initializeConfig();
      this.loader = false;
    } else if (this.data) {
      this.getConfigurationFile();
      this.loader = false;
    } else {
      this.language = this.helpService.getLanguage();
      this.form = this.createGroup();
      this.onChanges();
    }
  }

  initializeConfig() {
    this.configurationService
      .getConfiguration(this.path, this.file)
      .subscribe((data) => {
        this.config = data as FormConfig;
        // if (this.disableEdit) {
        //   this.setDisableEdit();
        // }
        // if (this.config.actionButtons) {
        //   this.setDisableEdit();
        // }
        this.form = this.createGroup();
        if (this.config.request && !this.data) {
          this.getData(this.config);
        }
      });
  }

  getConfigurationFile() {
    this.configurationService
      .getConfiguration(this.path, this.file)
      .subscribe((data) => {
        this.config = data as FormConfig;
        this.form = this.createGroup();
        this.setValueToForm(this.config.config, this.data);
      });
  }

  getData(data: any) {
    this.service.callApiGet(data, this.router).subscribe((data) => {
      this.data = data;
      this.setValueToForm(this.config.config, data);
    });
  }

  getIsFormDirty() {
    this.isFormDirty = this.form.dirty;
    this.isFormDirtyChange.emit(this.form.dirty);
  }

  onChanges(): void {
    this.form.valueChanges.subscribe((val) => {
      this.getIsFormDirty();
      this.sendValue();
    });
    if (this.form.get("noEventSinceCheckbox")) {
      this.form.get("noEventSinceCheckbox").valueChanges.subscribe((val) => {
        this.mapCondition(val);
      });
    }
  }

  sendValue(): void {
    this.emitValue.emit(this.value);
  }

  receiveConfirmExit(event: boolean): void {
    if (event) {
      this.isFormDirty = false;
      this.isFormDirtyChange.emit(false);
    }
    this.showDialogExit = false;
    this.showDialogExitChange.emit(false);
    this.isDataSaved.emit(event);
  }

  ngOnChanges() {
    if (this.form) {
      const controls = Object.keys(this.form.controls);
      const configControls = this.controls.map((item) => item.name);

      controls
        .filter((control) => !configControls.includes(control))
        .forEach((control) => this.form.removeControl(control));

      configControls
        .filter((control) => !controls.includes(control))
        .forEach((name) => {
          const config = this.config.config.find(
            (control) => control.name === name
          );
          this.form.addControl(name, this.createControl(config));
        });
    }
  }

  createGroup() {
    const group = this.fb.group({});
    this.controls.forEach((control) =>
      group.addControl(control.name, this.createControl(control))
    );
    return group;
  }

  createControl(config: FieldConfig) {
    const { disabled, validation, value } = config;
    return this.fb.control({ disabled, value }, validation);
  }

  handleSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.form.invalid) {
      this.helpService.errorToastr(
        this.language.allRequiredFieldsMustBeFilledOut,
        ""
      );
      return;
    }
    this.submit.emit(this.value);
  }

  setDisabled(name: string, disable: boolean) {
    if (this.form.controls[name]) {
      const method = disable ? "disable" : "enable";
      this.form.controls[name][method]();
      return;
    }

    this.config.config = this.config.config.map((item) => {
      if (item.name === name) {
        item.disabled = disable;
      }
      return item;
    });
  }

  private mapCondition(noEventSinceCheckboxVal) {
    let field = this.config.config.find((x) => x.name === "noEventSinceDate");
    let control = this.form.get(field.name);
    if (field.condition) {
      if (noEventSinceCheckboxVal) {
        field.condition.value = true;
        // control.setValidators(Validators.required);
      } else {
        field.condition.value = false;
        // control.clearValidators();
      }
      control.updateValueAndValidity();
    }
  }

  setValue(name: string, value: any, type: string) {
    if (name) {
      if (this.form.controls[name]) {
        if (type === "switch" || type === "checkbox") {
          this.form.controls[name].setValue(this.convertBooleanValue(value), {
            emitEvent: true,
          });
        } else {
          this.form.controls[name].setValue(value, { emitEvent: true });
        }
      }
    }
  }

  convertBooleanValue(value: number) {
    if (value === 1 || value) {
      return true;
    } else {
      return false;
    }
  }

  setValueToForm(fields: any, values: any) {
    if (values && values.length > 0) {
      for (let k = 0; k < values.length; k++) {
        for (let i = 0; i < fields.length; i++) {
          if (fields[i]["type"] !== FieldType.label) {
            this.setValue(
              fields[i]["name"],
              values[k][fields[i]["name"]],
              fields[i]["type"]
            );
          }
        }
      }
    } else {
      for (let i = 0; i < fields.length; i++) {
        if (fields[i]["type"] !== FieldType.label && values) {
          this.setValue(
            fields[i]["name"],
            values[fields[i]["name"]],
            fields[i]["type"]
          );
        }
      }
    }
    this.loader = false;
  }
}
