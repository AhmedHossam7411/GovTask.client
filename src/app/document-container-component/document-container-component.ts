import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { documentDto } from '../document-component/documentDto';
import { DocumentService } from '../services/document-service';
import { AddDocumentDialog } from '../document-component/add-document-dialog/add-document-dialog/add-document-dialog';
import { Documents } from '../document-component/documents';
@Component({
  selector: 'app-document-container-component',
  imports: [Documents,MatCheckbox],
  templateUrl: './document-container-component.html',
  styleUrl: './document-container-component.css'
})
export class DocumentContainerComponent {

  protected documents: documentDto[] = [];
    private documentService = inject(DocumentService);
    private dialogRef = inject(MatDialog);
    private errorMessage:string = '';
    #cdr = inject(ChangeDetectorRef)
    
    ngOnInit() {
      this.loadDocuments();
    }
    
    loadDocuments() {
      this.documentService.getDocuments().subscribe({
        next: (data) => {
          this.documents = data
          this.#cdr.markForCheck()
        },
        error: (err) => this.errorMessage = 'failed to fetch Document' + err
      });
    }

    openAddDialog()
       {
       const dialogRef = this.dialogRef.open(AddDocumentDialog);
       dialogRef.afterClosed().subscribe((newDocument : documentDto) => {
        if(newDocument)
        {
          this.documents.push(newDocument);
        }
       });
     }
  }

