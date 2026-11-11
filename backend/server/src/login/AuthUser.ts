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
    if (!this.email) {
      throw new Error('A verified account email is required');
    }
    return this.email;
  }
}
