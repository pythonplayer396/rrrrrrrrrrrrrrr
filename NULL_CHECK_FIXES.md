# Null Check Fixes

## Issue
Several interaction handlers were accessing `interaction.guild.id` without checking if `interaction.guild` exists first, causing `TypeError: Cannot read properties of null (reading 'id')` errors.

## Root Cause
When interactions occur in DMs or in certain edge cases, `interaction.guild` can be `null`. Accessing `.id` on a null object throws an error.

## Files Fixed

### ✅ events/interactionCreate/punishbutton.js
**Problem:** Guild data accessed outside modal submission check
**Fix:** Moved `guildId` and `entry` fetching inside the modal submission check

### ✅ events/interactionCreate/claimbutton.js
**Problem:** No null check before accessing `interaction.guild.id`
**Fix:** Added guild null check at the start:
```javascript
if (!interaction.guild) {
  return interaction.reply({
    content: "❌ This command can only be used in a server.",
    flags: 1 << 6,
  }).catch(() => {});
}
```

### ✅ events/interactionCreate/giveawayclaim.js
**Problem:** No null check in modal submission handler
**Fix:** Added guild null check before deferring reply

### ✅ events/interactionCreate/carriedbutton.js
**Problem:** No null checks in button click and modal submission handlers
**Fix:** Added guild null checks in both handlers

### ✅ events/interactionCreate/closebutton.js
**Problem:** No null check before accessing guild
**Fix:** Added guild null check at the start of button handler

### ✅ events/interactionCreate/approvalbuttons.js
**Already had proper checks** - No changes needed

### ✅ events/interactionCreate/feedbackHandler.js
**Already had proper checks** - No changes needed

### ✅ events/interactionCreate/otherButton.js
**Already had proper checks** - No changes needed (line 19-21)

## Pattern Used

For all fixes, we added this check before accessing guild data:

```javascript
if (!interaction.guild) {
  return interaction.reply({
    content: "❌ This command can only be used in a server.",
    flags: 1 << 6,
  }).catch(() => {});
}
```

The `.catch(() => {})` prevents errors if the reply also fails (e.g., interaction expired).

## Testing Checklist

- [x] Claim button in tickets
- [x] Close button in tickets  
- [x] Slayer carry modal submission
- [x] Dungeon carry modal submission
- [x] Carried button and modal
- [x] Feedback system buttons

## Notes

- All interaction handlers should check for `interaction.guild` before accessing guild-specific data
- Use `.catch(() => {})` on replies to handle cases where the interaction might have expired
- The error message is user-friendly and explains the limitation
