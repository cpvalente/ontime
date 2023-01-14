import './TitleCard.scss';

interface TitleCardProps {
  label: 'now' | 'next';
  title: string;
  subtitle: string;
  presenter: string;
}

export default function TitleCard(props: TitleCardProps) {
  const { label, title, subtitle, presenter } = props;
  const accent = label === 'now';

  return (
    <div className='title-card'>
      <div className='inline'>
        <span className='presenter'>{presenter}</span>
        <span className={accent? 'label accent': 'label'}>{label}</span>
      </div>
      <div className='title'>{title}</div>
      <div className='subtitle'>{subtitle}</div>
    </div>
  );
}
