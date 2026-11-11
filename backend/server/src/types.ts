export const SCHOOL_YEARS = ['first', 'second', 'third', 'fourth', 'fourth+', 'graduate'] as const;
export type SchoolYear = (typeof SCHOOL_YEARS)[number];
export const PRONOUNS = ['she/her', 'he/him', 'they/them', 'prefer not to say'] as const;
export type Pronoun = (typeof PRONOUNS)[number];

export const ACTIVITY_TYPES = ['study', 'food', 'sports', 'career', 'other'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface Profile {
  schoolId: number;
  name: string; 
  pronoun?: Pronoun | null;
  schoolYear: SchoolYear;
  major?: string | null;
  hobbies: string[];
  interestedTypes: ActivityType[]; //activity types
}

export interface ActivityInput {
  name: string; description: string; type: ActivityType; location: string;
  startTime: string; endTime: string; link?: string | null;
}
