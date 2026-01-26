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

  analysis?: SubjectAnalysis;
  loading = false;

  gradeChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { position: 'top' }, tooltip: { enabled: true } },
  };

  constructor(
    private resultService: ResultService,
    private examService: ExamService,
    private classService: ClassService,
    private studentService: StudentService,
  ) {}

  ngOnInit() {
    this.loadExams();
    this.loadClasses();
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

      // collect unique subjects across all students
      const subjectsSet = new Set<string>();
      this.examResults.forEach((r) =>
        Object.keys(r.subjectScores).forEach((s) => subjectsSet.add(s)),
      );
      this.subjects = Array.from(subjectsSet).sort();

      // Load all students for class filtering
      this.loadAllStudents();
    });
  }

  loadAllStudents() {
    this.studentService.getAll().subscribe((res) => {
      this.allStudents = res.data || [];
    });
  }

  loadAnalysis() {
    if (!this.selectedExamId || !this.selectedSubject) return;

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
            this.analysis = res.data;
            this.updateGradeChart();
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          },
        });
    }
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

    const colors = ['#0C66EC', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

    this.gradeChartData = {
      labels,
      datasets: [
        {
          data,
          label: `Students per Grade${this.selectedClassId ? ' (Filtered)' : ''}`,
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        },
      ],
    };
  }

  // Add this method to your component class
  getClassName(classId: string): string {
    const cls = this.classes.find((c) => c.id === classId);
    return cls ? `${cls.form}${cls.stream}` : 'Unknown Class';
  }
}
