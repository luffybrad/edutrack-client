import { Routes } from '@angular/router';
import { TeacherHomeComponent } from './teacher-home/teacher-home.component';
// Optional: If you want a layout wrapper
import { TeacherLayoutComponent } from './teacher-layout/teacher-layout.component';
import { StudentListComponent } from '../../shared/entities/student/student-list/student-list.component';

export const TEACHER_ROUTES: Routes = [
  {
    path: '',
    component: TeacherLayoutComponent,
    children: [
      {
        path: '',
        component: TeacherHomeComponent,
      },
      {
        path: 'students',
        component: StudentListComponent,
      },
      // Add more child routes here if needed
    ],
  },
];
