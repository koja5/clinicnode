import { Component, OnInit } from "@angular/core";
import { LoginService } from "../../service/login.service";
import { MailService } from "../../service/mail.service";
import { ActivatedRoute, Router } from "@angular/router";
import { CookieService } from "ng2-cookies";
import { DashboardService } from "../../service/dashboard.service";
import { MongoService } from "../../service/mongo.service";
import { HelpService } from "src/app/service/help.service";
import { PackLanguageService } from "src/app/service/pack-language.service";
import { StorageService } from "src/app/service/storage.service";
import { HttpClient } from "@angular/common/http";
import {
  Elements,
  Element as StripeElement,
  ElementsOptions,
  StripeService,
} from "ngx-stripe";
import { DynamicService } from "src/app/service/dynamic.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  public loginForm = "active";
  public signupForm: string;
  public paymentForm: string;
  public recoverForm: string;
  public userAccessForm: string;
  public loading = false;
  public hideShow = "password";
  public hideShowEye = "fa-eye-slash";
  public loginInfo: any;
  public signUpInfo: any;
  public forgotInfo = false;
  public errorInfo: string;
  public emailValid = true;
  public language: any;
  public languageLanding: any;
  private superadmin: number;
  public userAccessId: number;
  public userAccessDevice: string;
  public agreeValue = false;
  public validatePaymentField = false;
  public validateAgreeValue = false;
  public domain!: string;
  public package: string;
  public createdLicenceId: string;
  card: StripeElement;
  elementsOptions: ElementsOptions = {
    locale: "en",
  };
  elements: Elements;

  public data = {
    id: "",
    firstname: "",
    lastname: "",
    name: "",
    shortname: "",
    password: "",
    street: "",
    zipcode: "",
    place: "",
    email: "",
    telephone: "",
    mobile: "",
    comment: "",
    price: 0,
    storeId: 0,
    ipAddress: "",
    licence_id: 1,
    expired: null,
  };
  // public data: LoginData;

  constructor(
    private service: LoginService,
    private mailService: MailService,
    private cookie: CookieService,
    private router: Router,
    private activatedRouter: ActivatedRoute,
    private dashboardService: DashboardService,
    private mongo: MongoService,
    private helpService: HelpService,
    private packLanguage: PackLanguageService,
    private storageService: StorageService,
    private stripeService: StripeService,
    public http: HttpClient,
    private callApi: DynamicService
  ) {}

  ngOnInit() {
    this.domain = this.helpService.checkDomain();
    this.initialization();
    // ovde treba da se napravi da se ocita lokacija korisnika i na osnovu toga povuce odgovarajuci jezik
    // kada se korisnik loguje, povlaci se ona konfiguracija koju je on sacuvao...
  }

  initialization() {
    if (
      this.helpService.getSelectionLanguageCode() &&
      this.helpService.getLanguage()
    ) {
      this.language = this.helpService.getLanguage();
    } else if (
      this.helpService.getLocalStorage("countryCode") &&
      this.helpService.getLanguage()
    ) {
      this.language = this.helpService.getLanguage();
    } else {
      this.checkCountryLocation();
    }
    if (this.helpService.getLocalStorage("registrationData")) {
      const registrationData = JSON.parse(
        this.helpService.getLocalStorage("registrationData")
      );
      this.data.email = registrationData["email"];
      this.data.password = registrationData["password"];
    }
    this.helpService.setDefaultBrowserTabTitle();
    this.initializeIpAddress();

    if (!this.helpService.getLanguageForLanding()) {
      let selectedLanguageCode = this.helpService.getSelectionLanguageCode()
        ? this.helpService.getSelectionLanguageCode()
        : this.helpService.getLocalStorage("countryCode");
      this.helpService.getAllLangs().subscribe((data: any) => {
        if (!selectedLanguageCode) {
          selectedLanguageCode = "AT";
        }
        for (let i = 0; i < data.length; i++) {
          for (let j = 0; j < data[i].similarCode.length; j++) {
            if (data[i].similarCode[j] === selectedLanguageCode) {
              this.service
                .getLanguageForLanding(data[i].name)
                .subscribe((data) => {
                  this.helpService.setLanguageForLanding(data);
                  this.helpService.setSelectionLanguageCode(
                    this.helpService.getSelectionLanguageCode()
                  );
                  this.languageLanding =
                    this.helpService.getLanguageForLanding();
                });
            }
          }
        }
      });
    } else {
      this.languageLanding = this.helpService.getLanguageForLanding();
    }

    this.createPaymentForm();
    if (this.activatedRouter.snapshot.params.type) {
      this.signUpActive();
    }
  }

  initializeIpAddress() {
    this.http.get("http://api.ipify.org/?format=json").subscribe((res: any) => {
      this.data.ipAddress = res.ip;
    });
  }

  checkCountryLocation() {
    this.service.checkCountryLocation().subscribe(
      (data) => {
        this.helpService.setLocalStorage("countryCode", data["countryCode"]);
        this.getTranslationByCountryCode(data["countryCode"]);
        this.helpService.setLocalStorage("countryCode", data["countryCode"]);
      },
      (error) => {
        console.log(error);
        this.service.getDefaultLanguage().subscribe((language) => {
          this.language = language["config"];
          this.helpService.setLocalStorage(
            "language",
            JSON.stringify(this.language)
          );

          this.helpService.setLocalStorage(
            "languageVersion",
            language["timestamp"]
          );
          this.helpService.setLocalStorage(
            "languageName",
            language["language"]
          );
        });
        this.helpService.setLocalStorage("countryCode", "AT");
      }
    );
  }

  getTranslationByCountryCode(countryCode: string) {
    this.service.getTranslationByCountryCode(countryCode).subscribe(
      (language) => {
        if (language !== null) {
          this.language = language["config"];
          this.helpService.setLocalStorage(
            "language",
            JSON.stringify(this.language)
          );
          this.helpService.setLocalStorage(
            "languageVersion",
            language["timestamp"]
          );
          this.helpService.setLocalStorage(
            "languageName",
            language["language"]
          );
          this.helpService.setLocalStorage(
            "accountLanguage",
            language["countryCode"]
          );
          this.router.navigate(["/dashboard/home/task"]);
        } else {
          this.service.getDefaultLanguage().subscribe(
            (language) => {
              if (language !== null) {
                console.log("language", language);

                this.language = language["config"];
                this.helpService.setLocalStorage(
                  "language",
                  JSON.stringify(this.language)
                );
                this.helpService.setLocalStorage("accountLanguage", "AT");
                this.router.navigate(["/dashboard/home/task"]);
              } else {
                this.router.navigate(["/maintence"]);
              }
            },
            (error) => {
              this.router.navigate(["/maintence"]);
            }
          );
        }
      },
      (error) => {
        this.router.navigate(["/maintence"]);
      }
    );
  }

  getTranslationByLanguage(language?: any) {
    this.service.getTranslationByLanguage(language).subscribe(
      (language) => {
        if (language !== null) {
          this.language = language["config"];
          this.helpService.setLocalStorage(
            "language",
            JSON.stringify(this.language)
          );
          this.helpService.setLocalStorage(
            "languageVersion",
            language["timestamp"]
          );
          this.helpService.setLocalStorage(
            "languageName",
            language["language"]
          );
          this.helpService.setLocalStorage(
            "accountLanguage",
            language["countryCode"]
          );
          this.router.navigate(["/dashboard/home/task"]);
        } else {
          this.service.getDefaultLanguage().subscribe(
            (language) => {
              if (language !== null) {
                console.log("language", language);
                this.language = language["config"];
                this.helpService.setLocalStorage(
                  "language",
                  JSON.stringify(this.language)
                );
                this.helpService.setLocalStorage("accountLanguage", "US");
                this.router.navigate(["/dashboard/home/task"]);
              } else {
                this.router.navigate(["/maintence"]);
              }
            },
            (error) => {
              this.router.navigate(["/maintence"]);
            }
          );
        }
      },
      (error) => {
        this.router.navigate(["/maintence"]);
      }
    );
  }

  getTranslationByDemoCode(demoCode) {
    this.dashboardService
      .getTranslationByDemoAccount(demoCode)
      .subscribe((language) => {
        this.language = language["config"];
        this.helpService.setLocalStorage(
          "language",
          JSON.stringify(this.language)
        );
        this.helpService.setLocalStorage(
          "accountLanguage",
          language["countryCode"]
        );
        this.helpService.setLocalStorage("countryCode", language["demoCode"]);
        this.helpService.setLocalStorage(
          "demoAccountLanguage",
          language["demoAccount"]
        );
        this.router.navigate(["/dashboard/home/task"]);
      });
  }

  signUpActive() {
    if (this.activatedRouter.snapshot.params.type) {
      this.package = this.activatedRouter.snapshot.params.type;
    } else {
      this.package =
        this.languageLanding.priceTable.header[0].nameOfPackageTitle;
    }
    this.data.licence_id = this.getPackageId();
    this.loginForm = "";
    this.paymentForm = "";
    this.recoverForm = "";
    this.signupForm = "active";
  }

  paymetActive() {
    this.loginForm = "";
    this.recoverForm = "";
    this.signupForm = "";
    this.recoverForm = "";
    this.paymentForm = "active";
    this.createPaymentForm();
  }

  loginActive() {
    this.signupForm = "";
    this.recoverForm = "";
    this.paymentForm = "";
    this.recoverForm = "";
    this.loginForm = "active";
  }

  /*forgotActive() {
    this.signupForm = '';
    this.recoverForm = '';
    this.loginForm = 'active';
    this.forgotInfo = 'Link to recovery password is send on your mail!';
  }*/

  recoveryActive() {
    this.signupForm = "";
    this.loginForm = "";
    this.recoverForm = "active";
  }

  login(form) {
    this.loading = true;
    this.service.login(
      this.data,
      (
        isLogin,
        notActive,
        user,
        type,
        id,
        storeId,
        superadmin,
        last_login,
        info,
        user_access_id,
        licence
      ) => {
        if (isLogin) {
          if (!notActive) {
            this.loginInfo = JSON.parse(localStorage.getItem("language"))[
              "checkMailForActive"
            ];
            this.loading = false;
          } else {
            this.setUserInfoToLocalStorage(
              type,
              id,
              storeId,
              superadmin,
              licence
            );
            this.superadmin = superadmin;
            if (last_login === null) {
              console.log("last login NULL");
              this.helpService.setSessionStorage("first_login", true);
            }
            this.getConfigurationFromDatabase(id);
            if (this.helpService.getLocalStorage("registrationData")) {
              this.helpService.clearLocalStorage("registrationData");
            }
          }
        } else {
          if (info === "deny_access") {
            this.loginInfo = JSON.parse(localStorage.getItem("language"))[
              "needToSuperadminApproveAccess"
            ];
            if (user_access_id) {
              this.userAccessId = user_access_id;
              this.loginForm = "";
              this.userAccessForm = "active";
            }
          } else if (info === "licence_expired") {
            this.router.navigate(["/access-forbiden"]);
          } else if (info === "licence_expired_owner") {
            this.setUserInfoToLocalStorage(
              type,
              id,
              storeId,
              superadmin,
              licence
            );
            this.router.navigate(["/licence"]);
          } else {
            this.loginInfo = JSON.parse(localStorage.getItem("language"))[
              "notCorrectPass"
            ];
          }
          this.loading = false;
        }
      }
    );
  }

  setUserInfoToLocalStorage(type, id, storeId, superadmin, licence) {
    this.cookie.set("user", type);
    this.helpService.setLocalStorage("type", type);
    this.helpService.setLocalStorage("idUser", id);
    this.helpService.setLocalStorage("indicatorUser", id);
    this.helpService.setLocalStorage("storeId-" + id, storeId);
    this.helpService.setLocalStorage("superadmin", superadmin);
    this.helpService.setLocalStorage("lic", licence);
  }

  signUp(form) {
    this.loading = true;
    this.errorInfo = "";
    this.loginInfo = "";
    if (
      this.data.email !== "" &&
      this.data.shortname &&
      this.data.password !== "" &&
      this.data.licence_id &&
      this.data.telephone != ""
    ) {
      if (this.agreeValue) {
        if (this.data.licence_id > 1) {
          this.paymetActive();
        } else {
          this.signUpAccount();
        }
      } else {
        this.loading = false;
        this.errorInfo = JSON.parse(localStorage.getItem("language"))[
          "needToAgree"
        ];
      }
    } else {
      this.loading = false;
      this.errorInfo = JSON.parse(localStorage.getItem("language"))[
        "fillFields"
      ];
    }
  }

  signUpAccount() {
    this.service.signUp(this.data, (val) => {
      if (!val.success) {
        this.errorInfo = val.info;
      } else {
        this.data["language"] = this.packLanguage.getLanguageForConfirmMail();
        this.mailService.sendMail(this.data, function () {});
        this.signUpInfo = JSON.parse(localStorage.getItem("language"))[
          "checkMailForActive"
        ];
        this.helpService.setLocalStorage("superadmin", val.id);
        if (Number(this.data.licence_id) === 1) {
          setTimeout(() => {
            this.loginActive();
          }, 3000);
        } else {
          this.createdLicenceId = val.licenceId;
          this.createPayment();
        }
      }
      this.loading = false;
    });
  }

  forgotPassword() {
    const thisObject = this;
    thisObject.data["language"] = this.packLanguage.getLanguageForForgotMail();
    if (this.data.email !== "") {
      delete this.data.password;
      this.service.forgotPassword(
        this.data,
        function (exist, notVerified, superadmin, firstname) {
          setTimeout(() => {
            if (exist) {
              thisObject.data["superadmin"] = superadmin;
              thisObject.data["firstname"] = firstname;
              thisObject.mailService
                .sendForgetMail(thisObject.data)
                .subscribe((data) => {
                  console.log("test");
                });

              if (!exist) {
                thisObject.emailValid = false;
              } else {
                document.getElementById("textClass").innerHTML = JSON.parse(
                  localStorage.getItem("language")
                )["sendForgotMail"];
              }
            }
          }, 100);
        }
      );
    } else {
      this.errorInfo = JSON.parse(localStorage.getItem("language"))[
        "fillFields"
      ];
    }
  }

  hideShowPassword() {
    if (this.hideShow === "password") {
      this.hideShow = "text";
      this.hideShowEye = "fa-eye";
    } else {
      this.hideShow = "password";
      this.hideShowEye = "fa-eye-slash";
    }
  }

  getConfigurationFromDatabase(id) {
    this.mongo.getConfiguration(Number(id)).subscribe((data) => {
      if (data) {
        this.setConfiguration(data, id);
      } else {
        this.checkDemoAccountLanguage();
      }
    });
  }

  setConfiguration(data, id) {
    if (data.usersFor && data.usersFor.length !== 0) {
      this.setUsersForConfiguration(data.usersFor);
    }
    if (data.storeSettings) {
      this.helpService.setLocalStorage(
        "storeSettings",
        JSON.stringify(data.storeSettings)
      );
    }
    if (data.language) {
      // actually this will check user settings for account language, not the country code
      this.getTranslationByCountryCode(data.language);
    } else {
      this.checkDemoAccountLanguage();
    }

    /*if (
      data.language !== this.helpService.getLocalStorage("countryCode") ||
      this.helpService.getLocalStorage("language") == undefined
    ) {
      this.demoAccountLanguage(data.language);
    } else {
      this.router.navigate(["/dashboard/home/task"]);
    }*/
  }

  checkDemoAccountLanguage() {
    this.service.getDemoAccountLanguage(this.superadmin).subscribe((res) => {
      if (res && res["length"] > 0) {
        const language = res[0]["language"];
        this.getTranslationByLanguage(language);
      } else {
        this.getTranslationByCountryCode(
          this.helpService.getLocalStorage("countryCode")
        );
      }
    });
  }

  /*demoAccountLanguage(language) {
    this.service
      .getDemoAccountLanguage(this.superadmin)
      .subscribe((demoAccount) => {
        if (language) {
          this.helpService.setLocalStorage("countryCode", language);
          this.getTranslationByLanguage(language);
        } else if (demoAccount && demoAccount["length"] > 0) {
          this.getTranslationByLanguage(demoAccount[0]["language"]);
          this.helpService.setLocalStorage(
            "countryCode",
            demoAccount[0]["language"]
          );
        } else {
          this.getTranslationByCountryCode("US");
        }
        if (demoAccount && demoAccount["length"] > 0) {
          this.helpService.setLocalStorage(
            "demoAccountLanguage",
            demoAccount[0]["language"]
          );
        } else {
          this.helpService.clearLocalStorage("demoAccountLanguage");
        }
      });
  }*/

  setUsersForConfiguration(data) {
    for (let i = 0; i < data.length; i++) {
      this.helpService.setLocalStorage(
        data[i].key,
        JSON.stringify(data[i].value)
      );
    }
  }

  createUserAccessDevice(event) {
    const data = {
      id: this.userAccessId,
      device_name: this.userAccessDevice,
    };
    this.service.updateUserAccessDevice(data).subscribe((data) => {
      this.userAccessForm = "";
      this.loginForm = "active";
      this.loginInfo = this.language.successUserAccessDeviceName;
    });
  }

  backToLanding() {
    // this.router.navigate(["./"]);
    window.open("https://officenode.com", "_self");
  }

  selectPackage(event) {
    this.data.licence_id = event;
  }

  getPackageId() {
    for (let i = 0; i < this.languageLanding.priceTable.header.length; i++) {
      if (
        this.languageLanding.priceTable.header[i].nameOfPackageTitle ===
        this.package
      ) {
        return this.languageLanding.priceTable.header[i].id;
      }
    }
  }

  getPackagePrice() {
    for (let i = 0; i < this.languageLanding.priceTable.header.length; i++) {
      if (
        this.languageLanding.priceTable.header[i].id ===
        Number(this.data.licence_id)
      ) {
        return this.languageLanding.priceTable.header[i].price;
      }
    }
  }

  getPackageName() {
    for (let i = 0; i < this.languageLanding.priceTable.header.length; i++) {
      if (
        this.languageLanding.priceTable.header[i].id ===
        Number(this.data.licence_id)
      ) {
        return this.languageLanding.priceTable.header[i].name;
      }
    }
  }

  getSum() {
    const sum = Number(this.data.expired) * Number(this.getPackagePrice());
    return sum.toFixed(2);
  }

  createPaymentForm() {
    this.card = null;
    setTimeout(() => {
      this.stripeService
        .elements(this.elementsOptions)
        .subscribe((elements) => {
          this.elements = elements;
          if (!this.card) {
            this.card = this.elements.create("card", {
              iconStyle: "solid",
              hidePostalCode: true,
              style: {
                base: {
                  iconColor: "#666EE8",
                  color: "#31325F",
                  lineHeight: "40px",
                  fontWeight: 300,
                  fontFamily: '"Helverica Neue", Helvetica, sans-serif',
                  fontSize: "18px",
                  "::placeholder": {
                    color: "#CFD7E8",
                  },
                },
              },
            });
            this.card.mount("#card-element");
          }
        });
    }, 100);
  }

  payLicence() {
    console.log(this.data);
    if (
      !this.data.firstname ||
      !this.data.lastname ||
      !this.data.email ||
      !this.data.telephone ||
      !this.data.licence_id ||
      !this.data.expired
    ) {
      this.validatePaymentField = true;
    } else if (!this.agreeValue) {
      this.validateAgreeValue = true;
    } else {
      this.signUpAccount();
    }
  }

  createPayment() {
    this.data.price = Number(
      (this.getPackagePrice() * this.data.expired).toFixed(2)
    );
    this.stripeService
      .createToken(this.card, {
        name:
          this.data.firstname +
          " " +
          this.data.lastname +
          " - " +
          this.helpService.getSuperadmin(),
      })
      .subscribe(
        (result) => {
          if (result.token) {
            this.data["name"] = this.data.firstname + " " + this.data.lastname;
            this.data["token"] = result.token;
            this.data["licenceId"] = this.createdLicenceId;
            this.data["superadminId"] = this.helpService.getSuperadmin();
            this.data["expiration_date"] = new Date().setMonth(
              new Date().getMonth() + Number(this.data.expired)
            );
            this.callApi
              .callApiPost("/api/payment/create-payment", this.data)
              .subscribe(
                (res) => {
                  if (res["status"]) {
                    const successPayment = this.packDateForSendLicenseMail(
                      res["payment_id"]
                    );
                    this.callApi
                      .callApiPost(
                        "/api/sendInfoForLicencePaymentSuccess",
                        successPayment
                      )
                      .subscribe((res) => {});
                    this.router.navigate([
                      "payment-success/" + res["payment_id"],
                    ]);
                  } else {
                    this.helpService.errorToastr(
                      this.language.paymentError,
                      ""
                    );
                  }
                },
                (error) => {
                  this.helpService.errorToastr(this.language.paymentError, "");
                }
              );
          }
        },
        (error) => {
          this.helpService.errorToastr(this.language.paymentError, "");
        }
      );
  }

  packDateForSendLicenseMail(paidId) {
    const licenceName = this.getPackageName();
    return {
      licensePaidId: paidId,
      licenseInvoice: this.language.licenseInvoice,
      licenseCompany: this.language.licenseCompany,
      licenseCompanyName: this.language.licenseCompanyName,
      licenseCompanyAddress: this.language.licenseCompanyAddress,
      licenseZipCode: this.language.licenseZipCode,
      licenseCity: this.language.licenseCity,
      licenseCompanyUID: this.language.licenseCompanyUID,
      licenseCompanyFN: this.language.licenseCompanyFN,
      licenseInvoiceNumber: this.language.licenseInvoiceNumber,
      licenseInvoicePrefix: this.language.licenseInvoicePrefix,
      invoiceDate: this.language.invoiceDate,
      date: new Date(),
      licensePayer: this.language.licensePayer,
      payerName: this.data.name,
      payerEmail: this.data.email,
      payerPhone: this.data.telephone,
      licencePaymentDate: this.language.licencePaymentDate,
      licenceName: this.language.licenceName,
      licencePrice: this.language.licencePrice,
      licenseMonth: this.language.licenseMonth,
      licenseNetoPrice: this.language.licenseNetoPrice,
      licenseFee: this.language.licenseFee,
      licenseBrutoPrice: this.language.licenseBrutoPrice,
      licenceExpiredDate: this.language.licenceExpiredDate,
      datePaid: new Date(),
      name: this.language[licenceName]
        ? this.language[licenceName]
        : licenceName,
      price: this.getPackagePrice(),
      expired: this.data["expired"],
      feeValue: this.language.feeValue,
      expirationDate: this.data["expiration_date"],
      numberOfMonth: this.data["expired"],
      paymentType: this.language.paymentType,
      licenseCompanyPhone: this.language.licenseCompanyPhone,
      licenseCompanyEmail: this.language.licenseCompanyEmail,
    };
  }

  checkSelectedPackage(id) {
    return id === Number(this.data.licence_id) ? true : false;
  }
}
