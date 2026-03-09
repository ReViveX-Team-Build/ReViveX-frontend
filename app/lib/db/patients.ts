import { db } from "../firebase";
import {
  collection, query, where, getDocs,
  doc, getDoc, updateDoc,
} from "firebase/firestore";
import { PatientData } from "./types";
import { getLastSessionPerPatient, getCohortSessionsThisWeek } from "./sessions";