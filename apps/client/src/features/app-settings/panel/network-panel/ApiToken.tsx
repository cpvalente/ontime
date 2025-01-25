import CopyTag from '../../../../common/components/copy-tag/CopyTag';
import * as Panel from '../../panel-utils/PanelUtils';

function getCookie(cname: string) {
  const name = `${cname}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

export default function ApiToken() {
  const token = getCookie('token');

  if (!token) {
    return null;
  }

  return (
    <Panel.InlineElements>
      <CopyTag copyValue={token} onClick={() => {}} label='Copy API Password Token'>
        API Token
      </CopyTag>
    </Panel.InlineElements>
  );
}
