import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from './employee';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiServerUrl = environment.apiServerUrl;
  private jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  public getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiServerUrl}/employee/all`);
  }

  public getEmployeeById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiServerUrl}/employee/find/${id}`);
  }

  public addEmployee(employee: Employee): Observable<Employee> {
    return this.http.post<Employee>(`${this.apiServerUrl}/employee/add`, employee, { headers: this.jsonHeaders });
  }

  public updateEmployee(employee: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiServerUrl}/employee/update`, employee, { headers: this.jsonHeaders });
  }

  public deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiServerUrl}/employee/delete/${id}`);
  }

  public exportEmployeesToCSV(employees: Employee[]): void {
    if (!employees || employees.length === 0) {
      alert('No employees to export');
      return;
    }

    // Define CSV headers
    const headers = ['ID', 'Name', 'Email', 'Job Title', 'Phone', 'Status', 'Birthday', 'Hire Date', 'Contract Type', 'Contract Start Date', 'Contract End Date'];
    
    // Convert employees to CSV rows
    const rows = employees.map(emp => [
      emp.id?.toString() || '',
      emp.name || '',
      emp.email || '',
      emp.jobTitle || '',
      emp.phone || '',
      emp.status || '',
      this.formatDateForCSV(emp.birthday),
      this.formatDateForCSV(emp.hireDate),
      emp.contractType || '',
      this.formatDateForCSV(emp.contractStartDate),
      this.formatDateForCSV(emp.contractEndDate)
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => this.escapeCsvValue(cell as string)).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Create a more readable filename with current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_${dateStr}_${timeStr}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private escapeCsvValue(value: string): string {
    if (!value) return '';
    // Escape quotes and wrap in quotes if needed
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private formatDateForCSV(dateString: string | undefined): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      
      // Format as MM/DD/YYYY to match common CSV expectations
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${month}/${day}/${year}`;
    } catch (error) {
      return dateString; // Return original string if parsing fails
    }
  }

  public onOpenModal(employee: Employee | null, mode: string): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.style.display = 'none';
    button.setAttribute('data-toggle', 'modal');
    if (mode === 'add') {
      button.setAttribute('data-target', 'modal');
    }
  }




  
}
