import { DatePipe } from '@angular/common';
import { Component, inject, input, OnInit, Output, EventEmitter } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { documentDto } from './documentDto';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDocumentDialog } from './delete-document-dialog/delete-document-dialog/delete-document-dialog';

@Component({
  selector: 'app-documents',
  imports: [DatePipe, MatSlideToggleModule],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class Documents implements OnInit{

  document = input.required<documentDto>();
  private dialogRef = inject(MatDialog);

  @Output() itemEdited = new EventEmitter<documentDto>();
  @Output() itemDeleted = new EventEmitter<number>();

    ngOnInit(): void {
    console.log('Documents component initialized with document:', this.document());
  }

//   openEditDialog(department : documentDto)
//  {
   
//    this.dialogRef.open(EditForm,{
//     data : document
//    });
//  }
 openDeleteDialog(document : documentDto)
  {
   console.log('Opening delete dialog for document:', document);
   const dialogRef = this.dialogRef.open(DeleteDocumentDialog,{
    data : document
   });
   dialogRef.afterClosed().subscribe(res => {
     if (res === 'confirm') {
       this.itemDeleted.emit(document.id);
     }
   });
  } 
}
