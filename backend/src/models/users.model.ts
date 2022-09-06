import { User } from '@interfaces/users.interface';

// password: password
const userModel: User[] = [
  //{ id: 1, email: 'example1@email.com', password: '$2b$10$TBEfaCe1oo.2jfkBDWcj/usBj4oECsW2wOoDXpCa2IH9xqCpEK/hC', guid: '213456' },
  //{ id: 2, email: 'example2@email.com', password: '$2b$10$TBEfaCe1oo.2jfkBDWcj/usBj4oECsW2wOoDXpCa2IH9xqCpEK/hC', guid: '213456' },
  //{ id: 3, email: 'example3@email.com', password: '$2b$10$TBEfaCe1oo.2jfkBDWcj/usBj4oECsW2wOoDXpCa2IH9xqCpEK/hC', guid: '213456' },
  //{ id: 4, email: 'example4@email.com', password: '$2b$10$TBEfaCe1oo.2jfkBDWcj/usBj4oECsW2wOoDXpCa2IH9xqCpEK/hC', guid: '213456' },
  {
    id: 1,
    name: 'Karin Andersson',
    email: 'karin.andersson@example.com',
    password: '$2b$10$TBEfaCe1oo.2jfkBDWcj/usBj4oECsW2wOoDXpCa2IH9xqCpEK/hC',
    guid: 'd1eda732-5aec-45e2-a673-4debd42b2f04',
  },
  {
    id: 2,
    name: 'Jenny Svensson',
    email: 'jenny.svensson@example.com',
    password: '$2b$10$TBEfaCe1oo.2jfkBDWcj/usBj4oECsW2wOoDXpCa2IH9xqCpEK/hC',
    guid: 'd4554399-91bb-4258-a7a7-afb9f265dd66',
  },
  {
    id: 3,
    name: 'xxx',
    email: 'xxx@example.com',
    password: '$2b$10$TBEfaCe1oo.2jfkBDWcj/usBj4oECsW2wOoDXpCa2IH9xqCpEK/hC',
    guid: '740c013c-f979-4ad3-a073-42a6d5255e3a',
  },
];

export default userModel;
