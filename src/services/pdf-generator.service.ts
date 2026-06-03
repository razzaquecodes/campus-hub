import * as Print from 'expo-print';
import type { StudentModel } from '@/types/student';
import type { SemesterResult } from '@/hooks/queries/use-results';

export async function generateGradeCardPDF(
  student: StudentModel,
  semesterResult: SemesterResult
): Promise<string> {
  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e1e2e; }
          .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #4f46e5; font-size: 28px; letter-spacing: -0.5px; }
          .header p { margin: 5px 0 0 0; color: #64748b; font-size: 14px; }
          .student-info { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 20px; border-radius: 12px; }
          .info-block { font-size: 12px; }
          .info-block strong { color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px; display: block; margin-bottom: 4px; }
          .info-block span { font-size: 14px; font-weight: 600; color: #0f172a; }
          .results-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
          .results-header h2 { margin: 0; font-size: 18px; color: #334155; }
          .sgpa-box { background: #4f46e5; color: white; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { text-align: left; padding: 12px 16px; background: #f1f5f9; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; border-radius: 6px; }
          td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; font-weight: 500; }
          .grade-badge { padding: 4px 8px; border-radius: 4px; background: #e0e7ff; color: #3730a3; font-weight: bold; font-size: 12px; }
          .footer { text-align: center; margin-top: 50px; font-size: 10px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Campus Hub · Academic Grade Card</h1>
          <p>Verified Student Transcript — Generated via MAKAUT Portal</p>
        </div>
        <div class="student-info">
          <div class="info-block"><strong>Student Name</strong><span>${student.fullName}</span></div>
          <div class="info-block"><strong>Roll Number</strong><span>${student.rollNumber}</span></div>
          <div class="info-block"><strong>Registration No</strong><span>${student.registrationNumber}</span></div>
          <div class="info-block"><strong>Course</strong><span>${student.courseName}</span></div>
          <div class="info-block"><strong>Institute</strong><span>${student.instituteName}</span></div>
          <div class="info-block"><strong>ABC ID</strong><span>${student.abcId || 'N/A'}</span></div>
        </div>
        
        <div class="results-header">
          <h2>Semester ${semesterResult.semester} Results</h2>
          <div class="sgpa-box">SGPA: ${semesterResult.sgpa || 'N/A'}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Subject Code</th>
              <th>Subject Name</th>
              <th>Credits</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            ${semesterResult.subjects.map(s => `
              <tr>
                <td>${s.subjectCode}</td>
                <td>${s.subjectName}</td>
                <td>${s.credit}</td>
                <td><span class="grade-badge">${s.grade}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by Campus Hub app. This document is for informational purposes only.
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

export async function generateAcademicSummaryPDF(
  student: StudentModel,
  allSemesters: SemesterResult[]
): Promise<string> {
  const latestCgpa = allSemesters[0]?.cgpa || 'N/A';
  
  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e1e2e; }
          .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #4f46e5; font-size: 28px; letter-spacing: -0.5px; }
          .header p { margin: 5px 0 0 0; color: #64748b; font-size: 14px; }
          .student-info { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 20px; border-radius: 12px; }
          .info-block { font-size: 12px; }
          .info-block strong { color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px; display: block; margin-bottom: 4px; }
          .info-block span { font-size: 14px; font-weight: 600; color: #0f172a; }
          .summary-card { background: #4f46e5; color: white; padding: 20px; border-radius: 12px; display: flex; justify-content: space-around; margin-bottom: 30px; }
          .summary-item { text-align: center; }
          .summary-item span { display: block; font-size: 24px; font-weight: 800; }
          .summary-item small { font-size: 10px; text-transform: uppercase; opacity: 0.8; letter-spacing: 0.5px; }
          
          .semester-block { margin-bottom: 30px; page-break-inside: avoid; }
          .semester-title { font-size: 16px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; }
          .semester-title strong { color: #4f46e5; }
          
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 8px 10px; background: #f1f5f9; color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; }
          td { padding: 8px 10px; border-bottom: 1px solid #f8fafc; font-size: 12px; color: #334155; }
          .footer { text-align: center; margin-top: 50px; font-size: 10px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Campus Hub · Academic Summary</h1>
          <p>Comprehensive Academic Record</p>
        </div>
        
        <div class="student-info">
          <div class="info-block"><strong>Student Name</strong><span>${student.fullName}</span></div>
          <div class="info-block"><strong>Roll Number</strong><span>${student.rollNumber}</span></div>
          <div class="info-block"><strong>Course</strong><span>${student.courseName}</span></div>
          <div class="info-block"><strong>Institute</strong><span>${student.instituteName}</span></div>
        </div>

        <div class="summary-card">
          <div class="summary-item">
            <span>${latestCgpa}</span>
            <small>Overall CGPA</small>
          </div>
          <div class="summary-item">
            <span>${allSemesters.length}</span>
            <small>Semesters</small>
          </div>
          <div class="summary-item">
            <span>${allSemesters.reduce((acc, s) => acc + s.subjects.length, 0)}</span>
            <small>Subjects Done</small>
          </div>
        </div>

        ${allSemesters.map(sem => `
          <div class="semester-block">
            <div class="semester-title">
              <span>Semester ${sem.semester}</span>
              <strong>SGPA: ${sem.sgpa || 'N/A'}</strong>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 15%">Code</th>
                  <th style="width: 60%">Subject Name</th>
                  <th style="width: 10%">Cr</th>
                  <th style="width: 15%">Grade</th>
                </tr>
              </thead>
              <tbody>
                ${sem.subjects.map(sub => `
                  <tr>
                    <td>${sub.subjectCode}</td>
                    <td>${sub.subjectName}</td>
                    <td>${sub.credit}</td>
                    <td><strong>${sub.grade}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}

        <div class="footer">
          Generated automatically by Campus Hub app. This document is for informational purposes only.
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}
