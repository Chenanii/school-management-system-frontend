import { ClipboardList } from 'lucide-react';
import FormTutorReportDetailsPanel from './FormTutorReportDetailsPanel.jsx';

export default function FormTutorAssessmentsPage({ signOut }) {
  return <>
    <div className="welcome-row students-welcome"><div><p className="eyebrow">Form tutor workspace</p><h1 className="page-title">Assessments & reports<span className="title-dot">.</span></h1><p className="mt-2 text-sm text-muted">Enter report comments and promotion details for your assigned class.</p></div></div>
    <div className="form-tutor-assessments-intro"><ClipboardList size={18} /><span>Assessment marks are managed in Assessments. Use this section to complete the student comments and other report details.</span></div>
    <FormTutorReportDetailsPanel signOut={signOut} />
  </>;
}
