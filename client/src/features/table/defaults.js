/**
 * @description sets the defaults for the table, overrideable in app
 */
export const columnOptions = [
    { filterable: false, visible: true, type: 'short', width: '100px', header: 'Type', accessor: 'type' },
    { filterable: true, visible: true, type: 'bool', width: '4rem', header: 'Public', accessor: 'isPublic' },
    { filterable: true, visible: true, type: 'millis', width: '5rem', header: 'Start', accessor: 'timeStart' },
    { filterable: true, visible: true, type: 'millis', width: '5rem', header: 'End', accessor: 'timeEnd' },
    { filterable: true, visible: true, type: 'millis', width: '5rem', header: 'Duration', accessor: 'duration' },
    { filterable: true, visible: true, type: 'string', width: '15rem', header: 'Title', accessor: 'title' },
    { filterable: true, visible: true, type: 'string', width: '10rem', header: 'Subtitle', accessor: 'subtitle' },
    { filterable: true, visible: true, type: 'string', width: '10rem', header: 'Presenter', accessor: 'presenter' },
    { filterable: true, visible: true, type: 'string', width: '10rem', header: 'Notes', accessor: 'note' },
    { filterable: true, visible: true, type: 'textArea', maxchar: 40, width: '12rem', header: 'Light', accessor: 'light' },
    { filterable: true, visible: true, type: 'textArea', maxchar: 40, width: '12rem', header: 'Cam', accessor: 'cam' },
    { filterable: true, visible: true, type: 'textArea', maxchar: 40, width: '12rem', header: 'Video', accessor: 'video' },
    { filterable: true, visible: true, type: 'textArea', maxchar: 40, width: '12rem', header: 'Audio', accessor: 'audio' }
  ];
