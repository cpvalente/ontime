import { resolvePath } from 'react-router-dom';

import { generateUrlFromPreset, getRouteFromPreset, validateUrlPresetPath } from '../urlPresets';

describe('A preset fails if incorrect', () => {
  const testsToFail = [
    // no empty
    '',
    // no https, http or www
    'https://www.test.com',
    'http://www.test.com',
    'www.test.com',
    // no hostname
    'localhost/test',
    '127.0.0.1/test',
    '0.0.0.0/test',
    // no editor
    'editor',
    'editor?test',
  ];

  testsToFail.forEach((t) =>
    it(`${t}`, () => {
      expect(validateUrlPresetPath(t).isValid).toBeFalsy();
    }),
  );
});
describe('generateUrlFromPreset and getRouteFromPreset function', () => {
  test('generate the expected url from an alias', () => {
    const testData = [
      {
        enabled: true,
        alias: 'demopage',
        pathAndParams: '/timer?user=guest',
      },
    ];

    const expected = [
      {
        url: '/timer?user=guest&alias=demopage',
      },
    ];

    expect(generateUrlFromPreset(testData[0])).toStrictEqual(expected[0].url);
  });
  test('generate the url to redirect to when the current URL is just the alias', () => {
    const presets = [
      {
        enabled: true,
        alias: 'demopage',
        pathAndParams: '/timer?user=guest',
      },
    ];
    // let current location be the alias
    const location = resolvePath(presets[0].alias);

    const expected = [
      {
        url: '/timer?user=guest&alias=demopage',
      },
    ];

    expect(getRouteFromPreset(location, presets, null)).toStrictEqual(expected[0].url);
  });
  test('generate the url to redirect to when the current URL the same url but with a change of params', () => {
    const presets = [
      {
        enabled: true,
        alias: 'demopage',
        pathAndParams: '/timer?user=guest',
      },
    ];
    // let current location be the actual url with alias attached to it
    const location = resolvePath(presets[0].pathAndParams);
    const urlSearchParams = new URLSearchParams(location.search);
    urlSearchParams.append('alias', presets[0].alias); //

    // update current alias with extra param
    presets[0].pathAndParams += '&eventId=674';
    const expected = [
      {
        url: '/timer?user=guest&eventId=674&alias=demopage',
      },
    ];

    expect(getRouteFromPreset(location, presets, urlSearchParams)).toStrictEqual(expected[0].url);
  });
  test('generate no url to redirect to when the current URL the same url', () => {
    const presets = [
      {
        enabled: true,
        alias: 'demopage',
        pathAndParams: '/timer?user=guest',
      },
    ];
    // let current location be the actual url with alias attached to it
    const location = resolvePath(presets[0].pathAndParams);
    const urlSearchParams = new URLSearchParams(location.search);
    urlSearchParams.append('alias', presets[0].alias); //

    expect(getRouteFromPreset(location, presets, urlSearchParams)).toBeNull();
  });
});
