import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherService } from '../../../services/teacher.service';
import { StudentService } from '../../../services/student.service';
import { GuardianService } from '../../../services/guardian.service';
import { SubjectService } from '../../../services/subject.service';
import { ClassService, Class } from '../../../services/class.service';
import { ExamService } from '../../../services/exam.service';
import { FeeService, FeeArrear } from '../../../services/fee.service';
import { forkJoin, Subscription, timer, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalGuardians: number;
  totalSubjects: number;
  totalClasses: number;
  totalExams: number;
  feeCollection: number;
  avgClassSize: number;
  recentExams: any[];
  classDistribution: { form: number; count: number }[];
  recentActivities: any[];
}

interface ClassDistribution {
  form: number;
  count: number;
}

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-home.component.html',
})
export class AdminHomeComponent implements OnInit, OnDestroy {
  stats: DashboardStats = {
    totalStudents: 0,
    totalTeachers: 0,
    totalGuardians: 0,
    totalSubjects: 0,
    totalClasses: 0,
    totalExams: 0,
    feeCollection: 0,
    avgClassSize: 0,
    recentExams: [],
    classDistribution: [],
    recentActivities: [],
  };

  private refreshSubscription?: Subscription;
  isLoading = true;
  lastUpdated = new Date();

  constructor(
    private studentService: StudentService,
    private teacherService: TeacherService,
    private guardianService: GuardianService,
    private subjectService: SubjectService,
    private classService: ClassService,
    private examService: ExamService,
    private feeService: FeeService
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();

    // Auto-refresh every 60 seconds
    this.refreshSubscription = timer(0, 60000)
      .pipe(switchMap(() => this.loadAllData()))
      .subscribe();
  }

