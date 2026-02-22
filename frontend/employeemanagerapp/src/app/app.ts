import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Employee } from './employee';
import { EmployeeService } from './employee.service';
import { Observable, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  /**
   * Observable stream of employees fetched from the backend.
   * The `async` pipe in the template will handle subscription,
   * unsubscription, and change detection automatically.
   */
  public employees$: Observable<Employee[]>;
  private employeesSubject = new BehaviorSubject<Employee[]>([]);
  public editEmployee: Employee = {} as Employee;
  public deleteEmployee: Employee = {} as Employee;
  public selectedImageUrl: string = '';
  public selectedImageName: string = '';
  private allEmployees: Employee[] = [];

  constructor(private employeeService: EmployeeService) {
    // Initialize the observable AFTER the service is injected
    this.employees$ = this.employeesSubject.asObservable();
    this.employeeService.getEmployees().subscribe({
      next: (res) => {
        this.allEmployees = res;
        this.employeesSubject.next(res);
      },
      error: (err) => console.error(err)
    });
  }

  // Filter employees locally by name, email or job title
  public onSearch(key: string): void {
    const k = key ? key.trim().toLowerCase() : '';
    if (!k) {
      this.employeesSubject.next(this.allEmployees);
      return;
    }
    const filtered = this.allEmployees.filter(e => {
      const nameMatch = e.name && e.name.toLowerCase().includes(k);
      const emailMatch = e.email && e.email.toLowerCase().includes(k);
      const jobMatch = e.jobTitle && e.jobTitle.toLowerCase().includes(k);
      return nameMatch || emailMatch || jobMatch;
    }).sort((a, b) => {
      // Prioritize name matches
      const aNameStart = a.name?.toLowerCase().startsWith(k);
      const bNameStart = b.name?.toLowerCase().startsWith(k);
      return (bNameStart ? 1 : 0) - (aNameStart ? 1 : 0);
    });
    this.employeesSubject.next(filtered);
  }

  public onOpenModal(employee: Employee, mode: string): void {
    const container = document.getElementById('main-container');
    if (!container) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.style.display = 'none';
    button.setAttribute('data-bs-toggle', 'modal');
    if (mode === 'add') {
      button.setAttribute('data-bs-target', '#addEmployeeModal');
    }
    if (mode === 'edit') {
      // copy the employee into editEmployee to allow two-way binding safely
      this.editEmployee = { ...employee } as Employee;
      button.setAttribute('data-bs-target', '#updateEmployeeModal');
    }
    if (mode === 'delete') {
      this.deleteEmployee = { ...employee } as Employee;
      button.setAttribute('data-bs-target', '#deleteEmployeeModal');
    }
    container.appendChild(button);
    button.click();
  }

  public onAddEmployee(employeeData: any): void {
    this.employeeService.addEmployee(employeeData).subscribe({
      next: (newEmployee) => {
        this.allEmployees.push(newEmployee);
        this.employeesSubject.next([...this.allEmployees]);
      },
      error: (err) => console.error(err)
    });
  }

  public onUpdateEmployee(employeeData: any): void {
    this.employeeService.updateEmployee(employeeData).subscribe({
      next: (updatedEmployee) => {
        const index = this.allEmployees.findIndex(e => e.id === updatedEmployee.id);
        if (index !== -1) {
          this.allEmployees[index] = updatedEmployee;
          this.employeesSubject.next([...this.allEmployees]);
        }
      },
      error: (err) => console.error(err)
    });
  }

  public onDeleteEmployee(id?: number | null): void {
    if (!id) return;
    this.employeeService.deleteEmployee(id).subscribe({
      next: () => {
        this.allEmployees = this.allEmployees.filter(e => e.id !== id);
        this.employeesSubject.next([...this.allEmployees]);
      },
      error: (err) => console.error(err)
    });
  }

  public onViewImage(imageUrl: string, name?: string): void {
    this.selectedImageUrl = imageUrl;
    this.selectedImageName = name || '';
    const container = document.getElementById('main-container');
    if (!container) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.style.display = 'none';
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#imagePreviewModal');
    container.appendChild(button);
    button.click();
  }

  public copyToClipboard(text: string | undefined): void {
    if (!text) return;
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      // fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  public onImageFileChange(event: Event, form: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Set the imageUrl field in the form to the base64 data URL
        if (form && form.controls && form.controls.imageUrl) {
          form.controls.imageUrl.setValue(e.target.result);
        } else if (form && form.form && form.form.patchValue) {
          form.form.patchValue({ imageUrl: e.target.result });
        }
        // If the form looks like the EDIT form (contains an id) keep editEmployee in sync
        try {
          if (form && form.value && form.value.id) {
            this.editEmployee.imageUrl = e.target.result;
          }
        } catch (err) {
          
        }
      };
      reader.readAsDataURL(file);
    }
  }
}