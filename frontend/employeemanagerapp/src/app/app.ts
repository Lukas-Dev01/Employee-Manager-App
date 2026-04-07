import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Employee, EmployeeWithBirthday, EmployeeWithAnniversary, EmployeeWithContractWarning } from './employee';
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
  public selectedAddContractType: string = '';
  private allEmployees: Employee[] = [];
  public selectedEmployeeId: number | null = null;

  // New properties for sorting and statistics
  public sortBy: string = 'name';
  public sortDirection: 'asc' | 'desc' = 'asc';
  public statistics: any = {};
  public upcomingBirthdays: EmployeeWithBirthday[] = [];
  public upcomingAnniversaries: EmployeeWithAnniversary[] = [];
  public upcomingContractEndings: EmployeeWithContractWarning[] = [];

  constructor(private employeeService: EmployeeService) {
    // Initialize the observable AFTER the service is injected
    this.employees$ = this.employeesSubject.asObservable();
    this.employeeService.getEmployees().subscribe({
      next: (res) => {
        this.allEmployees = res;
        this.updateStatistics();
        this.updateUpcomingEvents();
        this.applySorting();
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
      this.selectedAddContractType = '';
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

  // Calendars season date handling

  public todayDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public getSeason(dateString: string | undefined): string {
    if (!dateString) return '';
    const month = new Date(dateString).getMonth() + 1;
    if (month === 12 || month <= 2) return 'Winter';
    if (month <= 5) return 'Spring';
    if (month <= 8) return 'Summer';
    return 'Autumn';
  }

  public clearFormDate(form: any, fieldName: string): void {
    if (form && form.controls && form.controls[fieldName]) {
      form.controls[fieldName].setValue('');
      form.controls[fieldName].markAsUntouched();
      form.controls[fieldName].markAsPristine();
    }
  }

  public setFormDate(form: any, fieldName: string, value: string): void {
    if (form && form.controls && form.controls[fieldName]) {
      form.controls[fieldName].setValue(value);
    }
  }

  public clearEditDate(fieldName: keyof Employee): void {
    if (this.editEmployee) {
      (this.editEmployee as any)[fieldName] = '';
    }
  }

  public setEditDateToday(fieldName: keyof Employee): void {
    if (this.editEmployee) {
      (this.editEmployee as any)[fieldName] = this.todayDateString();
    }
  }

  public onAddEmployee(employeeData: any): void {
    // Ensure the selected image preview is attached to the payload
    if (this.addEmployeeImageUrl) {
      employeeData = { ...employeeData, imageUrl: this.addEmployeeImageUrl };
    }

    this.employeeService.addEmployee(employeeData).subscribe({
      next: (newEmployee) => {
        this.allEmployees.push(newEmployee);
        this.updateAll();
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
          this.updateAll();
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
        this.updateAll();
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

  // Sorting functionality
  public onSortChange(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  private applySorting(): void {
    const sorted = [...this.allEmployees].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (this.sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'jobTitle':
          aValue = a.jobTitle?.toLowerCase() || '';
          bValue = b.jobTitle?.toLowerCase() || '';
          break;
        case 'hireDate':
          aValue = a.hireDate ? new Date(a.hireDate).getTime() : 0;
          bValue = b.hireDate ? new Date(b.hireDate).getTime() : 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.employeesSubject.next(sorted);
  }

  // Statistics calculation
  private updateStatistics(): void {
    const total = this.allEmployees.length;
    const active = this.allEmployees.filter(e => e.status === 'ACTIVE').length;
    const inactive = this.allEmployees.filter(e => e.status === 'INACTIVE').length;

    this.statistics = {
      total,
      active,
      inactive,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
    };
  }

  // Upcoming birthdays and anniversaries
  private updateUpcomingEvents(): void {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    // Get upcoming birthdays (next 30 days)
    this.upcomingBirthdays = this.allEmployees
      .filter(employee => employee.birthday)
      .map(employee => ({
        ...employee,
        daysUntilBirthday: this.getDaysUntilBirthday(employee.birthday!)
      }))
      .filter(employee => employee.daysUntilBirthday <= 30 && employee.daysUntilBirthday >= 0)
      .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday)
      .slice(0, 5);

    // Get upcoming anniversaries (next 30 days)
    this.upcomingAnniversaries = this.allEmployees
      .filter(employee => employee.hireDate)
      .map(employee => ({
        ...employee,
        daysUntilAnniversary: this.getDaysUntilAnniversary(employee.hireDate!),
        yearsOfService: this.getYearsOfService(employee.hireDate!)
      }))
      .filter(employee => employee.daysUntilAnniversary <= 30 && employee.daysUntilAnniversary >= 0)
      .sort((a, b) => a.daysUntilAnniversary - b.daysUntilAnniversary)
      .slice(0, 5);

    // Get upcoming contract endings (next 90 days)
    this.upcomingContractEndings = this.allEmployees
      .filter(employee => employee.contractEndDate)
      .map(employee => {
        const daysUntil = this.getDaysUntilDate(employee.contractEndDate!);
        let contractStatus: 'active' | 'ending-soon' | 'expired' | 'not-applicable' = 'active';
        
        if (daysUntil < 0) {
          contractStatus = 'expired';
        } else if (daysUntil <= 30) {
          contractStatus = 'ending-soon';
        }

        return {
          ...employee,
          daysUntilContractEnd: daysUntil,
          contractStatus
        };
      })
      .filter(employee => employee.daysUntilContractEnd <= 90 && employee.daysUntilContractEnd >= -7)
      .sort((a, b) => {
        // Show expired contracts first, then ending soon
        if (a.contractStatus === 'expired' && b.contractStatus !== 'expired') return -1;
        if (a.contractStatus !== 'expired' && b.contractStatus === 'expired') return 1;
        return a.daysUntilContractEnd - b.daysUntilContractEnd;
      })
      .slice(0, 5);
  }

  private getDaysUntilBirthday(birthdayStr: string): number {
    const today = new Date();
    const birthday = new Date(birthdayStr);
    const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());

    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = thisYearBirthday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getDaysUntilAnniversary(hireDateStr: string): number {
    const today = new Date();
    const hireDate = new Date(hireDateStr);
    const thisYearAnniversary = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());

    if (thisYearAnniversary < today) {
      thisYearAnniversary.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = thisYearAnniversary.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getYearsOfService(hireDateStr: string): number {
    const hireDate = new Date(hireDateStr);
    const today = new Date();
    return today.getFullYear() - hireDate.getFullYear();
  }

  public getContractYears(startDateStr: string | undefined, endDateStr: string | undefined): number {
    if (!startDateStr || !endDateStr) return 0;
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    return endDate.getFullYear() - startDate.getFullYear();
  }

  public getRemainingTimeDetailed(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const now = new Date();
    const endDate = new Date(dateStr);
    const diffMs = endDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMonths = Math.floor(diffDays / 30); // Approximate
    const remainingDays = diffDays % 30;
    
    if (diffMonths > 0) {
      return `${diffMonths} months, ${remainingDays} days, ${diffHours} hours`;
    } else if (remainingDays > 0) {
      return `${remainingDays} days, ${diffHours} hours`;
    } else {
      return `${diffHours} hours`;
    }
  }

  public getDaysUntilDate(dateStr: string | undefined): number {
    if (!dateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getContractHeaderClass(): string {
    const expired = this.upcomingContractEndings.some(e => e.contractStatus === 'expired');
    const endingSoon = this.upcomingContractEndings.some(e => e.contractStatus === 'ending-soon');
    
    if (expired) {
      return 'bg-danger text-white';
    } else if (endingSoon) {
      return 'bg-warning';
    }
    return 'bg-info text-white';
  }

  // Update statistics and events when employees change
  private updateAll(): void {
    this.updateStatistics();
    this.updateUpcomingEvents();
    this.applySorting();
  }

  public onContractTypeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedAddContractType = selectElement.value;
  }

  public onExportToCSV(): void {
    this.employeeService.exportEmployeesToCSV(this.allEmployees);
  }

  private highlightTimeout: any;

  public scrollToAndHighlightEmployee(employeeId: number | undefined): void {
    if (!employeeId) return;

    // Clear existing highlight timeout so we can restart animation now.
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
      this.highlightTimeout = null;
    }

    const elementId = `employee-card-${employeeId}`;
    const element = document.getElementById(elementId);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Restart CSS animation by removing and re-adding the class.
      element.classList.remove('highlight-blink');
      void element.offsetWidth; // Force reflow
      element.classList.add('highlight-blink');
    }

    this.selectedEmployeeId = employeeId;

    this.highlightTimeout = setTimeout(() => {
      this.selectedEmployeeId = null;
      if (element) {
        element.classList.remove('highlight-blink');
      }
      this.highlightTimeout = null;
    }, 3000);
  }
}