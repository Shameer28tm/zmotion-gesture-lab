import { describe, it, expect, vi } from 'vitest';
import { MediaCaptureService } from '../core/capture/MediaCaptureService';

describe('Privacy-First Photo and Video Capture (Priority 4)', () => {
  it('instantiates MediaCaptureService singleton correctly', () => {
    const service1 = MediaCaptureService.getInstance();
    const service2 = MediaCaptureService.getInstance();
    expect(service1).toBe(service2);
    expect(service1.getIsRecording()).toBe(false);
    expect(service1.getDurationSeconds()).toBe(0);
  });

  it('triggers user download using anchor element without backend upload', () => {
    const service = MediaCaptureService.getInstance();
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    const fakeBlobUrl = 'blob:http://localhost:5173/mock-uuid';
    service.downloadMedia(fakeBlobUrl, 'zmotion_capture.png');

    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('releases in-memory blob URLs safely', () => {
    const service = MediaCaptureService.getInstance();
    const mockRevoke = vi.fn();
    (globalThis.URL as unknown as { revokeObjectURL: (url: string) => void }).revokeObjectURL = mockRevoke;

    service.revokeMedia('blob:http://localhost:5173/mock-uuid');
    expect(mockRevoke).toHaveBeenCalledWith('blob:http://localhost:5173/mock-uuid');

    // Non-blob URL is ignored
    service.revokeMedia('data:image/png;base64,1234');
    expect(mockRevoke).toHaveBeenCalledTimes(1);
  });

  it('throws descriptive error if stopVideoRecording is called when not recording', async () => {
    const service = MediaCaptureService.getInstance();
    await expect(service.stopVideoRecording()).rejects.toThrow('No active video recording to stop');
  });
});
