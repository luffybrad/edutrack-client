// src/app/shared/entities/result/exam-analytics-section/exam-analytics-section.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import {
  ResultService,
  ExamAnalytics,
  Result,
} from '../../../../services/result.service';
import { ExamService, Exam } from '../../../../services/exam.service';
import { Class, ClassService } from '../../../../services/class.service';

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

  classes: Class[] = [];
  selectedClassId?: string;

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
    private classService: ClassService,
  ) {}

  ngOnInit() {
    this.loadExams();
    this.loadClasses();
  }

  loadExams() {
    this.examService.getAll().subscribe((res) => {
      this.exams = (res.data || [])
        .filter((exam) => exam.id)
        .map((exam) => ({ id: exam.id!, name: exam.name }));
    });
  }

  loadClasses() {
    this.classService.getAll().subscribe((res) => {
      this.classes = (res.data || [])
        .map((cls) => cls) // Keep as objects
        .sort((a, b) =>
          `${a.form}${a.stream}`.localeCompare(`${b.form}${b.stream}`),
        );
    });
  }

  getClassName(classId: string): string {
    if (!classId) return '';
    const cls = this.classes.find((c) => c.id === classId);
    return cls ? `${cls.form}${cls.stream}` : classId;
  }

  onExamChange() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    if (!this.selectedExamId) return;

    this.loading = true;

    // Always fetch the full analytics first
    this.resultService.getExamAnalytics(this.selectedExamId).subscribe({
      next: (res) => {
        if (res.data) {
          if (this.selectedClassId) {
            // Filter the results by class on the frontend
            this.filterAnalyticsByClass(res.data, this.selectedClassId);
          } else {
            // Use full analytics
            this.analytics = res.data;
            this.calculateExamStats();
            this.updateCharts();
          }
        } else {
          this.analytics = undefined;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.analytics = undefined;
        this.loading = false;
      },
    });
  }

  // New method to calculate weak subjects for a specific class
  calculateWeakSubjectsForClass(performers: Result[]): Record<string, number> {
    if (!performers || performers.length === 0) {
      return {};
    }

    const weakSubjects: Record<string, number> = {};
    const allSubjects = Object.keys(performers[0].subjectScores || {});

    allSubjects.forEach((subject) => {
      const subjectScores = performers
        .map((p) => p.subjectScores[subject])
        .filter((score) => score !== null && score !== undefined)
        .map((score) => Number(score));

      if (subjectScores.length > 0) {
        const average =
          subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length;
        weakSubjects[subject] = Number(average.toFixed(2));
      }
    });

    return weakSubjects;
  }

  // New method to process results and calculate analytics locally
  processResultsForAnalytics(results: any[]) {
    console.log('Processing results for class filter:', {
      resultsCount: results?.length || 0,
      resultsSample: results?.slice(0, 2),
      firstResult: results?.[0],
    });

    if (!results || results.length === 0) {
      this.analytics = undefined;
      this.resetExamStats();
      return;
    }

    // Create Result objects for ALL students, not just top 5
    const allResults: Result[] = results
      .map((r) => ({
        id: r.id || '',
        examId: r.examId || '',
        studentId: r.studentId || '',
        subjectScores: r.subjectScores || {},
        totalScore: r.totalScore || 0,
        meanScore: r.meanScore || 0,
        grade: r.grade || '',
        student: r.student || { id: '', name: '', admNo: '' },
      }))
      .filter((r) => r.meanScore !== undefined && r.meanScore !== null);

    console.log('All results after processing:', {
      allResultsCount: allResults.length,
      sampleAllResults: allResults.slice(0, 2),
    });

    if (allResults.length === 0) {
      console.log('No valid results after filtering');
      this.analytics = undefined;
      this.resetExamStats();
      return;
    }
    // Take top 5 for display
    const topPerformers = [...allResults]
      .sort(
        (a, b) =>
          this.parseMeanScore(b.meanScore) - this.parseMeanScore(a.meanScore),
      )
      .slice(0, 5);

    console.log('Top performers:', {
      topPerformersCount: topPerformers.length,
      topPerformers: topPerformers,
    });

    // Calculate weak subjects from ALL results
    const weakSubjects: Record<string, number> = {};

    if (allResults.length > 0) {
      const allSubjects = Object.keys(allResults[0].subjectScores || {});

      allSubjects.forEach((subject) => {
        const subjectScores = allResults
          .map((r) => r.subjectScores[subject])
          .filter((score) => score !== null && score !== undefined)
          .map((score) => Number(score));

        if (subjectScores.length > 0) {
          const average =
            subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length;
          weakSubjects[subject] = Number(average.toFixed(2));
        }
      });
    }

    this.analytics = {
      topPerformers,
      weakSubjects,
    };

    this.calculateExamStats();
    this.updateCharts();
  }

  clearClassFilter() {
    this.selectedClassId = undefined;
    if (this.selectedExamId) {
      this.loadAnalytics();
    }
  }

  filterAnalyticsByClass(fullAnalytics: ExamAnalytics, classId: string) {
    console.log('Filtering analytics for class:', classId);
    console.log(
      'Full analytics sample:',
      fullAnalytics.topPerformers[0]?.student,
    );

    // Filter top performers by class - check both classId and class.id
    const classTopPerformers = fullAnalytics.topPerformers.filter(
      (performer) => {
        // Cast to any to handle the data structure
        const student = performer.student as any;

        if (!student) return false;

        // Check all possible class identifiers
        const matchesClass =
          student.classId === classId ||
          (student.class && student.class.id === classId);

        return matchesClass;
      },
    );

    console.log('Class filtering results:', {
      totalPerformers: fullAnalytics.topPerformers.length,
      classPerformers: classTopPerformers.length,
      classPerformersNames: classTopPerformers.map((p) => p.student?.name),
    });

    // Call this in filterAnalyticsByClass after filtering
    console.log('Debug - Matching students:');
    classTopPerformers.forEach((p, i) => {
      const student = p.student as any;
      console.log(`${i + 1}. ${p.student?.name} matches class ${classId}`);
      console.log('  classId:', student?.classId);
      console.log('  class object:', student?.class);
    });

    // For weak subjects, we need to recalculate based on class students only
    const weakSubjects = this.calculateWeakSubjectsForClass(classTopPerformers);

    this.analytics = {
      topPerformers: classTopPerformers,
      weakSubjects: weakSubjects,
    };

    this.calculateExamStats();
    this.updateCharts();
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
    if (!this.analytics) {
      // Reset stats to zero when no analytics data
      this.resetExamStats();
      return;
    }

    // Check if we have any performers
    if (
      !this.analytics.topPerformers ||
      this.analytics.topPerformers.length === 0
    ) {
      console.log('No top performers found, but analytics exists');
      this.examStats.totalStudents = 0;
      this.examStats.averageMeanScore = 0;
      this.examStats.highestMeanScore = 0;
      this.examStats.lowestMeanScore = 0;
      this.examStats.passRate = 0;
      return;
    }

    // Use mean scores from analytics
    const meanScores = this.analytics.topPerformers
      .map((r) => this.parseMeanScore(r.meanScore))
      .filter((score) => score >= 0);

    if (meanScores.length === 0) {
      this.resetExamStats();
      return;
    }

    // Set student count to actual number from results (not just top 5)
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

    // If class filter is applied, we need to fetch and calculate locally
    if (this.selectedClassId) {
      this.processComparisonWithClassFilter();
    } else {
      // Original logic
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
  }

  // New method for class-filtered comparison
  processComparisonWithClassFilter() {
    const comparisonPromises = this.comparisonExams.map((examId) =>
      this.resultService.getByExam(examId, this.selectedClassId).toPromise(),
    );

    Promise.all(comparisonPromises)
      .then((responses) => {
        const comparisonData: Record<string, any> = {};

        // Add class data
        comparisonData[this.selectedClassId!] = {};

        this.comparisonExams.forEach((examId, index) => {
          const response = responses[index];
          const results = response?.data?.results || [];

          if (results.length > 0) {
            // Calculate average mean score for this class in this exam
            const meanScores = results
              .map((r) => this.parseMeanScore(r.meanScore))
              .filter((score) => !isNaN(score));

            const average =
              meanScores.length > 0
                ? meanScores.reduce((a, b) => a + b, 0) / meanScores.length
                : 0;

            comparisonData[this.selectedClassId!][examId] = {
              average: Number(average.toFixed(2)),
              count: results.length,
              examName: this.getExamName(examId),
            };
          }
        });

        this.comparisonData = comparisonData;
        this.updateComparisonChart();
        this.activeTab = 'comparison';
        this.comparisonLoading = false;
      })
      .catch(() => {
        this.comparisonLoading = false;
      });
  }

  // Update the comparison chart method to handle class filtering
  updateComparisonChart() {
    if (!this.comparisonData || Object.keys(this.comparisonData).length === 0)
      return;

    // If class filter is applied, only show that class in comparison
    const labels = this.selectedClassId
      ? [this.selectedClassId]
      : Object.keys(this.comparisonData);

    const datasets: any[] = [];
    const colors = ['#0C66EC', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

    let examIndex = 0;

    this.comparisonExams.forEach((examId) => {
      const examData = labels.map((className) => {
        return this.comparisonData[className]?.[examId]?.average || 0;
      });

      datasets.push({
        label: this.getExamName(examId),
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

  getComparisonClassKeys(): string[] {
    if (this.selectedClassId) {
      return [this.selectedClassId];
    }
    return Object.keys(this.comparisonData || {});
  }

  // Add this method for safe data access
  getClassExamData(classId: string, examId: string): any {
    return this.comparisonData?.[classId]?.[examId];
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

  // Add this method to debug
  debugData() {
    console.log('Current state:', {
      selectedExamId: this.selectedExamId,
      selectedClassId: this.selectedClassId,
      analyticsExists: !!this.analytics,
      topPerformersCount: this.analytics?.topPerformers?.length || 0,
      analyticsSample: this.analytics?.topPerformers?.[0],
    });

    if (this.analytics?.topPerformers) {
      console.log('All performers with class info:');
      this.analytics.topPerformers.forEach((p, i) => {
        const student = p.student as any;
        console.log(
          `${i + 1}. ${p.student?.name} - ClassID: ${student?.classId}, ClassObj:`,
          student?.class,
        );
      });
    }
  }
}
