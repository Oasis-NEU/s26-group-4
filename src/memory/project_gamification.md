---
name: Gamification system design
description: XP and gacha profile picture system — how it works and what still needs wiring up
type: project
---

XP is earned by completing/redeeming tasks (XP_PER_TASK = 50). It is spent on gacha pulls (PULL_COST = 100 XP) to unlock profile pictures. No custom uploads — only pictures won through the gacha pool.

Profile.jsx exports: ProfileAvatar, ProfilePanel, PROFILE_PICS, RARITY_COLORS, PULL_COST, XP_PER_TASK.

**Why:** README called out "gacha page and point counter and profile picture" as a future goal. XP replaces generic points.

**How to apply:** When wiring up XP/profile state, add to Calendar.jsx: `xp`, `setXp`, `profilePic`, `setProfilePic`, `owned`, `setOwned` useState hooks. Pass them into ProfilePanel. Award XP in Event.jsx's setCompletion when a task is marked complete (use XP_PER_TASK). Persist xp/profilePic/owned to a Supabase `profiles` table keyed on user_id.
