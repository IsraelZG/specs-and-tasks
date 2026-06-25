import { Message, Card } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

const now = new Date();

export default function MessageSection() {
  return (
    <SectionWrapper
      id="message"
      title="Message"
      overline="Component"
      description="Chat bubble. author determines alignment, color, and semantics. Should be inside a MessageList or MessageGroup container."
    >
      <Subsection title="Conversation" stack>
        <Card className="w-full max-w-md">
          <div className="flex flex-col gap-2 w-full">
            <Message author="received" timestamp={now} status="delivered">
              Hey! Can you help me pick a component for showing status labels?
            </Message>
            <Message author="ai" timestamp={now}>
              Sure! Use Badge for static status indicators — display-only and never interactive. For dynamic counts use Badge with intent="danger" or "warning". NavItem also accepts a trailing slot for count badges.
            </Message>
            <Message author="sent" timestamp={now} status="read">
              Perfect, that's exactly what I needed. Thanks!
            </Message>
            <Message author="system">
              Conversation started {now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </Message>
          </div>
        </Card>
      </Subsection>

      <Subsection title="Delivery status" stack>
        <Card className="w-full max-w-xs">
          <div className="flex flex-col gap-1 w-full">
            <Message author="sent" status="sending">Sending your file…</Message>
            <Message author="sent" status="sent">Message sent</Message>
            <Message author="sent" status="delivered">Delivered to 3 devices</Message>
            <Message author="sent" status="read">Read · 2m ago</Message>
            <Message author="sent" status="failed">Failed to send · Tap to retry</Message>
          </div>
        </Card>
      </Subsection>

      <Subsection title="Density compact" stack>
        <Card className="w-full max-w-md">
          <div className="flex flex-col gap-1 w-full">
            <Message author="received" density="compact" timestamp={now}>Compact received message</Message>
            <Message author="sent" density="compact" timestamp={now}>Compact sent message</Message>
            <Message author="ai" density="compact" timestamp={now}>Compact AI response</Message>
          </div>
        </Card>
      </Subsection>
    </SectionWrapper>
  );
}
