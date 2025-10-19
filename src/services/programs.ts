import { api } from '@/lib/api';

export type Program = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  collegeId: string;
  departmentId: string;
};

const map = (d: any): Program => ({
  id: d.program_id,
  name: d.program_name,
  code: d.code,
  description: d.description,
  collegeId: d.college_id,
  departmentId: d.department_id,
});

export const getProgramsByDepartment = async (departmentId: string): Promise<Program[]> => {
  const { data } = await api.get('/programs', { params: { department_id: departmentId } });
  return data.map(map);
};

export const createProgram = async (p: Omit<Program, 'id'>) => {
  const { data } = await api.post('/programs', {
    program_name: p.name,
    code: p.code,
    description: p.description,
    college_id: p.collegeId,
    department_id: p.departmentId,
  });
  return map(data);
};

export const updateProgram = async (id: string, p: Partial<Program>) => {
  const body: any = {};
  if (p.name !== undefined) body.program_name = p.name;
  if (p.code !== undefined) body.code = p.code;
  if (p.description !== undefined) body.description = p.description;
  if (p.collegeId !== undefined) body.college_id = p.collegeId;
  if (p.departmentId !== undefined) body.department_id = p.departmentId;
  const { data } = await api.put(`/programs/${id}`, body);
  return map(data);
};

export const deleteProgram = async (id: string) => api.delete(`/programs/${id}`);