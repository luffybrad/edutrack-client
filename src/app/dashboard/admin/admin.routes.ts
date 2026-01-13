//src/app/dashboard/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { AdminHomeComponent } from './admin-home/admin-home.component';
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
import { ResultsExamAnalysisComponent } from '../../shared/entities/result/results-exam-analysis/results-exam-analysis.component';
import { ResultsSubjectAnalysisComponent } from '../../shared/entities/result/results-subject-analysis/results-subject-analysis.component';
import { ResultsStudentAnalysisComponent } from '../../shared/entities/result/results-student-analysis/results-student-analysis.component';
import { TimetableListComponent } from '../../shared/entities/timetable/timetable-list/timetable-list.component';
import { TimetableGenerateComponent } from '../../shared/entities/timetable/timetable-generate/timetable-generate.component';
import { FeeListComponent } from '../../shared/entities/fee/fee-list/fee-list.component';


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
      { path: 'guardians', component: GuardianListComponent },
      { path: 'guardians/add', component: GuardianAddComponent },
      { path: 'subjects', component: SubjectListComponent },
      {
        path: 'subjects/:id/assign-students',
        component: SubjectAssignComponent,
      },
      { path: 'exams', component: ExamListComponent },
      {
        path: 'results', component: ResultsDashboardComponent
      },
  {
    path: 'results/exam/:examId',
    component: ResultsExamAnalysisComponent
  },

  {
  path: 'results/exam/:examId/subjects',
  component: ResultsSubjectAnalysisComponent
},
{
  path: 'results/exam/:examId/students',
  component: ResultsStudentAnalysisComponent
},
{
  path:'timetables',
  component: TimetableListComponent
},
{
  path: 'timetables/generate',
  component: TimetableGenerateComponent
},
{
  path: 'fees',
  component: FeeListComponent
}

    ],
  },
];
