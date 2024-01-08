import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AllLicencesComponent } from './all-licences.component';

describe('AllLicencesComponent', () => {
  let component: AllLicencesComponent;
  let fixture: ComponentFixture<AllLicencesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AllLicencesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllLicencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
