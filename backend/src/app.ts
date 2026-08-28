import 'reflect-metadata';

import {
  APP_NAME,
  BASE_URL_PREFIX,
  CREDENTIALS,
  ENVIRONMENT,
  LOG_FORMAT,
  NODE_ENV,
  ORIGIN,
  PORT,
  SAML_AUDIENCE,
  SAML_CALLBACK_URL,
  SAML_ENTRY_SSO,
  SAML_FAILURE_REDIRECT,
  SAML_IDP_PUBLIC_CERT,
  SAML_ISSUER,
  SAML_LOGOUT_CALLBACK_URL,
  SAML_PRIVATE_KEY,
  SAML_PUBLIC_KEY,
  SAML_SUCCESS_REDIRECT,
  SECRET_KEY,
  SESSION_MAX_AGE_MS,
  SWAGGER_ENABLED,
} from '@config';
import { createDefaultAuthGuard } from '@middlewares/default-auth.middleware';
import errorMiddleware from '@middlewares/error.middleware';
import { buildPublicPathSet, PublicRouteInfo } from '@middlewares/public.decorator';
import { Profile as SamlProfile, Strategy, VerifiedCallback } from '@node-saml/passport-saml';
import { logger, stream } from '@utils/logger';
import bodyParser from 'body-parser';
import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { existsSync, mkdirSync } from 'fs';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import passport from 'passport';
import { join } from 'path';
import { getMetadataArgsStorage, useExpressServer } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import swaggerUi from 'swagger-ui-express';

import { HttpException } from './exceptions/HttpException';
import { Profile } from './interfaces/profile.interface';
import { User } from './interfaces/users.interface';
import { livenessHandler } from './routes/liveness.route';
import { additionalConverters } from './utils/custom-validation-classes';
import { isValidOrigin } from './utils/isValidOrigin';
import { isValidUrl } from './utils/util';

const corsWhitelist = new Set(ORIGIN.split(','));

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user as Express.User);
});

const samlStrategy = new Strategy(
  {
    disableRequestedAuthnContext: true,
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
    callbackUrl: SAML_CALLBACK_URL,
    entryPoint: SAML_ENTRY_SSO,
    // decryptionPvk: SAML_PRIVATE_KEY,
    privateKey: SAML_PRIVATE_KEY,
    // Identity Provider's public key
    idpCert: SAML_IDP_PUBLIC_CERT,
    issuer: SAML_ISSUER,
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: false,
    acceptedClockSkewMs: 5000,
    audience: SAML_AUDIENCE || SAML_ISSUER,
    logoutCallbackUrl: SAML_LOGOUT_CALLBACK_URL,
  },
  function (samlProfile: SamlProfile | null, done: VerifiedCallback) {
    if (!samlProfile) {
      done({
        name: 'SAML_MISSING_PROFILE',
        message: 'Missing SAML profile',
      });
      return;
    }
    const { givenName, surname, citizenIdentifier, username } = samlProfile as unknown as Profile;

    if (!givenName || !surname || !citizenIdentifier) {
      done({
        name: 'SAML_MISSING_ATTRIBUTES',
        message: 'Missing profile attributes',
      });
      return;
    }

    //   const groupList: ADRole[] =
    //   groups !== undefined
    //     ? (groups
    //         .split(',')
    //         .map(x => x.toLowerCase())
    //         .filter(x => x.includes('sg_appl_app_')) as ADRole[])
    //     : [];

    // const appGroups: ADRole[] = groupList.length > 0 ? groupList : groupList.concat('sg_appl_app_read');

    try {
      // const personNumber = profile.citizenIdentifier;
      // const citizenResult = await apiService.get<CitizenGuidResponse>({ url: `citizen/2.0/${personNumber}/guid` });
      // const { data: personId } = citizenResult;

      // if (!personId) {
      //   return done({
      //     name: 'SAML_CITIZEN_FAILED',
      //     message: 'Failed to fetch user from Citizen API',
      //   });
      // }

      const findUser: User = {
        // personId: personId,
        username: username,
        name: `${givenName} ${surname}`,
        givenName: givenName,
        surname: surname,
      };

      done(null, findUser);
    } catch (err) {
      if (err instanceof HttpException && err.status === 404) {
        // Handle missing person form Citizen
      }
      done(err as Error);
    }
  },
  function (_samlProfile: SamlProfile | null, done: VerifiedCallback) {
    done(null, {});
  },
);

// A controller is a class; routing-controllers accepts the class references themselves.
type ControllerClass = new (...args: never[]) => object;

class App {
  public app: express.Application;
  public env: string;
  public port: string | number;
  public swaggerEnabled: boolean;

  constructor(
    Controllers: ControllerClass[],
    private readonly sessionStore: session.Store,
  ) {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 3000;
    this.swaggerEnabled = SWAGGER_ENABLED || false;

    this.initializeDataFolders();

    this.initializeLivenessRoute();
    const { paths: publicPaths, routes: publicRoutes } = buildPublicPathSet(Controllers);
    this.initializeMiddlewares(publicPaths, publicRoutes);
    this.initializeRoutes(Controllers);
    if (this.swaggerEnabled) {
      this.initializeSwagger(Controllers);
    }
    this.initializeErrorHandling();
  }

