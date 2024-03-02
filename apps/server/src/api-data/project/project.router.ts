import express from 'express';

import {
  createProjectFile,
  projectDownload,
  deleteProjectFile,
  getInfo,
  getProject,
  listProjects,
  patchPartialProjectFile,
  postProject,
  previewSpreadsheet,
  loadProject,
  duplicateProjectFile,
  renameProjectFile,
} from './project.controller.js';
import { uploadProjectFile, uploadSpreadsheet } from './project.middleware.js';
import {
  projectSanitiser,
  sanitizeProjectFilename,
  validateLoadProjectFile,
  validatePatchProjectFile,
  validateProjectDuplicate,
  validateProjectRename,
} from './project.validation.js';

export const router = express.Router();

router.get('/', getProject);
router.post('/', projectSanitiser, postProject);
router.patch('/', validatePatchProjectFile, patchPartialProjectFile);
router.post('/new', projectSanitiser, createProjectFile);

router.get('/download', projectDownload);
router.post('/upload', uploadProjectFile, uploadProjectFile);

router.get('/all', listProjects);

router.post('/load', validateLoadProjectFile, sanitizeProjectFilename, loadProject);
router.post('/:filename/duplicate', validateProjectDuplicate, sanitizeProjectFilename, duplicateProjectFile);
router.put('/:filename/rename', validateProjectRename, sanitizeProjectFilename, renameProjectFile);
router.delete('/:filename', sanitizeProjectFilename, deleteProjectFile);

router.get('/info', getInfo);

// TODO: validate import map
router.post('/spreadsheet/preview', uploadSpreadsheet, previewSpreadsheet);
