// src/app/shared/entities/result/subject-analysis-section/subject-analysis-section.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import {
  ResultService,
  SubjectAnalysis,
  ExamResultsResponse,
  Result,
} from '../../../../services/result.service';
import { ExamService, Exam } from '../../../../services/exam.service';
import { ClassService, Class } from '../../../../services/class.service';
import { StudentService } from '../../../../services/student.service';
import { Subject, SubjectService } from '../../../../services/subject.service';

@Component({
  selector: 'app-subject-analysis-section',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './subject-analysis-section.component.html',
})
export class SubjectAnalysisSectionComponent implements OnInit {
  exams: Exam[] = [];
  subjects: string[] = [];
  classes: Class[] = [];
  allStudents: any[] = [];
  examResults: Result[] = [];

  selectedExamId?: string;
  selectedSubject?: string;
  selectedClassId?: string;

  allSubjects: Subject[] = [];

  analysis?: SubjectAnalysis;
  loading = false;

  gradeChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const percentage = (
              ((context.raw as number) / total) *
              100
            ).toFixed(1);
            return `${context.dataset.label}: ${context.raw} students (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Students',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Grades',
        },
      },
    },
  };

  constructor(
    private resultService: ResultService,
    private examService: ExamService,
    private classService: ClassService,
    private studentService: StudentService,
    private subjectService: SubjectService,
  ) {}

  ngOnInit() {
    this.loadExams();
    this.loadClasses();
    this.loadSubjects();
  }

  loadExams() {
    this.examService.getAll().subscribe((res) => {
      this.exams = res.data || [];
    });
  }

  loadClasses() {
    this.classService.getAll().subscribe((res) => {
      this.classes = res.data || [];
    });
  }

  loadSubjects() {
    this.subjectService.getAll().subscribe((res) => {
      if (res.success && res.data) {
        // Store subjects from database
        this.allSubjects = res.data;
      }
    });
  }

  onExamChange() {
    if (!this.selectedExamId) return;

    this.selectedSubject = undefined;
    this.selectedClassId = undefined;
    this.analysis = undefined;
    this.examResults = [];

    // Fetch subjects dynamically from results
    this.resultService.getByExam(this.selectedExamId).subscribe((res) => {
      const examResults = res.data as ExamResultsResponse;
      this.examResults = examResults.results || [];

      // Collect unique subjects from exam results
      const subjectsFromResults = new Set<string>();
      this.examResults.forEach((r) =>
        Object.keys(r.subjectScores).forEach((s) => subjectsFromResults.add(s)),
      );

      // Combine subjects from results AND database (avoid duplicates)
      const combinedSubjects = new Set<string>();

      // Add subject NAMES from database (complete list)
      this.allSubjects.forEach((subject) => combinedSubjects.add(subject.name));

      // Add subjects from results (in case some subjects are in results but not in database)
      subjectsFromResults.forEach((subject) => combinedSubjects.add(subject));

      // Convert to sorted array
      this.subjects = Array.from(combinedSubjects).sort();

      // Load all students for class filtering
      this.loadAllStudents();
    });
  }

  getAvailableSubjects(): string[] {
    // Priority 1: Subjects from current exam results
    if (this.examResults.length > 0) {
      const subjectsFromResults = new Set<string>();
      this.examResults.forEach((r) =>
        Object.keys(r.subjectScores).forEach((s) => subjectsFromResults.add(s)),
      );

      if (subjectsFromResults.size > 0) {
        return Array.from(subjectsFromResults).sort();
      }
    }

    // Priority 2: Subject NAMES from database
    if (this.allSubjects.length > 0) {
      return this.allSubjects.map((s) => s.name).sort();
    }

    // Priority 3: Return whatever is in this.subjects
    return this.subjects;
  }

  loadAllStudents() {
    this.studentService.getAll().subscribe((res) => {
      this.allStudents = res.data || [];
    });
  }

  loadAnalysis() {
    if (!this.selectedExamId || !this.selectedSubject) return;

    // Check if the selected subject has data in this exam
    const hasData = this.checkSubjectHasData();

    if (!hasData) {
      // Show an error or empty state
      this.analysis = undefined;
      this.gradeChartData = { labels: [], datasets: [] };
      this.showNoDataMessage();
      return;
    }

    this.loading = true;

    if (this.selectedClassId) {
      // If class is selected, filter locally
      this.filterAnalysisLocally();
    } else {
      // If no class filter, use backend
      this.resultService
        .analyzeSubject(this.selectedExamId, this.selectedSubject)
        .subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.analysis = res.data;
              this.updateGradeChart();
            } else {
              this.handleNoData();
            }
            this.loading = false;
          },
          error: () => {
            this.handleNoData();
            this.loading = false;
          },
        });
    }
  }

  // Helper method to check if subject has data
  private checkSubjectHasData(): boolean {
    if (!this.selectedSubject || this.examResults.length === 0) {
      return false;
    }

    // Check if any student has a score for this subject
    return this.examResults.some((result) => {
      const score = result.subjectScores?.[this.selectedSubject!];
      return score !== null && score !== undefined;
    });
  }

  // Handle no data scenario
  private handleNoData() {
    this.analysis = undefined;
    this.gradeChartData = { labels: [], datasets: [] };
    // You could show a toast or message here
  }

  // Optional: Show a message when no data
  private showNoDataMessage() {
    // You could implement a toast or notification system
    console.warn(
      `No data available for subject "${this.selectedSubject}" in the selected exam`,
    );
  }

  // New method for local filtering
  filterAnalysisLocally() {
    if (
      !this.selectedExamId ||
      !this.selectedSubject ||
      !this.selectedClassId
    ) {
      this.loading = false;
      return;
    }

    // First check if subject has any data in this exam
    if (!this.checkSubjectHasData()) {
      this.analysis = undefined;
      this.gradeChartData = { labels: [], datasets: [] };
      this.loading = false;
      this.showNoDataMessage();
      return;
    }

    // Filter results by class
    const filteredResults = this.examResults.filter((result) => {
      const student = this.allStudents.find((s) => s.id === result.studentId);
      return student && student.classId === this.selectedClassId;
    });

    if (filteredResults.length === 0) {
      this.analysis = undefined;
      this.gradeChartData = { labels: [], datasets: [] };
      this.loading = false;
      return;
    }

    // Get scores for the selected subject
    const subjectScores = filteredResults
      .map((r) => r.subjectScores[this.selectedSubject!])
      .filter((score) => score !== null && score !== undefined) as number[];

    if (subjectScores.length === 0) {
      this.analysis = undefined;
      this.gradeChartData = { labels: [], datasets: [] };
      this.loading = false;
      return;
    }

    // Calculate statistics
    const highest = Math.max(...subjectScores);
    const lowest = Math.min(...subjectScores);
    const sum = subjectScores.reduce((a, b) => a + b, 0);
    const mean = sum / subjectScores.length;
    const count = subjectScores.length;

    // Calculate grade distribution
    const gradeDistribution: Record<string, number> = {};
    subjectScores.forEach((score) => {
      let grade = 'F';
      if (score >= 80) grade = 'A';
      else if (score >= 70) grade = 'B';
      else if (score >= 60) grade = 'C';
      else if (score >= 50) grade = 'D';
      else if (score >= 40) grade = 'E';

      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

    // Create analysis object
    this.analysis = {
      subject: this.selectedSubject!,
      highest,
      lowest,
      mean: Number(mean.toFixed(2)),
      count,
      gradeDistribution,
    };

    this.updateGradeChart();
    this.loading = false;
  }

  // Update applyClassFilter to trigger filtering
  applyClassFilter() {
    if (this.selectedExamId && this.selectedSubject) {
      this.loading = true;
      this.filterAnalysisLocally();
    }
  }

  // Clear class filter
  clearClassFilter() {
    this.selectedClassId = undefined;
    if (this.selectedExamId && this.selectedSubject) {
      this.loadAnalysis(); // Reload full analysis
    }
  }

  // Update grade chart with filtered data
  updateGradeChart() {
    if (
      !this.analysis?.gradeDistribution ||
      Object.keys(this.analysis.gradeDistribution).length === 0
    ) {
      this.gradeChartData = { labels: [], datasets: [] };
      return;
    }

    const labels = Object.keys(this.analysis.gradeDistribution);
    const data = Object.values(this.analysis.gradeDistribution);

    // Use more distinct colors
    const colors = [
      '#0C66EC', // Blue
      '#10B981', // Green
      '#F59E0B', // Orange
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#14B8A6', // Teal
    ];

    this.gradeChartData = {
      labels,
      datasets: [
        {
          data,
          label: `Students per Grade${this.selectedClassId ? ' (Filtered)' : ''}`,
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
          borderColor: labels.map((_, i) => colors[i % colors.length]),
          borderWidth: 1,
        },
      ],
    };
  }
  // Add this method to your component class
  getClassName(classId: string): string {
    const cls = this.classes.find((c) => c.id === classId);
    return cls ? `${cls.form}${cls.stream}` : 'Unknown Class';
  }

  getSubjectsWithData(): string[] {
    if (!this.selectedExamId || this.examResults.length === 0) {
      return [];
    }

    // Get subjects that actually have scores in this exam
    const subjectsWithData = new Set<string>();

    this.examResults.forEach((result) => {
      if (result.subjectScores) {
        Object.entries(result.subjectScores).forEach(([subject, score]) => {
          // Only include subjects with valid scores (not null/undefined)
          if (score !== null && score !== undefined) {
            subjectsWithData.add(subject);
          }
        });
      }
    });

    return Array.from(subjectsWithData).sort();
  }
}
