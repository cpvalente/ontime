export async function batchPutObject(obj: object, db) {
  await db.batch(
    Object.entries(obj).map(([key, value]) => {
      return value === null ? { type: 'del', key } : { type: 'put', key, value };
    }),
  );
}

//   await projectDb.batch([
//     { type: 'put', key: 'title', value: project.title },
//     { type: 'put', key: 'description', value: project.description },
//     { type: 'put', key: 'publicUrl', value: project.publicUrl },
//     { type: 'put', key: 'publicInfo', value: project.publicInfo },
//     { type: 'put', key: 'backstageUrl', value: project.backstageUrl },
//     { type: 'put', key: 'backstageInfo', value: project.backstageInfo },
//     project.backstageInfo
//       ? { type: 'put', key: 'projectLogo', value: project.projectLogo }
//       : { type: 'del', key: 'projectLogo' },
//   ]);

//   // await levelDb.put('project', project);

//   console.log('level',levelDb.getSync('project'));
//   console.log('project',projectDb.getSync('title'));
