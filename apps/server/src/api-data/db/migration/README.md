# Project migrations

The v5 project format stores custom fields as `customFields: { fields, order }`.
Existing keys become permanent IDs, preserving entry values and integration
references. New fields receive generated IDs; renaming edits only the definition,
never entry keys. Independent projects can have the same label under different
IDs; merges preserve both. Spreadsheet imports require an unambiguous label.
Labels and entry values are preserved when upgrading a v4 project. A saved v5
project must not be opened in v4; rollback means restoring the original backup.

## Adding v5 changes

- Add structural v4-to-v5 conversions to `db.migration.v5.ts`, called through
  `migrateAllData()`. Keep legacy input types independent of `DatabaseModel`.
- Preserve sections the migration does not own and never mutate its input.
- Let the current parsers validate and normalise the converted data. Do not put
  legacy-shape detection in the v5 parser.
- Stamp the target schema version only after all structural conversions succeed.
  The current settings parser stamps the running application version afterward.
- Add focused cases to `__tests__/migration.v5.test.ts`. Cover important
  preservation rules, then prove the full load path through persistence tests.

The load path applies v3-to-v4 changes, early v4 port migration, then v4-to-v5.
The `migrated` result invokes the existing project backup path before saving the
upgraded file. Backup failure must abort the load. A second load of the saved v5
file must not migrate it again. Unsupported major versions are rejected.

## Cloud rollout

Before enabling a v5 runtime, the cloud project reader must accept the nested
collection and use its explicit order. Cloud archive restoration must select a
compatible runtime. Existing cloud v4 readers and v4 archive-restore targets do
not support v5 files. Keep existing v4 stages and their archives readable during
the cloud transition.