  loadDashboardStats(): void {
    this.isLoading = true;
    this.loadAllData().subscribe({
      next: () => {
        this.isLoading = false;
        this.lastUpdated = new Date();
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  private loadAllData() {
    return forkJoin({
      students: this.studentService
        .getAll()
        .pipe(catchError(() => of({ data: [], success: false }))),
      teachers: this.teacherService
        .getAll()
        .pipe(catchError(() => of({ data: [], success: false }))),
      guardians: this.guardianService
        .getAll()
        .pipe(catchError(() => of({ data: [], success: false }))),
      subjects: this.subjectService
        .getAll()
        .pipe(catchError(() => of({ data: [], success: false }))),
      classes: this.classService
        .getAll()
        .pipe(catchError(() => of({ data: [], success: false }))),
      exams: this.examService
        .getAll()
        .pipe(catchError(() => of({ data: [], success: false }))),
      fees: this.feeService
        .getAll()
        .pipe(catchError(() => of({ data: [], success: false }))),
    }).pipe(
      map((responses) => {
        const students = responses.students.data || [];
        const teachers = responses.teachers.data || [];
        const guardians = responses.guardians.data || [];
        const subjects = responses.subjects.data || [];
        const classes = responses.classes.data || [];
        const exams = responses.exams.data || [];
        const fees = responses.fees.data || [];

        // Calculate all statistics dynamically
        this.calculateAllStats(
          students,
          teachers,
          guardians,
          subjects,
          classes,
          exams,
          fees
        );

        return responses;
      })
    );
  }

  private calculateAllStats(
    students: any[],
    teachers: any[],
    guardians: any[],
    subjects: any[],
    classes: Class[],
    exams: any[],
    fees: FeeArrear[]
  ): void {
    const totalStudents = students.length;
    const totalClasses = classes.length;

    // Calculate fee collection percentage
    const feeCollection = this.calculateFeeCollection(fees);

    // Calculate class distribution
    const classDistribution = this.calculateClassDistribution(
      classes,
      students
    );

    // Get recent exams
    const recentExams = this.getRecentExams(exams);

    // Generate recent activities based on actual data
    const recentActivities = this.generateRecentActivities(
      students,
      exams,
      fees
    );

    this.stats = {
      totalStudents,
      totalTeachers: teachers.length,
      totalGuardians: guardians.length,
      totalSubjects: subjects.length,
      totalClasses,
      totalExams: exams.length,
      feeCollection,
      avgClassSize:
        totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0,
      recentExams,
      classDistribution,
      recentActivities,
    };
  }

  private calculateFeeCollection(fees: FeeArrear[]): number {
    if (!fees.length) return 0;

    // If balancePercentage represents the REMAINING percentage
    // Then paid percentage = 100 - balancePercentage
    const totalPaidPercentage = fees.reduce((sum, fee) => {
      const remainingPercentage = fee.balancePercentage || 100;
      const paidPercentage = 100 - remainingPercentage;
      return sum + paidPercentage;
    }, 0);

    return Math.round(totalPaidPercentage / fees.length);
  }

  private calculateClassDistribution(
    classes: Class[],
    students: any[]
  ): ClassDistribution[] {
    const distribution: ClassDistribution[] = [];

    // Group students by class form (1-4)
    const forms = [1, 2, 3, 4];

    forms.forEach((form) => {
      // Find classes for this form
      const formClasses = classes.filter((c) => c.form === form);
      const formClassIds = formClasses.map((c) => c.id);

      // Count students in these classes
      const count = students.filter(
        (s) => s.classId && formClassIds.includes(s.classId)
      ).length;

      distribution.push({ form, count });
    });

    return distribution;
  }

  private getRecentExams(exams: any[]): any[] {
    // Sort by date and take most recent 3
    return exams
      .filter((exam) => exam.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
      .map((exam) => ({
        name: exam.name,
        date: new Date(exam.date).toLocaleDateString(),
        students: exam.students?.length || 0,
      }));
  }

  private generateRecentActivities(
    students: any[],
    exams: any[],
    fees: FeeArrear[]
  ): any[] {
    const activities = [];

    // Recent student enrollment
    if (students.length > 0) {
      const recentStudent = students[students.length - 1];
      activities.push({
        icon: 'fas fa-user-plus',
        title: 'New Student Enrollment',
        description: `${recentStudent.name || 'Student'} enrolled`,
        time: this.getRelativeTime(recentStudent.createdAt),
        color: 'bg-blue-100 text-blue-600',
      });
    }

    // Recent exam
    if (exams.length > 0) {
      const recentExam = exams[exams.length - 1];
      activities.push({
        icon: 'fas fa-file-alt',
        title: 'Exam Scheduled',
        description: `${recentExam.name || 'Exam'} scheduled`,
        time: this.getRelativeTime(recentExam.createdAt),
        color: 'bg-emerald-100 text-emerald-600',
      });
    }

    // Recent fee payment
    if (fees.length > 0) {
      const recentFee = fees[fees.length - 1];
      if (recentFee.transactions && recentFee.transactions.length > 0) {
        const recentTransaction =
          recentFee.transactions[recentFee.transactions.length - 1];
        activities.push({
          icon: 'fas fa-money-check-alt',
          title: 'Fee Payment Received',
          description: `KES ${recentTransaction.amountPaid} paid`,
          time: this.getRelativeTime(recentTransaction.createdAt),
          color: 'bg-amber-100 text-amber-600',
        });
      }
    }

    // Add timestamp for last data refresh
    activities.push({
      icon: 'fas fa-sync-alt',
      title: 'Data Refreshed',
      description: 'All metrics updated',
      time: 'Just now',
      color: 'bg-violet-100 text-violet-600',
    });

    return activities.slice(0, 4); // Return max 4 activities
  }

  private getRelativeTime(dateString: string | Date): string {
    if (!dateString) return 'Recently';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
  }

  getFeeProgressColor(percentage: number): string {
    if (percentage >= 90) return 'bg-emerald-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  }

  getClassColor(form: number): string {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-violet-100 text-violet-800 border-violet-200',
      'bg-amber-100 text-amber-800 border-amber-200',
    ];
    return colors[form - 1] || colors[0];
  }

  refreshData(): void {
    this.loadDashboardStats();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  // Add these getter methods to your AdminHomeComponent class:

  get studentsPerClass(): number {
    return this.stats.totalClasses > 0
      ? Math.round(this.stats.totalStudents / this.stats.totalClasses)
      : 0;
  }

  get teacherStudentRatio(): string {
    if (this.stats.totalTeachers === 0) return '1:0';
    const ratio = Math.round(
      this.stats.totalStudents / this.stats.totalTeachers
    );
    return `1:${ratio}`;
  }

  get subjectsPerClass(): number {
    return this.stats.totalClasses > 0
      ? Math.round(this.stats.totalSubjects / this.stats.totalClasses)
      : 0;
  }

  get guardianEngagementRate(): number {
    return this.stats.totalStudents > 0
      ? Math.round((this.stats.totalGuardians / this.stats.totalStudents) * 100)
      : 0;
  }

  get classDistributionCount(): number {
    return this.stats.classDistribution.length;
  }
}
