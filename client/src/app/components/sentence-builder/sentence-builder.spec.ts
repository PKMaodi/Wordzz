import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SentenceBuilder } from './sentence-builder';

describe('SentenceBuilder', () => {
  let component: SentenceBuilder;
  let fixture: ComponentFixture<SentenceBuilder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SentenceBuilder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SentenceBuilder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
