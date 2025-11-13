# Ticket Feedback System

### **Setup Commands:**

1. **Initial Ticket Setup:**
```
/ticketsetup id 
  highstaff:<role_id>
  slayercarrierrole:<role_id>
  dungeoncarrierrole:<role_id>
  transcriptchannel:<channel_id>
  giveawaycategory:<category_id>
  punishmentcategory:<category_id>
  othercategory:<category_id>
  recordchannel:<channel_id>
```

2. **Set Feedback Channel (in the channel you want):**
```
^feedbackchannel
```

The feedback system is now fully integrated and will work automatically when tickets are closed! 🎉

### **Admin Commands:**
- `^feedbackchannel` - Set current channel as feedback channel (requires Administrator permission)

## How It Works

#### When a ticket is closed:
1. **User receives transcript** - The ticket transcript is sent to their DMs
2. **Feedback request sent** - User gets an embed with 5 star rating buttons (⭐ 1-5)
3. **User clicks rating** - A modal opens asking for written feedback
4. **Feedback submitted** - Goes to the configured feedback channel

#### Feedback Embed Format:
```
Title: Ticket Feedback
Fields:
  - Rating: ⭐⭐⭐⭐⭐ Excellent (5/5)
  - User: username (user_id)
  - Feedback: [user's written feedback]
```

## Files Modified

### New Files:
- `events/interactionCreate/feedbackHandler.js` - Handles feedback button clicks and modal submissions
- `events/messageCreate/feedbackChannelSetup.js` - Handles `^feedbackchannel` command

### Modified Files:
- `schema/ticketSchema.js` - Added `feedbackChannelId` field
- `commands/close.js` - Sends feedback request after closing
- `events/interactionCreate/closebutton.js` - Sends feedback request after closing

## Features

✅ **5-star rating system** with buttons
✅ **Optional written feedback** via modal
✅ **Color-coded embeds** (green for 4-5 stars, orange for 3, red for 1-2)
✅ **Automatic cleanup** - Feedback message deleted after submission
✅ **24-hour window** mentioned to users
✅ **Graceful error handling** - Works even if feedback channel not set

## Rating Scale
- ⭐ 1 star - Very Poor (Red)
- ⭐⭐ 2 stars - Poor (Red)
- ⭐⭐⭐ 3 stars - Average (Orange)
- ⭐⭐⭐⭐ 4 stars - Good (Green)
- ⭐⭐⭐⭐⭐ 5 stars - Excellent (Green)

## Notes
- Feedback is sent even if no feedback channel is configured (user just gets confirmation)
- The system automatically loads via djs-commander
- Users can skip written feedback (it's optional)
- Original feedback request message is deleted after submission
