import type { ActivityType, Profile, SchoolYear } from '../types.js';

export class User {
  private constructor(
    readonly id: string,
    readonly email: string,
    readonly schoolId: number,
    public name: string,
    public pronoun: Profile['pronoun'],
    public schoolYear: SchoolYear,
    public major: string | null,
    public hobbies: string[],
    public interestedTypes: ActivityType[],
  ) {}

  static create(id: string, input: Profile, email: string): User {
    const name = input.name.trim();
    if (!name) {
      throw new Error('Name cannot be empty');
    }
    return new User(
      id,
      email.toLowerCase(),
      input.schoolId,
      name,
      input.pronoun ?? null,
      input.schoolYear,
      input.major?.trim() || null,
      [...new Set(input.hobbies)], //user input
      [...new Set(input.interestedTypes)],
    );
  }
}
