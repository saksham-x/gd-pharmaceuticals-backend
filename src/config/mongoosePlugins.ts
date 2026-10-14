import mongoose from 'mongoose';
import { captureDeletedPlugin } from '../modules/activityLog/activityLog.recorder.js';

/**
 * Plugins every schema gets. Mongoose applies global plugins when a model is
 * compiled, so app.ts imports this file before anything that defines a model.
 */
mongoose.plugin(captureDeletedPlugin);
