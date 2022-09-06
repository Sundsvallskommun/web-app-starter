import { Profile as SamlProfile } from 'passport-saml';

export interface Profile extends SamlProfile {
  citizenIdentifier: string;
  givenName: string;
  surname: string;
  attributes: { [key: string]: any };
}
