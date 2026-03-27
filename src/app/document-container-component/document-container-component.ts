import { ChangeDetectorRef, Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { documentDto } from '../document-component/documentDto';
import { DocumentService } from '../services/document-service';
import { AddDocumentDialog } from '../document-component/add-document-dialog/add-document-dialog/add-document-dialog';
import { Documents } from '../document-component/documents';
import { MatSliderModule } from '@angular/material/slider';
@Component({
  selector: 'app-document-container-component',
  imports: [Documents,MatCheckbox,MatSliderModule],
  templateUrl: './document-container-component.html',
  styleUrl: './document-container-component.css'
})
export class DocumentContainerComponent implements OnInit {

  protected documents = signal<documentDto[]>([]);
  public searchTerm = signal('');
  
  protected filteredDocuments = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.documents();
    return this.documents().filter(d => 
      d.name.toLowerCase().includes(term) || 
      (d.description && d.description.toLowerCase().includes(term)) ||
      (d.taskId && d.taskId.toString().includes(term)) ||
      d.id.toString().includes(term)
    );
  });
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
          this.documents.set(data);
          this.#cdr.markForCheck();
        },
        error: (err) => this.errorMessage = 'failed to fetch Document' + err
      });
    }

    openAddDialog() {
       const dialogRef = this.dialogRef.open(AddDocumentDialog);
       dialogRef.afterClosed().subscribe((newDocument : documentDto) => {
        if(newDocument)
        {
          this.documents.update(docs => [...docs, newDocument]);
          this.#cdr.markForCheck();
        }
       });
     }

    onDocumentEdited(updatedDocument: documentDto) {
      this.documents.update(docs => docs.map(d => 
        d.id === updatedDocument.id ? updatedDocument : d
      ));
      this.#cdr.markForCheck();
    }

    onDocumentDeleted(deletedId: number) {
      this.documents.update(docs => docs.filter(d => d.id !== deletedId));
      this.#cdr.markForCheck();
    }
  }