  public listen() {
    return this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  /**
   * Registers the liveness probe outside the routing-controllers prefix, so the path stays
   * `/health` whatever BASE_URL_PREFIX is set to, and ahead of the shared middleware chain,
   * so probe traffic is never rate limited, session-loaded or written to the request log.
   */
  private initializeLivenessRoute() {
    this.app.get('/health', livenessHandler);
  }

  private initializeMiddlewares(publicPaths: Set<string>, publicRoutes: PublicRouteInfo[]) {
    // Trust the nearest reverse proxy so req.ip and rate limiting use the client address.
    this.app.set('trust proxy', 1);
    this.app.use(morgan(LOG_FORMAT, { stream }));
    // Baseline rate limiting for every route (auth flows, swagger, proxied APIs). Tune per
    // deployment; deployments behind a gateway may also rate-limit at the edge.
    this.app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: true, legacyHeaders: false }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());

    this.app.use(
      session({
        secret: SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        store: this.sessionStore,
        cookie: {
          httpOnly: true,
          // Off for local http development, where the browser would otherwise drop the cookie.
          secure: this.env === 'production' && ENVIRONMENT !== 'LOCAL',
          // 'lax' still sends the cookie on the top-level redirect back from the IdP, which is
          // why login/logout must be full page loads rather than client-side navigations.
          sameSite: 'lax',
          maxAge: SESSION_MAX_AGE_MS,
        },
      }),
    );

    this.app.use(passport.initialize());
    this.app.use(passport.session());
    passport.use('saml', samlStrategy);

    this.app.use(
      cors({
        credentials: CREDENTIALS,
        origin: function (origin, callback) {
          if (origin === undefined || corsWhitelist.has(origin) || corsWhitelist.has('*')) {
            callback(null, true);
          } else {
            if (NODE_ENV == 'development') {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          }
        },
      }),
    );

    this.app.get(
      `${BASE_URL_PREFIX}/saml/login`,
      (req, res, next) => {
        // Express 5's `req.query` is a read-only getter recomputed from `req.url`, so writes to
        // it are silently discarded. passport-saml reads RelayState from
        // `req.query.RelayState || req.body.RelayState`, so stash it on `req.body` instead.
        let relayState = '';
        if (req.session.returnTo) {
          relayState = req.session.returnTo;
        } else if (typeof req.query.successRedirect === 'string') {
          relayState = req.query.successRedirect;
        }
        if (typeof req.query.failureRedirect === 'string') {
          relayState = `${relayState},${req.query.failureRedirect}`;
        }
        if (relayState) {
          req.body = { ...(req.body as Record<string, unknown> | undefined), RelayState: relayState };
        }
        next();
      },
      (req, res, next) => {
        const authenticate = passport.authenticate('saml', {
          failureRedirect: SAML_FAILURE_REDIRECT,
        }) as RequestHandler;
        authenticate(req, res, next);
      },
    );

    this.app.get(`${BASE_URL_PREFIX}/saml/metadata`, (req, res) => {
      res.type('application/xml');
      const metadata = samlStrategy.generateServiceProviderMetadata(SAML_PUBLIC_KEY, SAML_PUBLIC_KEY);
      res.status(200).send(metadata);
    });

    this.app.get(
      `${BASE_URL_PREFIX}/saml/logout`,
      (req, res, next) => {
        // See the /saml/login note: req.query is not writable in Express 5; pass RelayState
        // via req.body, which samlStrategy.logout() also reads.
        let relayState = '';
        if (req.session.returnTo) {
          relayState = req.session.returnTo;
        } else if (typeof req.query.successRedirect === 'string') {
          relayState = req.query.successRedirect;
        }
        if (relayState) {
          req.body = { ...(req.body as Record<string, unknown> | undefined), RelayState: relayState };
        }
        next();
      },
      (req, res, next) => {
        let successRedirect = SAML_SUCCESS_REDIRECT;
        if (typeof req.query.successRedirect === 'string' && isValidUrl(req.query.successRedirect) && isValidOrigin(req.query.successRedirect)) {
          successRedirect = req.query.successRedirect;
        }

        samlStrategy.logout(req as unknown as Parameters<typeof samlStrategy.logout>[0], () => {
          req.logout(err => {
            if (err) {
              next(err);
              return;
            }
            res.redirect(successRedirect);
          });
        });
      },
    );

    this.app.get(`${BASE_URL_PREFIX}/saml/logout/callback`, bodyParser.urlencoded({ extended: false }), (req, res, next) => {
      req.logout(err => {
        if (err) {
          next(err);
          return;
        }

        let successRedirect: URL, failureRedirect: URL;
        const relayState = (req.body as { RelayState?: string }).RelayState ?? '';
        const urls = relayState.split(',');
        const primary = urls[0] ?? '';
        const secondary = urls[1] ?? '';

        if (isValidUrl(primary) && isValidOrigin(primary)) {
          successRedirect = new URL(primary);
        } else {
          successRedirect = new URL(SAML_SUCCESS_REDIRECT);
        }
        if (isValidUrl(secondary) && isValidOrigin(secondary)) {
          failureRedirect = new URL(secondary);
        } else {
          failureRedirect = successRedirect;
        }

        const queries = new URLSearchParams(failureRedirect.searchParams);

        if (req.session.messages?.length) {
          queries.append('failMessage', req.session.messages[0] ?? 'SAML_UNKNOWN_ERROR');
        } else {
          queries.append('failMessage', 'SAML_UNKNOWN_ERROR');
        }

        if (failureRedirect) {
          res.redirect(failureRedirect.toString());
        } else {
          res.redirect(successRedirect.toString());
        }
      });
    });

    this.app.post(`${BASE_URL_PREFIX}/saml/login/callback`, bodyParser.urlencoded({ extended: false }), (req, res, next) => {
      let successRedirect: URL, failureRedirect: URL;

      const relayState = (req.body as { RelayState?: string }).RelayState ?? '';
      const urls = relayState.split(',');
      const primary = urls[0] ?? '';
      const secondary = urls[1] ?? '';

      if (isValidUrl(primary) && isValidOrigin(primary)) {
        successRedirect = new URL(primary);
      } else {
        successRedirect = new URL(SAML_SUCCESS_REDIRECT);
      }
      if (isValidUrl(secondary) && isValidOrigin(secondary)) {
        failureRedirect = new URL(secondary);
      } else {
        failureRedirect = successRedirect;
      }

      const authenticate = passport.authenticate('saml', (err: Error | null, user?: Express.User | false) => {
        if (err) {
          logger.warn(`SAML login callback failed: ${err.name}: ${err.message}`);
          const queries = new URLSearchParams(failureRedirect.searchParams);
          if (err.name) {
            queries.append('failMessage', err.name);
          } else {
            queries.append('failMessage', 'SAML_UNKNOWN_ERROR');
          }
          failureRedirect.search = queries.toString();
          res.redirect(failureRedirect.toString());
        } else if (!user) {
          const failMessage = new URLSearchParams(failureRedirect.searchParams);
          failMessage.append('failMessage', 'NO_USER');
          failureRedirect.search = failMessage.toString();
          res.redirect(failureRedirect.toString());
        } else {
          req.login(user, loginErr => {
            if (loginErr) {
              const failMessage = new URLSearchParams(failureRedirect.searchParams);
              failMessage.append('failMessage', 'SAML_UNKNOWN_ERROR');
              failureRedirect.search = failMessage.toString();
              res.redirect(failureRedirect.toString());
              return;
            }
            res.redirect(successRedirect.toString());
          });
        }
      }) as RequestHandler;
      authenticate(req, res, next);
    });

    // Default-deny authentication. Mounted last so the SAML endpoints above it stay
    // reachable, and before initializeRoutes() so every routing-controllers route sits
    // behind it unless its handler carries @Public().
    for (const route of publicRoutes) {
      logger.warn(
        `Auth guard: PUBLIC ${route.httpMethod} ${route.path} (${route.controller}.${route.action})` +
          (route.reason ? ` - ${route.reason}` : ' - no reason given'),
      );
    }
    this.app.use(BASE_URL_PREFIX, createDefaultAuthGuard(publicPaths));
  }

