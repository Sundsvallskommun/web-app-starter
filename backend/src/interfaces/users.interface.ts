export interface User {
  [key: string]: unknown;
  // personId: string;
  username: string;
  name: string;
  givenName: string;
  surname: string;
}

export interface ClientUser {
  name: string;
  username: string;
}
