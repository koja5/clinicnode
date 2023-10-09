import { Component, OnInit } from '@angular/core';
import { HelpService } from 'src/app/service/help.service';

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss'],
})
export class FeaturesComponent implements OnInit {
  public language: any;
  public domain!: string;

  constructor(private helpService: HelpService) {}

  ngOnInit(): void {
    this.domain = this.helpService.checkDomain();
    this.language = this.helpService.getLanguageForLanding();
  }

  sendEventForChangeLanguage(event: any) {
    this.language = this.helpService.getLanguageForLanding();
  }
}
