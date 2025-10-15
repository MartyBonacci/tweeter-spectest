/**
 * Like Action Route
 * Feature: Phase 0 POC - Like Functionality
 *
 * Action-only route for like/unlike operations
 */

import { toggleLikeAction } from '../actions/likes';

export const action = toggleLikeAction;

// This page doesn't render, it's action-only
export default function LikeAction() {
  return null;
}
