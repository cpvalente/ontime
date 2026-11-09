import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { initPersistence } from '../../../classes/data-provider/DataProvider.js';
import { makeNewProject } from '../../../models/dataModel.js';
import { publicDir } from '../../../setup/index.js';
import { editCurrentProjectData } from '../projectData.dao.js';

vi.mock('../../../services/change-service/change.service.js', () => ({
  notifyChange: vi.fn(),
}));

function makeProjectWithLogo(logo: string) {
  const project = makeNewProject();
  project.project.logo = logo;
  return project;
}

describe('editCurrentProjectData', () => {
  beforeAll(() => {
    mkdirSync(publicDir.projectsDir, { recursive: true });
    mkdirSync(publicDir.logoDir, { recursive: true });
  });

  it('deletes the replaced logo when no other project uses it', async () => {
    writeFileSync(join(publicDir.logoDir, 'unused.png'), 'logo');
    await initPersistence(join(publicDir.projectsDir, 'single.json'), makeProjectWithLogo('unused.png'));

    await editCurrentProjectData({ logo: null });

    expect(existsSync(join(publicDir.logoDir, 'unused.png'))).toBe(false);
  });

  it('keeps the replaced logo while another project uses it', async () => {
    writeFileSync(join(publicDir.logoDir, 'shared.png'), 'logo');
    writeFileSync(join(publicDir.projectsDir, 'other.json'), JSON.stringify(makeProjectWithLogo('shared.png')));
    await initPersistence(join(publicDir.projectsDir, 'current.json'), makeProjectWithLogo('shared.png'));

    await editCurrentProjectData({ logo: 'new.png' });

    expect(existsSync(join(publicDir.logoDir, 'shared.png'))).toBe(true);
  });

  it('never deletes the bundled demo logo', async () => {
    writeFileSync(join(publicDir.logoDir, 'ontime-logo.png'), 'logo');
    await initPersistence(join(publicDir.projectsDir, 'demo.json'), makeProjectWithLogo('ontime-logo.png'));

    await editCurrentProjectData({ logo: null });

    expect(existsSync(join(publicDir.logoDir, 'ontime-logo.png'))).toBe(true);
  });
});
