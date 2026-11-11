import type { IncomingHttpHeaders } from 'node:http';
import { isIP } from 'node:net';
import { hostname } from 'node:os';

import type { NextFunction, Request, Response } from 'express';

import { hasPassword } from '../api-data/session/session.service.js';
import { allowedHosts as allowedHostsEnv } from '../externals.js';
import { isOntimeCloud } from '../setup/environment.js';

const allowedHosts = new Set(
  (allowedHostsEnv ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
);

const machineName = hostname().toLowerCase().replace(/\.$/, '');

/** suffixes that home routers and private networks use, which public DNS does not resolve */
const privateSuffixes = ['.localhost', '.local', '.lan', '.home', '.home.arpa', '.internal'];

/**
 * Whether a request was made by a page on another site
 * Browsers send Sec-Fetch-Site, we fall back to comparing the Origin for browsers that don't
 * Requests without either header (Companion, scripts, curl) are not cross-site
 * same-site counts as cross-site: for an IP address it means another port on the same machine
 */
export function isCrossSite(headers: IncomingHttpHeaders): boolean {
  const site = headers['sec-fetch-site'];
  if (site !== undefined) {
    return site !== 'same-origin' && site !== 'none';
  }

  const origin = headers.origin;
  if (!origin) {
    return false;
  }

  // sandboxed frames and other opaque origins
  if (origin === 'null') {
    return true;
  }

  try {
    return normaliseHost(new URL(origin).host) !== normaliseHost(getRequestHost(headers));
  } catch (_) {
    return true;
  }
}

/**
 * In Ontime Cloud the proxy in front of the stage rewrites the Host
 */
function getRequestHost(headers: IncomingHttpHeaders): string {
  if (isOntimeCloud) {
    const forwardedHost = headers['x-forwarded-host'];
    const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost?.split(',')[0].trim();
    if (host) {
      return host;
    }
  }
  return headers.host ?? '';
}

function normaliseHost(host: string): string {
  return host
    .toLowerCase()
    .replace(/:(80|443)$/, '')
    .replace(/\.(:|$)/, '$1');
}

/**
 * Whether a Host header names this machine in a way a user would type
 * A page that rebinds its own public domain to this machine sends that domain as the Host
 */
export function isAllowedHost(host: string | undefined, extraHosts: Set<string> = allowedHosts): boolean {
  if (!host) {
    return false;
  }

  const name = stripPort(host).toLowerCase().replace(/\.$/, '');
  if (!name) {
    return false;
  }

  if (isIP(name) !== 0) {
    return true;
  }

  // single labels (localhost, nas, a docker service name) and private suffixes can't come from public DNS
  if (!name.includes('.') || privateSuffixes.some((suffix) => name.endsWith(suffix))) {
    return true;
  }

  // the whole name: a first label match would let <machine>.attacker.example through
  if (name === machineName) {
    return true;
  }

  return extraHosts.has('*') || extraHosts.has(name);
}

function stripPort(host: string): string {
  // IPv6 literals are bracketed: [::1]:4001
  if (host.startsWith('[')) {
    const end = host.indexOf(']');
    return end === -1 ? '' : host.slice(1, end);
  }
  return host.split(':')[0];
}

/**
 * Without a password every request on the network gets full access,
 * so a browser must address this machine by a name we know
 * Rebinding needs a browser, so clients without browser headers (Companion, scripts) are not checked
 * With a password, a rebinding page has no credential for its own domain
 */
export function isRequestHostAllowed(headers: IncomingHttpHeaders): boolean {
  if (hasPassword || isOntimeCloud) {
    return true;
  }
  const isBrowser = headers['sec-fetch-site'] !== undefined || headers.origin !== undefined;
  if (!isBrowser) {
    return true;
  }
  return isAllowedHost(headers.host);
}

/**
 * Express middleware refusing browser requests to a host we don't know
 */
export function refuseUnknownHost(req: Request, res: Response, next: NextFunction) {
  if (isRequestHostAllowed(req.headers)) {
    return next();
  }
  res
    .status(403)
    .send(`Ontime does not recognise the host "${req.headers.host}". Add it to ONTIME_ALLOWED_HOSTS to allow it.`);
}
