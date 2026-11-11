export class AuthUser {
  constructor(
    readonly id: string,
    readonly email: string | null,
  ) {}

  canUseApp(): boolean {
    return this.email !== null && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }
}
