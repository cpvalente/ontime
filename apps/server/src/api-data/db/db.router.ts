import express from 'express';

import {
  createProjectFile,
  deleteProjectFile,
  duplicateProjectFile,
  getInfo,
  listProjects,
  loadProject,
  patchPartialProjectFile,
  postProjectFile,
  projectDownload,
  renameProjectFile,
} from './db.controller.js';
import { uploadProjectFile } from './db.middleware.js';
import {
  projectSanitiser,
  sanitizeProjectFilename,
  validateLoadProjectFile,
  validatePatchProjectFile,
  validateProjectDuplicate,
  validateProjectRename,
} from './db.validation.js';

export const router = express.Router();

router.get('/download', projectDownload);
router.post('/upload', uploadProjectFile, postProjectFile);

router.patch('/', validatePatchProjectFile, patchPartialProjectFile);
router.post('/new', projectSanitiser, createProjectFile);

router.get('/all', listProjects);

router.post('/load', validateLoadProjectFile, sanitizeProjectFilename, loadProject);
router.post('/:filename/duplicate', validateProjectDuplicate, sanitizeProjectFilename, duplicateProjectFile);
router.put('/:filename/rename', validateProjectRename, sanitizeProjectFilename, renameProjectFile);
router.delete('/:filename', sanitizeProjectFilename, deleteProjectFile);

router.get('/info', getInfo);
