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
  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: { enabled: true },
    },
  };

  constructor(
    private resultService: ResultService,
    private examService: ExamService
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
        this.updateCharts();
        this.loading = false;
      });
  }

  updateCharts() {
    if (!this.analytics) return;

    // Top performers chart
    this.topPerformersChart = {
      labels: this.analytics.topPerformers.map((r) => r.student?.name || 'N/A'),
      datasets: [
        {
          data: this.analytics.topPerformers.map((r) => r.totalScore),
          label: 'Total Score',
          backgroundColor: '#0C66EC',
        },
      ],
    };

    // Weak subjects chart
    this.weakSubjectsChart = {
      labels: Object.keys(this.analytics.weakSubjects),
      datasets: [
        {
          data: Object.values(this.analytics.weakSubjects),
          label: 'Average Score',
          backgroundColor: '#3B82F6',
        },
      ],
    };
  }
}
