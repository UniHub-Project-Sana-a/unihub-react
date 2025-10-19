import { api } from '@/lib/api';

export type ProgramLevel = { id: string; programId: string; levelNumber: number; title: string };

const map = (d: any): ProgramLevel => ({
  id: d.program_level_id,
  programId: d.program_id,
  levelNumber: d.level_number,
  title: d.title,
});

export const getLevelsByProgram = async (programId: string): Promise<ProgramLevel[]> => {
  const { data } = await api.get('/program-levels', { params: { program_id: programId } });
  return data.map(map);
};

export const createLevel = async (p: Omit<ProgramLevel, 'id'>) => {
  const { data } = await api.post('/program-levels', {
    program_id: p.programId,
    level_number: p.levelNumber,
    title: p.title,
  });
  return map(data);
};

export const updateLevel = async (id: string, p: Partial<ProgramLevel>) => {
  const body: any = {};
  if (p.programId !== undefined) body.program_id = p.programId;
  if (p.levelNumber !== undefined) body.level_number = p.levelNumber;
  if (p.title !== undefined) body.title = p.title;
  const { data } = await api.put(`/program-levels/${id}`, body);
  return map(data);
};

export const deleteLevel = async (id: string) => api.delete(`/program-levels/${id}`);