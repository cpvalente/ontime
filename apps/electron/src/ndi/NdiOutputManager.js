const { BrowserWindow } = require('electron');

const FOURCC_BGRA = 1095911234;
const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const DEFAULT_FPS = 50;

function loadGrandiose() {
  try {
    return require('@stagetimerio/grandiose');
  } catch (error) {
    return { error };
  }
}

function getBitmapFrame(image) {
  const scaleFactors = image.getScaleFactors();
  const scaleFactor = scaleFactors.at(-1) ?? 1;
  const data = image.toBitmap({ scaleFactor });
  let { width, height } = image.getSize(scaleFactor);

  if (data.length !== width * height * 4) {
    const scale = Math.sqrt(data.length / (width * height * 4));
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  return { data, width, height };
}

function makeFrame(grandiose, image, fps) {
  const { data, width, height } = getBitmapFrame(image);

  return {
    xres: width,
    yres: height,
    frameRateN: fps * 1000,
    frameRateD: 1000,
    fourCC: grandiose.FOURCC_BGRA ?? FOURCC_BGRA,
    pictureAspectRatio: width / height,
    frameFormatType: grandiose.FORMAT_TYPE_PROGRESSIVE,
    lineStrideBytes: width * 4,
    data,
  };
}

class NdiOutputManager {
  constructor({ icon, onError }) {
    this.icon = icon;
    this.onError = onError;
    this.outputs = new Map();
    this.format = {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      fps: DEFAULT_FPS,
    };
  }

  isAvailable() {
    const grandiose = loadGrandiose();
    return !grandiose.error && grandiose.isSupportedCPU();
  }

  isActive(id) {
    return this.outputs.has(id);
  }

  getFormat() {
    return { ...this.format };
  }

  async setFormat(format) {
    this.format = {
      width: format.width ?? this.format.width,
      height: format.height ?? this.format.height,
      fps: format.fps ?? this.format.fps,
    };

    const activeOutputs = Array.from(this.outputs.values()).map((output) => output.options);
    this.stopAll();

    for (const outputOptions of activeOutputs) {
      await this.startOutput(outputOptions.id, outputOptions);
    }
  }

  async startOutput(id, options) {
    if (this.outputs.has(id)) {
      return;
    }

    const grandiose = loadGrandiose();
    if (grandiose.error) {
      this.handleError(
        'NDI is unavailable',
        'The grandiose native NDI module could not be loaded. Install dependencies and rebuild native modules for Electron.',
        grandiose.error,
      );
      return;
    }

    if (!grandiose.isSupportedCPU()) {
      this.handleError('NDI is unavailable', 'This CPU is not supported by the installed NDI runtime.');
      return;
    }

    const width = options.width ?? this.format.width;
    const height = options.height ?? this.format.height;
    const fps = options.fps ?? this.format.fps;
    const output = {
      id,
      name: options.name,
      options: {
        ...options,
        id,
      },
      sender: null,
      window: null,
      sending: false,
      pendingFrame: null,
    };

    try {
      output.sender = await grandiose.send({
        name: options.name,
        clockVideo: true,
        clockAudio: false,
      });

      output.window = new BrowserWindow({
        width,
        height,
        show: false,
        frame: false,
        icon: this.icon,
        paintWhenInitiallyHidden: true,
        webPreferences: {
          offscreen: true,
          nodeIntegration: false,
          contextIsolation: true,
          backgroundThrottling: false,
        },
      });

      output.window.webContents.setFrameRate(fps);
      output.window.webContents.setBackgroundThrottling(false);
      output.window.webContents.on('paint', (_event, _dirty, image) => {
        output.pendingFrame = makeFrame(grandiose, image, fps);
        this.flushFrame(output);
      });
      output.window.once('closed', () => {
        this.outputs.delete(id);
      });

      this.outputs.set(id, output);
      await output.window.loadURL(options.url);
    } catch (error) {
      this.stopOutput(id);
      this.handleError('Could not start NDI output', `Failed to start ${options.name}.`, error);
    }
  }

  async flushFrame(output) {
    if (output.sending || !output.pendingFrame || !output.sender) {
      return;
    }

    const frame = output.pendingFrame;
    output.pendingFrame = null;
    output.sending = true;

    try {
      await output.sender.video(frame);
    } catch (error) {
      this.handleError('NDI output error', `Failed to send a frame for ${output.name}.`, error);
      this.stopOutput(output.id);
    } finally {
      output.sending = false;
      if (output.pendingFrame) {
        this.flushFrame(output);
      }
    }
  }

  stopOutput(id) {
    const output = this.outputs.get(id);
    if (!output) {
      return;
    }

    this.outputs.delete(id);
    output.window?.destroy();
    output.sender?.destroy?.().catch((error) => {
      this.handleError('NDI output error', `Failed to stop ${output.name}.`, error);
    });
    output.sender = null;
  }

  stopAll() {
    for (const id of this.outputs.keys()) {
      this.stopOutput(id);
    }
  }

  handleError(title, message, error) {
    if (error) {
      console.error(title, error);
    }
    this.onError?.(title, message);
  }
}

module.exports = { NdiOutputManager };
