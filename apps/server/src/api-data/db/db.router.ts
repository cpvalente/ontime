import express from 'express';

import {
  createProjectFile,
  currentProjectDownload,
  deleteProjectFile,
  duplicateProjectFile,
  listProjects,
  loadDemo,
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

/**
 * @swagger
 * /data/db:
 *   get:
 *     summary: Download the current project file
 *     responses:
 *       200:
 *         description: The project file
 *   patch:
 *     summary: Patch the current project file
 *     responses:
 *       204:
 *         description: Successfully updated
 */
router.get('/', currentProjectDownload);
router.patch('/', validatePatchProject, patchPartialProjectFile);

/**
 * @swagger
 * /data/db/download:
 *   post:
 *     summary: Download a project file
 *     responses:
 *       200:
 *         description: The project file
 */
router.post('/download', validateFilenameBody, projectDownload);

/**
 * @swagger
 * /data/db/upload:
 *   post:
 *     summary: Upload a project file
 *     responses:
 *       204:
 *         description: Successfully uploaded
 */
router.post('/upload', uploadProjectFile, postProjectFile);

/**
 * @swagger
 * /data/db/new:
 *   post:
 *     summary: Create a new project file
 *     responses:
 *       201:
 *         description: Successfully created
 */
router.post('/new', validateFilenameBody, validateNewProject, createProjectFile);

/**
 * @swagger
 * /data/db/quick:
 *   post:
 *     summary: Create a new project file from a rundown
 *     responses:
 *       201:
 *         description: Successfully created
 */
router.post('/quick', validateQuickProject, quickProjectFile);

/**
 * @swagger
 * /data/db/all:
 *   get:
 *     summary: Get a list of all project files
 *     responses:
 *       200:
 *         description: A list of project files
 */
router.get('/all', listProjects);

/**
 * @swagger
 * /data/db/load:
 *   post:
 *     summary: Load a project file
 *     responses:
 *       204:
 *         description: Successfully loaded
 */
router.post('/load', validateFilenameBody, loadProject);

/**
 * @swagger
 * /data/db/demo:
 *   post:
 *     summary: Load the demo project file
 *     responses:
 *       204:
 *         description: Successfully loaded
 */
router.post('/demo', loadDemo);

/**
 * @swagger
 * /data/db/{filename}/duplicate:
 *   post:
 *     summary: Duplicate a project file
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Successfully duplicated
 */
router.post('/:filename/duplicate', validateFilenameParam, validateNewFilenameBody, duplicateProjectFile);

/**
 * @swagger
 * /data/db/{filename}/rename:
 *   put:
 *     summary: Rename a project file
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Successfully renamed
 */
router.put('/:filename/rename', validateFilenameParam, validateNewFilenameBody, renameProjectFile);

/**
 * @swagger
 * /data/db/{filename}:
 *   delete:
 *     summary: Delete a project file
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Successfully deleted
 */
router.delete('/:filename', validateFilenameParam, deleteProjectFile);
