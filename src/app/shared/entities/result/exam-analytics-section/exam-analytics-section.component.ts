// src/app/shared/entities/result/exam-analytics-section/exam-analytics-section.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import {
  ResultService,
  ExamAnalytics,
} from '../../../../services/result.service';
import { ExamService, Exam } from '../../../../services/exam.service';

@Component({
  selector: 'app-exam-analytics-section',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './exam-analytics-section.component.html',
})
export class ExamAnalyticsSectionComponent implements OnInit {
  exams: { id: string; name: string }[] = [];
  selectedExamId?: string;

  analytics?: ExamAnalytics;
  loading = false;

  topPerformersChart: ChartData<'bar'> = { labels: [], datasets: [] };
  weakSubjectsChart: ChartData<'bar'> = { labels: [], datasets: [] };

  // For total scores chart
  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('Mean') || label.includes('(%)')) {
              return `${label}: ${value.toFixed(1)}%`;
            }
            return `${label}: ${value.toFixed(1)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: string | number) {
            // Only add % for mean scores dataset
            const datasetIndex = (this as any).chart.data.datasets.findIndex(
              (d: any) => d.label.includes('Mean') || d.label.includes('(%)'),
            );
            const isMeanScore =
              datasetIndex !== -1 &&
              (this as any).chart.data.datasets[datasetIndex].label.includes(
                'Mean',
              );

            if (isMeanScore) {
              return value + '%';
            }
            return value;
          },
        },
      },
    },
  };

  // For comparison chart (only percentages)
  comparisonChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value: string | number) {
            return value + '%';
          },
        },
      },
    },
  };

  activeTab: 'overview' | 'performers' | 'subjects' | 'comparison' = 'overview';
  comparisonExams: string[] = [];
  comparisonData: Record<string, any> = {};
  comparisonLoading = false;

  // For detailed stats - UPDATED NAMES FOR CLARITY
  examStats = {
    totalStudents: 0,
    averageMeanScore: 0, // Changed from averageScore to averageMeanScore
    highestMeanScore: 0, // Changed from highestScore to highestMeanScore
    lowestMeanScore: 0, // Changed from lowestScore to lowestMeanScore
    gradeDistribution: {} as Record<string, number>,
    passRate: 0,
  };

  // Comparison chart
  comparisonChartData: ChartData<'line'> = { labels: [], datasets: [] };

  constructor(
    private resultService: ResultService,
    private examService: ExamService,
  ) {}

  ngOnInit() {
    this.loadExams();
  }

  loadExams() {
    this.examService.getAll().subscribe((res) => {
      this.exams = (res.data || [])
        .filter((exam) => exam.id)
        .map((exam) => ({ id: exam.id!, name: exam.name }));
    });
  }

  onExamChange() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    if (!this.selectedExamId) return;
    this.loading = true;
    this.resultService
      .getExamAnalytics(this.selectedExamId)
      .subscribe((res) => {
        this.analytics = res.data;
        this.calculateExamStats();
        this.updateCharts();
        this.loading = false;
      });
  }

  updateCharts() {
    if (!this.analytics) return;

    // Top performers chart - use raw total scores (no percentages)
    this.topPerformersChart = {
      labels: this.analytics.topPerformers.map((r) => r.student?.name || 'N/A'),
      datasets: [
        {
          data: this.analytics.topPerformers.map(
            (r) => this.parseTotalScore(r.totalScore), // Raw score without percentage
          ),
          label: 'Total Score',
          backgroundColor: '#0C66EC',
        },
        {
          data: this.analytics.topPerformers.map(
            (r) => this.parseMeanScore(r.meanScore), // Mean score with percentage
          ),
          label: 'Mean Score (%)',
          backgroundColor: '#3B82F6',
        },
      ],
    };

    // Weak subjects chart - mean scores as percentages
    this.weakSubjectsChart = {
      labels: Object.keys(this.analytics.weakSubjects || {}),
      datasets: [
        {
          data: Object.values(this.analytics.weakSubjects || {}),
          label: 'Average Score (%)',
          backgroundColor: '#3B82F6',
        },
      ],
    };
  }

  calculateExamStats() {
    if (!this.analytics?.topPerformers?.length) {
      // Reset stats to zero when no data
      this.resetExamStats();
      return;
    }

    // Get mean scores instead of total scores
    const meanScores = this.analytics.topPerformers
      .map((r) => this.parseMeanScore(r.meanScore))
      .filter((score) => score >= 0);

    if (meanScores.length === 0) {
      this.resetExamStats();
      return;
    }

    this.examStats.totalStudents = meanScores.length;
    this.examStats.highestMeanScore = Math.max(...meanScores);
    this.examStats.lowestMeanScore = Math.min(...meanScores);

    // Calculate average of mean scores (this will be percentage)
    const sum = meanScores.reduce((a, b) => a + b, 0);
    this.examStats.averageMeanScore = Number(
      (sum / meanScores.length).toFixed(2),
    );

    // Calculate actual grade distribution from data
    this.calculateGradeDistribution();

    // Calculate pass rate based on grades A, B, C
    this.calculatePassRateByGrade();
  }

  private resetExamStats(): void {
    this.examStats = {
      totalStudents: 0,
      averageMeanScore: 0,
      highestMeanScore: 0,
      lowestMeanScore: 0,
      gradeDistribution: {} as Record<string, number>,
      passRate: 0,
    };
  }

  // Helper method for grade distribution using actual data
  private calculateGradeDistribution(): void {
    if (!this.analytics?.topPerformers) {
      this.examStats.gradeDistribution = {};
      return;
    }

    const gradeCounts: Record<string, number> = {};

    this.analytics.topPerformers.forEach((performer) => {
      const grade = performer.grade || 'N/A';
      gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
    });

    this.examStats.gradeDistribution = gradeCounts;
  }

  // Calculate pass rate based on grades A, B, C
  private calculatePassRateByGrade(): void {
    if (!this.analytics?.topPerformers) {
      this.examStats.passRate = 0;
      return;
    }

    // Count students with passing grades (A, B, C)
    const passingGrades = ['A', 'B', 'C'];
    let passingCount = 0;

    this.analytics.topPerformers.forEach((performer) => {
      const grade = performer.grade || '';
      if (passingGrades.includes(grade.toUpperCase())) {
        passingCount++;
      }
    });

    // Calculate pass rate percentage
    this.examStats.passRate = Number(
      ((passingCount / this.examStats.totalStudents) * 100).toFixed(1),
    );
  }

  toggleExamComparison(examId: string) {
    const index = this.comparisonExams.indexOf(examId);
    if (index > -1) {
      this.comparisonExams.splice(index, 1);
    } else {
      this.comparisonExams.push(examId);
    }
  }

  compareSelectedExams() {
    if (this.comparisonExams.length < 2) {
      // Show error message
      return;
    }

    this.comparisonLoading = true;
    this.resultService
      .compareClassesAcrossExams(this.comparisonExams)
      .subscribe({
        next: (res) => {
          this.comparisonData = res.data || {};
          this.updateComparisonChart();
          this.activeTab = 'comparison';
          this.comparisonLoading = false;
        },
        error: () => {
          this.comparisonLoading = false;
        },
      });
  }

  updateComparisonChart() {
    if (!this.comparisonData || Object.keys(this.comparisonData).length === 0)
      return;

    const labels = Object.keys(this.comparisonData);
    const datasets: any[] = [];
    const colors = ['#0C66EC', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

    // For each exam in the first class, create a dataset
    const firstClass = Object.values(this.comparisonData)[0];
    let examIndex = 0;

    Object.keys(firstClass).forEach((examId) => {
      const examData = Object.values(this.comparisonData).map(
        (classData: any) => {
          return classData[examId]?.average || 0;
        },
      );

      datasets.push({
        label: firstClass[examId]?.examName || `Exam ${examIndex + 1}`,
        data: examData,
        borderColor: colors[examIndex % colors.length],
        backgroundColor: colors[examIndex % colors.length] + '20',
        fill: false,
        tension: 0.3,
      });
      examIndex++;
    });

    this.comparisonChartData = { labels, datasets };
  }

  getWeakSubjectColor(score: number): string {
    if (score >= 70) return 'text-emerald-600 bg-emerald-50';
    if (score >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  }

  getGradeColor(grade: string): string {
    const gradeColors: Record<string, string> = {
      A: 'text-emerald-600 bg-emerald-50',
      B: 'text-blue-600 bg-blue-50',
      C: 'text-amber-600 bg-amber-50',
      D: 'text-orange-600 bg-orange-50',
      E: 'text-red-600 bg-red-50',
      F: 'text-red-700 bg-red-100',
    };
    return gradeColors[grade] || 'text-gray-600 bg-gray-50';
  }

  // Add this method to your component class
  getGradeKeys(): string[] {
    return Object.keys(this.examStats.gradeDistribution || {});
  }

  // Add this method to your component class
  getSubjectKeys(): string[] {
    return Object.keys(this.analytics?.weakSubjects || {});
  }

  // Also add this for safe access
  getSubjectScore(subject: string): number {
    return this.analytics?.weakSubjects?.[subject] || 0;
  }

  // Add this method to your component class
  hasComparisonData(): boolean {
    return Object.keys(this.comparisonData || {}).length > 0;
  }

  // Add this method to your component class
  getExamName(examId: string): string {
    const exam = this.exams.find((e) => e.id === examId);
    return exam?.name || examId;
  }

  // Add this method to your component class (you might already have it)
  getComparisonClassKeys(): string[] {
    return Object.keys(this.comparisonData || {});
  }

  // Add this method for safe data access
  getClassExamData(className: string, examId: string): any {
    return this.comparisonData?.[className]?.[examId];
  }

  getSafeAverageScore(): number {
    const score = this.examStats?.averageMeanScore;

    // Convert to number if it's a string
    const numScore = typeof score === 'string' ? parseFloat(score) : score;

    if (
      numScore === undefined ||
      numScore === null ||
      isNaN(numScore) ||
      typeof numScore !== 'number'
    ) {
      return 0;
    }

    // Ensure it's a valid number between 0-100
    return Math.max(0, Math.min(100, numScore));
  }

  // Add these methods to your component class
  parseTotalScore(score: any): number {
    if (!score) return 0;

    // If it's a string, remove any percentage symbols and convert
    if (typeof score === 'string') {
      // Remove percentage signs and any whitespace
      const cleaned = score.replace(/%/g, '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }

    // If it's already a number, just return it
    const num = Number(score);
    return isNaN(num) ? 0 : num;
  }

  parseMeanScore(score: any): number {
    if (!score) return 0;

    // Mean score should be treated as a percentage
    if (typeof score === 'string') {
      // Remove percentage signs and any whitespace
      const cleaned = score.replace(/%/g, '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }

    const num = Number(score);
    return isNaN(num) ? 0 : num;
  }
}
