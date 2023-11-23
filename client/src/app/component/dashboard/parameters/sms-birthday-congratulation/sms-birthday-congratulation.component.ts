import { Component, OnInit, ViewChild } from "@angular/core";
import { Subject } from "rxjs";
import { DynamicFormsComponent } from "src/app/component/dynamic-elements/dynamic-forms/dynamic-forms.component";
import { FieldConfig } from "src/app/component/dynamic-elements/dynamic-forms/models/field-config";
import { FormConfig } from "src/app/component/dynamic-elements/dynamic-models/form-config";
import { FormGuardData } from "src/app/models/formGuard-data";
import { DynamicService } from "src/app/service/dynamic.service";
import { HelpService } from "src/app/service/help.service";
import { ParameterItemService } from "src/app/service/parameter-item.service";

@Component({
  selector: "app-sms-birthday-congratulation",
  templateUrl: "./sms-birthday-congratulation.component.html",
  styleUrls: ["./sms-birthday-congratulation.component.scss"],
})
export class SmsBirthdayCongratulationComponent
  implements OnInit, FormGuardData
{
  @ViewChild(DynamicFormsComponent) form: DynamicFormsComponent;
  public path = "parameters";
  public file = "sms-birthday-congratulation";
  public loading = true;
  public type: number;
  public id: number;
  public data: any;
  public changeData: any;
  public showDialog = false;
  public configField = new FormConfig();
  public language: any;
  isFormDirty: boolean = false;
  isDataSaved$: Subject<boolean> = new Subject<boolean>();
  showDialogExit: boolean = false;

  constructor(
    private service: ParameterItemService,
    private helpService: HelpService,
    private dynamicService: DynamicService
  ) {}

  ngOnInit() {
    this.language = this.helpService.getLanguage();
    this.initialization();
  }

  isDataSavedChange(event: boolean) {
    this.isDataSaved$.next(event);
  }

  openConfirmModal(): void {
    this.showDialogExit = true;
  }

  changeFormDirty(event) {
    this.isFormDirty = event;
  }

  changeShowDialogExit(event) {
    this.showDialogExit = event;
  }

  initialization() {
    this.id = this.helpService.getMe();

    this.dynamicService
      .getConfiguration(this.path, this.file)
      .subscribe((config) => {
        this.configField.config = config as FieldConfig[];
        this.getData(this.id);
      });
  }

  getData(id) {
    this.service.getSmsBirthdayCongratulation(id).subscribe((data) => {
      this.data = data;
      if (data && data["length"] > 0) {
        this.packValue(data);
      }
      this.loading = false;
    });
  }

  packValue(data) {
    for (let i = 0; i < this.configField.config.length; i++) {
      this.configField.config[i].value = this.helpService.convertValue(
        data[0][this.configField.config[i].field],
        this.configField.config[i].type
      );
    }
  }

  submitEmitter(event) {
    this.changeData = event;
    this.showDialog = true;
  }

  receiveConfirm(event) {
    if (event) {
      this.changeData["superadmin"] = this.helpService.getMe();
      if (this.data && this.data.length) {
        this.service
          .updateSmsBirthdayCongratulation(this.changeData)
          .subscribe((data) => {
            if (data) {
              this.helpService.successToastr(
                this.language.successExecutedActionTitle,
                this.language.successExecutedActionText
              );
            } else {
              this.helpService.errorToastr(
                this.language.errorExecutedActionTitle,
                this.language.errorExecutedActionText
              );
            }
          });
      } else {
        this.data = [this.changeData];
        this.service
          .createSmsBirthdayCongratulation(this.changeData)
          .subscribe((data) => {
            if (data) {
              this.helpService.successToastr(
                this.language.successExecutedActionTitle,
                this.language.successExecutedActionText
              );
            } else {
              this.helpService.errorToastr(
                this.language.errorExecutedActionTitle,
                this.language.errorExecutedActionText
              );
            }
          });
      }
      this.isFormDirty = false;
    }
    this.showDialog = false;
  }
}
