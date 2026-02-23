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
  public addEmployeeImageUrl: string = '';
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

  public onOpenModal(employee: Employee | null, mode: string): void {
    const container = document.getElementById('main-container');
    if (!container) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.style.display = 'none';
    button.setAttribute('data-bs-toggle', 'modal');
    if (mode === 'add') {
      // clear any previously selected add image when opening add modal
      this.addEmployeeImageUrl = '';
      // clear any file input value if present
      try {
        const fileInput = document.getElementById('imageFile') as HTMLInputElement | null;
        if (fileInput) fileInput.value = '';
      } catch (err) {}
      button.setAttribute('data-bs-target', '#addEmployeeModal');
    }
    if (mode === 'edit') {
      // copy the employee into editEmployee to allow two-way binding safely
      if (employee) this.editEmployee = { ...employee } as Employee;
      // clear edit file input so previous selection doesn't persist
      try {
        const editFileInput = document.getElementById('editImageFile') as HTMLInputElement | null;
        if (editFileInput) editFileInput.value = '';
      } catch (err) {}
      button.setAttribute('data-bs-target', '#updateEmployeeModal');
    }
    if (mode === 'delete') {
      if (employee) this.deleteEmployee = { ...employee } as Employee;
      button.setAttribute('data-bs-target', '#deleteEmployeeModal');
    }
    container.appendChild(button);
    button.click();
  }

  public onAddEmployee(employeeData: any): void {
    // Ensure the selected image preview is attached to the payload
    if (this.addEmployeeImageUrl) {
      employeeData = { ...employeeData, imageUrl: this.addEmployeeImageUrl };
    }

    this.employeeService.addEmployee(employeeData).subscribe({
      next: (newEmployee) => {
        this.allEmployees.push(newEmployee);
        this.employeesSubject.next([...this.allEmployees]);
      },
      error: (err) => console.error(err)
    });
  }

  public onUpdateEmployee(employeeData: any): void {
    // Prefer the bound editEmployee.imageUrl if available (ensures file-picked image is used)
    if (this.editEmployee && this.editEmployee.imageUrl) {
      employeeData = { ...employeeData, imageUrl: this.editEmployee.imageUrl };
    }

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

  public onImageFileChange(event: Event, formOrType: any): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const dataUrl = e.target.result as string;
      // If caller provided a string type marker ('add' or 'edit'), use component props
      if (typeof formOrType === 'string') {
        if (formOrType === 'add') {
          this.addEmployeeImageUrl = dataUrl;
        } else if (formOrType === 'edit') {
          this.editEmployee.imageUrl = dataUrl;
        }
        return;
      }

      // Otherwise, attempt to patch the provided ngForm/reactive form object
      const form = formOrType;
      try {
        if (form && form.controls && form.controls.imageUrl) {
          // reactive form style
          form.controls.imageUrl.setValue(dataUrl);
        } else if (form && form.form && form.form.patchValue) {
          // nested form object
          form.form.patchValue({ imageUrl: dataUrl });
        } else if (form && form.value && form.value.id) {
          // looks like edit form - keep editEmployee in sync
          this.editEmployee.imageUrl = dataUrl;
        } else {
          // fallback: set add preview
          this.addEmployeeImageUrl = dataUrl;
        }
      } catch (err) {
        // fallback: set add preview
        this.addEmployeeImageUrl = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  }

  // Called when the user types/pastes an Image URL into the input.
  // Keeps the preview in sync for both add and edit forms.
  public onImageUrlInputChange(value: string, formType: 'add' | 'edit'): void {
    if (formType === 'add') {
      this.addEmployeeImageUrl = value;
    } else {
      if (!this.editEmployee) this.editEmployee = {} as Employee;
      this.editEmployee.imageUrl = value;
    }
  }
}