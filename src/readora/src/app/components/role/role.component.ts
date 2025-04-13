import { Component, OnInit } from '@angular/core';
import { RoleService } from '../../core/services/role.service';
import { Role } from '../../models/role/role.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-role',
  imports: [CommonModule],
  templateUrl: './role.component.html',
  styleUrl: './role.component.css'
})
export class RoleComponent implements OnInit {
  roles: Role[] = [];

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.roleService.getAllRoles().subscribe({
      next: (data) => this.roles = data,
      error: (error) => console.error('Error fetching roles', error)
    });
  }
}
