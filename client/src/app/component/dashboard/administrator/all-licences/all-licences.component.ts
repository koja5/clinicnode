import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-all-licences",
  templateUrl: "./all-licences.component.html",
  styleUrls: ["./all-licences.component.scss"],
})
export class AllLicencesComponent implements OnInit {
  public path = "grid";
  public name = "all-licences";

  constructor() {}

  ngOnInit() {}
}
