import express from 'express';

import {
  createProjectFile,
  currentProjectDownload,
  deleteProjectFile,
  duplicateProjectFile,
  getCssOverride,
  listProjects,
  loadDemo,
  loadProject,
  patchPartialProjectFile,
  postCssOverride,
  postProjectFile,
  projectDownload,
  quickProjectFile,
  renameProjectFile,
  restoreCss,
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
router.post('/demo', loadDemo);
router.post('/:filename/duplicate', validateFilenameParam, validateNewFilenameBody, duplicateProjectFile);
router.put('/:filename/rename', validateFilenameParam, validateNewFilenameBody, renameProjectFile);
router.delete('/:filename', validateFilenameParam, deleteProjectFile);

router.get('/css', getCssOverride);
router.post('/css', postCssOverride);
router.post('/css/restore', restoreCss);
