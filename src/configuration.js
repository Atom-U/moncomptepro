import crypto from 'crypto';
import path from 'path';

import { findById } from './connectors/oidc-account-adapter';
import { render } from './services/utils';

const { OIDC_PAIRWISE_IDENTIFIER_SALT, SESSION_COOKIE_SECRET } = process.env;

export const cookiesSecrets = [SESSION_COOKIE_SECRET];
export const cookiesMaxAge = 1 * 24 * 60 * 60 * 1000; // 1 day in ms

export const provider = {
  acrValues: ['urn:mace:incommon:iap:bronze'],
  cookies: {
    names: {
      session: 'api_gouv_session',
      interaction: 'api_gouv_grant',
      resume: 'api_gouv_grant',
      state: 'api_gouv_state',
    },
    long: { signed: true, secure: true, maxAge: cookiesMaxAge },
    // triple the default value of short.maxAge as interaction may include a password forgot process which can be longer than 10 minutes
    short: { signed: true, secure: true, maxAge: 3 * 60 * 60 * 1000 }, // 3 hours in ms,
    keys: cookiesSecrets,
  },
  claims: {
    amr: null,
    address: ['address'],
    email: ['email', 'email_verified'],
    profile: ['family_name', 'given_name', 'updated_at'],
    organizations: ['organizations'],
    roles: ['roles'],
  },
  features: {
    devInteractions: false,
    discovery: false,
    frontchannelLogout: true,
    encryption: true,
  },
  findById,
  formats: {
    default: 'opaque',
    AccessToken: 'jwt',
  },
  postLogoutRedirectUri: ctx => {
    return ctx.headers.referer;
  },
  subjectTypes: ['public', 'pairwise'],
  pairwiseIdentifier(accountId, { sectorIdentifier }) {
    return crypto
      .createHash('sha256')
      .update(sectorIdentifier)
      .update(accountId)
      .update(OIDC_PAIRWISE_IDENTIFIER_SALT)
      .digest('hex');
  },
  interactionUrl: function interactionUrl(ctx, interaction) {
    // eslint-disable-line no-unused-vars
    return `/interaction/${ctx.oidc.uuid}`;
  },
  logoutSource: async (ctx, form) => {
    const xsrfToken = /name="xsrf" value="([a-f0-9]*)"/.exec(form)[1];
    const bodyHtml = await render(
      path.resolve(`${__dirname}/views/logout.ejs`),
      { xsrfToken }
    );

    ctx.type = 'html';
    ctx.body = await render(path.resolve(`${__dirname}/views/_layout.ejs`), {
      body: bodyHtml,
    });
  },
  clientCacheDuration: 1 * 24 * 60 * 60, // 1 day in seconds,
  routes: {
    authorization: '/oauth/authorize',
    token: '/oauth/token',
    userinfo: '/oauth/userinfo',
    end_session: '/oauth/logout',
  },
  renderError: async (ctx, { error, error_description }, err) => {
    console.error(err);

    const bodyHtml = await render(
      path.resolve(`${__dirname}/views/error.ejs`),
      {
        error_code: err.statusCode || err,
        error_message: `${error}: ${error_description}`,
      }
    );

    ctx.type = 'html';
    ctx.body = await render(path.resolve(`${__dirname}/views/_layout.ejs`), {
      body: bodyHtml,
    });
  },
  ttl: {
    AccessToken: 3 * 60 * 60, // 3 hours in second
    IdToken: 3 * 60 * 60, // 3 hours in second
  },
  extraParams: ['source'],
};