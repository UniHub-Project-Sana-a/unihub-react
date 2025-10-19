import { api } from '@/lib/api';
import { getBuildingsByCollege } from './buildings';

export type Classroom = {
  id: string;
  name: string;
  buildingId: string;
  floor: number;
  capacity: number;
  latitude?: number | null;
  longitude?: number | null;
  allowedDistance?: number | null;
  type: 'CLASSROOM' | 'LAB';
};

const map = (d: any): Classroom => ({
  id: d.classroom_id,
  name: d.classroom_name,
  buildingId: d.building_id,
  floor: d.floor,
  capacity: d.capacity,
  latitude: d.latitude,
  longitude: d.longitude,
  allowedDistance: d.allowed_distance,
  type: d.classroom_type,
});

export const getClassroomsByBuilding = async (buildingId: string): Promise<Classroom[]> => {
  const { data } = await api.get('/classrooms', { params: { building_id: buildingId } });
  return data.map(map);
};

export const getClassroomsByCollege = async (collegeId: string): Promise<Classroom[]> => {
  const buildings = await getBuildingsByCollege(collegeId);
  const lists = await Promise.all(buildings.map(b => getClassroomsByBuilding(b.id)));
  return lists.flat();
};

export const createClassroom = async (p: Omit<Classroom, 'id'>) => {
  const { data } = await api.post('/classrooms', {
    classroom_name: p.name,
    building_id: p.buildingId,
    floor: p.floor,
    capacity: p.capacity,
    latitude: p.latitude,
    longitude: p.longitude,
    allowed_distance: p.allowedDistance,
    classroom_type: p.type,
  });
  return map(data);
};

export const updateClassroom = async (id: string, p: Partial<Classroom>) => {
  const body: any = {};
  if (p.name !== undefined) body.classroom_name = p.name;
  if (p.buildingId !== undefined) body.building_id = p.buildingId;
  if (p.floor !== undefined) body.floor = p.floor;
  if (p.capacity !== undefined) body.capacity = p.capacity;
  if (p.latitude !== undefined) body.latitude = p.latitude;
  if (p.longitude !== undefined) body.longitude = p.longitude;
  if (p.allowedDistance !== undefined) body.allowed_distance = p.allowedDistance;
  if (p.type !== undefined) body.classroom_type = p.type;
  const { data } = await api.put(`/classrooms/${id}`, body);
  return map(data);
};

export const deleteClassroom = async (id: string) => api.delete(`/classrooms/${id}`);