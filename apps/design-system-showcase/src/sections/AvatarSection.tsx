import { Avatar } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
const initials = ['AB', 'CK', 'JS', 'MR', 'TW', 'XZ'];
const stackImgs = [1, 2, 3, 4];

export default function AvatarSection() {
  return (
    <SectionWrapper
      id="avatar"
      title="Avatar"
      overline="Component"
      description="Circular user representation. Fallback hierarchy: image → initials → default icon."
    >
      <Subsection title="Sizes — with image">
        {sizes.map((size, i) => (
          <div key={size} className="flex flex-col items-center gap-1.5">
            <Avatar src={`https://i.pravatar.cc/96?img=${i + 1}`} alt={`User ${i + 1}`} size={size} />
            <span className="text-[length:var(--ds-font-size-2xs)] text-[color:var(--ds-theme-content-subtle)]">
              {size}
            </span>
          </div>
        ))}
      </Subsection>

      <Subsection title="Fallback — initials">
        {sizes.map((size, i) => (
          <div key={size} className="flex flex-col items-center gap-1.5">
            <Avatar fallback={initials[i]} size={size} />
            <span className="text-[length:var(--ds-font-size-2xs)] text-[color:var(--ds-theme-content-subtle)]">
              {size}
            </span>
          </div>
        ))}
      </Subsection>

      <Subsection title="Fallback — default icon">
        <Avatar size="sm" />
        <Avatar size="md" />
        <Avatar size="lg" />
        <Avatar size="xl" />
      </Subsection>

      <Subsection title="With ring">
        <Avatar src="https://i.pravatar.cc/96?img=5" alt="With ring" size="md" ring />
        <Avatar src="https://i.pravatar.cc/96?img=6" alt="With ring" size="lg" ring />
        <Avatar fallback="AB" size="md" ring />
        <Avatar fallback="CK" size="lg" ring />
      </Subsection>

      <Subsection title="Avatar stack — group of users">
        <div className="flex -space-x-2 items-center">
          {stackImgs.map(i => (
            <Avatar
              key={i}
              src={`https://i.pravatar.cc/96?img=${i}`}
              alt={`Team member ${i}`}
              size="md"
              ring
            />
          ))}
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] bg-[var(--ds-component-avatar-fallback-bg)] text-[color:var(--ds-component-avatar-fallback-text)] outline outline-2 outline-[color:var(--ds-component-avatar-ring-color)] outline-offset-0">
            +5
          </span>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
