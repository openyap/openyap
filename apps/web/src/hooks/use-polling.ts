import { useEffect, useRef } from "react";
import { UI_CONSTANTS } from "~/lib/constants";

interface UsePollingOptions {
  enabled: boolean;
  interval?: number;
  onPoll: () => void;
}

export function usePolling({
  enabled,
  interval = UI_CONSTANTS.POLLING_INTERVALS.UPDATE_INTERVAL,
  onPoll,
}: UsePollingOptions) {
  const onPollRef = useRef(onPoll);

  useEffect(() => {
    onPollRef.current = onPoll;
  }, [onPoll]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const pollInterval = setInterval(() => {
      onPollRef.current();
    }, interval);

    return () => {
      clearInterval(pollInterval);
    };
  }, [enabled, interval]);
}
