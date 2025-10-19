import { api } from '@/lib/api';

export type Staff = {
  id: string;
  fullName: string;
  staffNumber: string;
  academicAffairsNumber?: string | null;
  academicRank: string;
  employmentType: 'متفرغ' | 'غير متفرغ';
  lectureRate: number;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  collegeId: string;
  departmentId?: string | null;
};

const map = (d: any): Staff => ({
  id: d.id,
  fullName: d.full_name,
  staffNumber: d.staff_number,
  academicAffairsNumber: d.academic_affairs_number,
  academicRank: d.academic_rank,
  employmentType: d.employment_type,
  lectureRate: d.lecture_rate,
  address: d.address,
  phone: d.phone,
  email: d.email,
  notes: d.notes,
  collegeId: d.college_id,
  departmentId: d.department_id,
});

export const getStaffByCollege = async (collegeId: string): Promise<Staff[]> => {
  const { data } = await api.get('/staff', { params: { college_id: collegeId } });
  return data.map(map);
};

export const createStaff = async (p: Omit<Staff, 'id'>) => {
  const { data } = await api.post('/staff', {
    full_name: p.fullName,
    staff_number: p.staffNumber,
    academic_affairs_number: p.academicAffairsNumber,
    academic_rank: p.academicRank,
    employment_type: p.employmentType,
    lecture_rate: p.lectureRate,
    address: p.address,
    phone: p.phone,
    email: p.email,
    notes: p.notes,
    college_id: p.collegeId,
    department_id: p.departmentId,
  });
  return map(data);
};

export const updateStaff = async (id: string, p: Partial<Staff>) => {
  const body: any = {};
  if (p.fullName !== undefined) body.full_name = p.fullName;
  if (p.staffNumber !== undefined) body.staff_number = p.staffNumber;
  if (p.academicAffairsNumber !== undefined) body.academic_affairs_number = p.academicAffairsNumber;
  if (p.academicRank !== undefined) body.academic_rank = p.academicRank;
  if (p.employmentType !== undefined) body.employment_type = p.employmentType;
  if (p.lectureRate !== undefined) body.lecture_rate = p.lectureRate;
  if (p.address !== undefined) body.address = p.address;
  if (p.phone !== undefined) body.phone = p.phone;
  if (p.email !== undefined) body.email = p.email;
  if (p.notes !== undefined) body.notes = p.notes;
  if (p.collegeId !== undefined) body.college_id = p.collegeId;
  if (p.departmentId !== undefined) body.department_id = p.departmentId;
  const { data } = await api.put(`/staff/${id}`, body);
  return map(data);
};

export const deleteStaff = async (id: string) => api.delete(`/staff/${id}`);