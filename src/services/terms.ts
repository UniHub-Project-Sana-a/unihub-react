import { api } from '@/lib/api';

export type ProgramTerm = { id: string; programLevelId: string; termNumber: 1 | 2; title: string };

const map = (d: any): ProgramTerm => ({
  id: d.program_term_id,
  programLevelId: d.program_level_id,
  termNumber: d.term_number,
  title: d.title,
});

export const getTermsByLevel = async (programLevelId: string): Promise<ProgramTerm[]> => {
  const { data } = await api.get('/program-terms', { params: { program_level_id: programLevelId } });
  return data.map(map);
};

export const createTerm = async (p: Omit<ProgramTerm, 'id'>) => {
  const { data } = await api.post('/program-terms', {
    program_level_id: p.programLevelId,
    term_number: p.termNumber,
    title: p.title,
  });
  return map(data);
};

export const updateTerm = async (id: string, p: Partial<ProgramTerm>) => {
  const body: any = {};
  if (p.programLevelId !== undefined) body.program_level_id = p.programLevelId;
  if (p.termNumber !== undefined) body.term_number = p.termNumber;
  if (p.title !== undefined) body.title = p.title;
  const { data } = await api.put(`/program-terms/${id}`, body);
  return map(data);
};

export const deleteTerm = async (id: string) => api.delete(`/program-terms/${id}`);