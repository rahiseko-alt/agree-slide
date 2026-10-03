import { createContext } from 'react';

// Every animated element reads the same clock. Pausing also freezes its movement.
export const PlaybackContext = createContext(0);
