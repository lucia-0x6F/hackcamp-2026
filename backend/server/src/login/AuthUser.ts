export class AuthUser {
  constructor(
    readonly id: string,
    readonly email: string | null,
  ) {}

  /**
   * The Auth0 subject is the identity used for authorization. Email is only
   * optional profile/contact data: an access token does not normally include
   * it, so it must never decide whether a signed-in user may use the app.
   */
  storageEmail(): string {
    if (this.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      return this.email;
    }

    // The existing SQLite schema requires a unique, non-null email. Keep a
    // deterministic internal placeholder until an email claim is available.
    return `auth0-${Buffer.from(this.id).toString('base64url')}@users.oncampus.invalid`;
  }
}
