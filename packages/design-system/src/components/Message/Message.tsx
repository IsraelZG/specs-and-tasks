import * as React from 'react';
import { cn } from '../../lib/utils';

/*
 * Tokens consumed: component.message.* (primary) + theme exceptions:
 *   - --ds-theme-intent-accent-subtle   (ai bubble bg, documented in metadata)
 *   - --ds-theme-intent-danger-border   (failed status border, documented in metadata)
 *   - --ds-theme-content-muted          (system message text)
 *
 * `author` is the single source of truth for alignment AND color.
 * Anti-pattern: never put full forms/cards inside Message children.
 * Must be used inside MessageList or MessageGroup (parent constraint).
 */

export type Author  = 'sent' | 'received' | 'ai' | 'system';
export type Status  = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type Density = 'cozy' | 'compact';

export interface MessageProps {
  children: React.ReactNode;
  author: Author;
  timestamp?: Date | string;
  status?: Status;
  density?: Density;
  reactions?: React.ReactNode;
  isEditing?: boolean;
  className?: string;
}

const STATUS_ICONS: Record<Status, string> = {
  sending:   '○',
  sent:      '✓',
  delivered: '✓✓',
  read:      '✓✓',
  failed:    '!',
};

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  (
    {
      children,
      author,
      timestamp,
      status,
      density = 'cozy',
      reactions,
      isEditing = false,
      className,
    },
    ref
  ) => {
    // System messages: no bubble, centered, muted
    if (author === 'system') {
      return (
        <div
          ref={ref}
          role="status"
          className={cn('flex w-full justify-center', className)}
        >
          <p className="text-xs text-[color:var(--ds-theme-content-muted)]">{children}</p>
        </div>
      );
    }

    const isSent     = author === 'sent';
    const isAi       = author === 'ai';
    const isFailed   = status === 'failed';
    const isSending  = status === 'sending';

    return (
      <div
        ref={ref}
        className={cn(
          'flex w-full flex-col',
          isSent ? 'items-end' : 'items-start',
          density === 'compact' ? 'gap-0.5' : 'gap-1',
          className
        )}
      >
        <div
          className={cn(
            'relative max-w-[70%]',
            'rounded-[var(--ds-component-message-radius)]',
            'px-[var(--ds-component-message-padding-x)] py-[var(--ds-component-message-padding-y)]',
            'text-sm leading-relaxed',
            // Color — author drives both bg and text
            isSent && 'bg-[var(--ds-component-message-bg-sent)] text-[color:var(--ds-component-message-text-sent)]',
            !isSent && !isAi && 'bg-[var(--ds-component-message-bg-received)] text-[color:var(--ds-component-message-text-received)]',
            // ai: theme exception documented in metadata
            isAi && 'bg-[var(--ds-theme-intent-accent-subtle)] text-[color:var(--ds-component-message-text-received)]',
            // Delivery states
            isSending && 'opacity-60',
            // failed: theme exception documented in metadata
            isFailed && 'border-2 border-[var(--ds-theme-intent-danger-border)]',
            // Tail corner: reduce attachment-side bottom corner (showcase.html .bubble pattern)
            isSent && 'rounded-br-[var(--ds-radius-sm)]',
            !isSent && !isAi && 'rounded-bl-[var(--ds-radius-sm)]',
          )}
          aria-busy={isSending || undefined}
        >
          {isAi && (
            <span
              aria-label="AI assistant"
              className="mb-1 block text-xs font-semibold opacity-60"
            >
              AI
            </span>
          )}
          {isEditing ? (
            <div
              role="textbox"
              aria-multiline="true"
              contentEditable
              suppressContentEditableWarning
              className="outline-none"
            >
              {children}
            </div>
          ) : (
            children
          )}
        </div>

        {reactions && (
          <div className={isSent ? 'mr-2' : 'ml-2'}>{reactions}</div>
        )}

        {(timestamp || (status && isSent)) && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs opacity-50',
              isSent ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {timestamp && (
              <time
                dateTime={
                  timestamp instanceof Date ? timestamp.toISOString() : timestamp
                }
              >
                {timestamp instanceof Date
                  ? timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : timestamp}
              </time>
            )}
            {status && isSent && (
              <span aria-label={status}>{STATUS_ICONS[status]}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Message.displayName = 'Message';

export { Message };
