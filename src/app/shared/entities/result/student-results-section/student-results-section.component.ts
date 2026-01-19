// src/app/shared/entities/result/student-results-section/student-results-section.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import {
  ResultService,
  StudentComparison,
  SubjectProgression,
  StudentImprovement,
} from '../../../../services/result.service';
import { StudentService, Student } from '../../../../services/student.service';
import { map } from 'rxjs';
import { AuthService } from '../../../../auth/auth.service';
import { RoleType } from '../../../../auth/auth.routes';

@Component({
  selector: 'app-student-results-section',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './student-results-section.component.html',
})
export class StudentResultsSectionComponent implements OnInit {
  students: { id: string; name: string }[] = [];
  selectedStudentId?: string;
  guardianId: string | null = null;
  RoleType: RoleType | null = null;

  comparisons: StudentComparison[] = [];
  progression?: SubjectProgression;
  improvement: StudentImprovement[] = [];

  loading = false;

  progressionChartData: ChartData<'line'> = { labels: [], datasets: [] };
  progressionChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: { tooltip: { enabled: true }, legend: { position: 'top' } },
  };

  constructor(
    private resultService: ResultService,
    private studentService: StudentService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.loadStudents();
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.authService.getProfile$().subscribe((profile) => {
      if (profile) {
        this.RoleType = profile.role;
        if (profile.role === RoleType.Guardian) {
          this.guardianId = profile.id;
        }
      }
    });
  }

  loadStudents() {
    this.studentService.getAll().subscribe((res) => {
      let filteredStudents = (res.data || []).filter((s) => s.id);

      // Filter students by guardian if user is a guardian
      if (this.RoleType === RoleType.Guardian && this.guardianId) {
        filteredStudents = filteredStudents.filter(
          (s) => s.guardianId === this.guardianId,
        );
      }

      this.students = filteredStudents.map((s) => ({
        id: s.id!,
        name: s.name,
      }));
    });
  }

  onStudentChange() {
    this.loadStudentData();
  }

  loadStudentData() {
    if (!this.selectedStudentId) return;

    this.loading = true;
    this.comparisons = [];
    this.progression = undefined;
    this.improvement = [];

    this.resultService.compareStudent(this.selectedStudentId).subscribe({
      next: (res) => {
        this.comparisons = res.data || [];
        this.calculateStudentStats();

        this.loading = false;
      },
      error: () => (this.loading = false),
    });

    this.resultService
      .trackSubjectProgression(this.selectedStudentId)
      .subscribe({
        next: (res) => {
          this.progression = res.data || undefined;
          this.updateProgressionChart();
          this.updateMeanTrendChart();
        },
        error: () => (this.progression = undefined),
      });

    this.resultService.studentImprovement(this.selectedStudentId).subscribe({
      next: (res) => {
        this.improvement = res.data || [];
        this.updateImprovementChart();
      },
      error: () => (this.improvement = []),
    });
  }

  updateProgressionChart() {
    if (!this.progression) return;

    const labels = this.progression.meanTrend.map((t) => t.examName);
    const datasets = Object.keys(this.progression.progression).map(
      (subject) => ({
        data: this.progression!.progression[subject].map((p) => p.score),
        label: subject,
        fill: false,
        tension: 0.3,
        borderColor: this.getColor(subject),
      }),
    );

    this.progressionChartData = { labels, datasets };
  }

  private getColor(subject: string): string {
    const colorMap: Record<string, string> = {
      Math: '#0C66EC',
      English: '#3B82F6',
      Science: '#60A5FA',
      History: '#93C5FD',
      default: '#BFDBFE',
    };
    return colorMap[subject] || colorMap['default'];
  }

  // Add after existing properties
  meanTrendChartData: ChartData<'line'> = { labels: [], datasets: [] };
  meanTrendChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      tooltip: { enabled: true },
      legend: { position: 'top' },
      // Remove annotation property
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: function (value: string | number) {
            const numValue =
              typeof value === 'string' ? parseFloat(value) : value;
            return numValue.toFixed(0) + '%';
          },
        },
      },
    },
  };

  improvementChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  improvementChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      tooltip: { enabled: true },
      legend: { position: 'top' },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: string | number) {
            // Convert to number before comparison
            const numValue =
              typeof value === 'string' ? parseFloat(value) : value;
            return numValue > 0
              ? '+' + numValue.toFixed(1) + '%'
              : numValue.toFixed(1) + '%';
          },
        },
      },
    },
  };

  // For tab navigation
  activeTab: 'overview' | 'progress' | 'improvement' | 'details' = 'overview';

  // For stats
  studentStats = {
    bestSubject: '',
    worstSubject: '',
    highestScore: 0,
    lowestScore: 0,
    avgScore: 0,
    trend: 'stable',
  };

  calculateStudentStats() {
    if (!this.comparisons.length) return;

    const latestResult = this.comparisons[this.comparisons.length - 1];
    const subjectScores = Object.entries(latestResult.subjectScores || {});

    if (subjectScores.length === 0) return;

    // Filter out null/undefined scores and convert to numbers
    const validSubjectScores = subjectScores
      .filter(([subject, score]) => score != null && !isNaN(Number(score)))
      .map(([subject, score]) => [subject, Number(score)] as [string, number]);

    if (validSubjectScores.length === 0) return;

    // Sort by score (descending)
    const sortedSubjects = [...validSubjectScores].sort((a, b) => b[1] - a[1]);

    // Find best and worst subjects
    this.studentStats.bestSubject = sortedSubjects[0][0];
    this.studentStats.worstSubject =
      sortedSubjects[sortedSubjects.length - 1][0];

    // Calculate scores
    const scores = validSubjectScores.map((s) => s[1]);
    this.studentStats.highestScore = Math.max(...scores);
    this.studentStats.lowestScore = Math.min(...scores);
    this.studentStats.avgScore = Number(
      (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
    );

    // Determine trend
    if (this.comparisons.length > 1) {
      const firstMean = this.comparisons[0].meanScore || 0;
      const lastMean =
        this.comparisons[this.comparisons.length - 1].meanScore || 0;
      this.studentStats.trend =
        lastMean > firstMean
          ? 'improving'
          : lastMean < firstMean
            ? 'declining'
            : 'stable';
    }
  }

  updateMeanTrendChart() {
    if (!this.progression?.meanTrend.length) return;

    const labels = this.progression.meanTrend.map((t) => t.examName);
    const data = this.progression.meanTrend.map((t) => t.meanScore);

    this.meanTrendChartData = {
      labels,
      datasets: [
        {
          data,
          label: 'Mean Score Trend',
          borderColor: '#0C66EC',
          backgroundColor: 'rgba(12, 102, 236, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#0C66EC',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    };
  }

  updateImprovementChart() {
    if (!this.improvement.length) return;

    const labels = this.improvement.map((i) => i.examName);
    const data = this.improvement.map((i) => i.delta);

    this.improvementChartData = {
      labels,
      datasets: [
        {
          data,
          label: 'Improvement (Δ)',
          backgroundColor: data.map((d) => (d > 0 ? '#10B981' : '#EF4444')),
          borderColor: data.map((d) => (d > 0 ? '#059669' : '#DC2626')),
          borderWidth: 1,
        },
      ],
    };
  }

  // Helper method to get trend icon
  getTrendIcon(): string {
    switch (this.studentStats.trend) {
      case 'improving':
        return 'fas fa-arrow-up text-emerald-600';
      case 'declining':
        return 'fas fa-arrow-down text-red-600';
      default:
        return 'fas fa-minus text-gray-600';
    }
  }

  // Helper method to get grade color
  getGradeColor(grade: string): string {
    const gradeColors: Record<string, string> = {
      A: 'text-emerald-600 bg-emerald-50',
      B: 'text-blue-600 bg-blue-50',
      C: 'text-amber-600 bg-amber-50',
      D: 'text-orange-600 bg-orange-50',
      E: 'text-red-600 bg-red-50',
      F: 'text-red-700 bg-red-100',
    };
    return gradeColors[grade.charAt(0)] || 'text-gray-600 bg-gray-50';
  }

  // Add these methods to your component class
  getTotalImprovement(): number {
    if (!this.improvement.length) return 0;
    return Number(
      this.improvement.reduce((sum, i) => sum + (i.delta || 0), 0).toFixed(1),
    );
  }

  getAverageImprovement(): number {
    if (!this.improvement.length) return 0;
    const total = this.improvement.reduce((sum, i) => sum + (i.delta || 0), 0);
    return Number((total / this.improvement.length).toFixed(1));
  }
}
