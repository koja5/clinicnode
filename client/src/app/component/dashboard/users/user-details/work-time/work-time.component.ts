import { Component, Input, OnInit } from "@angular/core";
import { DynamicService } from "src/app/service/dynamic.service";
import { HelpService } from "src/app/service/help.service";
import { WorkTimeEmpty } from "./work-time-empty";
import { WorkTimeColorsService } from "src/app/service/work-time-colors.service";

@Component({
  selector: "app-work-time",
  templateUrl: "./work-time.component.html",
  styleUrls: ["./work-time.component.scss"],
})
export class WorkTimeComponent implements OnInit {
  @Input() userId!: string;

  public invalidMessageStartField = [];
  public invalidMessageEndField = [];
  public invalidStartField = [];
  public invalidEndField = [];
  public newWorkTime = true;
  public language: any;
  public workTime: any;
  public palette: Array<string> = [];
  public data: any = {};
  public allWorkTimes: any;
  public selectValidDate: any;
  public index = 0;

  constructor(
    private service: DynamicService,
    private helpService: HelpService,
    private workTimeColorService: WorkTimeColorsService
  ) {}

  ngOnInit() {
    this.language = this.helpService.getLanguage();
    this.initialize();
  }

  initialize() {
    this.workTimeColorService
      .getWorkTimeColors(localStorage.getItem("superadmin"))
      .subscribe((data: []) => {
        const colors = data.sort(function (a, b) {
          return a["sequence"] - b["sequence"];
        });
        for (let i = 0; i < colors["length"]; i++) {
          this.palette.push(colors[i]["color"]);
        }
      });

    this.service
      .callApiGet("/api/getAllWorkTimesForUser", this.userId)
      .subscribe((data: any) => {
        if (data.length) {
          this.data = data[0];
          this.selectValidDate = this.data.id;
          this.allWorkTimes = data;
          this.workTime = JSON.parse(this.data.value);
          console.log(this.workTime);
          this.newWorkTime = false;
        } else {
          this.createNew();
        }
      });
  }

  addNewTime(index) {
    this.workTime[index].times.push({ start: "", end: "" });
  }

  deleteWorkTime(i, j) {
    if (this.workTime[i].times.length > 1) {
      this.workTime[i].times.splice(j, 1);
    }
  }

  deleteSelectedWorkTime() {
    this.service
      .callApiGet("/api/deleteSelectedWorkTime", this.selectValidDate)
      .subscribe((data: any) => {
        if (data) {
          this.helpService.successToastr(
            this.language.successExecutedActionTitle,
            this.language.successExecutedActionText
          );
          this.initialize();
        }
      });
  }

  changeWorkTimeStart(event, i, j) {
    if (event) {
      this.workTime[i].times[j].start = event.value ? event.value : event;
      this.validEntry(i, j);
    }
  }

  changeWorkTimeEnd(event, i, j) {
    if (event) {
      this.workTime[i].times[j].end = event.value ? event.value : event;
      this.validEntry(i, j);
    }
  }

  validEntry(i, j) {
    let ind = 1;
    if (
      this.workTime[i].times[j].start &&
      this.workTime[i].times[j].end &&
      this.convertToDate(this.workTime[i].times[j].start).getHours() >=
        this.convertToDate(this.workTime[i].times[j].end).getHours()
    ) {
      this.invalidEndField[i + j] = true;
      this.invalidMessageEndField[i] = true;
    } else {
      this.invalidEndField[i + j] = false;
      this.invalidMessageEndField[i] = false;
    }

    if (j > 0) {
      if (
        this.workTime[i].times[j].start &&
        this.workTime[i].times[j - 1].end &&
        this.convertToDate(this.workTime[i].times[j].start).getHours() <=
          this.convertToDate(this.workTime[i].times[j - 1].end).getHours()
      ) {
        this.invalidStartField[i + j] = true;
        this.invalidMessageStartField[i] = true;
      } else {
        this.invalidStartField[i + j] = false;
        this.invalidMessageStartField[i] = false;
      }
    }
  }

  convertToDate(date: any) {
    if (typeof date === "string" || date instanceof String) {
      const copyVariable = JSON.parse(JSON.stringify(date));
      return new Date(copyVariable);
    } else {
      return date;
    }
  }

  saveWorkTime() {
    if (this.checkInvalid()) {
      this.data.value = JSON.stringify(this.workTime);
      this.data.user_id = this.userId;
      this.service
        .callApiPost("/api/saveWorkTime", this.data)
        .subscribe((data) => {
          if (data) {
            this.helpService.successToastr(this.language.successSavedWorkTime);
          }
        });
    } else {
      this.helpService.errorToastr("Not success!");
    }
  }

  updateWorkTime() {
    if (this.checkInvalid()) {
      this.data.value = JSON.stringify(this.workTime);
      this.service
        .callApiPost("/api/updateWorkTime", this.data)
        .subscribe((data) => {
          if (data) {
            this.helpService.successToastr(
              this.language.successUpdatedWorkTime
            );
          }
        });
    } else {
      this.helpService.errorToastr("Not success!");
    }
  }

  enableDisableDays(event, i) {
    if (event.checked) {
      this.workTime[i].active = 1;
    } else {
      this.workTime[i].active = 0;
    }
  }

  changeColorPalette(event) {
    this.data.color = event;
  }

  changeValidateFromDropdown(event) {
    console.log(event);
    this.data = event.itemData;
    this.workTime = JSON.parse(this.data.value);
  }

  createNew() {
    this.data.value = this.helpService.copyObject(WorkTimeEmpty.value);
    this.workTime = this.data.value;
    this.data.validate_from = new Date();
    this.data.color = this.palette[0];
    this.selectValidDate = null;
    this.newWorkTime = true;
  }

  checkInvalid() {
    for (let i = 0; i < this.invalidEndField.length; i++) {
      if (this.invalidEndField[i]) {
        return false;
      }
    }

    for (let i = 0; i < this.invalidStartField.length; i++) {
      if (this.invalidStartField[i]) {
        return false;
      }
    }

    return true;
  }

  getIndex(i, j) {
    this.index += 1;
    return i + j + this.index;
  }
}
