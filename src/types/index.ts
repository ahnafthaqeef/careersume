export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
  profilePicture?: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
  honors?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  bullets: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
}

export interface ResumeContent {
  personalInfo: PersonalInfo;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  certifications: Certification[];
}

export interface JobAnalysis {
  jobTitle: string;
  company?: string;
  seniorityLevel: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  keywords: string[];
  tools: string[];
}

export interface WeakBullet {
  original: string;
  suggested: string;
}

export interface GeneratedResume {
  resume: ResumeContent;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  weakBullets: WeakBullet[];
}

export type TemplateName =
  | "experienced"
  | "entry-level"
  | "modern"
  | "executive"
  | "creative"
  | "minimal"
  | "tech"
  | "compact"
  | "professional"
  | "elegant";

export interface Template {
  name: TemplateName;
  label: string;
  description: string;
  accentColor: string;
}
