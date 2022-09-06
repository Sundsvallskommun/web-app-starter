import { formatOrgNr } from '@/utils/util';
import { NextFunction, Request, Response } from 'express';

export const ensureLoggedIn = options => {
  if (typeof options == 'string') {
    options = { redirectTo: options };
  }
  options = options || {};

  const url = options.redirectTo || '/api/saml/login';
  const setReturnTo = options.setReturnTo === undefined ? true : options.setReturnTo;

  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      if (setReturnTo && req.session) {
        req.session.returnTo = req.originalUrl || req.url;
      }
      return res.redirect(url);
    }
    req.session.representing = {
      organizationName: 'Testbolag 4 bokat av SKV Aktiebolag',
      organizationNumber: formatOrgNr('5560021361'), // '556002-1361',
      organizationId: 'd5727c45-8c19-42a0-a04a-5ef11d108618',
    };
    next();
  };
};
