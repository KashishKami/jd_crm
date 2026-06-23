export interface Team {
  teamId: number;
  teamName: string;
  teamCreated: string | Date;
  teamUpdated?: string | Date | null;
}

export interface Role {
  roleId: number;
  roleName: string;
  roleCreated: string | Date;
  roleUpdated?: string | Date | null;
}

export interface Agent {
  uid: number;
  name: string;
  nickname?: string | null;
  username: string;
  email?: string | null;
  mobile?: string | null;
  gender: string;
  status?: number | null;
  age?: number | null;
  designation?: string | null;
  dateOfJoining?: string | Date | null;
  agentId?: string | null;
  profileImage?: string | null;
  agentTarget?: string | null;
  agentSalary?: string | null;
  created?: string | Date | null;
  teamId: number;
  roleId: number;
  team?: Team;
  role?: Role;
}

export interface AgentProfile {
  profileId: number;
  profileUserId: number;
  profileLocalAddress?: string | null;
  profilePermanentAddress?: string | null;
  profileAlternatePhone?: string | null;
  profileDob?: string | Date | null;
  profilePan?: string | null;
  profileAadhar?: string | null;
  profileBankAccount?: string | null;
  profileBankName?: string | null;
  profileBankAddress?: string | null;
  profileBankBranch?: string | null;
  profileBankIfsc?: string | null;
  profileEmergencyContactName?: string | null;
  profileEmergencyContactRelation?: string | null;
  profileEmergencyContactAddress?: string | null;
  profileEmergencyContactNumber?: string | null;
  profileEmergencyContactNumber2?: string | null;
  profileCreatedAt?: string | Date | null;
  profileUpdatedAt?: string | Date;
}

export interface AgentAcademic {
  academicId: number;
  academicUserId: number;
  academicStandard?: string | null;
  academicYearFrom?: string | null;
  academicYearTo?: string | null;
  academicSpecialization?: string | null;
  academicInstitute?: string | null;
  academicCreated?: string | Date | null;
}

export interface AgentProfessional {
  professionalId: number;
  professionalUserId: number;
  professionalOrganization?: string | null;
  professionalYearFrom?: string | null;
  professionalYearTo?: string | null;
  professionalDesignation?: string | null;
  professionalSalary?: string | null;
  professionalExperiance?: string | null;
  professionalCreatedAt?: string | Date;
}

export interface AgentDetail extends Agent {
  profile?: AgentProfile | null;
  academicRecord?: AgentAcademic[];
  professionalRecord?: AgentProfessional[];
}

export interface FormAcademicRecord {
  academicStandard: string;
  academicInstitute: string;
  academicSpecialization: string;
  academicYearFrom: string;
  academicYearTo: string;
}

export interface FormProfessionalRecord {
  professionalOrganization: string;
  professionalDesignation: string;
  professionalSalary: string;
  professionalYearFrom: string;
  professionalYearTo: string;
  professionalExperiance: string;
}
