import { defaultCss } from '../../user/styles/bundledCss.js';
import type { Request, Response } from 'express';
import { readCssFile, writeCssFile } from './assets.service.js';

/**
 * Exposes the contents of the cssOverride.css file
 */
export async function getCssOverride(_req: Request, res: Response) {
  try {
    const data = await readCssFile();
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: error });
  }
}

/**
 * Allows modifying the cssOverride.css file
 */
export async function postCssOverride(req: Request, res: Response) {
  const { css } = req.body;

  try {
    await writeCssFile(css);
    res.status(204).send();
  } catch (error) {
    res.status(500).send({ message: error });
  }
}

/**
 * Restores the default cssOverride.css file
 */
export async function restoreCss(_req: Request, res: Response) {
  try {
    await writeCssFile(defaultCss);
    res.status(200).send(defaultCss);
  } catch (error) {
    res.status(500).send({ message: error });
  }
}
