import { useCallback, useEffect } from 'react';
import { Container, Graphics, Stage, Text } from '@pixi/react';
import { OntimeEvent, SupportedEvent } from 'ontime-types';
import { getFirstEvent, getLastEvent } from 'ontime-utils';
import { Point, TextStyle } from 'pixijs';

import Empty from '../../common/components/state/Empty';
import { getOperatorOptions } from '../../common/components/view-params-editor/constants';
import { useOperator, useTimer } from '../../common/hooks/useSocket';
import useProjectData from '../../common/hooks-query/useProjectData';
import useRundown from '../../common/hooks-query/useRundown';
import useUserFields from '../../common/hooks-query/useUserFields';
import { formatTime } from '../../common/utils/time';

const COLORS = {
  red: 0xfa5656,
  white: 0xffffff,
  green: 0x087a27,
};

export default function Timeline() {
  const { data, status } = useRundown();
  const { data: userFields, status: userFieldsStatus } = useUserFields();
  const { data: projectData, status: projectDataStatus } = useProjectData();

  const featureData = useOperator();
  const timer = useTimer();

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Timeline';
  }, []);

  const missingData = !data || !userFields || !projectData;
  const isLoading = status === 'loading' || userFieldsStatus === 'loading' || projectDataStatus === 'loading';

  if (missingData || isLoading) {
    return <Empty text='Loading...' />;
  }

  const operatorOptions = getOperatorOptions(userFields);

  const firstEvent = getFirstEvent(data);
  const lastEvent = getLastEvent(data);

  if (!(firstEvent && lastEvent)) {
    return <></>;
  }

  const height = 50;
  const padding = 5;
  const SCALE_X = 1000;

  const events = Object.fromEntries(
    (data.filter((e) => e.type === SupportedEvent.Event) as OntimeEvent[]).map((e) => [e.id, e]),
  );
  const totalDuration = lastEvent.timeEnd - firstEvent.timeStart;

  const MARGIN = {
    x: 30,
    y: 50,
  };

  return (
    <Stage
      options={{
        backgroundColor: 0,
        antialias: true,
      }}
      width={window.innerWidth}
      height={window.innerHeight}
    >
      <Container x={MARGIN.x} y={MARGIN.y}>
        {Object.values(events).map((event, i) => {
          const { id, cue, title, timeStart, duration } = event;
          const x = ((timeStart - firstEvent.timeStart) / totalDuration) * SCALE_X;
          const y = i * (height + padding);
          const width = (duration / totalDuration) * SCALE_X;

          const isActive = featureData.selectedEventId === id;
          const isPast = i < Object.values(events).findIndex((e) => e.id === featureData.selectedEventId);

          return (
            <Container x={x} y={y} key={id}>
              <Graphics
                draw={(g) => {
                  g.beginFill(isActive ? COLORS.green : isPast ? 0x303030 : pixiColor(event.colour));
                  g.drawRoundedRect(0, 0, width, height, 10);
                  g.endFill();
                }}
              />
              <Text text={cue} x={5} y={22} style={new TextStyle({ fill: COLORS.white, fontSize: 20 })} />
              <Text text={title} x={5} y={5} style={new TextStyle({ fill: COLORS.white, fontSize: 15 })} />
            </Container>
          );
        })}
        {featureData.selectedEventId && timer.current ? (
          <Container
            x={
              ((-timer.current + events[featureData.selectedEventId].timeEnd - firstEvent.timeStart) / totalDuration) *
              SCALE_X
            }
            y={0}
          >
            <Graphics
              draw={(g) => {
                g.lineStyle(2, COLORS.red);
                g.moveTo(0, 0);
                g.lineTo(0, window.innerHeight);
                g.endFill();
              }}
            />
            <Text
              text={formatTime(timer.current, { showSeconds: true, format: 'hh:mm:ss' })}
              x={0}
              y={-5}
              anchor={new Point(0.5, 1)}
              style={
                new TextStyle({
                  fill: timer.current < 0 ? COLORS.red : COLORS.white,
                  fontSize: 15,
                  fontWeight: 'bold',
                })
              }
            />
          </Container>
        ) : null}
      </Container>
    </Stage>
  );
}

function pixiColor(color: string) {
  return parseInt(color.replace('#', ''), 16);
}
