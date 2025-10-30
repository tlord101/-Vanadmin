import type { ReactNode, ReactElement } from 'react';

export interface StatCardProps {
  title: string;
  value: number | null;
  icon: ReactNode;
  color: string;
}

export interface NavItem {
  name: string;
  icon: (props: { className?: string }) => ReactElement;
}

// Course Management interfaces
export interface Topic {
  topicId: string;
  topicName: string;
}

export interface Subject {
  level: string;
  subjectId: string;
  subjectName: string;
  topics: Topic[];
}

export interface Course {
  id: string; // Firestore document ID
  courseId: string;
  courseName: string;
  description?: string;
  levels: string[];
  subjectList: Subject[];
}

// User Management and Notification interfaces
export interface User {
    id: string; // Firestore document ID (same as userId)
    displayName: string;
    email: string;
    xp?: number; // Fetched from leaderboardOverall
    createdAt?: { seconds: number; nanoseconds: number; };
    // Fields from user document in firestore
    courseId?: string;
    currentStreak?: number;
    level?: string;
    plan?: string;
    totalTestXP?: number;
    totalXP?: number;
    lastActivityDate?: { seconds: number; nanoseconds: number; };
}
  
export interface Notification {
    id: string; // Firestore document ID
    title: string;
    message: string;
    target: string; // "all" or a specific userId
    createdAt: string;
}