import { Component, inject } from '@angular/core';
import { DocumentService } from '../../../services/document-service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { documentDto } from '../../documentDto';

@Component({
  selector: 'app-delete-document-dialog',
  imports: [],
  templateUrl: './delete-document-dialog.html',
  styleUrl: './delete-document-dialog.css'
})
export class DeleteDocumentDialog {
  private DocumentService = inject(DocumentService);
  private dialogRef = inject(MatDialogRef);
  data = inject(MAT_DIALOG_DATA) as documentDto;

  confirmDocumentDelete()
  {
      this.DocumentService.deleteDocument(this.data.id)
      .subscribe({
        next : () => {
          this.dialogRef.close('confirm');
        },
        error: (err) => {
          console.log(err);
          this.dialogRef.close('error');
        }
      });
  }
  
   closeDocumentDialog()
   {
    this.dialogRef.close();
   }
}
