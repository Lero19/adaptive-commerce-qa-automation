import { faker } from '@faker-js/faker';
import { Gender, RegistrationUser } from '../pages/register.page';

/** Tokens a business-readable Examples table can use instead of literal data. */
export const RANDOM = 'random';
export const MATCH = 'match'; // confirmPassword only: reuse the resolved password

export function userFactory(overrides: Partial<RegistrationUser> = {}): RegistrationUser {
  const password = overrides.password ?? `Qa!${faker.string.alphanumeric(12)}9`;
  return {
    gender: faker.helpers.arrayElement<Gender>(['male', 'female']),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: `qa.${Date.now()}.${faker.string.alphanumeric(6).toLowerCase()}@example.com`,
    confirmPassword: password,
    ...overrides,
    password
  };
}

export interface RawUserInput {
  gender: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Turns Examples-table values into a concrete user.
 *  - "random"  -> generated value (password is generated once and remembered)
 *  - "match"   -> (confirmPassword) same value as the resolved password
 *  - ""        -> left blank on purpose (negative scenarios)
 *  - anything else is used literally
 */
export function resolveUser(raw: RawUserInput): RegistrationUser {
  const generated = userFactory();
  const pick = (value: string, random: string): string => (value === RANDOM ? random : value);

  const password = pick(raw.password, generated.password);
  const confirmPassword = raw.confirmPassword === MATCH ? password : pick(raw.confirmPassword, generated.password);

  const gender = raw.gender === RANDOM ? generated.gender : (raw.gender as Gender | '');

  return {
    gender: gender === '' ? undefined : gender,
    firstName: pick(raw.firstName, generated.firstName),
    lastName: pick(raw.lastName, generated.lastName),
    email: pick(raw.email, generated.email),
    password,
    confirmPassword
  };
}