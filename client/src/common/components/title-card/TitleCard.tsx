import './TitleCard.scss';

interface TitleCardProps {
  label: string;
  title: string;
  subtitle: string;
  presenter: string;
}

export default function TitleCard(props: TitleCardProps) {
  const { label, title, subtitle, presenter } = props;

  return (
    <>
      <div className='label'>{label}</div>
      <div className='title'>{title}</div>
      <div className='presenter'>{presenter}</div>
      <div className='subtitle'>{subtitle}</div>
    </>
  );
}
