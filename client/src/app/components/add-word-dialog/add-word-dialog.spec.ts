import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWordDialog } from './add-word-dialog';

describe('AddWordDialog', () => {
  let component: AddWordDialog;
  let fixture: ComponentFixture<AddWordDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddWordDialog]
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
