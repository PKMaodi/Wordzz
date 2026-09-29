import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedSentences } from './saved-sentences';

describe('SavedSentences', () => {
  let component: SavedSentences;
  let fixture: ComponentFixture<SavedSentences>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavedSentences],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SavedSentences);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
