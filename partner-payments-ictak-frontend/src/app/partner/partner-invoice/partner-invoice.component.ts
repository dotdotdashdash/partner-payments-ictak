import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { PartnerService } from '../partner.service';
import { FormGroup, FormControl, Validators, ReactiveFormsModule} from '@angular/forms'

@Component({
  selector: 'app-partner-invoice',
  templateUrl: './partner-invoice.component.html',
  styleUrls: ['./partner-invoice.component.css']
})
export class PartnerInvoiceComponent implements OnInit {

  invoiceData: any = { };
  workOrderDataFetched: Boolean = false;
  displayMultipleInvoices: Boolean = false;

  @ViewChild('multipleInput', { static: false }) multipleInput!: ElementRef;

  images:any;
  multipleInvoices=[];
  textColor: string = '';

  constructor( 
    private partnerServices: PartnerService,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  selectMultipleInvoice(event:any) {
    if(event.target.files.length > 0) {
      this.multipleInvoices = event.target.files
    }
  }

  fetchWorkOrderData() {
      this.partnerServices.fetchWorkOrderData(this.invoiceData.workOrderNumber)
      .subscribe({
        next: (succ)=> {
          this.invoiceData.partnerName = succ.data.trainingDetails.partnerName;
          this.invoiceData.partnerEmail = succ.data.trainingDetails.partnerEmail;
          // this.invoiceData.startTime = succ.data.trainingDetails.startTime;
          this.invoiceData.workOrderId = succ.data._id;
          this.invoiceData.workOrderDate = new Date(succ.data.sessionDetails.startTime);
          this.workOrderDataFetched = true;

        },
        error: (err)=> {
          // console.log('Error', err.message);
        }
      });
  }

  uploadInvoice() {
    const formdata = new FormData()
    for (let img of this.multipleInvoices) {
      formdata.append('files',img)
    }

    //do the form upload call on successfull completion of fileupload
    this.partnerServices.invoiceFileUpload(formdata)
      .subscribe((res) => {
        this.multipleInput.nativeElement.value = ""
        this.invoiceFormUpload(res.path[0])
        this.displayMultipleInvoices=true
      });

  }

  invoiceFormUpload(invoiceFileName: any) {
    this.invoiceData.fileName = invoiceFileName;
    this.invoiceData.paid = this.invoiceData.invoiceType

    this.partnerServices.invoiceFormUpload(this.invoiceData)
      .subscribe(
        (succ:any) => {
          if (succ.success) {
            // this.invoiceForm.reset();
            // localStorage.setItem("Id", this.invoiceData._id.toString() )
            setTimeout(() => {
              const currentRoute = this.router.url;
              this.router.navigateByUrl('/', { skipLocationChange: true })
                .then(() => {
                  this.router.navigate([currentRoute]); // navigate to same route
                }); 
            }, 2000)}
      })
  }
  
}
