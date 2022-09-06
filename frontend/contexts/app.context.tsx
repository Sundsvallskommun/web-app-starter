import { User } from '@interfaces/user';
import { createContext, useContext, useState } from 'react';
import { emptyUser } from '@services/user-service';

export interface AppContextInterface {
  user: User;
  setUser: (user: User) => void;

  isCookieConsentOpen: boolean;
  setIsCookieConsentOpen: (isOpen: boolean) => void;
}

const AppContext = createContext<AppContextInterface>(null);

export function AppWrapper({ children }) {
  const [user, setUser] = useState<User>(emptyUser);
  const [isCookieConsentOpen, setIsCookieConsentOpen] = useState(true);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser: (user: User) => setUser(user),

        isCookieConsentOpen,
        setIsCookieConsentOpen: (isOpen: boolean) => setIsCookieConsentOpen(isOpen),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
