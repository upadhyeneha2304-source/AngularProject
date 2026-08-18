import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Employee } from './employee.model';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.css']
})
export class EmployeeDetailComponent {
  @Input() employee: Employee | null = null;
}

