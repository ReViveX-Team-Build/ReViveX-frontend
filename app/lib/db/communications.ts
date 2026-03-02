/**
 * lib/db/communications.ts
 *
 * Firestore helpers for the `communications` collection.
 *
 * NOTE: Make sure your Firestore indexes are set up in the console:
 * 1. Collection: communications | Fields: receiverId ASC, timestamp DESC
 * 2. Collection: communications | Fields: senderId ASC, receiverId ASC, type ASC, timestamp ASC
 */

import { db } from '../firebase';
import {
  collection, addDoc, query, where, orderBy,
  getDocs, doc, updateDoc, Timestamp, onSnapshot,
  QuerySnapshot, DocumentData,
} from 'firebase/firestore';
import { Communication } from './types';

// We extend the base Communication type here to require title and isImportant.
// Eventually, this should just be moved into lib/db/types.ts directly.
type FullCommunication = Communication & {
  title:        string;
  isImportant?: boolean;
};