import { AspectRatio } from '@chakra-ui/layout';
import { CircularProgress } from '@chakra-ui/progress';
import { useState } from 'react';
import style from './IFrameLoader.module.css';

export default function IFrameLoader(props) {
  const [loading, setLoading] = useState(true);
  const { title, src } = props;

  return (
    <AspectRatio maxW='300' ratio={16 / 9} className={style.iframeContainer}>
      <>
        {loading && (
          <CircularProgress
            className={style.loader}
            isIndeterminate
            color='orange.300'
            trackColor='#FFF0'
          />
        )}
        <iframe
          className={style.iframe}
          title={title}
          src={src}
          onLoad={() => setLoading(false)}
        />
      </>
    </AspectRatio>
  );
}
