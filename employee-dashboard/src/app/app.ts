import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmployeeDetailComponent } from './employee-detail.component';
import { Employee } from './employee.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeeDetailComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  employees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  loading = true;
  errorMessage = '';
  searchTerm = '';
  currentPage = 1;
  readonly pageSize = 10;

  get filteredEmployees(): Employee[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.employees;
    }

    return this.employees.filter((employee) =>
      `${employee.EmployeeName} ${employee.Team}`.toLowerCase().includes(term)
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredEmployees.length / this.pageSize));
  }

  get pageNumbers(): Array<number | 'ellipsis'> {
    if (this.totalPages <= 3) {
      return Array.from({ length: this.totalPages }, (_, index) => index + 1);
    }

    if (this.currentPage === 1) {
      return [1, 2, 'ellipsis', this.totalPages];
    }

    if (this.currentPage === this.totalPages) {
      return [1, 'ellipsis', this.totalPages - 1, this.totalPages];
    }

    return [1, 'ellipsis', this.currentPage, 'ellipsis', this.totalPages];
  }

  get paginatedEmployees(): Employee[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEmployees.slice(start, start + this.pageSize);
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  viewDetails(employee: Employee): void {
    this.selectedEmployee = employee;
  }

  closeDetails(): void {
    this.selectedEmployee = null;
  }

  onSearch(): void {
    this.currentPage = 1;
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  private async loadEmployees(): Promise<void> {
    try {
      const response = await fetch('/employees.csv');

      if (!response.ok) {
        throw new Error(`CSV could not be loaded (${response.status})`);
      }

      const csvText = await response.text();
      this.employees = this.parseCsv(csvText);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load employee data.';
      this.employees = [];
    } finally {
      this.loading = false;
    }
  }

  private parseCsv(csvText: string): Employee[] {
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      return [];
    }

    const headers = this.parseCsvLine(lines[0]);

    return lines.slice(1).map((line) => {
      const values = this.parseCsvLine(line);
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] ?? '';
      });

      return {
        EmployeeName: row['First Name'] ?? '',
        Gender: row['Gender'] ?? '',
        'Start Date': row['Start Date'] ?? '',
        'Last Login Time': row['Last Login Time'] ?? '',
        Salary: Number(row['Salary'] ?? 0),
        'Bonus %': Number(row['Bonus %'] ?? 0),
        'Senior Management': (row['Senior Management'] ?? '').toLowerCase() === 'true',
        Team: row['Team'] ?? ''
      };
    });
  }

  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }
}
