import { api } from '@/lib/api';

export type Department = { id: string; name: string; code?: string | null; collegeId: string };

const map = (d: any): Department => ({
  id: d.department_id,
  name: d.department_name,
  code: d.department_code,
  collegeId: d.college_id,
});

export const getDepartmentsByCollege = async (collegeId: string): Promise<Department[]> => {
  const { data } = await api.get('/departments', { params: { college_id: collegeId } });
  return data.map(map);
};

export const createDepartment = async (p: Omit<Department, 'id'>) => {
  const { data } = await api.post('/departments', {
    department_name: p.name,
    department_code: p.code,
    college_id: p.collegeId,
  });
  return map(data);
};

export const updateDepartment = async (id: string, p: Partial<Department>) => {
  const body: any = {};
  if (p.name !== undefined) body.department_name = p.name;
  if (p.code !== undefined) body.department_code = p.code;
  if (p.collegeId !== undefined) body.college_id = p.collegeId;
  const { data } = await api.put(`/departments/${id}`, body);
  return map(data);
};

export const deleteDepartment = async (id: string) => api.delete(`/departments/${id}`);