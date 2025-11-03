import type { ReactNode, ReactElement } from 'react';

export interface StatCardProps {
  title: string;
  value: number | string | null;
  icon: ReactNode;
  color: string;
}

export interface NavItem {
  name: string;
  icon: (props: { className?: string }) => ReactElement;
}

// Course Management interfaces aligned with courses_data schema
export interface Topic {
  topic_id: string;
  topic_name: string;
}

export interface Subject {
  subject_id: string;
  level: string;
  subject_name: string;
  semester: 'first' | 'second';
  topics: Topic[];
}

export interface Course {
  id: string; // Primary key from courses_data
  course_name: string;
  levels: string[];
  subject_list: Subject[]; // from jsonb column
}

// User Management and Notification interfaces aligned with schema
export interface User {
    uid: string; // Supabase auth.users.id (UUID)
    display_name: string;
    photo_url?: string;
    xp?: number; // This is joined from leaderboard_overall
    course_id?: string;
    current_streak?: number;
    level?: string;
    total_test_xp?: number;
    total_xp?: number;
    last_activity_date?: string; // From bigint
}
  
export interface Notification {
    id: string; // Supabase UUID
    user_id: string; // user this is for
    type?: string;
    title: string;
    message: string;
    timestamp: string; // ISO 8601 string from 'timestamp with time zone'
    is_read: boolean;
    link?: string;
}
