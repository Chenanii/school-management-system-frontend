import { BookOpen, Boxes, CalendarDays, ClipboardCheck, ClipboardList, CreditCard, GraduationCap, LayoutDashboard, Network, UsersRound, UserRoundCog, Users, FileCheck2, Files, UserRoundPlus } from 'lucide-react';

export const sections = [
  { id: 'overview', label: 'Overview', group: 'Home', icon: LayoutDashboard },
  { id: 'academic-years', label: 'Academic years', group: 'Academic calendar', icon: CalendarDays, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] },
  { id: 'terms', label: 'Terms', group: 'Academic calendar', icon: CalendarDays, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] },
  { id: 'students', label: 'Students', group: 'Students', icon: GraduationCap, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] },
  { id: 'enrollments', label: 'Enrollments', group: 'Students', icon: UserRoundPlus, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'] },
  { id: 'teaching-assignments', label: 'Teaching assignments', group: 'Teaching & results', icon: ClipboardList, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] },
  { id: 'assessments', label: 'Assessments', group: 'Teaching & results', icon: ClipboardList, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] },
  { id: 'term-results', label: 'Term results', group: 'Teaching & results', icon: FileCheck2, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'] },
  { id: 'report-cards', label: 'Report cards', group: 'Teaching & results', icon: Files, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN', 'EXAMS_OFFICER'] },
  { id: 'promotions', label: 'Promotions', group: 'Teaching & results', icon: ClipboardCheck, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN', 'HEADTEACHER', 'ACADEMIC_ADMIN'] },
  { id: 'class-levels', label: 'Class levels', group: 'Curriculum & classes', icon: Boxes, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] },
  { id: 'class-groups', label: 'Class groups', group: 'Curriculum & classes', icon: UsersRound, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] },
  { id: 'subjects', label: 'Subjects', group: 'Curriculum & classes', icon: BookOpen, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] },
  { id: 'class-subjects', label: 'Class subjects', group: 'Curriculum & classes', icon: Network, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] },
  { id: 'staff', label: 'Teachers', group: 'Administration', icon: Users, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] },
  { id: 'users', label: 'User management', group: 'Administration', icon: UserRoundCog, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] },
  { id: 'subscriptions', label: 'Subscriptions', group: 'Administration', icon: CreditCard, roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] }
];
