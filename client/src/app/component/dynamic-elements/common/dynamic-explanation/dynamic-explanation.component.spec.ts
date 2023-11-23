import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicExplanationComponent } from './dynamic-explanation.component';

describe('DynamicExplanationComponent', () => {
  let component: DynamicExplanationComponent;
  let fixture: ComponentFixture<DynamicExplanationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DynamicExplanationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DynamicExplanationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
