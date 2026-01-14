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

@Component({
  selector: 'app-student-results-section',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './student-results-section.component.html',
})
export class StudentResultsSectionComponent implements OnInit {
  students: { id: string; name: string }[] = [];
  selectedStudentId?: string;

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
    private studentService: StudentService
  ) {}

  ngOnInit() {
    this.loadStudents();
  }

  loadStudents() {
    this.studentService.getAll().subscribe((res) => {
      this.students = (res.data || [])
        .filter((s) => s.id)
        .map((s) => ({ id: s.id!, name: s.name }));
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
        },
        error: () => (this.progression = undefined),
      });

    this.resultService.studentImprovement(this.selectedStudentId).subscribe({
      next: (res) => (this.improvement = res.data || []),
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
      })
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
}
