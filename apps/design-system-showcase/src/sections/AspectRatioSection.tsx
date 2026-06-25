import { AspectRatio } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function AspectRatioSection() {
  return (
    <SectionWrapper
      id="aspectratio"
      title="Aspect Ratio"
      overline="Component"
      description="Prevents content shift and maintains designated width-to-height proportions (such as widescreen, square, or portrait) responsively."
    >
      <Subsection title="16:9 Video Ratio" stack>
        <div className="w-full max-w-md">
          <AspectRatio ratio={16 / 9} className="bg-[color:var(--ds-theme-surface-subdued)] rounded-lg overflow-hidden border border-[color:var(--ds-theme-border-subtle)]">
            <img
              src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=60"
              alt="Anime Room Illustration"
              className="object-cover w-full h-full"
            />
          </AspectRatio>
        </div>
      </Subsection>

      <Subsection title="1:1 Square Album/Profile Ratio" stack>
        <div className="w-full max-w-[200px]">
          <AspectRatio ratio={1} className="bg-[color:var(--ds-theme-surface-subdued)] rounded-2xl overflow-hidden border border-[color:var(--ds-theme-border-subtle)]">
            <img
              src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=60"
              alt="Concert Crowd lights"
              className="object-cover w-full h-full"
            />
          </AspectRatio>
        </div>
      </Subsection>

      <Subsection title="4:3 Traditional Photographic Ratio" stack>
        <div className="w-full max-w-sm">
          <AspectRatio ratio={4 / 3} className="bg-[color:var(--ds-theme-surface-subdued)] rounded-xl overflow-hidden border border-[color:var(--ds-theme-border-subtle)]">
            <img
              src="https://images.unsplash.com/photo-1472214222541-d510753a4907?w=600&auto=format&fit=crop&q=60"
              alt="Mountain Lake scenery"
              className="object-cover w-full h-full"
            />
          </AspectRatio>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