  private initializeRoutes(controllers: ControllerClass[]) {
    useExpressServer(this.app, {
      routePrefix: BASE_URL_PREFIX,
      controllers: controllers,
      defaultErrorHandler: false,
    });
  }

  private initializeSwagger(controllers: ControllerClass[]) {
    const schemas = validationMetadatasToSchemas({
      classTransformerMetadataStorage: defaultMetadataStorage,
      refPointerPrefix: '#/components/schemas/',
      additionalConverters: additionalConverters,
    });

    const routingControllersOptions = {
      routePrefix: BASE_URL_PREFIX,
      controllers: controllers,
    };

    const storage = getMetadataArgsStorage();
    type OpenApiComponents = NonNullable<Parameters<typeof routingControllersToSpec>[2]>['components'];
    type SchemasMap = NonNullable<NonNullable<OpenApiComponents>['schemas']>;
    const spec = routingControllersToSpec(storage, routingControllersOptions, {
      components: {
        schemas: schemas as unknown as SchemasMap,
        securitySchemes: {
          basicAuth: {
            scheme: 'basic',
            type: 'http',
          },
        },
      },
      info: {
        title: `${APP_NAME} Proxy API`,
        description: '',
        version: '1.0.0',
      },
    });

    this.app.use(`${BASE_URL_PREFIX}/swagger.json`, (req: express.Request, res: express.Response) => {
      res.json(spec);
    });
    this.app.use(`${BASE_URL_PREFIX}/api-docs`, swaggerUi.serve, swaggerUi.setup(spec));
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeDataFolders() {
    const logsDir: string = join(__dirname, '../data/logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
    const sessionsDir: string = join(__dirname, '../data/sessions');
    if (!existsSync(sessionsDir)) {
      mkdirSync(sessionsDir, { recursive: true });
    }
  }
}

export default App;
