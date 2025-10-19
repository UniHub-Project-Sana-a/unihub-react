import { api } from '@/lib/api';

export type ProgramCourse = {
  id: string;
  programTermId: string;
  programLevelId: string;
  courseCode: string;
  courseName: string;
  creditHours: number;
  isElective: boolean;
  departmentId?: string | null;
  notes?: string | null;
};

const map = (d: any): ProgramCourse => ({
  id: d.id,
  programTermId: d.program_term_id,
  programLevelId: d.program_level_id,
  courseCode: d.course_code,
  courseName: d.course_name,
  creditHours: d.credit_hours,
  isElective: !!d.is_elective,
  departmentId: d.department_id,
  notes: d.notes,
});

export const getCoursesByTerm = async (programTermId: string): Promise<ProgramCourse[]> => {
  const { data } = await api.get('/program-courses', { params: { program_term_id: programTermId } });
  return data.map(map);
};

export const createCourse = async (p: Omit<ProgramCourse, 'id' | 'programLevelId'>) => {
  const { data } = await api.post('/program-courses', {
    program_term_id: p.programTermId,
    course_code: p.courseCode,
    course_name: p.courseName,
    credit_hours: p.creditHours,
    is_elective: p.isElective,
    department_id: p.departmentId,
    notes: p.notes,
  });
  return map(data);
};

export const updateCourse = async (id: string, p: Partial<ProgramCourse>) => {
  const body: any = {};
  if (p.programTermId !== undefined) body.program_term_id = p.programTermId;
  if (p.courseCode !== undefined) body.course_code = p.courseCode;
  if (p.courseName !== undefined) body.course_name = p.courseName;
  if (p.creditHours !== undefined) body.credit_hours = p.creditHours;
  if (p.isElective !== undefined) body.is_elective = p.isElective;
  if (p.departmentId !== undefined) body.department_id = p.departmentId;
  if (p.notes !== undefined) body.notes = p.notes;
  const { data } = await api.put(`/program-courses/${id}`, body);
  return map(data);
};

export const deleteCourse = async (id: string) => api.delete(`/program-courses/${id}`);