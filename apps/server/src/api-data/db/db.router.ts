import express from 'express';

import {
  createProjectFile,
  currentProjectDownload,
  deleteProjectFile,
  duplicateProjectFile,
  listProjects,
  loadProject,
  patchPartialProjectFile,
  postProjectFile,
  projectDownload,
  quickProjectFile,
  renameProjectFile,
} from './db.controller.js';
import { uploadProjectFile } from './db.middleware.js';
import {
  validateNewProject,
  validatePatchProject,
  validateFilenameBody,
  validateFilenameParam,
  validateNewFilenameBody,
  validateQuickProject,
} from './db.validation.js';

export const router = express.Router();

router.get('/', currentProjectDownload);
router.post('/download', validateFilenameBody, projectDownload);
router.post('/upload', uploadProjectFile, postProjectFile);

router.patch('/', validatePatchProject, patchPartialProjectFile);
router.post('/new', validateFilenameBody, validateNewProject, createProjectFile);
router.post('/quick', validateQuickProject, quickProjectFile);

router.get('/all', listProjects);

router.post('/load', validateFilenameBody, loadProject);
router.post('/:filename/duplicate', validateFilenameParam, validateNewFilenameBody, duplicateProjectFile);
router.put('/:filename/rename', validateFilenameParam, validateNewFilenameBody, renameProjectFile);
router.delete('/:filename', validateFilenameParam, deleteProjectFile);
