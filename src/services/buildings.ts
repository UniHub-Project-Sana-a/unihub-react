import { api } from '@/lib/api';

export type Building = { id: string; name: string; floorCount: number; collegeId: string };

const map = (d: any): Building => ({
  id: d.building_id,
  name: d.building_name,
  floorCount: d.floor_count,
  collegeId: d.college_id,
});

export const getBuildingsByCollege = async (collegeId: string): Promise<Building[]> => {
  const { data } = await api.get('/buildings', { params: { college_id: collegeId } });
  return data.map(map);
};

export const createBuilding = async (p: Omit<Building, 'id'>) => {
  const { data } = await api.post('/buildings', {
    building_name: p.name,
    floor_count: p.floorCount,
    college_id: p.collegeId,
  });
  return map(data);
};

export const updateBuilding = async (id: string, p: Partial<Building>) => {
  const body: any = {};
  if (p.name !== undefined) body.building_name = p.name;
  if (p.floorCount !== undefined) body.floor_count = p.floorCount;
  if (p.collegeId !== undefined) body.college_id = p.collegeId;
  const { data } = await api.put(`/buildings/${id}`, body);
  return map(data);
};

export const deleteBuilding = async (id: string) => api.delete(`/buildings/${id}`);