import { SupportedEvent } from 'ontime-types';
import { enum_, object, unknown, string, array, number, never, minValue, parse } from 'valibot';
import { Request, Response } from 'express';

//TODO: we could add messages for each field if we want

export const rundownPostValidator = (req: Request, res: Response) => {
  try {
    return parse(
      object(
        {
          type: enum_(SupportedEvent),
        },
        unknown(),
      ),
      req.body,
      { abortEarly: true },
    );
  } catch ({ issues }) {
    res.status(422).json({ error: issues[0].message });
  }
};

export const rundownPutValidator = (req: Request, res: Response) => {
  try {
    return parse(
      object(
        {
          id: string(),
        },
        unknown(),
      ),
      req.body,
      { abortEarly: true },
    );
  } catch ({ issues }) {
    res.status(422).json({ error: issues[0].message });
  }
};

export const rundownBatchPutValidator = (req: Request, res: Response) => {
  try {
    return parse(
      object(
        {
          data: object({}),
          ids: array(string()),
        },
        never(),
      ),
      req.body,
      { abortEarly: true },
    );
  } catch ({ issues }) {
    res.status(422).json({ error: issues[0].message });
  }
};

export const rundownReorderValidator = (req: Request, res: Response) => {
  try {
    return parse(
      object(
        {
          eventId: string(),
          from: number([minValue(0)]),
          to: number([minValue(0)]),
        },
        never(),
      ),
      req.body,
      { abortEarly: true },
    );
  } catch ({ issues }) {
    res.status(422).json({ error: issues[0].message });
  }
};

export const rundownSwapValidator = (req: Request, res: Response) => {
  try {
    return parse(
      object(
        {
          from: string(),
          to: string(),
        },
        never(),
      ),
      req.body,
      { abortEarly: true },
    );
  } catch ({ issues }) {
    res.status(422).json({ error: issues[0].message });
  }
};

export const paramsMustHaveEventId = (req: Request, res: Response) => {
  try {
    return parse(
      object(
        {
          eventId: string(),
        },
        never(),
      ),
      req.params,
      { abortEarly: true },
    ).eventId;
  } catch ({ issues }) {
    res.status(422).json({ error: issues[0].message });
  }
};
