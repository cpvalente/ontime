import style from './EventEditorImage.module.scss';

interface EventEditorImageProps {
  src: string;
}

export default function EventEditorImage(props: EventEditorImageProps) {
  const { src } = props;

  return (
    <div className={style.imageContainer}>
      <img loading='lazy' src={src} />
      <div className={style.imageOverlay} />
    </div>
  );
}
