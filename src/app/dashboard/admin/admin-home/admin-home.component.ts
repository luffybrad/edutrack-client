import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherService } from '../../../services/teacher.service';
import { StudentService } from '../../../services/student.service';
import { GuardianService } from '../../../services/guardian.server';
import { SubjectService } from '../../../services/subject.service';
import { ClassService } from '../../../services/class.service';
import { ExamService } from '../../../services/exam.service';
import { ResultService } from '../../../services/result.service';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-home.component.html',
})
export class AdminHomeComponent implements OnInit {
  totalStudents = 0;
  totalTeachers = 0;
  totalGuardians = 0;
  totalSubjects = 0;
  totalClasses = 0;
  totalExams = 0;
  totalResults = 0;

  constructor(
    private studentService: StudentService,
    private teacherService: TeacherService,
    private guardianService: GuardianService,
    private subjectService: SubjectService,
    private classService: ClassService,
    private examService: ExamService,
    private resultService: ResultService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.studentService.getAll().subscribe({
      next: (res) => (this.totalStudents = res?.data?.length ?? 0),
      error: () => (this.totalStudents = 0),
    });

    this.teacherService.getAll().subscribe({
      next: (res) => (this.totalTeachers = res?.data?.length ?? 0),
      error: () => (this.totalTeachers = 0),
    });

    this.guardianService.getAll().subscribe({
      next: (res) => (this.totalGuardians = res?.data?.length ?? 0),
      error: () => (this.totalGuardians = 0),
    });

    this.subjectService.getAll().subscribe({
      next: (res) => (this.totalSubjects = res?.data?.length ?? 0),
      error: () => (this.totalSubjects = 0),
    });

    this.classService.getAll().subscribe({
      next: (res) => (this.totalClasses = res?.data?.length ?? 0),
      error: () => (this.totalClasses = 0),
    });

    this.examService.getAll().subscribe({
      next: (res) => (this.totalExams = res?.data?.length ?? 0),
      error: () => (this.totalExams = 0),
    });
  }
}
