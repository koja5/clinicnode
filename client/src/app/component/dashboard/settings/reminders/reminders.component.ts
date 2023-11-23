import { Component, OnInit, ViewChild } from "@angular/core";
import { Subject } from "rxjs";
import { AnonymousSubject } from "rxjs-compat";
import { DynamicFormsComponent } from "src/app/component/dynamic-elements/dynamic-forms/dynamic-forms.component";
import { FieldConfig } from "src/app/component/dynamic-elements/dynamic-forms/models/field-config";
import { FormConfig } from "src/app/component/dynamic-elements/dynamic-models/form-config";
import { FormGuardData } from "src/app/models/formGuard-data";
import { DynamicService } from "src/app/service/dynamic.service";
import { HelpService } from "src/app/service/help.service";
import { RemindersService } from "src/app/service/reminders.service";

@Component({
  selector: "app-reminders",
  templateUrl: "./reminders.component.html",
  styleUrls: ["./reminders.component.scss"],
})
export class RemindersComponent implements OnInit, FormGuardData {
  @ViewChild(DynamicFormsComponent) form: DynamicFormsComponent;
  public configField = new FormConfig();
  public language: any;
  public superadmin: string;
  public loading = true;
  public data: any;
  public changeData: any;
  public showDialog = false;
  isFormDirty: boolean = false;
  isDataSaved$: Subject<boolean> = new Subject<boolean>();
  showDialogExit: boolean = false;

  constructor(
    private service: RemindersService,
    private helpService: HelpService,
    private dynamicService: DynamicService
  ) {}

  ngOnInit() {
    this.language = this.helpService.getLanguage();
    this.superadmin = this.helpService.getSuperadmin();
    this.initialization();
  }

  getValue(event: any): void {
    if (
      this.configField.config[0].value == event.email &&
      this.configField.config[1].value == event.sms
    ) {
      this.isFormDirty = false;
    } else {
      this.isFormDirty = true;
    }
  }

  receiveConfirmExit(event: boolean): void {
    if (event) {
      this.isFormDirty = false;
    }
    this.showDialogExit = false;
    this.isDataSaved$.next(event);
  }

  openConfirmModal(): void {
    this.showDialogExit = true;
  }

  initialization() {
    this.dynamicService
      .getConfiguration("settings/permission", "reminders")
      .subscribe((config) => {
        this.configField.config = config as FieldConfig[];
        this.getData();
      });
  }

  getData() {
    this.service.getReminderSettings(this.superadmin).subscribe((data) => {
      if (data && data["length"]) {
        this.data = data[0];
      }
      this.packValue(this.data);
      this.loading = false;
    });
  }

  packValue(data) {
    this.loading = false;
    for (let i = 0; i < this.configField.config.length; i++) {
      if (data && data[this.configField.config[i].field]) {
        this.configField.config[i].value = true;
      } else {
        this.configField.config[i].value = false;
      }
    }
  }

  submitEmitter(event) {
    this.isFormDirty = false;
    this.changeData = event;
    this.showDialog = true;
  }

  receiveConfirm(event) {
    if (event) {
      this.changeData.superadmin = this.superadmin;
      this.service.setReminderSettings(this.changeData).subscribe((data) => {
        if (data) {
          this.helpService.successToastr(
            "",
            this.language.successChangeReminderSettingsText
          );
        } else {
          this.helpService.errorToastr(
            "",
            this.language.errorChangeReminderSettingsText
          );
        }
      });
      this.isFormDirty = false;
    }
    this.showDialog = false;
  }
}
