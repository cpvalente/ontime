import style from './Info.module.css';
import InfoTitle from './InfoTitle';
import InfoLogger from './InfoLogger';

export default function Info() {
  const data = {};
  const logData = [];
  return (
    <>
      <div className={style.main}>Event 1/31</div>
      <InfoTitle title={'Now'} data={data} />
      <InfoTitle title={'Next'} data={data} />
      <InfoLogger logData={logData} />
    </>
  );
}
