import { Award, BookOpen, Boxes, Building2, CalendarDays, ClipboardCheck, ClipboardList, CreditCard, GraduationCap, LayoutDashboard, Network, UsersRound, UserRoundCog, Users, FileCheck2, Files, UserRoundPlus, History } from 'lucide-react';

export const sections = [
  { id: 'overview', label: 'Overview', group: 'Home', icon: LayoutDashboard },
  { id: 'school-profile', label: 'School profile', group: 'Administration', icon: Building2, roles: ['SCHOOL_ADMIN', 'HEADTEACHER'] },
  { id: 'academic-years', label: 'Academic years', group: 'Academic calendar', icon: CalendarDays, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'] },
  { id: 'grading-scales', label: 'Grading scales', group: 'Academic calendar', icon: Award, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'] },
  { id: 'terms', label: 'Terms', group: 'Academic calendar', icon: CalendarDays, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'] },
  { id: 'students', label: 'Students', group: 'Students', icon: GraduationCap, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'TEACHER'] },
  { id: 'enrollments', label: 'Enrollments', group: 'Students', icon: UserRoundPlus, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'] },
  { id: 'teaching-assignments', label: 'Teaching assignments', group: 'Teaching & results', icon: ClipboardList, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'] },
  { id: 'assessments', label: 'Assessments', group: 'Teaching & results', icon: ClipboardList, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'EXAMS_OFFICER', 'TEACHER'] },
  { id: 'term-results', label: 'Term results', group: 'Teaching & results', icon: FileCheck2, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'] },
  { id: 'report-cards', label: 'Report cards', group: 'Teaching & results', icon: Files, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER', 'TEACHER'] },
  { id: 'promotions', label: 'Promotions', group: 'Teaching & results', icon: ClipboardCheck, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN'] },
  { id: 'class-levels', label: 'Class levels', group: 'Curriculum & classes', icon: Boxes, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'] },
  { id: 'class-groups', label: 'Class groups', group: 'Curriculum & classes', icon: UsersRound, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'] },
  { id: 'subjects', label: 'Subjects', group: 'Curriculum & classes', icon: BookOpen, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'] },
  { id: 'class-subjects', label: 'Class subjects', group: 'Curriculum & classes', icon: Network, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'] },
  { id: 'staff', label: 'Teachers', group: 'Administration', icon: Users, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'] },
  { id: 'users', label: 'User management', group: 'Administration', icon: UserRoundCog, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER'] },
  { id: 'audit-logs', label: 'Audit log', group: 'Administration', icon: History, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'] },
  { id: 'subscriptions', label: 'Subscriptions', group: 'Administration', icon: CreditCard, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] }
];
