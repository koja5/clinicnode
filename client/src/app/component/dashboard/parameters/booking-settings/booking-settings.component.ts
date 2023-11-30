import { Component, OnInit } from "@angular/core";
import { DynamicService } from "src/app/service/dynamic.service";
import { HelpService } from "src/app/service/help.service";
import * as sha1 from "sha1";

@Component({
  selector: "app-booking-settings",
  templateUrl: "./booking-settings.component.html",
  styleUrls: ["./booking-settings.component.scss"],
})
export class BookingSettingsComponent implements OnInit {
  public path = "parameters";
  public file = "booking-settings";
  public data: any;
  public language: any;
  public loading = true;
  public buttonLoader = false;
  public stripeActivated = false;

  constructor(
    private service: DynamicService,
    private helpService: HelpService
  ) {}

  ngOnInit() {
    this.language = this.helpService.getLanguage();
    this.getData();
    this.checkStripeAccount();
  }

  getData() {
    this.loading = true;
    this.service
      .callApiGet("/api/getBookingSettings", this.helpService.getSuperadmin())
      .subscribe((data) => {
        console.log(data);
        if (data) {
          this.data = data[0];
          this.loading = false;
        }
      });
  }

  checkStripeAccount() {
    this.service
      .callApiGet("/api/checkStripeAccount", this.helpService.getSuperadmin())
      .subscribe((data: any) => {
        if (data) {
          this.stripeActivated = true;
        } else {
          this.stripeActivated = false;
        }
      });
  }

  saveConfig(config) {
    console.log(config);

    if (this.data) {
      this.service
        .callApiPost("/api/updateBookingSettings", config)
        .subscribe((data) => {
          if (data) {
            this.helpService.successToastr(
              this.language.successExecutedActionTitle
            );
          }
        });
    } else {
      config.superadmin_id = this.helpService.getSuperadmin();
      this.service
        .callApiPost("/api/createBookingSettings", config)
        .subscribe((data) => {
          if (data) {
            this.helpService.successToastr(
              this.language.successExecutedActionTitle
            );
          }
        });
    }
  }

  generateOnlineLink() {
    this.helpService.copyToClipboard(
      "https://booking.officenode.com/booking/" +
        sha1(this.helpService.getSuperadmin())
    );
    this.helpService.successToastr(this.language.successCopiedFormLink, "");
  }

  connectToStripe() {
    this.buttonLoader = true;
    this.service
      .callApiPost("/api/payment/connect-to-stripe", {
        superadminId: this.helpService.getSuperadmin(),
      })
      .subscribe((data: any) => {
        window.open(data.url);
        this.buttonLoader = false;
      });
  }

  test() {
    this.service
      .callApiPost("/api/payment/stripe-test-payment", null)
      .subscribe((data: any) => {
        console.log(data);
      });
  }
}
