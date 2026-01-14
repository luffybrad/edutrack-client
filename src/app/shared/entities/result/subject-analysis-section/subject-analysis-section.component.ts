// src/app/shared/entities/result/subject-analysis-section/subject-analysis-section.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import {
  ResultService,
  SubjectAnalysis,
} from '../../../../services/result.service';
import { ExamService, Exam } from '../../../../services/exam.service';

@Component({
  selector: 'app-subject-analysis-section',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './subject-analysis-section.component.html',
})
export class SubjectAnalysisSectionComponent implements OnInit {
  exams: Exam[] = [];
  subjects: string[] = [];

  selectedExamId?: string;
  selectedSubject?: string;

  analysis?: SubjectAnalysis;
  loading = false;

  gradeChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { position: 'top' }, tooltip: { enabled: true } },
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
      this.exams = res.data || [];
    });
  }

  onExamChange() {
    if (!this.selectedExamId) return;

    this.selectedSubject = undefined;
    this.analysis = undefined;

    // Fetch subjects dynamically from results
    this.resultService.getByExam(this.selectedExamId).subscribe((res) => {
      const results = res.data?.results || [];
      // collect unique subjects across all students
      const subjectsSet = new Set<string>();
      results.forEach((r) =>
        Object.keys(r.subjectScores).forEach((s) => subjectsSet.add(s))
      );
      this.subjects = Array.from(subjectsSet).sort();
    });
  }

  loadAnalysis() {
    if (!this.selectedExamId || !this.selectedSubject) return;
    this.loading = true;
    this.resultService
      .analyzeSubject(this.selectedExamId, this.selectedSubject)
      .subscribe((res) => {
        this.analysis = res.data;
        this.updateGradeChart();
        this.loading = false;
      });
  }

  updateGradeChart() {
    if (!this.analysis?.gradeDistribution) return;

    const labels = Object.keys(this.analysis.gradeDistribution);
    const data = Object.values(this.analysis.gradeDistribution);

    const colors = ['#0C66EC', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

    this.gradeChartData = {
      labels,
      datasets: [
        {
          data,
          label: 'Students per Grade',
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        },
      ],
    };
  }
}
