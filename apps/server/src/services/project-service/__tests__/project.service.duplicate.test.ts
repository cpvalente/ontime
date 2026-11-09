import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { DatabaseModel } from 'ontime-types';

import { makeNewProject } from '../../../models/dataModel.js';
import { publicDir } from '../../../setup/index.js';
import { duplicateProjectFile } from '../project.service.js';

// stop the database loading from initiating
vi.mock('../../../setup/loadDb.js', () => {
  return {
    switchDb: vi.fn(),
  };
});

function writeProject(fileName: string, logo: string | null) {
  const project = makeNewProject();
  project.project.logo = logo;
  writeFileSync(join(publicDir.projectsDir, fileName), JSON.stringify(project));
}

function readProject(fileName: string): DatabaseModel {
  return JSON.parse(readFileSync(join(publicDir.projectsDir, fileName), 'utf-8'));
}

function readProjectLogo(fileName: string): string | null {
  return readProject(fileName).project.logo;
}

describe('duplicateProjectFile', () => {
  it('gives the duplicate its own copy of the logo', async () => {
    writeFileSync(join(publicDir.logoDir, 'original-logo.png'), 'logo');
    writeProject('with-logo.json', 'original-logo.png');

    await duplicateProjectFile('with-logo.json', 'with-logo-copy.json');

    const duplicateLogo = readProjectLogo('with-logo-copy.json');
    expect(duplicateLogo).not.toBe('original-logo.png');
    expect(duplicateLogo).toMatch(/\.png$/);
    expect(readFileSync(join(publicDir.logoDir, duplicateLogo as string), 'utf-8')).toBe('logo');
    expect(readProjectLogo('with-logo.json')).toBe('original-logo.png');
  });

  it('clears the logo of the duplicate if the logo file is missing', async () => {
    writeProject('missing-logo.json', 'missing-logo.png');

    await duplicateProjectFile('missing-logo.json', 'missing-logo-copy.json');

    expect(readProjectLogo('missing-logo-copy.json')).toBeNull();
  });

  it('duplicates a project without a logo', async () => {
    writeProject('no-logo.json', null);

    await duplicateProjectFile('no-logo.json', 'no-logo-copy.json');

    expect(existsSync(join(publicDir.projectsDir, 'no-logo-copy.json'))).toBe(true);
    expect(readProjectLogo('no-logo-copy.json')).toBeNull();
  });

  it('gives the duplicate its own project id', async () => {
    writeProject('identity.json', null);

    await duplicateProjectFile('identity.json', 'identity-copy.json');

    expect(readProject('identity-copy.json').projectId).toMatch(/.+/);
    expect(readProject('identity-copy.json').projectId).not.toBe(readProject('identity.json').projectId);
  });
});
