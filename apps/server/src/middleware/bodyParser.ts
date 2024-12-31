import express from 'express';

export const bodyParser = [express.urlencoded({ extended: true }), express.json({ limit: '1mb' })];
