const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class TranscriptParser {
  constructor() {
    this.transcriptsDir = path.join(__dirname, '../../data/transcripts');
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.transcriptsDir)) {
      fs.mkdirSync(this.transcriptsDir, { recursive: true });
    }
  }

  /**
   * Generate transcript from Discord messages
   * @param {Object} options - Transcript generation options
   * @param {Array} options.messages - Discord messages array
   * @param {Object} options.channel - Discord channel object
   * @param {Object} options.guild - Discord guild object
   * @param {Object} options.closer - User who closed the ticket
   * @param {string} options.reason - Reason for closing
   * @returns {Object} Generated transcript data with URL
   */
  async generateTranscript(options) {
    const {
      messages,
      channel,
      guild,
      closer,
      reason,
      ticketType = 'General',
      opener = null
    } = options;

    const transcriptId = uuidv4();
    const now = new Date();

    // Process messages
    const processedMessages = messages.map(msg => this.processMessage(msg));

    // Add system message for ticket closure
    processedMessages.push({
      id: 'system-close',
      type: 'system',
      content: `Ticket closed by ${closer.tag}`,
      author: {
        id: 'system',
        username: 'System',
        discriminator: '0000',
        avatar: null,
        bot: true
      },
      timestamp: now.toISOString(),
      embeds: [{
        title: '🎫 Ticket Closed',
        description: `**Reason:** ${reason}`,
        color: 0xff6b6b,
        timestamp: now.toISOString()
      }]
    });

    const transcriptData = {
      id: transcriptId,
      version: '1.0',
      channel: {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        category: channel.parent?.name || null
      },
      guild: {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL() || null
      },
      ticketInfo: {
        type: ticketType,
        opener: opener ? {
          id: opener.id,
          username: opener.username,
          discriminator: opener.discriminator,
          avatar: opener.displayAvatarURL()
        } : null,
        closer: {
          id: closer.id,
          username: closer.username,
          discriminator: closer.discriminator,
          avatar: closer.displayAvatarURL()
        },
        reason: reason
      },
      createdAt: now.toISOString(),
      closedAt: now.toISOString(),
      messageCount: processedMessages.length,
      messages: processedMessages
    };

    // Save transcript
    const filePath = path.join(this.transcriptsDir, `${transcriptId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(transcriptData, null, 2));

    return {
      id: transcriptId,
      url: `/transcript/${transcriptId}`,
      filePath: filePath,
      data: transcriptData
    };
  }

  /**
   * Process a Discord message for transcript
   * @param {Object} message - Discord message object
   * @returns {Object} Processed message data
   */
  processMessage(message) {
    return {
      id: message.id,
      type: message.type || 'default',
      content: message.content || '',
      author: {
        id: message.author.id,
        username: message.author.username,
        discriminator: message.author.discriminator,
        avatar: message.author.displayAvatarURL(),
        bot: message.author.bot || false,
        color: this.getUserColor(message.member)
      },
      timestamp: message.createdAt.toISOString(),
      edited: message.editedAt ? message.editedAt.toISOString() : null,
      embeds: Array.from(message.embeds || []).map(embed => this.processEmbed(embed)),
      attachments: Array.from(message.attachments?.values() || []).map(attachment => this.processAttachment(attachment)),
      reactions: Array.from(message.reactions?.cache?.values() || []).map(reaction => ({
        emoji: {
          name: reaction.emoji.name,
          id: reaction.emoji.id,
          animated: reaction.emoji.animated || false
        },
        count: reaction.count
      })),
      reference: message.reference ? {
        messageId: message.reference.messageId,
        channelId: message.reference.channelId
      } : null
    };
  }

  /**
   * Process Discord embed
   * @param {Object} embed - Discord embed object
   * @returns {Object} Processed embed data
   */
  processEmbed(embed) {
    return {
      title: embed.title || null,
      description: embed.description || null,
      url: embed.url || null,
      color: embed.color || null,
      timestamp: embed.timestamp || null,
      footer: embed.footer ? {
        text: embed.footer.text,
        iconURL: embed.footer.iconURL
      } : null,
      thumbnail: embed.thumbnail ? {
        url: embed.thumbnail.url
      } : null,
      image: embed.image ? {
        url: embed.image.url
      } : null,
      author: embed.author ? {
        name: embed.author.name,
        url: embed.author.url,
        iconURL: embed.author.iconURL
      } : null,
      fields: embed.fields.map(field => ({
        name: field.name,
        value: field.value,
        inline: field.inline || false
      }))
    };
  }

  /**
   * Process Discord attachment
   * @param {Object} attachment - Discord attachment object
   * @returns {Object} Processed attachment data
   */
  processAttachment(attachment) {
    return {
      id: attachment.id,
      filename: attachment.name,
      size: attachment.size,
      url: attachment.url,
      proxyURL: attachment.proxyURL,
      contentType: attachment.contentType,
      width: attachment.width || null,
      height: attachment.height || null,
      isImage: attachment.contentType?.startsWith('image/') || false,
      isVideo: attachment.contentType?.startsWith('video/') || false
    };
  }

  /**
   * Get user role color
   * @param {Object} member - Discord guild member
   * @returns {string} Hex color code
   */
  getUserColor(member) {
    if (!member || !member.roles || !member.roles.cache) return '#ffffff';
    
    try {
      const roles = Array.from(member.roles.cache.values())
        .filter(role => role.color !== 0)
        .sort((a, b) => b.position - a.position);
      
      const role = roles[0];
      return role ? `#${role.color.toString(16).padStart(6, '0')}` : '#ffffff';
    } catch (error) {
      return '#ffffff';
    }
  }

  /**
   * Clean up old transcripts (optional)
   * @param {number} daysOld - Remove transcripts older than this many days
   */
  cleanupOldTranscripts(daysOld = 30) {
    const cutoffDate = moment().subtract(daysOld, 'days');
    
    fs.readdirSync(this.transcriptsDir).forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(this.transcriptsDir, file);
        const stats = fs.statSync(filePath);
        
        if (moment(stats.mtime).isBefore(cutoffDate)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Cleaned up old transcript: ${file}`);
        }
      }
    });
  }
}

module.exports = TranscriptParser;
