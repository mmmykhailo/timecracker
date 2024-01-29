import { renderHook, act } from '@testing-library/react';
import useOnlineStatus from '../useOnlineStatus';

describe('GIVEN useOnlineStatus', () => {
  it('should initialize with the correct online status', () => {
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current.isOnline).toBe(navigator.onLine);
  });

  it('should update online status when the browser goes online', () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should update online status when the browser goes offline', () => {
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(true);

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current.isOnline).toBe(true);

    act(() => {
      jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(false);
      result.current.updateOnlineStatus();
    });

    expect(result.current.isOnline).toBe(false);

    jest.restoreAllMocks();
  });

  it('should clean up event listeners on unmount', () => {
    const originalAddEventListener = window.addEventListener;

    window.addEventListener = jest.fn();

    const { unmount } = renderHook(() => useOnlineStatus());

    expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

    act(() => {
      unmount();
    });

    expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

    window.addEventListener = originalAddEventListener;
  });
});