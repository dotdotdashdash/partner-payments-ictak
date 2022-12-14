import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../admin.service';
import { server } from "../../globals";

@Component({
  selector: 'app-admin-invoices',
  templateUrl: './admin-invoices.component.html',
  styleUrls: ['./admin-invoices.component.css']
})
export class AdminInvoicesComponent implements OnInit {

  pendingInvoices: any = [];
  approvedInvoices: any = [];
  paidInvoices : any = [];
  advanceInvoices: any = []

  constructor(
    private adminServices: AdminService,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.adminServices.getInvoices('pending-approval') // fetch pending invoices adminApproved field doesnt exist for pending invoices
      .subscribe({
        next: (succ: any)=> {
          this.pendingInvoices = succ.data;
          },
        error: (err)=> {
          console.log('error');
          console.log('Error getting pending invoices', err.message);
        }
      });

    this.adminServices.getInvoices('admin-approved')
      .subscribe({
        next: (succ: any)=> {
          this.approvedInvoices = succ.data;
        },
        error: (err)=> {
          console.log('Error getting approved invoices', err.message);
        }
      });

    this.adminServices.getInvoices('advance') // fetch advance invoices - invoicetype = true for advance
    .subscribe({
      next: (succ: any)=> {
        this.advanceInvoices = succ.data;
      },
      error: (err)=> {
        console.log('Error getting advance invoices', err.message);
      }
    });

  }

  approve(invoiceId: any) {
    if(confirm(`Approve invoice and forward to finance for payment?`)) {
      let dueDate: string | null = prompt('Enter the due date for payment: (YYYY-MM-DD)');
      let d = new Date();
      if(dueDate) {
        if(dueDate.length == 10) {
          let year = parseInt(dueDate.slice(0,4)); let thisYear = d.getFullYear();
          let month = parseInt(dueDate.slice(5,7)); let thisMonth = d.getMonth()+1;
          let date = parseInt(dueDate.slice(8,10)); let today = d. getDate();

          if(isNaN(year) || isNaN(month) || isNaN(date)) {
            alert('Invalid due date. (Encountered letters) Please enter the due date in the prescribed format!');
          } else if(month > 12 || date > 31) {
            alert('Invalid due date. (Invalid month or date) Please enter the due date in the prescribed format!');
          } else if((year < thisYear) || (year == thisYear && month < thisMonth) || (year == thisYear && month == thisMonth && date < today)) {
            alert(`Due date can't be a past date`);
          } else {
            this.adminServices.approveInvoice(invoiceId, dueDate)
            .subscribe({
              next: (succ: any)=> {
                if(succ.success) {
                  alert(`Invoice approved and forwarded to finance department`)
                  const currentRoute = this.router.url; // function to reload the current component
                  this.router.navigateByUrl('/', { skipLocationChange: true })
                    .then(() => {
                      this.router.navigate([currentRoute]); // navigate to same route
                    }); 
                }
              },
              error: (err: any)=> {
                alert(`Error while approving invoice, ${err.name}`)
              }
            }); 
          }
        }else {
          alert('Invalid due date. Please enter the due date in the prescribed format(YYYY-MM-DD) and prescribed length!');
        }         
      }else {
        alert(`Due date can't be empty`);
      } 
    }
  }

  viewInvoice(invoiceId: any) {
    sessionStorage.setItem(`goToUrl`, `${server}/admin/getinvoice/${invoiceId}`);
    console.log(invoiceId);
    
    this.router.navigate(['admin/invoices/getinvoice']);
  }

  deny(invoiceId: any){
    if(confirm(`Are you sure?`)) {
      {
        this.adminServices.denyInvoice(invoiceId)
        .subscribe({
          next: (succ: any)=> {
            if(succ.success) {
              alert(`Invoice denied`)
              const currentRoute = this.router.url; // function to reload the current component
              this.router.navigateByUrl('/', { skipLocationChange: true })
                .then(() => {
                  this.router.navigate([currentRoute]); // navigate to same route
                }); 
            }
          },
          error: (err: any)=> {
            console.log('Error while denying invoice', err.message);
          }
        }); 
      }
    }
  }

}
