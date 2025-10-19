import { api } from '@/lib/api';

export type College = { id: string; name: string; academicCode: string };

const map = (d: any): College => ({
  id: d.college_id,
  name: d.college_name,
  academicCode: d.academic_code,
});

export const getColleges = async (): Promise<College[]> => {
  const { data } = await api.get('/colleges');
  return data.map(map);
};

export const createCollege = async (p: Omit<College, 'id'>) => {
  const { data } = await api.post('/colleges', {
    college_name: p.name,
    academic_code: p.academicCode,
  });
  return map(data);
};

export const updateCollege = async (id: string, p: Partial<College>) => {
  const body: any = {};
  if (p.name !== undefined) body.college_name = p.name;
  if (p.academicCode !== undefined) body.academic_code = p.academicCode;
  const { data } = await api.put(`/colleges/${id}`, body);
  return map(data);
};

export const deleteCollege = async (id: string) => api.delete(`/colleges/${id}`);