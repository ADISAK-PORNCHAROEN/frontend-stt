type WavOptions = {
  durationSeconds?: number;
  sampleRate?: number;
};

export type TestMedia = {
  name: string;
  mimeType: string;
  buffer: Buffer;
};

export function silentWav({ durationSeconds = 28, sampleRate = 8_000 }: WavOptions = {}): TestMedia {
  const bytesPerSample = 2;
  const channels = 1;
  const dataBytes = durationSeconds * sampleRate * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataBytes, 40);

  return { name: "sample.wav", mimeType: "audio/wav", buffer };
}
