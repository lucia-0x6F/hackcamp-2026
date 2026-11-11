export class Validator {
  static email(value: string) {
    const v = value.trim().toLowerCase();
    const pattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!pattern.test(v)) {
      throw new Error('Email format is invalid');
    }
    return v;
  }
}
