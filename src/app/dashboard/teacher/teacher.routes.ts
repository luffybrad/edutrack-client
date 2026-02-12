import { Routes } from '@angular/router';
import { TeacherHomeComponent } from './teacher-home/teacher-home.component';
// Optional: If you want a layout wrapper
import { TeacherLayoutComponent } from './teacher-layout/teacher-layout.component';
import { StudentListComponent } from './../../shared/entities/student/student-list/student-list.component';
import { StudentAddComponent } from '../../shared/entities/student/student-add/student-add.component';
import { ClassListComponent } from '../../shared/entities/class/class-list/class-list.component';
import { ClassAddComponent } from '../../shared/entities/class/class-add/class-add.component';
import { TeacherListComponent } from '../../shared/entities/teacher/teacher-list/teacher-list.component';
import { TeacherAddComponent } from '../../shared/entities/teacher/teacher-add/teacher-add.component';
import { GuardianListComponent } from '../../shared/entities/guardian/guardian-list/guardian-list.component';
import { GuardianAddComponent } from '../../shared/entities/guardian/guardian-add/guardian-add.component';
import { SubjectListComponent } from '../../shared/entities/subject/subject-list/subject-list.component';
import { SubjectAssignComponent } from '../../shared/entities/subject/subject-assign/subject-assign.component';
import { ExamListComponent } from '../../shared/entities/exam/exam-list/exam-list.component';
import { ResultsDashboardComponent } from '../../shared/entities/result/results-dashboard/results-dashboard.component';

import { TimetableListComponent } from '../../shared/entities/timetable/timetable-list/timetable-list.component';
import { TimetableGenerateComponent } from '../../shared/entities/timetable/timetable-generate/timetable-generate.component';
import { FeeDashboardComponent } from '../../shared/entities/fee/fee-dashboard/fee-dashboard.component';
import { ProfileManagementComponent } from '../../shared/entities/profile/profile-management/profile-management.component';
import { NotificationsDashboardComponent } from '../../shared/entities/notifications/notifications-dashboard/notifications-dashboard.component';
export const TEACHER_ROUTES: Routes = [
  {
    path: '',
    component: TeacherLayoutComponent,
    children: [
      {
        path: '',
        component: ClassListComponent,
      },
      { path: 'students', component: StudentListComponent },
      { path: 'students/add', component: StudentAddComponent },
      { path: 'classes', component: ClassListComponent },
      { path: 'classes/add', component: ClassAddComponent },
      { path: 'teachers', component: TeacherListComponent },
      { path: 'teachers/add', component: TeacherAddComponent },
      { path: 'guardians', component: GuardianListComponent },
      { path: 'guardians/add', component: GuardianAddComponent },
      { path: 'subjects', component: SubjectListComponent },
      {
        path: 'subjects/:id/assign-students',
        component: SubjectAssignComponent,
      },
      { path: 'exams', component: ExamListComponent },
      {
        path: 'results',
        component: ResultsDashboardComponent,
      },

      {
        path: 'timetables',
        component: TimetableListComponent,
      },
      {
        path: 'timetables/generate',
        component: TimetableGenerateComponent,
      },
      {
        path: 'fees',
        component: FeeDashboardComponent,
      },
      {
        path: 'profile',
        component: ProfileManagementComponent,
      },
      {
        path: 'notifications',
        component: NotificationsDashboardComponent,
      },

      // Add more child routes here if needed
    ],
  },
];
