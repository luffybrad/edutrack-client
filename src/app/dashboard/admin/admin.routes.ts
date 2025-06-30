import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { AdminHomeComponent } from './admin-home/admin-home.component';
import { StudentListComponent } from './../../shared/entities/student/student-list/student-list.component';
import { StudentAddComponent } from '../../shared/entities/student/student-add/student-add.component';
import { ClassListComponent } from '../../shared/entities/class/class-list/class-list.component';
import { ClassAddComponent } from '../../shared/entities/class/class-add/class-add.component';
import { TeacherListComponent } from '../../shared/entities/teacher/teacher-list/teacher-list.component';
import { TeacherAddComponent } from '../../shared/entities/teacher/teacher-add/teacher-add.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminHomeComponent },
      { path: 'students', component: StudentListComponent },
      { path: 'students/add', component: StudentAddComponent },
      { path: 'classes', component: ClassListComponent },
      { path: 'classes/add', component: ClassAddComponent },
      { path: 'teachers', component: TeacherListComponent },
      { path: 'teachers/add', component: TeacherAddComponent },
      // Add more admin pages here like 'students', 'results', etc.
    ],
  },
];
