import { useEffect, useRef, useState } from 'react';
import { getFormattedTimer, getTimerByType, isStringBoolean } from '../common/viewUtils';
import { Playback, TimerPhase, TimerType, ViewSettings } from 'ontime-types';
import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { useTranslation } from '../../../translation/TranslationProvider';


import './PopOutTimer.scss';

interface MinimalTimerProps {
  isMirrored: boolean;
  time: ViewExtendedTimer;
  viewSettings: ViewSettings;

}

export default function PopOutClock(props: MinimalTimerProps) {
  const { isMirrored, time, viewSettings } = props;
  const [ready, setReady] = useState(false);
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { getLocalizedString } = useTranslation();

  

  const stageTimer = getTimerByType(false, time);
  const display = getFormattedTimer(stageTimer, time.timerType, getLocalizedString('common.minutes'), {
    removeSeconds: false,
    removeLeadingZero: true,
  });

  let color = "#000000";
  let title = "";
  let clicked = false;

  useEffect(() => {
    const canvas = canvasRef.current;
    const videoElement = videoRef.current;
    if (canvas && videoElement) {
      const context = canvas.getContext('2d');
      if (context) {
        changeVideo(color, title, context, canvas, videoElement);
      }
      setReady(true);
    }
  }, []);

  const openPip = async () => {
    if (!videoRef.current) return;
    clicked = true;
    await videoRef.current.play();

    if (videoRef.current !== document.pictureInPictureElement) {
      try {
        await videoRef.current.requestPictureInPicture();
      } catch (error) {
        console.error("Error: Unable to enter Picture-in-Picture mode:", error);
      }
    } else {
      try {
        await document.exitPictureInPicture();
      } catch (error) {
        console.error("Error: Unable to exit Picture-in-Picture mode:", error);
      }
    }
  };

  const drawFrame = (color: string, text: string, context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = "60px Arial";
    context.fillStyle = "white";
    const textWidth = context.measureText(text).width;
    const x = (canvas.width - textWidth) / 2;
    const y = canvas.height / 2 + 15;

    context.fillText(text, x, y);
  };

  const createVideoBlob = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, callback: (url: string) => void) => {
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      callback(URL.createObjectURL(blob));
    };

    mediaRecorder.start();
    setTimeout(() => {
      mediaRecorder.stop();
    }, 100); 
  };

  const changeVideo = (
    color: string,
    text: string,
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    videoElement: HTMLVideoElement
  ) => {
    drawFrame(color, text, context, canvas);
    createVideoBlob(canvas, context, (newVideoSource) => {
      if (videoSource) {
        URL.revokeObjectURL(videoSource);
      }
      setVideoSource(newVideoSource);
      videoElement.src = newVideoSource;
      videoElement.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    });
  };

  useEffect(() => {
    if (ready && canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      let i = 0;
      const interval = setInterval(() => {
        changeVideo("green", display, context!, canvas, videoRef.current!);
        i++;
      }, 1000);
      return () => clearInterval(interval); // Clean up the interval on component unmount
    }
  }, [ready]);

  return (
    <div>
      <div>{display}</div>
      <canvas
        ref={canvasRef}
        id="canvas"
        width="640"
        height="360"
      />
      <video
        ref={videoRef}
        id="pip-video"
        loop
        controls
      >
        {videoSource && <source src={videoSource} type="video/webm" />}
      </video>
      <button onClick={openPip}>
        Picture-in-Picture
      </button>
    </div>
  );
}
