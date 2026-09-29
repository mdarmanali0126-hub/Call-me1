import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

export const StoryModeStandalonePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return <Navigate to="/" replace />;
  }

  // Safely redirect to standard profile page since Story Mode is disabled
  return <Navigate to={`/profile/${slug}`} replace />;
};
