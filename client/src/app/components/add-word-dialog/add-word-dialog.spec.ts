import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWordDialog } from './add-word-dialog';

describe('AddWordDialog', () => {
  let component: AddWordDialog;
  let fixture: ComponentFixture<AddWordDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddWordDialog],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddWordDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
