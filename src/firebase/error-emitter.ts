
import { EventEmitter } from 'events';

// It's a global emitter, we can safely re-use it
const errorEmitter = new EventEmitter();

export { errorEmitter };
